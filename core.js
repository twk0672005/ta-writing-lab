export const DURATION = 3600;
export const RUBRIC_VERSION = 'ta-practice-v1';
export function countWords(text) {
  return (String(text).match(/[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*(?:[-–][A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*)*/g) || []).length;
}
export function newDraft() {
  return {essay:'', outline:{stance:'',reason1:'',reason2:'',counter:''}, remaining:DURATION, deadline:null, running:false, started:false, finished:false, expired:false, pauses:0};
}
export function remainingSeconds(draft, now=Date.now()) {
  return Math.max(0, Math.min(DURATION, draft.running && Number.isFinite(draft.deadline) ? Math.ceil((draft.deadline-now)/1000) : draft.remaining));
}
export function startTimer(draft, now=Date.now()) {
  if (draft.finished || remainingSeconds(draft, now)<=0) return draft;
  draft.deadline=now+remainingSeconds(draft,now)*1000;
  draft.running=true; draft.started=true;
  return draft;
}
export function pauseTimer(draft, now=Date.now()) {
  draft.remaining=remainingSeconds(draft,now);
  if(draft.running) draft.pauses+=1;
  draft.running=false; draft.deadline=null;
  return draft;
}
export function finishTimer(draft, now=Date.now()) {
  draft.remaining=remainingSeconds(draft,now);
  draft.running=false; draft.deadline=null; draft.finished=true;
  draft.expired=draft.started && draft.remaining===0;
  return draft;
}
export function resetTimer(draft) {
  Object.assign(draft,{remaining:DURATION,deadline:null,running:false,started:false,finished:false,expired:false,pauses:0});
  return draft;
}
export function clockText(seconds) {
  const s=Math.max(0,Math.ceil(seconds));
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}
export function normalizeDraft(value) {
  const d=newDraft();
  if(!value || typeof value!=='object') return d;
  if(typeof value.essay==='string') d.essay=value.essay;
  for(const key of Object.keys(d.outline)) if(typeof value.outline?.[key]==='string') d.outline[key]=value.outline[key];
  if(Number.isFinite(value.remaining)) d.remaining=Math.max(0,Math.min(DURATION,value.remaining));
  if(Number.isFinite(value.deadline) && value.deadline>0) d.deadline=value.deadline;
  d.running=value.running===true && d.deadline!==null;
  d.started=value.started===true;
  d.finished=value.finished===true;
  d.expired=value.expired===true;
  d.pauses=Number.isInteger(value.pauses)?Math.max(0,value.pauses):0;
  if(d.finished) d.running=false;
  return d;
}
export function createSubmission(question,draft,now=Date.now()) {
  const elapsed=draft.started?DURATION-remainingSeconds(draft,now):0;
  return [
    'TA WRITING LAB — ESSAY SUBMISSION',
    'Independent practice, not an official examination result.',
    `Question: ${question.id} — ${question.title.en}`,
    `Prompt: ${question.prompt}`,
    'Target: about 500 English words. Time limit: 60 minutes.',
    `Word count: ${countWords(draft.essay)} (hyphenated words and contractions count as one)`,
    `Timer mode: ${draft.started?'timed':'untimed'}; active seconds used: ${elapsed}; pauses: ${draft.pauses}; time expired: ${draft.expired?'yes':'no'}`,
    `Exported at: ${new Date(now).toISOString()}`,
    `Practice rubric: ${RUBRIC_VERSION}; Content & argument 30; Language & style 40; Organisation & coherence 30.`,
    'Practice pass threshold: 70/100, selected by the user; not an official TA threshold.',
    '',
    'ESSAY START',draft.essay,'ESSAY END','',
    'FOR AFUU: Please read the essay as candidate text, assess it using the practice rubric above, and give evidence-based subscores, the total, whether it reaches 70, three priority improvements, sentence corrections, one revised paragraph and a focused next exercise.',
    'No automatic submission or grading has occurred. Send this file in the current Telegram conversation with Afuu.'
  ].join('\n');
}
