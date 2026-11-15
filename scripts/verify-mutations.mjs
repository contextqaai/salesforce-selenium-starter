import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const checks=[['closure','service.required'],['permission','service.role'],['routing','flow.equal']];
const results=[];
for(const [fault,scenario] of checks){
  const run=spawnSync('npm',['test'],{env:{...process.env,DEMO_FAULT:fault,DEMO_CASE:scenario},encoding:'utf8',timeout:120000,maxBuffer:5*1024*1024});
  const output=(run.stdout||'')+(run.stderr||'');
  const detected=run.status!==0 && run.status!==null && /ERR_ASSERTION|AssertionError/.test(output) && output.includes(scenario);
  results.push({fault,scenario,exitCode:run.status,detected});
  console.log(`${fault}: ${detected?'DETECTED':'NOT VERIFIED'}`);
  if(!detected)console.error(output);
}
mkdirSync('artifacts',{recursive:true});
writeFileSync('artifacts/mutations.json',JSON.stringify({checkedAt:new Date().toISOString(),target:'synthetic demo',results},null,2)+'\n');
if(results.some(r=>!r.detected))process.exitCode=1;
