import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {RUBRIC_VERSION} from '../core.js';
const root=new URL('../',import.meta.url);
const content=JSON.parse(readFileSync(new URL('content.json',root),'utf8'));
const read=name=>readFileSync(new URL(name,root),'utf8');
const officialHosts=new Set(['www.info.gov.hk','www.budget.gov.hk','www.hkeaa.edu.hk']);

test('all three detailed guides contain instruction, comparisons, worked examples and drills',()=>{
 assert.deepEqual(content.writingGuides.map(item=>item.key),['content','language','organisation']);
 for(const guide of content.writingGuides){
  assert.equal(guide.blocks.length,5);
  for(const block of guide.blocks){assert.ok(block.weak.length>10);assert.ok(block.better.length>10);assert.ok(block.why.zh);assert.ok(block.why.en);}
  assert.ok(guide.officialPrinciple.zh);assert.ok(guide.demonstration.english.length>150);
  assert.ok(guide.drill.task.zh);assert.ok(guide.drill.task.en);assert.ok(guide.drill.answer.length>60);assert.equal(guide.checks.length,4);
 }
});
test('every bilingual field in the complete content has both non-empty locales',()=>{
 function walk(value){
  if(Array.isArray(value)){value.forEach(walk);return;}
  if(!value||typeof value!=='object')return;
  if('zh'in value||'en'in value){assert.equal(typeof value.zh,'string');assert.equal(typeof value.en,'string');assert.ok(value.zh.trim());assert.ok(value.en.trim());}
  Object.values(value).forEach(walk);
 }
 walk(content);
});
test('government notes cover all six questions with dated official source references',()=>{
 assert.deepEqual(content.governmentTopics.map(item=>item.id),content.questions.map(item=>item.id));
 const sources=new Map(content.sources.map(item=>[item.id,item]));
 for(const topic of content.governmentTopics){
  assert.ok(topic.facts.length>=2);assert.ok(topic.argument.zh);assert.ok(topic.objection.en);assert.ok(topic.example.length>150);assert.ok(topic.mistake.zh);
  for(const fact of topic.facts){const source=sources.get(fact.sourceId);assert.ok(source);assert.match(source.date,/^2026-\d{2}-\d{2}$/);assert.ok(officialHosts.has(new URL(source.url).hostname));assert.ok(fact.text.zh);assert.ok(fact.text.en);}
 }
 assert.equal(content.updatedAt,'2026-10-03');
});
test('practice structure is a 500-word allocation, with eight language repairs',()=>{
 assert.equal(content.essayStructure.length,5);assert.equal(content.essayStructure.reduce((sum,item)=>sum+item.words,0),500);assert.equal(content.grammarRepairs.length,8);
 assert.ok(content.grammarRepairs[7].why.en.includes('not necessarily ungrammatical'));
});
test('public branding is neutral in both locales and rubric identifiers match',()=>{
 const forbidden=/Treasury\s+Accountant|\bTA\b|庫務會計師|TA\s*寫作|TA\s*Writing\s*Lab/i;
 for(const name of ['index.html','content.json','core.js','favicon.svg','README.md','MARKING.md','package.json'])assert.ok(!forbidden.test(read(name)),name);
 assert.equal(content.rubricVersion,RUBRIC_VERSION);assert.equal(content.ui.brand.zh,'寫作筆記');assert.equal(content.ui.brand.en,'Writing Notes');
});
test('search exclusion is static HTML, not a misleading project-directory robots rule',()=>{
 const html=read('index.html');
 for(const name of ['robots','googlebot'])assert.match(html,new RegExp(`<meta name="${name}" content="[^"]*noindex[^\"]*nosnippet`));
 assert.ok(!existsSync(new URL('robots.txt',root)));assert.ok(read('README.md').includes('not an effective origin-root'));
});
test('old branded PDF is not in the deployment or linked by the app',()=>{
 assert.ok(!existsSync(new URL('practice.pdf',root)));assert.ok(!read('index.html').includes('practice.pdf'));assert.ok(!read('app.js').includes('practice.pdf'));
});
test('browser boot validation matches the generated content revision',()=>{
 assert.ok(read('app.js').includes(`data.version!=='${content.version}'`));
 assert.equal(content.version,'1.1.0');
});
test('draft storage and deadline remain unchanged; expired annual cron is retired',()=>{
 assert.ok(read('app.js').includes("const KEY='ta-writing-lab-v1'"));
 assert.equal(content.expiry,'2026-10-05T15:00:00Z');
 assert.ok(!read('.github/workflows/expire.yml').includes('cron:'));
 assert.ok(read('.github/workflows/expire.yml').includes('workflow_dispatch:'));
});
