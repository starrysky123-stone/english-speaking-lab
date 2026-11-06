import {lessons} from '../app/lessons';
export function practiceContext(id:unknown,value:unknown){
 const builtIn=lessons.find(l=>l.id===id);
 if(builtIn)return {title:builtIn.en,role:builtIn.role,level:builtIn.level,words:builtIn.words.map(w=>w.word),sentences:builtIn.sentences.map(s=>s.en)};
 if(typeof id!=='string'||!id.startsWith('custom-')||!value||typeof value!=='object')return null;
 const x=value as Record<string,unknown>;
 const text=(v:unknown,max:number)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
 if(!text(x.title,120)||!text(x.role,240)||!['daily','academic'].includes(x.category as string))return null;
 if(!Array.isArray(x.words)||!x.words.length||x.words.length>12||x.words.some(w=>!text(w,80)))return null;
 if(!Array.isArray(x.sentences)||!x.sentences.length||x.sentences.length>12||x.sentences.some(s=>!text(s,600)))return null;
 return {title:x.title as string,role:x.role as string,level:'adapt to the learner',words:x.words as string[],sentences:x.sentences as string[]};
}
