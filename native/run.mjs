import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';

// Explicitly opted-in native API companion; never runs from npm test or CI.
// This does not drive Lightning UI or establish restricted-persona coverage.
const required = ['SF_INSTANCE_URL','SF_CLIENT_ID','SF_CLIENT_SECRET','SF_EXPECTED_ORG_ID','SF_API_VERSION','SF_APPROVED_TEST_ORG_ID'];
for (const key of required) if (!process.env[key]) throw Error(`Missing ${key}`);
const env = process.env;
assert.equal(env.SF_APPROVED_TEST_ORG_ID,env.SF_EXPECTED_ORG_ID,'Test-org approval must match expected identity');
const base = new URL(env.SF_INSTANCE_URL);
assert.equal(base.protocol,'https:');
assert.ok(base.hostname.endsWith('.my.salesforce.com'),'Use the reviewed Salesforce My Domain');
assert.equal(base.pathname,'/');
assert.ok(!base.username && !base.password && !base.search && !base.hash && !base.port);
assert.match(env.SF_EXPECTED_ORG_ID,/^00D[A-Za-z0-9]{12}([A-Za-z0-9]{3})?$/);
assert.match(env.SF_API_VERSION,/^\d{2,3}\.0$/);
const root = `/services/data/v${env.SF_API_VERSION}`;
const startedAt = new Date().toISOString();
const marker = 'CQA-PROOF-'+randomUUID();
const receipt = {startedAt, runMarker:marker, scope:'Native API reference-org checks; not Lightning UI, role acceptance or all-module coverage', outcomes:[], cleanup:[], gaps:[]};
let token;
const owned = [];
let leadId;
async function request(path,method='GET',body,expected=200) {
  assert.ok(path.startsWith('/') && !path.startsWith('//'));
  const response=await fetch(new URL(path,base),{method,redirect:'error',signal:AbortSignal.timeout(45000),headers:{authorization:`Bearer ${token}`,'content-type':'application/json','Sforce-Auto-Assign':'FALSE'},body:body===undefined?undefined:JSON.stringify(body)});
  assert.equal(response.status,expected,`Unexpected HTTP status for ${method} ${path.split('?')[0]}`);
  return response.status===204?null:await response.json();
}
async function query(q,tooling=false) {return request(`${root}/${tooling?'tooling/':''}query?q=${encodeURIComponent(q)}`);}
async function create(type,body) {
  const result=await request(`${root}/sobjects/${type}`,'POST',body,201);
  assert.equal(result.success,true);assert.match(result.id,/^[A-Za-z0-9]{15,18}$/);
  owned.push({type,id:result.id});return result.id;
}
async function record(type,id) {assert.match(id,/^[A-Za-z0-9]{15,18}$/);return request(`${root}/sobjects/${type}/${id}`);}
async function check(name,fn) {
  try{await fn();receipt.outcomes.push({name,status:'passed'});console.log(`PASS ${name}`);}
  catch(error){receipt.outcomes.push({name,status:'failed',errorType:error.name});console.log(`FAIL ${name} (${error.name}); inspect private receipt`);throw error;}
}
let failed=false;
try {
  const response=await fetch(new URL('/services/oauth2/token',base),{method:'POST',redirect:'error',signal:AbortSignal.timeout(45000),headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',client_id:env.SF_CLIENT_ID,client_secret:env.SF_CLIENT_SECRET})});
  assert.equal(response.status,200,'OAuth failed');
  const auth=await response.json();token=auth.access_token;
  assert.equal(new URL(auth.instance_url).origin,base.origin,'OAuth returned a different instance');
  const org=await query('SELECT Id,IsSandbox,OrganizationType FROM Organization');
  assert.equal(org.totalSize,1);assert.equal(org.records[0].Id,env.SF_EXPECTED_ORG_ID);
  receipt.environment={identityMatched:true,isSandbox:org.records[0].IsSandbox,edition:org.records[0].OrganizationType,explicitTestOrgApproval:true,apiVersion:env.SF_API_VERSION};

  await check('Lead conversion creates linked Account and Contact',async()=>{
    const statuses=await query('SELECT MasterLabel FROM LeadStatus WHERE IsConverted = true');
    assert.ok(statuses.records.length>0,'No converted Lead status');
    const convertedStatus=env.SF_CONVERTED_STATUS;
    assert.ok(convertedStatus && statuses.records.some(r=>r.MasterLabel===convertedStatus),'Set SF_CONVERTED_STATUS to a reviewed converted status');
    leadId=await create('Lead',{LastName:marker,Company:marker});
    const before=await record('Lead',leadId);assert.equal(before.IsConverted,false);
    // Escape literals; leadId is validated. No deployments, email or opportunity creation.
    const quote=s=>s.replaceAll('\\','\\\\').replaceAll("'","\\'");
    const code=`Lead owned=[SELECT Id,LastName FROM Lead WHERE Id='${leadId}']; System.assertEquals('${marker}',owned.LastName); Database.LeadConvert lc=new Database.LeadConvert(); lc.setLeadId(owned.Id); lc.setConvertedStatus('${quote(convertedStatus)}'); lc.setDoNotCreateOpportunity(true); lc.setSendNotificationEmail(false); Database.LeadConvertResult result=Database.convertLead(lc); System.assert(result.isSuccess());`;
    const converted=await request(`${root}/tooling/executeAnonymous/?anonymousBody=${encodeURIComponent(code)}`);
    assert.equal(converted.compiled,true,'Conversion Apex did not compile');assert.equal(converted.success,true,'Conversion failed');
    const lead=await record('Lead',leadId);
    assert.equal(lead.Id,leadId);assert.equal(lead.IsConverted,true);assert.equal(lead.LastName,marker);assert.equal(lead.ConvertedOpportunityId,null);
    const account=await record('Account',lead.ConvertedAccountId);assert.equal(account.Name,marker);
    const contact=await record('Contact',lead.ConvertedContactId);assert.equal(contact.LastName,marker);assert.equal(contact.AccountId,account.Id);
    owned.push({type:'Account',id:account.Id},{type:'Contact',id:contact.Id});
  });
  await check('Case closure preserves evidence and ownership',async()=>{
    const field=env.SF_RESOLUTION_FIELD,closed=env.SF_CLOSED_STATUS;
    assert.ok(field && /^[A-Za-z][A-Za-z0-9_]*$/.test(field),'Set a reviewed SF_RESOLUTION_FIELD');
    assert.ok(closed,'Set SF_CLOSED_STATUS');
    const schema=await request(`${root}/sobjects/Case/describe`);
    assert.ok(schema.fields.some(f=>f.name===field && f.createable),'Resolution field is not available');
    const evidence='Synthetic reference-run resolution';
    const id=await create('Case',{Subject:marker,Origin:'Web',[field]:evidence});
    const before=await record('Case',id);assert.equal(before.IsClosed,false);
    await request(`${root}/sobjects/Case/${id}`,'PATCH',{Status:closed},204);
    const after=await record('Case',id);
    assert.equal(after.Id,id);assert.equal(after.Subject,marker);assert.equal(after.IsClosed,true);assert.equal(after.Status,closed);assert.equal(after[field],evidence);assert.equal(after.OwnerId,before.OwnerId);
  });
  await check('Missing Account Name is rejected without creating a record',async()=>{
    const website=`https://${marker.toLowerCase()}.invalid`;
    const result=await request(`${root}/sobjects/Account`,'POST',{Website:website},400);
    assert.ok(Array.isArray(result));assert.equal(result[0].errorCode,'REQUIRED_FIELD_MISSING');
    const after=await query(`SELECT Id FROM Account WHERE Website='${website}'`);assert.equal(after.totalSize,0);
  });
} catch(error) {
  failed=true;receipt.errorType=error.name;
  receipt.gaps.push('A failed request can have an uncertain write outcome. Reconcile this runMarker before retrying, including records whose creation response was lost.');
  // Do not log response bodies, tokens, credentials or org records.
} finally {
  if(token && leadId) {
    // Recover converted children even if a later assertion failed before registration.
    try {
      const lead=await record('Lead',leadId);
      if(lead.LastName===marker && lead.IsConverted) {
        for(const [type,id] of [['Account',lead.ConvertedAccountId],['Contact',lead.ConvertedContactId]]) {
          if(!id || owned.some(x=>x.id===id))continue;
          const row=await record(type,id);
          assert.equal(type==='Account'?row.Name:row.LastName,marker,'Cleanup ownership mismatch');
          owned.push({type,id});
        }
      }
    }catch(error){receipt.gaps.push('Could not fully reconcile converted children; inspect run-owned records');failed=true;}
  }
  // Delete children before parents; only IDs created or linked to this exact run.
  const order={Case:0,Contact:1,Lead:2,Account:3};
  for(const item of owned.sort((a,b)=>order[a.type]-order[b.type])) {
    try {
      await request(`${root}/sobjects/${item.type}/${item.id}`,'DELETE',undefined,204);
      await request(`${root}/sobjects/${item.type}/${item.id}`,'GET',undefined,404);
      receipt.cleanup.push({type:item.type,status:'deleted-and-verified'});
    }catch(error){receipt.cleanup.push({type:item.type,status:'failed',id:item.id});failed=true;}
  }
  receipt.finishedAt=new Date().toISOString();receipt.status=failed?'failed':'passed';
  receipt.gaps.push('Restricted personas, active Flow branches, missing-resolution enforcement and greenfield portability are not covered by this run.');
  await mkdir('artifacts',{recursive:true});
  await writeFile('artifacts/native-result.json',JSON.stringify(receipt,null,2)+'\n',{mode:0o600});
  console.log(`Native API run ${receipt.status}; ${receipt.cleanup.length} cleanup outcomes. Private receipt: artifacts/native-result.json`);
  if(failed)process.exitCode=1;
}
