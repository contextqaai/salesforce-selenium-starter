import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
const valid={SF_INSTANCE_URL:'https://test.my.salesforce.com',SF_CLIENT_ID:'unused',SF_CLIENT_SECRET:'unused',SF_EXPECTED_ORG_ID:'00D000000000000AAA',SF_APPROVED_TEST_ORG_ID:'00D000000000000AAA',SF_API_VERSION:'68.0'};
for(const [name,patch] of [
 ['missing credentials',{SF_CLIENT_SECRET:''}],
 ['unapproved identity',{SF_APPROVED_TEST_ORG_ID:'00D111111111111AAA'}],
 ['non-Salesforce host',{SF_INSTANCE_URL:'https://example.com'}],
 ['insecure origin',{SF_INSTANCE_URL:'http://test.my.salesforce.com'}],
 ['embedded credentials',{SF_INSTANCE_URL:'https://user:pass@test.my.salesforce.com'}],
 ['invalid API version',{SF_API_VERSION:'68.0/other'}]
]) test(name,()=>{
 const child=spawnSync(process.execPath,[fileURLToPath(new URL('./run.mjs',import.meta.url))],{env:{...valid,...patch},encoding:'utf8',timeout:3000});
 assert.equal(child.error,undefined);assert.equal(child.status,1);assert.match(child.stderr,/Missing|AssertionError/);
 assert.doesNotMatch(child.stdout,/Native API run/,'Preflight must fail before OAuth/network work');
});
