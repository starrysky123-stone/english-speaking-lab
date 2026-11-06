import { env } from 'cloudflare:workers';
export function config() {
 const e=env as unknown as Record<string,string|undefined>;
 return {key:e.OPENAI_API_KEY,model:e.OPENAI_MODEL||'gpt-6-astra',speechKey:e.AZURE_SPEECH_KEY,endpoint:e.AZURE_SPEECH_ENDPOINT};
}
export function guard(req:Request) {
 const origin=req.headers.get('origin');
 if(origin && origin!==new URL(req.url).origin) return Response.json({error:'此請求來源不允許。'},{status:403});
 if(!req.headers.get('oai-authenticated-user-id')) return Response.json({error:'請先登入網站，再使用線上練習服務。'},{status:401});
}
export const fail=(message:string,status=502)=>Response.json({error:message},{status});
