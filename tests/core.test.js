import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {countWords,newDraft,remainingSeconds,startTimer,pauseTimer,finishTimer,resetTimer,normalizeDraft,clockText,createSubmission} from '../core.js';
const content=JSON.parse(readFileSync(new URL('../content.json',import.meta.url),'utf8'));

test('word count handles empty input, punctuation, contractions and hyphens',()=>{
 assert.equal(countWords(''),0);assert.equal(countWords(' -- 中文 '),0);
 assert.equal(countWords("AI's well-being plan for 2026–27."),5);
 assert.equal(countWords('one\n\ntwo\tthree'),3);
});
test('both original essays really have 500 English words',()=>{
 for(const model of content.models)assert.equal(countWords(model.paragraphs.join(' ')),500);
});
test('rubric totals 100 and practice pass mark is 70',()=>{
 assert.equal(content.rubric.reduce((sum,item)=>sum+item.max,0),100);assert.equal(content.passMark,70);
 assert.equal(content.questions.length,6);assert.equal(content.lessons.length,6);
});
test('every interface label and teaching item has both locales',()=>{
 for(const [key,label]of Object.entries(content.ui)){assert.ok(label.zh,key);assert.ok(label.en,key);}
 for(const item of [...content.lessons,...content.rubric,...content.sources]){assert.ok(item.title.zh);assert.ok(item.title.en);}
});
test('wall clock survives tab inactivity and reload',()=>{
 const draft=newDraft();startTimer(draft,100000);assert.equal(remainingSeconds(draft,160000),3540);
 const reloaded=normalizeDraft(JSON.parse(JSON.stringify(draft)));assert.equal(remainingSeconds(reloaded,280000),3420);
});
test('pause and resume preserve active time and record pauses',()=>{
 const d=newDraft();startTimer(d,100000);pauseTimer(d,130000);assert.equal(d.remaining,3570);assert.equal(d.pauses,1);
 assert.equal(remainingSeconds(d,900000),3570);startTimer(d,1000000);assert.equal(remainingSeconds(d,1030000),3540);
});
test('expiry and finishing never remove the essay or outline',()=>{
 const d=newDraft();d.essay='Original candidate text';d.outline.stance='conditional support';startTimer(d,100000);
 assert.equal(remainingSeconds(d,4000000),0);finishTimer(d,4000000);assert.ok(d.expired);assert.ok(d.finished);
 assert.equal(d.essay,'Original candidate text');assert.equal(d.outline.stance,'conditional support');
});
test('reset changes the clock only',()=>{
 const d=newDraft();d.essay='Keep this.';d.outline.counter='privacy';startTimer(d,1);finishTimer(d,10);resetTimer(d);
 assert.equal(d.remaining,3600);assert.equal(d.essay,'Keep this.');assert.equal(d.outline.counter,'privacy');assert.equal(d.started,false);
});
test('malformed storage has safe defaults',()=>{
 const d=normalizeDraft({essay:7,remaining:-90,deadline:'bad',running:true,outline:{stance:1}});
 assert.equal(d.essay,'');assert.equal(d.remaining,0);assert.equal(d.running,false);assert.equal(d.outline.stance,'');
});
test('export preserves question and exact essay, labels no auto grading',()=>{
 const d=newDraft();d.essay='<script>alert(1)</script>\nMy original text.';const result=createSubmission(content.questions[0],d,100000);
 assert.ok(result.includes(content.questions[0].prompt));assert.ok(result.includes(d.essay));assert.ok(result.includes('70/100'));assert.ok(result.includes('not an official TA threshold'));assert.ok(result.includes('untimed'));
 assert.ok(result.includes('No automatic submission or grading has occurred.'));
});
test('clock never goes negative and zero is visible',()=>{assert.equal(clockText(3600),'60:00');assert.equal(clockText(0),'00:00');assert.equal(clockText(-10),'00:00');});
