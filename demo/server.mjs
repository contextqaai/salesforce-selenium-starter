import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
const sessions = new Map();
const fault = process.env.DEMO_FAULT || '';
if (!['', 'closure', 'permission', 'routing'].includes(fault)) throw new Error('Unknown demo fault');
const page = readFileSync(new URL('./index.html', import.meta.url));
const logo = readFileSync(new URL('./contextqa-logo.svg', import.meta.url));
const send = (res, status, data) => { res.writeHead(status, {'Content-Type':'application/json'}); res.end(JSON.stringify(data)); };
const server = http.createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET' && req.url === '/') {res.writeHead(200, {'Content-Type':'text/html'}); return res.end(page);}
  if (req.method === 'GET' && req.url === '/logo.svg') {res.writeHead(200, {'Content-Type':'image/svg+xml'}); return res.end(logo);}
  if (req.method === 'GET' && req.url === '/health') return send(res, 200, {app:'contextqa-synthetic-workflows', fault});
  if (req.method === 'POST' && req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) return send(res,403,{error:'Origin denied'});
  let data = {};
  if(req.method === 'POST') {
    try {let body=''; for await(const chunk of req) {body+=chunk; if(body.length>8192) {send(res,413,{error:'Too large'});return;}} data=JSON.parse(body||'{}');}
    catch {return send(res,400,{error:'Invalid JSON'});}
  }
  if(req.method==='POST' && req.url==='/api/session') {
    if(!['sales','support','restricted'].includes(data.role)) return send(res,400,{error:'Unknown role'});
    const old = req.headers.cookie?.match(/(?:^|; )sid=([^;]+)/)?.[1]; if(old) sessions.delete(old);
    const sid=randomUUID();
    sessions.set(sid,{role:data.role,lead:{id:randomUUID(),converted:false},accounts:[],contacts:[],opportunities:[],case:{id:randomUUID(),status:'Open',resolution:'',queue:'Standard'},audit:[]});
    res.setHeader('Set-Cookie',`sid=${sid}; HttpOnly; SameSite=Strict; Path=/`);
    return send(res,201,{message:'Demo session ready'});
  }
  const sid=req.headers.cookie?.match(/(?:^|; )sid=([^;]+)/)?.[1];
  const s=sessions.get(sid);
  if(!s) return send(res,401,{error:'Start a demo session'});
  if(req.method==='DELETE' && req.url==='/api/session') {sessions.delete(sid);return send(res,200,{deleted:true});}
  if(req.method==='GET' && req.url==='/api/state') return send(res,200,s);
  if(req.method!=='POST') return send(res,404,{error:'Not found'});
  const allowed=(role)=>s.role===role || fault==='permission';
  if(req.url==='/api/convert') {
    if(!allowed('sales')) return send(res,403,{error:'Sales role required'});
    if(typeof data.company!=='string'||!data.company.trim()) return send(res,422,{error:'Company is required'});
    if(s.lead.converted) return send(res,409,{error:'Lead already converted'});
    const account={id:randomUUID(),name:data.company.trim()};
    const contact={id:randomUUID(),accountId:account.id,leadId:s.lead.id};
    const opportunity={id:randomUUID(),accountId:account.id,leadId:s.lead.id,stage:'Qualification'};
    s.accounts.push(account);s.contacts.push(contact);s.opportunities.push(opportunity);
    Object.assign(s.lead,{converted:true,accountId:account.id,contactId:contact.id,opportunityId:opportunity.id});
    s.audit.push('lead.converted'); return send(res,200,{message:'Lead converted'});
  }
  if(req.url==='/api/close') {
    if(!allowed('support')) return send(res,403,{error:'Support role required'});
    if(fault!=='closure' && (typeof data.resolution!=='string'||!data.resolution.trim())) return send(res,422,{error:'Resolution evidence is required'});
    s.case.status='Closed';s.case.resolution=String(data.resolution||'').trim();s.audit.push('case.closed');
    return send(res,200,{message:'Case closed'});
  }
  if(req.url==='/api/route') {
    if(!allowed('support')) return send(res,403,{error:'Support role required'});
    if(typeof data.score!=='number'||!Number.isFinite(data.score)||data.score<0||data.score>100) return send(res,422,{error:'Score must be between 0 and 100'});
    s.case.queue=(fault==='routing'?data.score>50:data.score>=50)?'Priority':'Standard';
    s.audit.push('case.routed');return send(res,200,{message:`Routed to ${s.case.queue}`});
  }
  return send(res,404,{error:'Not found'});
});
server.listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log(`Demo listening on http://127.0.0.1:${server.address().port}`));
process.on('SIGTERM',()=>server.close());
