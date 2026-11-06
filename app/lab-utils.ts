import type {Word} from './lessons';
export type ReviewWord=Word&{id:string;lessonId:string;source:'manual'|'assessment';mastered:boolean;addedAt:string;score?:number;reviews:number};
export type PracticeLog={id:string;lessonId:string;date:string;seconds:number;confidence:number};
export type LabState={review:ReviewWord[];logs:PracticeLog[];progress:Record<string,number>;lastLesson:string;goal:number;rate:number;accent:string};
export const initialState:LabState={review:[],logs:[],progress:{},lastLesson:'introductions',goal:10,rate:.85,accent:'en-US'};
export const localDay=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export function readState():LabState{try{const d=JSON.parse(localStorage.getItem('speaking-lab-v1')||'null');if(d&&Array.isArray(d.review)&&Array.isArray(d.logs))return {...initialState,...d,progress:d.progress||{}};}catch{}return {...initialState};}
export function speak(text:string,rate:number,accent:string,onError:(s:string)=>void){
 if(!('speechSynthesis' in window)){onError('此瀏覽器不支援發音播放，請使用新版 Chrome、Edge 或 Safari。');return;}
 speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=accent;u.rate=rate;
 const voices=speechSynthesis.getVoices();u.voice=voices.find(v=>v.lang===accent)||voices.find(v=>v.lang.startsWith('en'))||null;
 u.onerror=e=>{if(e.error!=='interrupted'&&e.error!=='canceled')onError('發音暫時無法播放，請確認裝置的語音與音量設定。');};speechSynthesis.speak(u);
}
export async function toWav(blob:Blob){
 const ctx=new AudioContext();try{
 const audio=await ctx.decodeAudioData(await blob.arrayBuffer());
 const len=Math.min(Math.round(audio.duration*16000),480000);
 const offline=new OfflineAudioContext(1,len,16000);const source=offline.createBufferSource();source.buffer=audio;source.connect(offline.destination);source.start();
 const samples=(await offline.startRendering()).getChannelData(0);const b=new ArrayBuffer(44+samples.length*2);const v=new DataView(b);
 const str=(o:number,s:string)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};
 str(0,'RIFF');v.setUint32(4,b.byteLength-8,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,16000,true);v.setUint32(28,32000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,samples.length*2,true);
 for(let i=0;i<samples.length;i++){const s=Math.max(-1,Math.min(1,samples[i]));v.setInt16(44+i*2,s<0?s*32768:s*32767,true);}return new Blob([b],{type:'audio/wav'});
 }finally{await ctx.close();}
}
export type Assessment={source:string;reference:string;result:{Display?:string;AccuracyScore?:number;FluencyScore?:number;CompletenessScore?:number;PronScore?:number;PronunciationAssessment?:{AccuracyScore?:number;FluencyScore?:number;CompletenessScore?:number;PronScore?:number};Words?:{Word:string;AccuracyScore?:number;ErrorType?:string;PronunciationAssessment?:{AccuracyScore?:number;ErrorType?:string}}[]}};
export function weakWords(a:Assessment){return(a.result.Words||[]).filter(w=>{const p=w.PronunciationAssessment||w;return typeof p.AccuracyScore==='number'&&p.AccuracyScore<70&&p.ErrorType!=='Omission'&&p.ErrorType!=='Insertion';}).map(w=>({word:w.Word,score:(w.PronunciationAssessment||w).AccuracyScore!}));}
