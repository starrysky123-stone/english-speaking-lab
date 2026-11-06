import {lessons} from '../app/lessons';
export function practiceContext(id:unknown,value:unknown){
 const builtIn=lessons.find(l=>l.id===id);
 if(builtIn&&value==null)return {title:builtIn.en,role:builtIn.role,level:builtIn.level,words:builtIn.words.map(w=>w.word),sentences:builtIn.sentences.map(s=>s.en)};
 if(typeof id!=='string'||(!builtIn&&!/^custom-[a-zA-Z0-9-]+$/.test(id))||!value||typeof value!=='object')return null;
 const x=value as Record<string,unknown>;
 const text=(v:unknown,max:number)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
 if(!text(x.title,120)||!text(x.role,240)||!['daily','academic'].includes(x.category as string))return null;
 if(!Array.isArray(x.words)||x.words.length>12||x.words.some(w=>!text(w,80)))return null;
 if(!Array.isArray(x.sentences)||x.sentences.length>12||x.sentences.some(s=>!text(s,600)))return null;
 if(!x.words.length&&!x.sentences.length)return null;
 return {title:x.title as string,role:x.role as string,level:'adapt to the learner',words:x.words as string[],sentences:x.sentences as string[]};
}
export function lessonContext(lesson:{title:string;category:string;role:string;words:{word:string}[];sentences:{en:string}[]}){return {title:lesson.title,category:lesson.category,role:lesson.role,words:lesson.words.map(w=>w.word),sentences:lesson.sentences.map(s=>s.en)};}
