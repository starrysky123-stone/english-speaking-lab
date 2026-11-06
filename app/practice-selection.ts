import type {Lesson,Word} from './lessons';
export type PracticeSelection={words:Word[];sentences:Lesson['sentences']};
export const selectionKey=(s:string)=>s.trim().replace(/\s+/g,' ').toLowerCase();
export function practiceOptions(lesson:Lesson):PracticeSelection{
 const words=new Map(lesson.words.map(w=>[selectionKey(w.word),w]));
 const sentences=new Map(lesson.sentences.map(s=>[selectionKey(s.en),s]));
 if(lesson.material){
  for(const word of lesson.material.text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)||[]){if(word.length<=80&&!words.has(selectionKey(word)))words.set(selectionKey(word),{word,ipa:'',meaning:'',tip:'選自你的教材。先聽示範，再錄音回聽。'});}
  const segmenter=new Intl.Segmenter('en',{granularity:'sentence'});
  for(const paragraph of lesson.material.text.split(/\n\s*\n/))for(const s of segmenter.segment(paragraph.replace(/\n/g,' '))){const en=s.segment.trim();if(en.length<=600&&/[A-Za-z]/.test(en)&&!sentences.has(selectionKey(en)))sentences.set(selectionKey(en),{en,zh:''});}
 }
 return {words:[...words.values()],sentences:[...sentences.values()]};
}
export function validSelection(value:unknown):value is PracticeSelection{
 if(!value||typeof value!=='object')return false;const v=value as PracticeSelection;
 const text=(s:unknown,n:number)=>typeof s==='string'&&s.length<=n;
 return Array.isArray(v.words)&&v.words.length<=12&&v.words.every(w=>w&&text(w.word,80)&&!!w.word.trim()&&text(w.ipa,100)&&text(w.meaning,200)&&text(w.tip,400))&&Array.isArray(v.sentences)&&v.sentences.length<=12&&v.sentences.every(s=>s&&text(s.en,600)&&!!s.en.trim()&&text(s.zh,600))&&(v.words.length+v.sentences.length>0);
}
export function selectedLesson(lesson:Lesson,selection:PracticeSelection):Lesson{
 if(!validSelection(selection))throw new Error('請選至少一個單字或句子，每類最多 12 個。');
 return {...lesson,words:selection.words.map(w=>({...w})),sentences:selection.sentences.map(s=>({...s}))};
}
export function readSelections(value:unknown):Record<string,PracticeSelection>{
 if(!value||typeof value!=='object'||Array.isArray(value))return {};
 return Object.fromEntries(Object.entries(value).slice(0,60).filter(([id,v])=>id.length<=100&&validSelection(v)));
}
