import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2";

env.allowLocalModels = false;
env.useBrowserCache = true;

const $ = id => document.getElementById(id);
const input = $("videoInput"), drop = $("dropZone"), info = $("fileInfo");
const btn = $("transcribeBtn"), status = $("status"), statusText = $("statusText");
const detail = $("detail"), progress = $("progress"), percent = $("percent");
const preview = $("previewCard"), video = $("video"), overlay = $("captionOverlay");
const list = $("captionList"), lang = $("language"), size = $("fontSize"), pos = $("position");
const srtBtn = $("downloadSrt"), vttBtn = $("downloadVtt"), clearBtn = $("clearBtn");

let file = null, objectUrl = null, captions = [], recognizer = null, busy = false;

function setStatus(text, p=0, d=""){
  status.classList.remove("hidden"); statusText.textContent=text;
  progress.value=p; percent.textContent=Math.round(p)+"%"; detail.textContent=d;
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function fmt(t){t=Math.max(0,t);const h=Math.floor(t/3600),m=Math.floor((t%3600)/60),s=Math.floor(t%60),ms=Math.floor((t%1)*1000);return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")},${String(ms).padStart(3,"0")}`;}
function fmtVtt(t){return fmt(t).replace(",",".");}
function setFile(f){
  if(!f)return;
  if(!f.type.startsWith("video/")&&!f.type.startsWith("audio/")){alert("Please choose a video or audio file.");return;}
  file=f; captions=[]; list.innerHTML=""; srtBtn.disabled=vttBtn.disabled=true;
  if(objectUrl)URL.revokeObjectURL(objectUrl);
  objectUrl=URL.createObjectURL(f); video.src=objectUrl; preview.classList.remove("hidden");
  info.textContent=`${f.name} • ${(f.size/1024/1024).toFixed(1)} MB`;info.classList.remove("hidden");
  btn.disabled=false; overlay.textContent="";
}
input.addEventListener("change",e=>setFile(e.target.files[0]));
["dragenter","dragover"].forEach(x=>drop.addEventListener(x,e=>{e.preventDefault();drop.classList.add("drag")}));
["dragleave","drop"].forEach(x=>drop.addEventListener(x,e=>{e.preventDefault();drop.classList.remove("drag")}));
drop.addEventListener("drop",e=>setFile(e.dataTransfer.files[0]));

async function decodeTo16k(f){
  const ac=new AudioContext();
  const buf=await ac.decodeAudioData(await f.arrayBuffer());
  const target=16000, frames=Math.ceil(buf.duration*target);
  const off=new OfflineAudioContext(1,frames,target);
  const src=off.createBufferSource(); src.buffer=buf;
  src.connect(off.destination); src.start();
  const rendered=await off.startRendering(); await ac.close();
  return rendered.getChannelData(0);
}
async function getRecognizer(){
  if(recognizer)return recognizer;
  setStatus("Loading speech model…",5,"The first run downloads the model and may take a while.");
  recognizer=await pipeline("automatic-speech-recognition","Xenova/whisper-tiny",{
    device:"wasm", dtype:"q8",
    progress_callback:p=>{
      if(typeof p.progress==="number")setStatus("Loading speech model…",Math.min(25,5+p.progress*.2),p.status||"Downloading model…");
    }
  });
  return recognizer;
}
function renderList(){
  list.innerHTML="";
  captions.forEach((c,i)=>{
    const row=document.createElement("div");row.className="caption-row";
    row.innerHTML=`<time>${fmt(c.start).slice(3,8)}</time><button type="button">${escapeHtml(c.text)}</button>`;
    row.querySelector("button").onclick=()=>{video.currentTime=c.start;video.play();};
    list.appendChild(row);
  });
}
function currentCaption(t){
  return captions.find(c=>t>=c.start && t<(c.end||c.start+4));
}
video.addEventListener("timeupdate",()=>{
  const c=currentCaption(video.currentTime); overlay.textContent=c?.text||"";
});
size.addEventListener("input",()=>overlay.style.fontSize=size.value+"px");
pos.addEventListener("change",()=>{overlay.className="caption-overlay "+pos.value;});
overlay.className="caption-overlay bottom";

btn.addEventListener("click",async()=>{
  if(!file||busy)return; busy=true;btn.disabled=true;
  try{
    if(file.size>500*1024*1024)throw new Error("This file is over 500 MB. Please use a shorter/smaller file on mobile.");
    setStatus("Reading audio…",28,"Decoding the media locally.");
    const audio=await decodeTo16k(file);
    const asr=await getRecognizer();
    setStatus("Transcribing…",35,"Speech recognition is running in your browser.");
    const language=lang.value==="auto"?undefined:lang.value;
    const out=await asr(audio,{
      chunk_length_s:30,stride_length_s:5,
      return_timestamps:true,
      ...(language?{language}:{})
    });
    const chunks=out.chunks||[];
    captions=chunks.map(c=>({start:c.timestamp?.[0]??0,end:c.timestamp?.[1]??((c.timestamp?.[0]??0)+3),text:(c.text||"").trim()}))
      .filter(c=>c.text.length>0 && c.end>c.start);
    if(!captions.length)throw new Error("No speech was detected. Try clearer audio or a different language setting.");
    renderList();srtBtn.disabled=vttBtn.disabled=false;
    setStatus("Captions ready ✓",100,`${captions.length} caption segments generated.`);
  }catch(e){
    console.error(e);setStatus("Could not generate captions",0,e?.message||String(e));
    alert(e?.message||"Something went wrong while generating captions.");
  }finally{busy=false;btn.disabled=false;}
});

function download(name,text,type){
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));
  a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
srtBtn.onclick=()=>download("glowcaption.srt",captions.map((c,i)=>`${i+1}\n${fmt(c.start)} --> ${fmt(c.end)}\n${c.text}\n`).join("\n"),"text/plain");
vttBtn.onclick=()=>download("glowcaption.vtt","WEBVTT\n\n"+captions.map(c=>`${fmtVtt(c.start)} --> ${fmtVtt(c.end)}\n${c.text}\n`).join("\n"),"text/vtt");
clearBtn.onclick=()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);file=null;captions=[];video.removeAttribute("src");video.load();info.classList.add("hidden");preview.classList.add("hidden");btn.disabled=true;srtBtn.disabled=vttBtn.disabled=true;overlay.textContent="";list.innerHTML="";};
