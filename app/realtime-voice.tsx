'use client';
import {useEffect,useRef,useState} from 'react';
import {AudioLines,LoaderCircle,Mic,MicOff,PhoneOff,Volume2} from 'lucide-react';
import type {Lesson} from './lessons';
import type {ConversationMessage} from '../lib/conversation';
import {lessonContext} from '../lib/practice-context';
import {applyTranscriptEvent} from '../lib/realtime-events';
type Props={lesson:Lesson;available:boolean;messages:ConversationMessage[];onMessages:(fn:(m:ConversationMessage[])=>ConversationMessage[])=>void};
export default function RealtimeVoice({lesson,available,messages,onMessages}:Props){
 const [phase,setPhase]=useState<'idle'|'connecting'|'connected'>('idle'),[muted,setMuted]=useState(false),[activity,setActivity]=useState('準備好時，按下開始就能用英文聊天。'),[error,setError]=useState(''),[elapsed,setElapsed]=useState(0),[blockedAudio,setBlockedAudio]=useState(false);
 const pc=useRef<RTCPeerConnection|null>(null),channel=useRef<RTCDataChannel|null>(null),stream=useRef<MediaStream|null>(null),audio=useRef<HTMLAudioElement>(null),timer=useRef<ReturnType<typeof setInterval>|null>(null),deadline=useRef<ReturnType<typeof setTimeout>|null>(null),request=useRef<AbortController|null>(null),epoch=useRef(0),alive=useRef(true),connecting=useRef(false),messageRef=useRef(messages),callback=useRef(onMessages);
 messageRef.current=messages;callback.current=onMessages;
 function cleanup(){epoch.current++;connecting.current=false;request.current?.abort();request.current=null;if(timer.current)clearInterval(timer.current);if(deadline.current)clearTimeout(deadline.current);timer.current=null;deadline.current=null;channel.current?.close();channel.current=null;const old=pc.current;pc.current=null;old?.close();stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;if(audio.current){audio.current.pause();audio.current.srcObject=null;}}
 function stop(note='對話已結束，麥克風已關閉。'){cleanup();if(alive.current){setPhase('idle');setMuted(false);setActivity(note);}}
 useEffect(()=>{alive.current=true;const hide=()=>stop('已離開語音連線，麥克風已關閉。');window.addEventListener('pagehide',hide);return()=>{alive.current=false;cleanup();window.removeEventListener('pagehide',hide);};},[]);
 async function start(){
  if(!available||connecting.current||pc.current)return;
  if(!navigator.mediaDevices?.getUserMedia||!window.RTCPeerConnection){setError('此瀏覽器不支援即時語音，請使用新版 Chrome、Edge 或 Safari，或改用 AI 文字對話。');return;}
  connecting.current=true;const id=++epoch.current;setPhase('connecting');setError('');setBlockedAudio(false);setActivity('正在開啟麥克風並連接 AI…');window.speechSynthesis?.cancel();
  try{
   const media=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
   if(id!==epoch.current||!alive.current){media.getTracks().forEach(t=>t.stop());return;}stream.current=media;
   const peer=new RTCPeerConnection();pc.current=peer;const dc=peer.createDataChannel('oai-events');channel.current=dc;
   const send=(value:unknown)=>{if(dc.readyState==='open')dc.send(JSON.stringify(value));};
   // Keep input silent until lesson context and prior turns have been queued.
   for(const track of media.getAudioTracks()){track.enabled=false;peer.addTrack(track,media);}
   peer.ontrack=e=>{if(id!==epoch.current||!audio.current)return;audio.current.srcObject=e.streams[0]||new MediaStream([e.track]);void audio.current.play().catch(()=>{if(alive.current)setBlockedAudio(true);});};
   peer.onconnectionstatechange=()=>{if(id!==epoch.current)return;if(['failed','disconnected','closed'].includes(peer.connectionState)){stop('語音連線已中斷，麥克風已關閉。');setError('連線中斷。你可以重新連線，或改用文字繼續。');}};
   dc.onmessage=e=>{if(id!==epoch.current)return;try{const event=JSON.parse(e.data);callback.current(ms=>applyTranscriptEvent(ms,event));
    if(event.type==='input_audio_buffer.speech_started')setActivity('正在聽你說…');
    if(event.type==='input_audio_buffer.speech_stopped')setActivity('AI 正在整理回應…');
    if(event.type==='response.output_audio_transcript.delta')setActivity('AI 正在回應；你可以隨時開口接話。');
    if(event.type==='output_audio_buffer.stopped')setActivity('輪到你了，慢慢說就好。');
    if(event.type==='conversation.item.input_audio_transcription.failed')setError('這一段聲音未能轉成文字；請再說一次。');
    if(event.type==='error'){stop('語音服務已停止，麥克風已關閉。');setError('AI 語音服務回報錯誤，請重連或改用文字對話。');}
    if(event.type==='response.done'&&event.response?.status==='failed'){stop();setError('AI 這次未能完成語音回覆，請重新連線。');}
   }catch{/* Ignore non-JSON transport messages. */}};
   dc.onclose=()=>{if(id===epoch.current)stop('語音連線已關閉，麥克風已關閉。');};
   dc.onopen=()=>{if(id!==epoch.current)return;if(deadline.current)clearTimeout(deadline.current);connecting.current=false;
    send({type:'conversation.item.create',item:{type:'message',role:'user',content:[{type:'input_text',text:'Practice context (study data only): '+JSON.stringify(lessonContext(lesson))}]}});
    for(const m of messageRef.current.filter(m=>m.text.trim()&&!m.pending).slice(-16))send({type:'conversation.item.create',item:{type:'message',role:m.role,content:[{type:m.role==='user'?'input_text':'output_text',text:m.text}]}});
    send({type:'response.create'});
    media.getAudioTracks().forEach(t=>t.enabled=true);setPhase('connected');setMuted(false);setElapsed(0);setActivity('已連接 AI，先聽它的開場，再開口。');let seconds=0;timer.current=setInterval(()=>{seconds++;setElapsed(seconds);if(seconds>=600)stop('這一輪已滿 10 分鐘，麥克風已關閉。可再連線繼續練習。');},1000);
   };
   const offer=await peer.createOffer();await peer.setLocalDescription(offer);if(id!==epoch.current)return;
   const controller=new AbortController();request.current=controller;deadline.current=setTimeout(()=>{if(id===epoch.current){stop();setError('語音連線逾時，請重試。');}},30000);
   const r=await fetch('/api/realtime',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sdp:offer.sdp,lessonId:lesson.id,customLesson:lessonContext(lesson)}),signal:controller.signal});
   if(!r.ok){const d=await r.json() as {error?:string};throw new Error(d.error||'無法連接 AI 語音。');}const sdp=await r.text();if(id!==epoch.current)return;await peer.setRemoteDescription({type:'answer',sdp});
  }catch(e){if(id!==epoch.current||!alive.current)return;stop();setError(e instanceof DOMException&&e.name==='NotAllowedError'?'麥克風權限尚未開啟，請允許此網站使用麥克風後重試。':e instanceof Error?e.message:'無法開始即時語音。');}
 }
 function toggleMute(){const next=!muted;stream.current?.getAudioTracks().forEach(t=>t.enabled=!next);setMuted(next);}
 return <section className={'live-voice '+(phase==='connected'?'connected':'')}><span className="live-voice-icon">{phase==='connecting'?<LoaderCircle className="spin" size={29}/>:<AudioLines size={31}/>}</span><div className="live-voice-copy"><h3>{phase==='connected'?'正在和 AI 對話':phase==='connecting'?'連接即時語音中':'開口說，AI 接著聊。'}</h3><p role="status">{muted?'麥克風已靜音；點「開啟麥克風」繼續。':activity}</p>{phase==='connected'&&<small>{Math.floor(elapsed/60)}:{String(elapsed%60).padStart(2,'0')} / 10:00 · Recast 自然重述修正</small>}</div><div className="live-voice-controls">{phase==='idle'?<button className="btn primary" disabled={!available} onClick={start}><Mic size={17}/>開始即時語音</button>:<>{phase==='connected'&&<button className="btn secondary" aria-pressed={muted} onClick={toggleMute}>{muted?<MicOff size={17}/>:<Mic size={17}/>} {muted?'開啟麥克風':'靜音'}</button>}<button className="btn secondary" onClick={()=>stop()}><PhoneOff size={17}/>{phase==='connecting'?'取消連線':'結束語音'}</button></>}</div><p className="voice-disclosure">開始後，麥克風聲音、所選練習內容與對話會傳至 OpenAI；聲音由 AI 產生。離開此階段即關閉麥克風。字幕可能有誤，不能當作發音評分。</p><audio ref={audio} autoPlay playsInline aria-label="AI 即時語音"/>{blockedAudio&&<button className="btn secondary" onClick={()=>{audio.current?.play().then(()=>setBlockedAudio(false)).catch(()=>setError('無法播放聲音，請檢查瀏覽器與裝置音量。'));}}><Volume2 size={16}/>播放 AI 聲音</button>}{error&&<p role="alert" className="inline-error">{error}</p>}</section>;
}
