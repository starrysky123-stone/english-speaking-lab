import { env } from 'cloudflare:workers';
export function config() {
 const e=env as unknown as Record<string,string|undefined>;
 return {key:e.OPENAI_API_KEY,model:e.OPENAI_MODEL||'gpt-6-astra',realtimeModel:e.OPENAI_REALTIME_MODEL||'gpt-realtime-2.1',speechKey:e.AZURE_SPEECH_KEY,endpoint:e.AZURE_SPEECH_ENDPOINT};
}
export function guard(req:Request) {
 const origin=req.headers.get('origin');
 if(origin && origin!==new URL(req.url).origin) return Response.json({error:'此請求來源不允許。'},{status:403});
 if(!req.headers.get('oai-authenticated-user-id')) return Response.json({error:'請先登入網站，再使用線上練習服務。'},{status:401});
}
export const fail=(message:string,status=502)=>Response.json({error:message},{status});
export async function boundedJson(req:Request,max:number):Promise<Record<string,unknown>>{
 if(Number(req.headers.get('content-length')||0)>max)throw new Error('REQUEST_TOO_LARGE');
 if(!req.body)throw new Error('INVALID_REQUEST');
 const reader=req.body.getReader();let length=0;const chunks:Uint8Array[]=[];
 try{while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>max){await reader.cancel();throw new Error('REQUEST_TOO_LARGE');}chunks.push(value);}}finally{reader.releaseLock();}
 const data=new Uint8Array(length);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.length;}
 const body=JSON.parse(new TextDecoder().decode(data));if(!body||typeof body!=='object'||Array.isArray(body))throw new Error('INVALID_REQUEST');return body;
}
