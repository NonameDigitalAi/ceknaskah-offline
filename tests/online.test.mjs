import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {handleOnline,normalizeResult,safeUrl} from '../server/online-api.mjs';
import {onlineReportHtml,putReport,readReports} from '../src/online-reports.mjs';
import {estimateCredits} from '../src/online-config.mjs';
import worker from '../server/worker.mjs';
const text='Penelitian ini meninjau literasi digital mahasiswa dan cara menilai keandalan sumber informasi. '.repeat(8);
const token='synthetic-test-token-not-a-real-key';
const request=(body={},headers={})=>new Request('https://ceknaskah.test/api/online/scan',{method:'POST',headers:{'Content-Type':'application/json','X-Winston-Key':token,Origin:'https://ceknaskah.test',...headers},body:JSON.stringify({kind:'ai',text,language:'id',consent:true,...body})});
const aiFixture={status:200,score:18,sentences:[{text:'Penelitian ini meninjau literasi digital.',score:8}],credits_used:100,credits_remaining:1900,version:'fixture-only',language:'id'};
const plagiarismFixture={status:200,result:{score:42,textWordCounts:100,totalPlagiarismWords:42},sources:[{title:'Sumber buatan untuk pengujian',url:'https://example.org/paper',score:42,plagiarismWords:42,plagiarismFound:[{startIndex:0,endIndex:10,sequence:'Penelitian ini'}]}],credits_used:200,credits_remaining:1700};

test('API rejects invalid requests before any credit-consuming outbound call',async()=>{
 let calls=0;const fetcher=()=>{calls++;throw Error('unexpected');};
 for(const [req,status] of [[request({}, {'X-Winston-Key':''}),401],[request({consent:false}),400],[request({language:'xx'}),400],[request({text:'short'}),400],[request({text:'a'.repeat(120001)}),400],[request({kind:'unknown'}),400],[request({}, {Origin:'https://attacker.test'}),403]])assert.equal((await handleOnline(req,fetcher)).status,status);
 assert.equal(calls,0);
});
test('AI uses fixed provider endpoint, Indonesian model input, and reverses Human Score correctly',async()=>{
 let calls=0;
 const response=await handleOnline(request({website:'https://attacker.test'}),async(url,options)=>{
  calls++;assert.equal(url,'https://api.gowinston.ai/v2/ai-content-detection');assert.equal(options.headers.Authorization,`Bearer ${token}`);assert.equal(options.redirect,'error');
  const body=JSON.parse(options.body);assert.equal(body.language,'id');assert.equal(body.version,'latest');assert.equal(body.website,undefined);assert.equal(body.text,text.trim());return Response.json(aiFixture);
 });
 assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
 const result=await response.json();assert.equal(result.humanScore,18);assert.equal(result.aiScore,82);assert.equal(result.sentences[0].aiScore,92);assert.equal(result.creditsRemaining,1900);assert.equal(calls,1);assert.ok(!JSON.stringify(result).includes(token));
});
test('Plagiarism preserves provider score and evidence rather than summing overlapping sources',async()=>{
 const response=await handleOnline(request({kind:'plagiarism'}),async(url,options)=>{
  assert.equal(url,'https://api.gowinston.ai/v2/plagiarism');assert.equal(JSON.parse(options.body).country,'id');return Response.json({...plagiarismFixture,sources:[...plagiarismFixture.sources,...plagiarismFixture.sources]});
 });
 const result=await response.json();assert.equal(result.score,42);assert.equal(result.sources.length,2);assert.equal(result.sources[0].passages[0].text,'Penelitian ini');
});
test('Missing, invalid and nonnumeric provider scores never turn into 0%',async()=>{
 for(const score of [undefined,null,'0',NaN,-1,101])assert.throws(()=>normalizeResult('ai',{score}));
 const bad=await handleOnline(request(),async()=>Response.json({status:200}));assert.equal(bad.status,502);assert.equal((await bad.json()).aiScore,undefined);
 assert.equal(normalizeResult('ai',{score:100}).aiScore,0);
 assert.equal(normalizeResult('plagiarism',{result:{score:0},sources:[]}).score,0);
});
test('Provider auth and exhausted credits return actionable errors with no retries or raw secret echo',async()=>{
 for(const code of [401,402,429,500]){
  let calls=0;const response=await handleOnline(request(),async()=>{calls++;return Response.json({error:`secret ${token}`},{status:code});});
  assert.equal(response.status,code===500?502:code);assert.equal(calls,1);assert.ok(!(await response.text()).includes(token));
 }
 const response=await handleOnline(request(),async()=>{throw Error(token);});assert.equal(response.status,502);assert.ok(!(await response.text()).includes(token));
});
test('Provider source links are limited to public HTTP schemes, and exports escape manuscript HTML',()=>{
 for(const url of ['javascript:alert(1)','data:text/html,hi','https://user:pass@example.org'])assert.equal(safeUrl(url),null);
 const r={title:'<img onerror=alert(1)>',text:'<script>secret()</script>',createdAt:'2026-09-10',results:{ai:{status:'error',error:'Connection failed'},plagiarism:{status:'complete',...normalizeResult('plagiarism',plagiarismFixture)}}};
 const html=onlineReportHtml(r);assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(html.includes('Tidak tersedia'));assert.ok(html.includes('42.0%'));assert.ok(html.includes('https://example.org/paper'));
});
test('Both checks budget three credits per local word, not GPT tokens',()=>{assert.equal(estimateCredits('literasi digital mahasiswa','both'),9);assert.equal(estimateCredits('literasi digital mahasiswa','plagiarism'),6);});
test('Online report roundtrip preserves partial errors and stores no API key',async()=>{
 const report={id:'roundtrip',title:'Synthetic report',text,createdAt:'2026-09-10T00:00:00Z',results:{ai:{status:'complete',...normalizeResult('ai',aiFixture)},plagiarism:{status:'error',error:'Insufficient credits'}}};
 await putReport(report);const [saved]=await readReports();assert.deepEqual(saved,report);assert.ok(!JSON.stringify(saved).includes(token));
});
test('Worker serves API separately from static assets',async()=>{
 const api=await worker.fetch(new Request('https://ceknaskah.test/api/online/status'),{});assert.equal((await api.json()).service,'ceknaskah-online');
 const asset=await worker.fetch(new Request('https://ceknaskah.test/'),{ASSETS:{fetch:()=>new Response('static')}});assert.equal(await asset.text(),'static');
});
