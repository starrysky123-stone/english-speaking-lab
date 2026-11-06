'use client';
import {useState,useRef,useEffect} from 'react';
import {Mic,Square,RotateCcw,AudioLines,LoaderCircle} from 'lucide-react';
import {toWav,type Assessment} from './lab-utils';
export default function Recorder({reference='',assessment,onResult,onRecorded}:{reference?:string;assessment:boolean;onResult:(a:Assessment)=>void;onRecorded?:()=>void}){
 const [recording,setRecording]=useState(false),[busy,setBusy]=useState(false),[url,setUrl]=useState(''),[blob,setBlob]=useState<Blob|null>(null),[seconds,setSeconds]=useState(0),[error,setError]=useState('');
 const recorder=useRef<MediaRecorder|null>(null),stream=useRef<MediaStream|null>(null),timer=useRef<ReturnType<typeof setInterval>|null>(null),alive=useRef(true),currentUrl=useRef('');
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;if(timer.current)clearInterval(timer.current);if(recorder.current?.state==='recording')recorder.current.stop();stream.current?.getTracks().forEach(t=>t.stop());if(currentUrl.current)URL.revokeObjectURL(currentUrl.current);};},[]);
 function stop(){if(recorder.current?.state==='recording')recorder.current.stop();stream.current?.getTracks().forEach(t=>t.stop());if(timer.current)clearInterval(timer.current);setRecording(false);}
 async function start(){
 setError('');if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){setError('此瀏覽器不支援錄音。請以 Chrome、Edge 或 Safari 開啟網站；你仍可使用文字練習。');return;}
 try{setBusy(true);const media=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});if(!alive.current){media.getTracks().forEach(t=>t.stop());return;}stream.current=media;
 if(currentUrl.current)URL.revokeObjectURL(currentUrl.current);setUrl('');setBlob(null);const chunks:BlobPart[]=[];const mr=new MediaRecorder(media);recorder.current=mr;
 mr.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};mr.onstop=()=>{if(!alive.current)return;const b=new Blob(chunks,{type:mr.mimeType});if(!b.size){setError('未取得錄音，請再試一次。');return;}const next=URL.createObjectURL(b);currentUrl.current=next;setUrl(next);setBlob(b);onRecorded?.();};
 mr.onerror=()=>{stop();setError('錄音中斷，請檢查麥克風後再試一次。');};mr.start();setSeconds(0);setRecording(true);let count=0;timer.current=setInterval(()=>{count++;setSeconds(count);if(count>=30)stop();},1000);
 }catch(e){setError(e instanceof DOMException&&e.name==='NotAllowedError'?'麥克風權限尚未開啟。請在瀏覽器設定允許麥克風後重試。':'無法使用麥克風，請檢查裝置連接或是否被其他程式使用。');}finally{setBusy(false);}
 }
 async function assess(){if(!blob)return;setBusy(true);setError('');try{const data=new FormData();data.set('audio',await toWav(blob),'practice.wav');data.set('reference',reference);const r=await fetch('/api/assess',{method:'POST',body:data});const d=await r.json() as Assessment&{error?:string};if(!r.ok)throw new Error(d.error||'評估失敗');onResult(d);}catch(e){setError(e instanceof Error?e.message:'錄音處理失敗，請重試。');}finally{setBusy(false);}}
 return <div className={'recorder '+(recording?'is-recording':'')}>
 <div className="record-controls"><button className={recording?'record-btn stop':'record-btn'} onClick={recording?stop:start} disabled={busy} aria-label={recording?'停止錄音':'開始錄音'}>{busy?<LoaderCircle className="spin" size={20}/>:recording?<Square size={18}/>:url?<RotateCcw size={20}/>:<Mic size={21}/>}</button><div><strong>{recording?`正在錄音 ${String(seconds).padStart(2,'0')} / 30 秒`:url?'錄音完成，聽聽自己的聲音':'換你開口說說看'}</strong><small>{recording?'再按一下即可停止':'錄音只留在本次頁面；最長 30 秒'}</small></div>{recording&&<div className="mini-wave">{[1,2,3,4,5].map(i=><i key={i} style={{animationDelay:`${i*.12}s`}}/>)}</div>}</div>
 {url&&<div className="playback"><audio controls src={url} aria-label="回聽自己的錄音"/>{assessment?<><button className="btn secondary" disabled={busy} onClick={assess}><AudioLines size={17}/>{busy?'評估中…':'分析發音'}</button><small>按下分析，錄音將傳送至 Azure Speech 評估。</small></>:<small>可先回聽與自我檢查；專業發音評估尚未連接。</small>}</div>}{error&&<p className="inline-error" role="alert">{error}</p>}
 </div>;
}
