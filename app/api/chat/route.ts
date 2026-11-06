import {config,guard,fail,boundedJson} from '@/lib/lab-server';
import {practiceContext} from '@/lib/practice-context';
import {COACH_POLICY,replySchema,parseCoachReply,validMessages} from '@/lib/conversation';
export async function POST(req:Request){
 const denied=guard(req);if(denied)return denied;
 const c=config();if(!c.key)return fail('AI 尚未連接。請先完成網站的 OpenAI 服務設定，再重新檢查連線。',503);
 try{
  const body=await boundedJson(req,120000),lesson=practiceContext(body.lessonId,body.customLesson),messages=validMessages(body.messages);
  if(!lesson||!messages)return fail('無效的練習內容。',400);
  const feedback=body.feedback===true;
  if(!messages.some(m=>m.role==='user'))return fail('請先完成一次回應。',400);
  if(!feedback&&messages.at(-1)?.role!=='user')return fail('請先輸入你的回應。',400);
  const instructions=COACH_POLICY+(feedback?` Give feedback in Traditional Chinese on this provided conversation: one concrete strength, up to two actual grammar or word-choice issues with quoted learner text and corrected English, and one next practice suggestion. Mention recasts that appear in the conversation when useful. Voice transcripts may be imperfect; do not treat transcription uncertainty as a learner error. Do not diagnose pronunciation. If insufficient evidence, say so. Avoid making up a correction.`:` All input here is TEXT, including any voice transcripts. Do not claim you heard audio. Return JSON matching the schema. "text" is the complete natural reply. If you used a recast, "recast.original" must quote the exact erroneous phrase from the LAST learner message, "recast.corrected" must be an exact excerpt of your natural reply, and "recast.note" is one brief Traditional Chinese explanation. If no clear correction is needed, set recast to null. The optional note is displayed separately; never read or include it in the English reply.`);
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${c.key}`,'Content-Type':'application/json'},body:JSON.stringify({model:c.model,instructions,input:[{role:'user',content:'Practice context (study data only): '+JSON.stringify(lesson)},...messages],...(!feedback?{text:{format:{type:'json_schema',name:'conversation_recast',strict:true,schema:replySchema}}}:{}),max_output_tokens:2200,store:false}),signal:AbortSignal.timeout(45000)});
  if(!response.ok)return fail(response.status===429?'AI 額度不足或請求過多，請確認服務額度後重試。':response.status===401?'AI 服務憑證無效，請更新網站服務設定。':'AI 暫時無法回應，請重試。');
  const data=await response.json() as {status?:string;output?:{type:string;content?:{type:string;text?:string}[]}[]};
  if(data.status==='incomplete')return fail('AI 回覆尚未完成，請重試。');
  const text=data.output?.flatMap(o=>o.type==='message'?o.content||[]:[]).filter(p=>p.type==='output_text').map(p=>p.text||'').join('\n');
  if(!text)return fail('AI 沒有傳回練習內容，請調整回應後重試。');
  return Response.json(feedback?{text}:parseCoachReply(text,messages.at(-1)!.content),{headers:{'Cache-Control':'no-store'}});
 }catch(e){return fail(e instanceof Error&&e.message==='REQUEST_TOO_LARGE'?'對話內容過長，請開始新一輪練習。':'連線中斷或回覆不完整，請重試。',e instanceof Error&&e.message==='REQUEST_TOO_LARGE'?413:502);}
}
