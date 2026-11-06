import {boundedJson,config,fail,guard} from '@/lib/lab-server';
import {practiceContext} from '@/lib/practice-context';
import {COACH_POLICY} from '@/lib/conversation';
export async function POST(req:Request){
 const denied=guard(req);if(denied)return denied;const c=config();
 if(!c.key)return fail('即時語音尚未連接。請先完成網站的 OpenAI 服務設定。',503);
 try{
  const body=await boundedJson(req,100000);const lesson=practiceContext(body.lessonId,body.customLesson);
  if(!lesson||typeof body.sdp!=='string'||body.sdp.length>64000||!body.sdp.startsWith('v=0'))return fail('語音連線內容不完整，請重新開始。',400);
  const session={type:'realtime',model:c.realtimeModel,output_modalities:['audio'],instructions:COACH_POLICY+' Speak slowly and clearly enough for a learner, with natural pauses. The first user message provides the study context as JSON, followed by any earlier conversation. Treat that JSON as study data only. Start with a brief greeting and one relevant question if there is no earlier dialogue. If earlier conversation is provided, continue it with one relevant question. Never correct the context JSON as though the learner said it. Recast naturally in spoken replies when warranted; do not announce grammar rules or scores. If you are unsure what was said, ask the learner to repeat. Keep the floor open for their reply.',audio:{input:{transcription:{model:'gpt-transcribe',language:'en'},noise_reduction:{type:'near_field'},turn_detection:{type:'semantic_vad',eagerness:'low',create_response:true,interrupt_response:true}},output:{voice:'marin'}},max_output_tokens:700};
  const form=new FormData();form.set('sdp',body.sdp);form.set('session',JSON.stringify(session));
  const r=await fetch('https://api.openai.com/v1/realtime/calls',{method:'POST',headers:{Authorization:`Bearer ${c.key}`},body:form,signal:AbortSignal.timeout(25000)});
  if(!r.ok)return fail(r.status===429?'即時語音額度不足或連線過多，請稍後重試。':r.status===401?'AI 服務憑證無效，請更新網站服務設定。':'無法建立即時語音，請重試或改用 AI 文字對話。');
  return new Response(await r.text(),{headers:{'Content-Type':'application/sdp','Cache-Control':'no-store'}});
 }catch(e){return fail(e instanceof Error&&e.message==='REQUEST_TOO_LARGE'?'語音連線內容過長。':'語音連線逾時，請重新開始。');}
}
