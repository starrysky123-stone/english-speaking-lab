import {config,guard,fail} from '@/lib/lab-server';
export async function POST(req:Request){
 const denied=guard(req);if(denied)return denied;
 const c=config();if(!c.speechKey||!c.endpoint)return fail('專業發音評估尚未連接；你的錄音仍可回聽。',503);
 try{
 if(Number(req.headers.get('content-length')||0)>1100000)return fail('請將錄音控制在 30 秒內。',413);
 const form=await req.formData();const audio=form.get('audio');let reference=String(form.get('reference')||'').slice(0,1800);
 if(!(audio instanceof File)||audio.size<48||audio.size>1000000)return fail('錄音格式或長度不正確，請重新錄音。',400);
 const bytes=await audio.arrayBuffer();const dv=new DataView(bytes);
 if(dv.getUint32(0,false)!==0x52494646||dv.getUint32(8,false)!==0x57415645||dv.getUint32(24,true)!==16000||dv.getUint16(22,true)!==1||dv.getUint16(34,true)!==16)return fail('請提供 16kHz 單聲道 PCM WAV 錄音。',400);
 const endpoint=new URL(c.endpoint);
 if(endpoint.protocol!=='https:'||!endpoint.hostname.endsWith('.cognitiveservices.azure.com'))return fail('發音服務設定需要更新。',503);
 endpoint.pathname='/stt/speech/recognition/conversation/cognitiveservices/v1';endpoint.search='?language=en-US&format=detailed';
 const headers:Record<string,string>={'Ocp-Apim-Subscription-Key':c.speechKey,'Content-Type':'audio/wav; codecs=audio/pcm; samplerate=16000','Accept':'application/json'};
 const send=()=>fetch(endpoint,{method:'POST',headers,body:bytes,signal:AbortSignal.timeout(30000)});
 // Free speech uses recognition only to obtain a reference; acoustic assessment below supplies every score.
 if(!reference){const r=await send();if(!r.ok)return fail('語音服務目前無法使用。');const d=await r.json() as {RecognitionStatus:string;DisplayText?:string;NBest?:{Display?:string}[]};if(d.RecognitionStatus!=='Success')return fail('沒有聽到清楚的語音，請靠近麥克風再試一次。',422);reference=d.NBest?.[0]?.Display||d.DisplayText||'';}
 if(!reference)return fail('未辨識到語音，請重新錄音。',422);
 headers['Pronunciation-Assessment']=Buffer.from(JSON.stringify({ReferenceText:reference,GradingSystem:'HundredMark',Granularity:'Phoneme',Dimension:'Comprehensive',EnableMiscue:'True'})).toString('base64');
 const r=await send();if(!r.ok)return fail('發音評估暫時無法使用，請稍後再試。');
 const d=await r.json() as {RecognitionStatus:string;NBest?:Record<string,unknown>[]};const best=d.NBest?.[0];
 if(d.RecognitionStatus!=='Success'||!best)return fail('錄音未能完成評估，請重新錄製。',422);
 return Response.json({source:'Azure Speech Pronunciation Assessment',reference,result:best});
 }catch{return fail('錄音處理失敗或評估逾時，請稍後再試。');}
}
