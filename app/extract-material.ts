import {MAX_MATERIAL_TEXT,normalizedText} from './materials';
export const ACCEPTED_MATERIALS='.txt,.md,.pdf,.docx,.pptx,.json';
const fileError='無法讀取這份檔案，請確認檔案完整、未加密，或直接貼上教材文字。';
export async function extractMaterial(file:File,onProgress:(s:string)=>void):Promise<string>{
 if(file.size>10*1024*1024)throw new Error('檔案超過 10 MB，請先分成較小的教材再匯入。');
 if(file.size===0)throw new Error('這是空白檔案，請選擇包含教材的檔案。');
 const ext=file.name.split('.').pop()?.toLowerCase();let text='';
 if(ext==='txt'||ext==='md'){text=await file.text();if(text.includes('\u0000'))throw new Error('請使用 UTF-8 編碼的文字檔，或直接貼上文字。');}
 else if(ext==='pdf'){
 onProgress('正在讀取 PDF…');
 const pdfjs=await import('pdfjs-dist');
 pdfjs.GlobalWorkerOptions.workerSrc='/pdf.worker.min.mjs';
 const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),useSystemFonts:true,disableFontFace:true});
 try{const doc=await task.promise;
 if(doc.numPages>50)throw new Error('PDF 超過 50 頁，請先取出要練習的章節。');
 const pages:string[]=[];let length=0;
 for(let i=1;i<=doc.numPages;i++){
 onProgress(`正在讀取 PDF：第 ${i} / ${doc.numPages} 頁`);
 const page=await doc.getPage(i);const content=await page.getTextContent();
 const paragraph=content.items.map(item=>'str' in item?item.str+(item.hasEOL?'\n':' '):'').join('').trim();length+=paragraph.length;
 if(length>MAX_MATERIAL_TEXT)throw new Error('教材超過 50,000 字元，請分成較小章節匯入。');
 pages.push(paragraph);page.cleanup();}
 text=pages.join('\n\n');
 if(text.replace(/\s/g,'').length<15)throw new Error('這份 PDF 沒有可擷取的文字，可能是掃描或圖片。請先轉成可選取的文字，或貼上要練習的段落。');
 }catch(e){if(e instanceof Error&&e.name==='PasswordException')throw new Error('這份 PDF 需要密碼，請先解鎖後再匯入。');throw e;}finally{await task.destroy();}
 }else if(ext==='docx'||ext==='pptx'){
 onProgress(ext==='docx'?'正在讀取 Word…':'正在讀取投影片…');
 const {unzipSync,strFromU8}=await import('fflate');let total=0;
 let files:Record<string,Uint8Array>;
 try{files=unzipSync(new Uint8Array(await file.arrayBuffer()),{filter:f=>{
 const selected=ext==='docx'?f.name==='word/document.xml':/^ppt\/slides\/slide\d+\.xml$/.test(f.name);
 if(!selected)return false;total+=f.originalSize;
 if(f.originalSize>3000000||total>12000000)throw new Error('內容過大');return true;
 }});}catch{throw new Error(fileError);}
 const keys=Object.keys(files).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 if(!keys.length)throw new Error(fileError);
 const ns=ext==='docx'?'http://schemas.openxmlformats.org/wordprocessingml/2006/main':'http://schemas.openxmlformats.org/drawingml/2006/main';
 const parts=keys.map(key=>{const xml=new DOMParser().parseFromString(strFromU8(files[key]),'application/xml');if(xml.querySelector('parsererror'))throw new Error(fileError);
 return Array.from(xml.getElementsByTagNameNS(ns,'p')).map(p=>Array.from(p.getElementsByTagNameNS(ns,'t')).map(n=>n.textContent||'').join('')).filter(Boolean).join('\n\n');});
 text=parts.join('\n\n');if(!text.trim())throw new Error('檔案中沒有可擷取的文字，請改貼上文字內容。');
 }else throw new Error('請選擇 TXT、Markdown、PDF、DOCX 或 PPTX；圖片和舊版 DOC／PPT 請先轉檔。');
 text=normalizedText(text);
 if(text.length>MAX_MATERIAL_TEXT)throw new Error('教材超過 50,000 字元，請分成較小單元匯入。');
 if(!text.trim())throw new Error('沒有讀到教材文字，請改貼上內容。');
 return text;
}
