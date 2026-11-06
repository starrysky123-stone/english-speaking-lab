import type {Lesson,Word} from './lessons';
export const MAX_MATERIAL_TEXT=50000;
export const MAX_MATERIALS=30;
export type MaterialSource={text:string;name:string;createdAt:string;updatedAt:string;archived?:boolean};
export type ImportedLesson=Lesson&{material:MaterialSource};
const stopwords=new Set('about after again against almost also although always among another because been before being below between both could does doing down during each either enough every example first from further have having here itself just last little made main make many might more most much must myself never next once only other ourselves over same should since some still such than that their theirs them themselves then there these they this those through together under until upon used using very want were what when where whether which while whom whose will with within without would your yours yourself you are the and for but not all can has had was our how into may its she his him who out too any one two now'.split(' '));
export function normalizedText(s:string){return s.replace(/\r\n?/g,'\n').replace(/[\t\u00a0]/g,' ').replace(/ +/g,' ').replace(/\n{3,}/g,'\n\n').trim();}
export function candidateWords(text:string):Word[]{
 const counts=new Map<string,{word:string;count:number;order:number}>();
 const matches=text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)||[];
 matches.forEach((word,i)=>{const key=word.toLowerCase();if(key.length<4||key.length>40||stopwords.has(key))return;const existing=counts.get(key);if(existing)existing.count++;else counts.set(key,{word,count:1,order:i});});
 return [...counts.values()].sort((a,b)=>b.count-a.count||b.word.length-a.word.length||a.order-b.order).slice(0,6).map(x=>({word:x.word,ipa:'',meaning:'',tip:'選自你的教材。先聽示範，再錄音回聽。'}));
}
export function candidateSentences(text:string){
 const paragraphs=normalizedText(text).split(/\n\s*\n/).map(p=>p.replace(/\n/g,' '));
 const segmenter=new Intl.Segmenter('en',{granularity:'sentence'});
 const candidates=paragraphs.flatMap(p=>[...segmenter.segment(p)].map(x=>x.segment.trim()));
 const usable=candidates.filter(s=>s.length<=420&&(s.match(/[A-Za-z]+/g)||[]).length>=4);
 return [...new Set(usable)].slice(0,6).map(en=>({en,zh:''}));
}
export function materialDraft(text:string,title:string,category:'daily'|'academic',name:string):ImportedLesson{
 text=normalizedText(text);
 if(text.length>MAX_MATERIAL_TEXT)throw new Error('教材超過 50,000 字元，請分成幾個較小單元匯入。');
 if((text.match(/[A-Za-z]+/g)||[]).length<8)throw new Error('請提供至少一小段英文教材（約 8 個英文單字以上），讓我們建立口說練習。');
 const words=candidateWords(text),sentences=candidateSentences(text);
 if(!words.length||!sentences.length)throw new Error('無法選出合適的英文單字或短句。請貼上完整句子，或將過長的段落拆開再試。');
 const date=new Date().toISOString();
 return {id:`custom-${crypto.randomUUID()}`,category,title:title.trim()||'我的英文教材',en:'My own learning material',desc:'從自己的教材出發，練習單字、跟讀與表達。',level:'自訂',minutes:10,icon:category==='academic'?'book':'chat',words,sentences,role:category==='academic'?'與你討論這份教材的研究同儕':'與你聊這份教材的英文練習夥伴',questions:category==='academic'?['What is the main question or purpose of this material?','Can you explain one important method, idea, or finding in your own words?','What is one limitation, unanswered question, or possible next step?']:['What is this material mainly about?','Which idea or detail stood out to you, and why?','How does this connect to your own experience?'],hints:category==='academic'?['The material focuses on… / Its purpose is to…','One important point is… / This means that…','One question I still have is… / A possible next step is…']:['This is about… / The main idea is…','I was interested in… because…','This reminds me of… / In my experience…'],material:{text,name:name||'貼上的文字',createdAt:date,updatedAt:date}};
}
export function isOriginalExcerpt(source:string,excerpt:string){return !!excerpt.trim()&&normalizedText(source).replace(/\s+/g,' ').includes(normalizedText(excerpt).replace(/\s+/g,' '));}
export function validateMaterial(value:unknown):ImportedLesson{
 if(!value||typeof value!=='object')throw new Error('教材格式不正確。');
 const x=value as ImportedLesson;
 const field=(v:unknown,max:number,required=false)=>typeof v==='string'&&v.length<=max&&(!required||!!v.trim());
 if(!field(x.id,100,true)||!/^custom-[a-zA-Z0-9-]+$/.test(x.id)||!field(x.title,120,true)||!['daily','academic'].includes(x.category))throw new Error('請填寫教材名稱並選擇分類。');
 if(!x.material||!field(x.material.text,MAX_MATERIAL_TEXT,true)||!field(x.material.name,240,true))throw new Error('原始教材內容或來源名稱不正確。');
 if(!Array.isArray(x.words)||!x.words.length||x.words.length>12||x.words.some(w=>!w||!field(w.word,80,true)||!field(w.ipa,100)||!field(w.meaning,200)||!field(w.tip,400)))throw new Error('請保留 1–12 個單字，並填寫每個單字。');
 if(!Array.isArray(x.sentences)||!x.sentences.length||x.sentences.length>12||x.sentences.some(s=>!s||!field(s.en,600,true)||!field(s.zh,600)))throw new Error('請保留 1–12 個跟讀句，每句最多 600 字元。');
 if(!Array.isArray(x.questions)||!x.questions.length||x.questions.length>8||x.questions.some(q=>!field(q,400,true))||!Array.isArray(x.hints)||x.hints.length!==x.questions.length||x.hints.some(h=>!field(h,400)))throw new Error('請保留 1–8 個對話問題，每題最多 400 字元。');
 if(!field(x.role,240,true))throw new Error('請填寫對話夥伴的角色。');
 return {id:x.id,title:x.title.trim(),category:x.category,en:'My own learning material',desc:'從自己的教材出發，練習單字、跟讀與表達。',level:'自訂',minutes:10,icon:x.category==='academic'?'book':'chat',words:x.words.map(w=>({word:w.word.trim(),ipa:w.ipa.trim(),meaning:w.meaning.trim(),tip:w.tip.trim()})),sentences:x.sentences.map(s=>({en:s.en.trim(),zh:s.zh.trim()})),questions:x.questions.map(s=>s.trim()),hints:x.hints.map(s=>s.trim()),role:x.role.trim(),material:{text:x.material.text,name:x.material.name,createdAt:field(x.material.createdAt,40,true)?x.material.createdAt:new Date().toISOString(),updatedAt:field(x.material.updatedAt,40,true)?x.material.updatedAt:new Date().toISOString(),archived:x.material.archived===true}};
}
export function readMaterials(value:unknown):ImportedLesson[]{
 if(!Array.isArray(value))return [];
 return value.slice(0,MAX_MATERIALS).flatMap(v=>{try{return [validateMaterial(v)];}catch{return [];}});
}
export function parseMaterialBackup(text:string):ImportedLesson[]{
 if(text.length>2500000)throw new Error('教材備份過大，請分批匯入。');
 let value:{format?:string;materials?:unknown;customLessons?:unknown};try{value=JSON.parse(text);}catch{throw new Error('這不是有效的教材備份 JSON。');}
 if(!value||typeof value!=='object')throw new Error('這不是 English Speaking Lab 的教材備份。');
 const items=value.format==='speaking-lab-materials-v1'?value.materials:value.customLessons;
 if(!Array.isArray(items)||!items.length||items.length>MAX_MATERIALS)throw new Error('備份內需要包含 1–30 份教材。');
 return items.map(validateMaterial);
}
export function downloadMaterials(materials:ImportedLesson[]){const blob=new Blob([JSON.stringify({format:'speaking-lab-materials-v1',materials},null,2)],{type:'application/json'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download='speaking-lab-materials.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),500);}
