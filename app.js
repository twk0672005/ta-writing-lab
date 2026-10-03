import {countWords,newDraft,normalizeDraft,remainingSeconds,startTimer,pauseTimer,finishTimer,resetTimer,clockText,createSubmission} from './core.js?v=2';

const KEY='ta-writing-lab-v1';
const VIEWS=['study','government','practice','models','grading'];
let data, state, storageOK=true, modelId='A';
const $=(selector)=>document.querySelector(selector);
const t=(key)=>data?.ui[key]?.[state?.lang||'zh']||key;
const loc=(value)=>value[state.lang];
const current=()=>state.drafts[state.topic];
const question=()=>data.questions.find(q=>q.id===state.topic);
function E(tag,attributes={},...children){
 const node=document.createElement(tag);
 for(const [key,value] of Object.entries(attributes)){
  if(key==='class') node.className=value;
  else if(key.startsWith('on')) node.addEventListener(key.slice(2),value);
  else if(key==='text') node.textContent=value;
  else if(value!==false && value!=null) node.setAttribute(key,value===true?'':value);
 }
 for(const child of children.flat(Infinity)) if(child!=null) node.append(typeof child==='string'?document.createTextNode(child):child);
 return node;
}
function text(tag,key,cls=''){return E(tag,{class:cls},t(key));}
function linkButton(key,view,primary=true){return E('a',{class:`button ${primary?'primary':'secondary'}`,href:`#${view}`},t(key));}
function header(title,lead){return [text('span','unofficial','eyebrow'),text('h1',title),text('p',lead,'lead')];}
function sectionHeading(title,number){return E('div',{class:'section-heading'},text('h2',title),E('span',{class:'section-number','aria-hidden':'true'},number));}
function sourceCard(source){return E('article',{class:'source-card'},E('h3',{},loc(source.title)),E('p',{},loc(source.note)),source.date?E('p',{class:'small muted'},t('sourceDate')+': '+source.date):null,E('a',{href:source.url,target:'_blank',rel:'noopener noreferrer'},t('openSource')));}
function examplePair(item){
 return E('div',{class:'example-pair'},E('div',{},text('p','weakExample','example-label'),E('p',{class:'example weak-example',lang:'en'},item.weak)),E('div',{},text('p','betterExample','example-label'),E('p',{class:'example better-example',lang:'en'},item.better)));
}
function writingGuides(){
 const stack=E('div',{class:'guide-stack'});
 for(const guide of data.writingGuides){
  const panel=E('details',{class:'writing-guide','data-guide-key':guide.key},E('summary',{},loc(guide.title)),E('p',{class:'guide-intro'},loc(guide.intro)),E('p',{class:'notice'},E('strong',{},t('officialPrinciple')+': '),loc(guide.officialPrinciple)));
  for(const block of guide.blocks)panel.append(E('section',{class:'guide-block'},E('h3',{},loc(block.title)),E('p',{},loc(block.body)),examplePair(block),E('p',{class:'small'},E('strong',{},t('whyBetter')+': '),loc(block.why))));
  if(guide.key==='language')panel.append(E('section',{class:'guide-block'},text('h3','grammarTitle'),E('div',{class:'repair-grid'},data.grammarRepairs.map(item=>E('article',{'data-repair':'',class:'repair-card'},examplePair(item),E('p',{class:'small'},loc(item.why)))))));
  if(guide.key==='organisation')panel.append(E('section',{class:'guide-block'},text('h3','structureTitle'),text('p','structureNote','small muted'),E('ol',{class:'structure-list'},data.essayStructure.map(item=>E('li',{},E('strong',{},loc(item.title)),E('span',{class:'word-allocation'},state.lang==='zh'?`約${item.words}詞`:`about ${item.words} words`),E('p',{class:'example',lang:'en'},item.starter))))));
  panel.append(E('section',{class:'guide-block'},text('h3','workedParagraph'),E('p',{class:'example worked-paragraph',lang:'en'},guide.demonstration.english),E('p',{class:'small'},loc(guide.demonstration.notes))),E('section',{class:'guide-block'},text('h3','selfCheck'),E('ul',{class:'check-list'},guide.checks.map(item=>E('li',{},loc(item))))),E('section',{class:'guide-block short-drill'},text('h3','shortDrill'),E('p',{},loc(guide.drill.task)),E('details',{class:'answer-details'},text('summary','suggestedAnswer'),E('p',{class:'example',lang:'en'},guide.drill.answer),E('p',{class:'small'},loc(guide.drill.explanation)))));
  stack.append(panel);
 }
 return stack;
}
function renderGovernment(){
 const notes=E('div',{class:'government-notes'});
 const jumps=E('div',{class:'topic-jumps',role:'group','aria-label':t('government')});
 for(const topic of data.governmentTopics){
  const card=E('details',{class:'government-note','data-gov-id':topic.id},E('summary',{},E('span',{class:'topic-letter','aria-hidden':'true'},topic.id),loc(topic.title)));
  if(topic.id==='A')card.open=true;
  const facts=E('section',{class:'guide-block'},text('h3','factsLabel'));
  for(const fact of topic.facts){
   const source=data.sources.find(item=>item.id===fact.sourceId);
   facts.append(E('div',{class:'fact'},E('p',{},loc(fact.text)),E('p',{class:'source-reference small'},E('a',{href:source.url,target:'_blank',rel:'noopener noreferrer'},loc(source.title)+' ↗'),E('span',{},' · '+source.date))));
  }
  card.append(facts,E('section',{class:'guide-block'},text('h3','argumentLabel'),E('p',{},loc(topic.argument))),E('section',{class:'guide-block'},text('h3','objectionLabel'),E('p',{},loc(topic.objection))),E('section',{class:'guide-block'},text('h3','usageLabel'),E('p',{class:'example worked-paragraph',lang:'en'},topic.example)),E('p',{class:'notice'},E('strong',{},t('avoidLabel')+': '),loc(topic.mistake)),E('button',{class:'button primary',type:'button',onclick:()=>{state.topic=topic.id;persist();location.hash='practice';}},t('topicPractice')));
  notes.append(card);
  jumps.append(E('button',{type:'button',class:'button secondary',onclick:()=>{card.open=true;card.scrollIntoView({block:'start'});card.querySelector('summary').focus({preventScroll:true});}},topic.id+' / '+loc(data.questions.find(item=>item.id===topic.id).title)));
 }
 $('#government').replaceChildren(...header('governmentTitle','governmentLead'),jumps,notes);
}
function topicField(id){
 const select=E('select',{id,onchange:(event)=>{state.topic=event.target.value;persist();render();}});
 for(const q of data.questions){const option=E('option',{value:q.id},`${q.id} / ${loc(q.title)}`);option.selected=q.id===state.topic;select.append(option);}
 return E('div',{class:'topic-field'},E('label',{for:id},t('selectTopic')),select);
}
function saveStateNode(){return E('span',{'data-save-state':'',class:'save-state'+(storageOK?'':' error'),role:'status'},t(storageOK?'saved':'saveError'));}
function updateSaveState(){document.querySelectorAll('[data-save-state]').forEach(n=>{n.textContent=t(storageOK?'saved':'saveError');n.classList.toggle('error',!storageOK);});}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}updateSaveState();}
function restore(){
 let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{storageOK=false;}
 const drafts={};for(const q of data.questions) drafts[q.id]=normalizeDraft(saved.drafts?.[q.id]);
 return {lang:saved.lang==='en'?'en':'zh',topic:data.questions.some(q=>q.id===saved.topic)?saved.topic:'A',drafts,spellcheck:saved.spellcheck===true};
}
function activeView(){const hash=location.hash.slice(1);return VIEWS.includes(hash)?hash:'study';}
function renderStudy(){
 const metrics=E('aside',{class:'hero-aside','aria-label':state.lang==='zh'?'練習設定':'Practice format'},
  E('div',{class:'metric'},E('strong',{},'60'),text('span','minutes')),
  E('div',{class:'metric'},E('strong',{},'500'),text('span','words')),
  E('div',{class:'metric'},E('strong',{},'70'),text('span','pass')));
 const hero=E('div',{class:'hero'},E('div',{},...header('studyTitle','studyLead'),E('div',{class:'button-row'},linkButton('startPractice','practice'),linkButton('viewModels','models',false))),metrics);
 const lessons=E('div',{class:'lesson-grid'});
 data.lessons.forEach((lesson,i)=>{
  const details=E('details',{class:'lesson'},E('summary',{},E('span',{class:'lesson-index','aria-hidden':'true'},String(i+1).padStart(2,'0')),loc(lesson.title)),E('p',{},loc(lesson.text)),E('p',{class:'example',lang:'en'},lesson.example));
  if(i===0) details.open=true;
  lessons.append(details);
 });
 const guideSection=E('div',{class:'section-block'},sectionHeading('guideTitle','02'),text('p','guideLead','lead'),writingGuides());
 const official=E('div',{class:'section-block'},sectionHeading('officialTitle','03'),text('p','officialNote','notice'),E('div',{class:'source-grid'},data.sources.slice(0,3).map(sourceCard)));
 const outlines=E('div',{class:'outline-grid'});
 for(const key of ['stance','reason1','reason2','counter']){
  const input=E('textarea',{id:`plan-${key}`,rows:'3',placeholder:t('planPlaceholder'),oninput:(event)=>{current().outline[key]=event.target.value;persist();}});input.value=current().outline[key];
  outlines.append(E('div',{class:'field'},E('label',{for:`plan-${key}`},t(key)),input));
 }
 const warmup=E('div',{class:'section-block warmup'},sectionHeading('warmupTitle','04'),text('p','warmupLead','small muted'),topicField('study-topic'),E('p',{class:'example',lang:'en'},question().prompt),outlines,E('div',{class:'button-row'},linkButton('startPractice','practice')),saveStateNode());
 const sources=E('div',{class:'section-block'},sectionHeading('sourcesTitle','05'),E('div',{class:'source-grid'},data.sources.slice(3).map(sourceCard)));
 $('#study').replaceChildren(hero,E('p',{class:'review-route'},t('reviewRoute')),E('div',{class:'button-row'},linkButton('governmentCta','government',false)),E('div',{class:'section-block'},sectionHeading('lessonTitle','01'),lessons),guideSection,official,warmup,sources);
}
function updateTimer(){
 const d=current();const remaining=remainingSeconds(d);
 const clock=$('#clock');if(clock)clock.textContent=clockText(remaining);
 const status=$('#timer-status');if(status)status.textContent=t(d.expired?'expired':d.finished?'finished':d.running?'running':d.started?'paused':'ready');
 const start=$('#timer-start');if(start){start.textContent=t(d.started?'resume':'start');start.disabled=d.running||d.finished||remaining===0;}
 const pause=$('#timer-pause');if(pause)pause.disabled=!d.running;
 const finish=$('#finish');if(finish)finish.disabled=!d.essay.trim();
 const downloads=document.querySelectorAll('[data-export]');downloads.forEach(n=>n.disabled=!d.essay.trim());
}
function updateWords(){const output=$('#word-count');if(output)output.textContent=`${countWords(current().essay)} / 500 words`;updateTimer();}
function doStart(){startTimer(current());persist();updateTimer();}
function doPause(){pauseTimer(current());persist();updateTimer();}
function doReset(){if(confirm(t('resetConfirm'))){resetTimer(current());persist();updateTimer();}}
function submissionSummary(){return `${question().id} / ${loc(question().title)} · ${countWords(current().essay)} words · ${clockText(3600-remainingSeconds(current()))}`;}
function openSubmission(){
 if(!current().essay.trim())return;
 finishTimer(current());persist();updateTimer();
 $('#submission-summary').textContent=submissionSummary();$('#delivery-status').textContent='';
 $('#submission-dialog').showModal();
}
function renderPractice(){
 const prompt=E('div',{class:'question-card'},text('span','questionLabel','eyebrow'),E('p',{class:'prompt',lang:'en'},question().prompt));
 if(state.lang==='zh')prompt.append(E('p',{class:'translation-text'},t('translationLabel')+'：'+question().translation));
 const textarea=E('textarea',{id:'essay',lang:'en',spellcheck:String(state.spellcheck),placeholder:t('essayPlaceholder'),'aria-describedby':'word-hint',oninput:(event)=>{current().essay=event.target.value;current().finished=false;persist();updateWords();}});textarea.value=current().essay;
 const spell=E('input',{type:'checkbox',id:'spellcheck',onchange:(event)=>{state.spellcheck=event.target.checked;textarea.spellcheck=state.spellcheck;persist();}});spell.checked=state.spellcheck;
 const editor=E('div',{class:'editor-card'},E('div',{class:'editor-label-row'},E('label',{for:'essay'},t('essayLabel')),saveStateNode()),textarea,E('div',{class:'editor-bottom'},E('output',{id:'word-count',class:'word-output',for:'essay'},'0 / 500 words'),E('label',{class:'spellcheck-label',for:'spellcheck'},spell,t('spellcheck'))));
 const outline=E('details',{class:'outline-reference'},text('summary','planInPractice'));
 const hasOutline=Object.values(current().outline).some(x=>x.trim());
 if(hasOutline){for(const [key,value]of Object.entries(current().outline))if(value.trim())outline.append(E('p',{class:'outline-line'},E('strong',{},t(key)+': '),value));}else outline.append(text('p','noOutline','small muted'));
 const writing=E('div',{},prompt,editor,E('p',{id:'word-hint',class:'small muted word-hint'},t('wordHint')),E('div',{class:'button-row'},E('button',{type:'button',class:'button primary',id:'finish',onclick:openSubmission},t('finish')),E('button',{type:'button',class:'button secondary','data-export':'',onclick:download},t('download'))),E('p',{id:'practice-delivery-status',class:'small muted',role:'status'}),outline);
 const mobile=window.matchMedia('(max-width:760px)').matches;
 const timer=E('div',{class:'timer-panel'+(mobile?' timer-mobile':'')},text('h2','timerTitle'),E('div',{id:'clock',class:'clock',role:'timer','aria-live':'off'},'60:00'),E('p',{id:'timer-status',class:'timer-status',role:'status'},t('ready')),E('div',{class:'button-row'},E('button',{id:'timer-start',type:'button',class:'button primary',onclick:doStart},t('start')),E('button',{id:'timer-pause',type:'button',class:'button secondary',onclick:doPause},t('pause'))),E('button',{id:'timer-reset',type:'button',class:'text-button',onclick:doReset},t('reset')));
 const sidebar=E('aside',{},mobile?null:timer,E('div',{class:'side-note'},text('h3','timePlanTitle'),text('p','timePlan')),E('div',{class:'side-note'},text('h3','checklistTitle'),text('p','checklist')),text('p','privateNote','small muted'));
 $('#practice').replaceChildren(...header('practiceTitle','practiceLead'),topicField('practice-topic'),mobile?timer:null,E('div',{class:'practice-layout'},writing,sidebar));updateWords();
}
function renderModels(){
 const tabs=E('div',{class:'model-tabs',role:'group','aria-label':t('models')});
 data.models.forEach(m=>tabs.append(E('button',{type:'button','aria-pressed':String(m.id===modelId),onclick:()=>{modelId=m.id;renderModels();}},`${m.id} / ${loc(data.questions.find(q=>q.id===m.id).title)}`)));
 const model=data.models.find(m=>m.id===modelId);
 const sheet=E('article',{class:'essay-sheet'},text('span','unofficialLabel','eyebrow'),E('h2',{lang:'en'},model.heading),E('p',{class:'small muted'},'500 words'));
 model.paragraphs.forEach((paragraph,i)=>{
  sheet.append(E('p',{class:'english-paragraph',lang:'en'},paragraph));
  if(state.lang==='zh')sheet.append(E('details',{class:'translation-details'},text('summary','translation'),E('p',{},model.translations[i])));
 });
 const analysis=E('aside',{class:'commentary'},text('h3','position'),E('p',{class:'position-box'},loc(model.position)),text('h3','analysis'),E('ol',{},model.analysis.map(a=>E('li',{},loc(a)))),E('a',{href:data.sources.find(s=>s.id==='hkeaa-2025-pdf').url,target:'_blank',rel:'noopener noreferrer',class:'small'},t('officialSampleLink')));
 $('#models').replaceChildren(...header('modelTitle','modelLead'),tabs,E('div',{class:'model-layout'},sheet,analysis));
}
function renderGrading(){
 const cards=data.rubric.map(item=>E('article',{class:'rubric-card'},E('span',{class:'rubric-max'},String(item.max)),E('h2',{},loc(item.title)),E('ul',{},item.parts.map(part=>E('li',{},loc(part))))));
 const steps=E('div',{},text('h2','submitStepsTitle'),E('ol',{},['submitStep1','submitStep2','submitStep3'].map(key=>text('li',key))));
 const feedback=E('div',{},text('h2','feedbackTitle'),text('p','feedback','small'),linkButton('startPractice','practice'));
 const source=data.sources.find(s=>s.id==='hkeaa-descriptors');
 $('#grading').replaceChildren(...header('gradingTitle','gradingLead'),text('p','practiceThreshold','threshold'),text('p','rubricNote','notice'),E('div',{class:'rubric-grid'},cards),E('a',{href:source.url,target:'_blank',rel:'noopener noreferrer',class:'small'},loc(source.title)+' ↗'),E('div',{class:'section-block'},text('h2','guideTitle'),writingGuides()),E('div',{class:'submission-steps'},steps,feedback));
}
function updateLocale(){
 document.documentElement.lang=state.lang==='zh'?'zh-Hant-HK':'en';
 document.title=state.lang==='zh'?'寫作筆記 · 先溫習，再寫作':'Writing Notes · Study, write, improve';
 document.querySelectorAll('[data-i18n]').forEach(n=>n.textContent=t(n.dataset.i18n));
 document.querySelectorAll('[data-lang]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.lang===state.lang)));
}
function render(){
 updateLocale();renderStudy();renderGovernment();renderPractice();renderModels();renderGrading();
 const view=activeView();for(const key of VIEWS)$(`#${key}`).hidden=key!==view;
 document.querySelectorAll('[data-view]').forEach(n=>{if(n.dataset.view===view)n.setAttribute('aria-current','page');else n.removeAttribute('aria-current');});
 updateSaveState();
}
function download(){
 if(!current().essay.trim())return;
 const blob=new Blob(['\uFEFF',createSubmission(question(),current())],{type:'text/plain;charset=utf-8'});
 const url=URL.createObjectURL(blob);const anchor=E('a',{href:url,download:`writing-essay-${state.topic}-${new Date().toISOString().slice(0,10)}.txt`});
 document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
 $('#delivery-status').textContent=t('downloaded');
 const visibleStatus=$('#practice-delivery-status');if(visibleStatus)visibleStatus.textContent=t('downloaded');
}
async function copy(){
 try{await navigator.clipboard.writeText(createSubmission(question(),current()));$('#delivery-status').textContent=t('copied');}
 catch{$('#delivery-status').textContent=t('copyFailed');}
}
function tick(){
 let changed=false;for(const draft of Object.values(state.drafts))if(draft.running&&remainingSeconds(draft)===0){finishTimer(draft);changed=true;}
 if(changed)persist();updateTimer();
}
async function boot(){
 try{
  const response=await fetch('./content.json',{cache:'no-cache'});if(!response.ok)throw new Error('Content unavailable');data=await response.json();
  if(data.version!=='1.1.0'||!Array.isArray(data.questions)||data.questions.length!==6||!Array.isArray(data.writingGuides)||data.writingGuides.length!==3||!Array.isArray(data.governmentTopics)||data.governmentTopics.length!==6)throw new Error('Invalid content');
  state=restore();$('#loading').hidden=true;render();tick();
  window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);});
  document.querySelectorAll('[data-lang]').forEach(button=>button.addEventListener('click',()=>{state.lang=button.dataset.lang;persist();render();}));
  $('#dialog-close').addEventListener('click',()=>$('#submission-dialog').close());
  $('#continue-editing').addEventListener('click',()=>{$('#submission-dialog').close();current().finished=false;persist();updateTimer();$('#essay').focus();});
  $('#dialog-download').addEventListener('click',download);$('#dialog-copy').addEventListener('click',copy);
  window.matchMedia('(max-width:760px)').addEventListener('change',()=>renderPractice());
  window.addEventListener('beforeunload',()=>persist());setInterval(tick,250);
 }catch{
  $('#loading').textContent='內容未能載入，請重新整理；請勿清除已有草稿的瀏覽器資料。 Material could not load. Refresh without clearing browser data containing drafts.';
 }
}
boot();
