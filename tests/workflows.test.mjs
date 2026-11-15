import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {Builder,By,until} from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import {selected} from './scenarios.mjs';
const base='http://127.0.0.1:4174';
let server;
before(async()=>{
  server=spawn(process.execPath,['demo/server.mjs'],{env:{...process.env,PORT:'4174'},stdio:['ignore','pipe','pipe']});
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('Demo server startup timed out')),10000);
    server.once('error',reject);server.once('exit',code=>{clearTimeout(timer);reject(new Error(`Demo server exited: ${code}`));});
    server.stdout.on('data',data=>{if(data.toString().includes('Demo listening')){clearTimeout(timer);resolve();}});
  });
});
after(async()=>{if(server && server.exitCode===null){server.kill();await new Promise(r=>server.once('exit',r));}});
for(const scenario of selected) test(scenario.id,{timeout:30000},async()=>{
  const options=new chrome.Options();
  if(process.env.HEADLESS!=='0') options.addArguments('--headless=new');
  options.addArguments('--window-size=1280,900');
  if(process.env.CHROME_BINARY) options.setChromeBinaryPath(process.env.CHROME_BINARY);
  const browser=await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  async function api(path,method='GET') {
    const cookies=await browser.manage().getCookies();
    return fetch(base+path,{method,headers:{Cookie:cookies.map(c=>`${c.name}=${c.value}`).join('; ')}});
  }
  const driver={
    async start(role){await browser.get(base);await browser.findElement(By.css(`#role option[value="${role}"]`)).click();await browser.findElement(By.id('start')).click();await browser.wait(until.elementTextIs(browser.findElement(By.id('message')),'Demo session ready'),5000);},
    async fill(id,value){const e=await browser.findElement(By.id(id));await e.clear();await e.sendKeys(value);},
    async click(id,expected){
      // Clear the previous message, then wait for this action's completion.
      await browser.executeScript("document.getElementById('message').textContent=''");
      await browser.findElement(By.id(id)).click();
      await browser.wait(async()=>Boolean(await browser.findElement(By.id('message')).getText()),5000);
      assert.equal(await browser.findElement(By.id('message')).getText(),expected);
    },
    async state(){const r=await api('/api/state');assert.equal(r.status,200);return r.json();}
  };
  try {await scenario.run(driver);}
  catch(error){await mkdir('artifacts',{recursive:true});await writeFile(`artifacts/${scenario.id}.png`,await browser.takeScreenshot(),'base64');throw error;}
  finally {try{assert.equal((await api('/api/session','DELETE')).status,200);assert.equal((await api('/api/state')).status,401);}finally{await browser.quit();}}
});
