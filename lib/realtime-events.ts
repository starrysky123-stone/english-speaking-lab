import type {ConversationMessage} from './conversation';
type Event={type:string;item_id?:string;transcript?:string;delta?:string;text?:string;item?:{id?:string;role?:string;type?:string}};
export function applyTranscriptEvent(messages:ConversationMessage[],event:Event):ConversationMessage[]{
 const id=event.item_id||event.item?.id;if(!id)return messages;
 let role:'user'|'assistant'|null=null,text:string|undefined,pending:boolean|undefined;
 if(event.type==='input_audio_buffer.speech_started'){role='user';text='';pending=true;}
 if(event.type==='conversation.item.input_audio_transcription.completed'){role='user';text=event.transcript||'';pending=false;}
 if(event.type==='conversation.item.input_audio_transcription.failed'){role='user';text='（此段語音未能辨識，請再說一次）';pending=true;}
 if(event.type==='response.output_item.added'&&event.item?.role==='assistant'&&event.item.type==='message'){role='assistant';text='';pending=true;}
 if(event.type==='response.output_audio_transcript.delta'||event.type==='response.output_text.delta'){role='assistant';text=(messages.find(m=>m.id===id)?.text||'')+(event.delta||'');pending=true;}
 if(event.type==='response.output_audio_transcript.done'||event.type==='response.output_text.done'){role='assistant';text=event.transcript??event.text??'';pending=false;}
 if(!role||text===undefined)return messages;
 const index=messages.findIndex(m=>m.id===id),next={id,role,text,source:'voice' as const,pending};
 if(index<0)return [...messages,next];
 // Do not let a late placeholder erase already completed transcription.
 if(messages[index].pending===false&&pending&&text==='')return messages;
 return messages.map((m,i)=>i===index?{...m,...next}:m);
}
