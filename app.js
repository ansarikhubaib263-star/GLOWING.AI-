import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
env.allowLocalModels = false;
env.useBrowserCache = true;
let whisperPipe = null;

async function getWhisper(){
  if(whisperPipe) return whisperPipe;
  toast('Loading caption AI… first time may take a little while');
  whisperPipe = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny');
  return whisperPipe;
}

async function extractMono16k(file){
  const buf = await file.arrayBuffer();
  const AC = window.AudioContext || window.webkitAudioContext;
  const ac = new AC();
  const decoded = await ac.decodeAudioData(buf);
  const frames = Math.ceil(decoded.duration * 16000);
  const offline = new OfflineAudioContext(1, frames, 16000);
  const src = offline.createBufferSource();
  const mono = offline.createBuffer(1, decoded.length, decoded.sampleRate);
  const out = mono.getChannelData(0);
  for(let i=0;i<decoded.length;i++){
    let v=0;
    for(let c=0;c<decoded.numberOfChannels;c++) v += decoded.getChannelData(c)[i] || 0;
    out[i]=v/decoded.numberOfChannels;
  }
  src.buffer=mono;
  src.connect(offline.destination);
  src.start();
  const rendered=await offline.startRendering();
  const data=rendered.getChannelData(0);
  await ac.close();
  return data;
}

function makeSegments(result){
  const chunks=(result && result.chunks)||[];
  if(!chunks.length && result?.text){
    return [{start:0,end:Math.max(video.duration||3,3),text:result.text.trim()}];
  }
  return chunks.filter(x=>x.text?.trim()).map((x,i)=>{
    const a=x.timestamp?.[0] ?? 0;
    const b=x.timestamp?.[1] ?? Math.min((video.duration||a+3),a+3);
    return {start:a,end:Math.max(b,a+0.8),text:x.text.trim()};
  });
}
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const video=$("#video"), overlay=$("#captionOverlay"), captionText=$("#captionText"), stage=$("#stage"), empty=$("#emptyState");
let captions=[], selectedCaption=0, currentStyle="Neon Glow", currentFont="Inter", currentAnim="Pop", weight=900, italic=false, transformCase="normal", mediaURL="", history=[], future=[];

const presets=[
["Neon Glow","#fff","#00eaff","#00eaff","rgba(0,234,255,.16)","0 0 24px var(--glow),0 3px 0 #000"],
["Electric Purple","#fff","#b85cff","#b85cff","rgba(184,92,255,.14)","0 0 25px var(--glow),0 3px 0 #000"],
["Fire","#fff","#ff6a00","#ff3d00","rgba(255,61,0,.14)","0 0 22px var(--glow),0 3px 0 #000"],
["Gold","#fff","#ffd34d","#ffae00","rgba(255,174,0,.14)","0 0 22px var(--glow),0 3px 0 #000"],
["Glass","#fff","#dcecff","#7dd3fc","rgba(125,211,252,.12)","0 4px 18px rgba(0,0,0,.5)"],
["Karaoke","#fff","#ffef00","#ff00b8","rgba(255,0,184,.12)","0 0 18px var(--glow),0 3px 0 #000"],
["Candy Pop","#fff","#ff72d2","#8b5cf6","rgba(255,114,210,.12)","0 0 24px var(--glow),0 3px 0 #000"],
["Lime Punch","#fff","#b6ff00","#70ff00","rgba(112,255,0,.10)","0 0 22px var(--glow),0 3px 0 #000"],
["Ice Blue","#fff","#eaffff","#00aaff","rgba(0,170,255,.12)","0 0 22px var(--glow),0 3px 0 #000"],
["Black Punch","#fff","#fff","#111","rgba(0,0,0,.35)","0 3px 0 #000,0 0 12px #000"],
["Marker","#111","#ffe600","#ffe600","rgba(255,230,0,.2)","0 2px 0 rgba(255,255,255,.35)"],
["Retro Pink","#fff","#ff4da6","#ff147d","rgba(255,20,125,.14)","0 0 24px var(--glow),0 3px 0 #000"]
];
const fonts=[
["Inter","Inter"],["Poppins","Poppins"],["Montserrat","Montserrat"],["Anton","Anton"],["Bebas Neue","Bebas Neue"],["Oswald","Oswald"],["Roboto Condensed","Roboto Condensed"],["DM Sans","DM Sans"],["Space Grotesk","Space Grotesk"],["Titan One","Titan One"],["Playfair Display","Playfair Display"],["Pacifico","Pacifico"],["Arial Black","Arial Black"],["Georgia","Georgia"],["Trebuchet","Trebuchet MS"],["Impact","Impact"]
];
const anims=[["None","none"],["Pop","pop"],["Zoom","zoom"],["Slide Left","slide"],["Bounce","bounce"],["Blur In","blur"],["Glow Up","glow"],["Rise Up","rise"],["Flip","flip"],["Elastic","elastic"],["Punch","punch"],["Float","float"]];

function toast(t){let x=$("#toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),1800)}
function saveState(){history.push(JSON.stringify({captions,selectedCaption,currentStyle,currentFont,currentAnim,weight,italic,transformCase}));if(history.length>30)history.shift();future=[]}
function renderPresets(){
 $("#presetGrid").innerHTML=presets.map((p,i)=>`<button class="preset ${p[0]===currentStyle?"selected":""}" data-i="${i}" style="background:linear-gradient(145deg,${p[3]}22,${p[4]})"><div class="mini" style="color:${p[1]};font-family:Inter;text-shadow:${p[5]}">${p[0]==="Marker"?"BROWN":"the QUICK"}</div><small>${p[0]}</small></button>`).join("");
 $$("#presetGrid .preset").forEach(b=>b.onclick=()=>{saveState();applyPreset(presets[+b.dataset.i]);renderPresets()});
}
function applyPreset(p){
  currentStyle=p[0];
  $("#textColor").value=p[1];
  $("#accentColor").value=p[2];
  $("#glowColor").value=p[3];
  $("#bgColor").value="#000000";
  overlay.style.setProperty("--glow",p[3]);
  overlay.style.setProperty("--accent",p[2]);
  captionText.style.color=p[1];
  captionText.style.textShadow=p[5];
  captionText.style.background=p[0]==="Marker"?"linear-gradient(transparent 38%,#ffe600 38%,#ffe600 82%,transparent 82%)":"none";
  captionText.style.webkitBackgroundClip="initial";
  captionText.style.padding=p[0]==="Glass"?".12em .28em":"0";
  captionText.style.borderRadius=p[0]==="Glass"?".18em":"0";
  captionText.style.backdropFilter=p[0]==="Glass"?"blur(8px)":"none";
  renderCaption();
}
function renderFonts(){
  $("#fontGrid").innerHTML=fonts.map(f=>`<button type="button" class="font-card ${f[0]===currentFont?"selected":""}" data-font="${f[1]}" style="font-family:'${f[1]}',sans-serif"><span style="font-family:'${f[1]}',sans-serif">${f[0]}</span></button>`).join("");
  $$("#fontGrid .font-card").forEach(b=>b.onclick=async()=>{
    saveState();
    currentFont=b.dataset.font;
    try{await document.fonts.load(`700 28px '${currentFont}'`)}catch(e){}
    renderFonts();
    renderCaption();
    toast(`${currentFont} applied ✓`);
  });
}
function renderAnimations(){
  $("#animationGrid").innerHTML=anims.map(a=>`<button type="button" class="anim-card ${a[1]===currentAnim?"selected":""}" data-anim="${a[1]}"><span>${a[0]}</span></button>`).join("");
  $$("#animationGrid .anim-card").forEach(b=>b.onclick=()=>{
    saveState();
    currentAnim=b.dataset.anim;
    renderAnimations();
    renderCaption(true);
    toast(`${b.textContent.trim()} animation ✓`);
  });
}
function wrapWords(text){return text.split(/\s+/).filter(Boolean).map((w,i)=>`<span class="word" style="--i:${i}">${w}</span>`).join(" ")}
function getActive(){if(!captions.length)return null;let t=video.currentTime;return captions.find(c=>t>=c.start&&t<=c.end)||captions[selectedCaption]||captions[0]}
function renderCaption(forceAnimation=false){
 let c=getActive();let text=c?c.text:"Your captions will appear here";if(transformCase==="upper")text=text.toUpperCase();if(transformCase==="lower")text=text.toLowerCase();
 captionText.innerHTML=wrapWords(text);
 overlay.className="caption-overlay";
 void overlay.offsetWidth;
 overlay.className=`caption-overlay anim-${currentAnim}`;overlay.style.setProperty("--dur",`${.55/parseFloat($("#speedRange").value||1)}s`);overlay.style.setProperty("--stagger",`${$("#staggerRange").value}s`);
 captionText.style.fontWeight=weight;captionText.style.fontStyle=italic?"italic":"normal";captionText.style.fontFamily=`'${currentFont}',sans-serif`;
 captionText.style.fontSize=`${$("#sizeRange").value}px`;captionText.style.letterSpacing=`${$("#spacingRange").value}px`;captionText.style.textShadow=`0 0 ${$("#glowRange").value}px ${$("#glowColor").value},0 2px ${$("#outlineRange").value}px #000`;
 captionText.style.color=$("#textColor").value;overlay.style.setProperty("--glow",$("#glowColor").value);
}
function renderCaptionList(){
 $("#captionCount").textContent=`${captions.length} segments`;
 $("#captionList").innerHTML=captions.map((c,i)=>`<div class="caption-item"><textarea data-i="${i}">${c.text}</textarea><div class="caption-meta"><input data-start="${i}" type="number" step=".01" value="${c.start}"><input data-end="${i}" type="number" step=".01" value="${c.end}"><button data-del="${i}">Delete</button></div></div>`).join("");
 $$("#captionList textarea").forEach(x=>x.oninput=e=>{captions[+e.target.dataset.i].text=e.target.value;renderCaption()});
 $$("#captionList [data-start]").forEach(x=>x.onchange=e=>{captions[+e.target.dataset.start].start=+e.target.value});
 $$("#captionList [data-end]").forEach(x=>x.onchange=e=>{captions[+e.target.dataset.end].end=+e.target.value});
 $$("#captionList [data-del]").forEach(x=>x.onclick=e=>{saveState();captions.splice(+e.target.dataset.del,1);renderCaptionList();renderCaption()});
}
$("#mediaInput").onchange=e=>{let f=e.target.files[0];if(!f)return;mediaURL=URL.createObjectURL(f);video.src=mediaURL;$("#fileName").textContent=f.name;empty.style.display="none";video.onloadedmetadata=()=>{$("#duration").textContent=fmt(video.duration);$("#scrubber").max=video.duration};toast("Media loaded")};
video.ontimeupdate=()=>{$("#currentTime").textContent=fmt(video.currentTime);$("#scrubber").value=video.currentTime;let c=getActive();if(c&&c.text!==captionText.textContent)renderCaption()};
$("#scrubber").oninput=e=>video.currentTime=+e.target.value;
function fmt(s){if(!isFinite(s))return"0:00";return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`}
$("#addCaptionBtn").onclick=()=>{saveState();let t=video.currentTime||0;captions.push({start:t,end:Math.min((video.duration||t+3),t+3),text:"New caption"});selectedCaption=captions.length-1;renderCaptionList();renderCaption();toast("Caption added")};
$("#clearBtn").onclick=()=>{saveState();captions=[];renderCaptionList();renderCaption()};
$("#generateBtn").onclick=async()=>{
 if(!video.src){toast("Upload a video first");return}
 const btn=$("#generateBtn");
 const file=$("#mediaInput").files?.[0];
 if(!file){toast("Please choose the video again");return}
 btn.disabled=true;
 const old=btn.textContent;
 try{
   btn.textContent="Loading AI…";
   const whisper=await getWhisper();
   btn.textContent="Extracting audio…";
   const audio=await extractMono16k(file);
   const lang=$("#languageSelect")?.value || "hi";
   btn.textContent="Generating captions…";
   const result=await whisper(audio,{
     language:lang,
     task:"transcribe",
     return_timestamps:true,
     chunk_length_s:30,
     stride_length_s:5,
     callback_function:()=>{}
   });
   captions=makeSegments(result);
   selectedCaption=0;
   renderCaptionList();
   renderCaption();
   toast(captions.length?`${captions.length} caption segments ready ✓`:"No speech detected");
 }catch(err){
   console.error(err);
   toast("Caption AI failed — try again or add captions manually");
 }finally{
   btn.disabled=false;
   btn.textContent=old;
 }
};
$("#exportBtn").onclick=()=>{
 if(!captions.length){toast("No captions to export");return}
 let srt=captions.map((c,i)=>`${i+1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text}\n`).join("\n");
 let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([srt],{type:"text/plain"}));a.download="captions.srt";a.click();toast("SRT exported");
};
function srtTime(s){let h=Math.floor(s/3600),m=Math.floor(s%3600/60),sec=Math.floor(s%60),ms=Math.floor((s%1)*1000);return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")},${String(ms).padStart(3,"0")}`}
$$(".tab").forEach(t=>t.onclick=()=>{$$(".tab").forEach(x=>x.classList.remove("active"));$$(".tab-panel").forEach(x=>x.classList.remove("active"));t.classList.add("active");$("#"+t.dataset.tab).classList.add("active")});
$$(".ratio").forEach(r=>r.onclick=()=>{$$(".ratio").forEach(x=>x.classList.remove("active"));r.classList.add("active");stage.className=`stage ratio-${r.dataset.ratio.replace("/","")}`});
$$("[data-weight]").forEach(b=>b.onclick=()=>{saveState();weight=+b.dataset.weight;$$("[data-weight]").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderCaption()});
$("#italicBtn").onclick=()=>{saveState();italic=!italic;$("#italicBtn").classList.toggle("active",italic);renderCaption()};
$("#capsBtn").onclick=()=>{saveState();transformCase="upper";renderCaption()};
$("#lowerBtn").onclick=()=>{saveState();transformCase="lower";renderCaption()};
["textColor","accentColor","glowColor","bgColor","glowRange","outlineRange","sizeRange","spacingRange","speedRange","staggerRange"].forEach(id=>$("#"+id).oninput=renderCaption);
$("#undoBtn").onclick=()=>{if(!history.length)return;future.push(JSON.stringify({captions,selectedCaption,currentStyle,currentFont,currentAnim,weight,italic,transformCase}));let s=JSON.parse(history.pop());Object.assign(window,s);captions=s.captions;selectedCaption=s.selectedCaption;currentStyle=s.currentStyle;currentFont=s.currentFont;currentAnim=s.currentAnim;weight=s.weight;italic=s.italic;transformCase=s.transformCase;renderPresets();renderFonts();renderAnimations();renderCaptionList();renderCaption()};
$("#redoBtn").onclick=()=>{if(!future.length)return;let s=JSON.parse(future.pop());history.push(JSON.stringify({captions,selectedCaption,currentStyle,currentFont,currentAnim,weight,italic,transformCase}));captions=s.captions;selectedCaption=s.selectedCaption;currentStyle=s.currentStyle;currentFont=s.currentFont;currentAnim=s.currentAnim;weight=s.weight;italic=s.italic;transformCase=s.transformCase;renderPresets();renderFonts();renderAnimations();renderCaptionList();renderCaption()};
renderPresets();renderFonts();renderAnimations();renderCaptionList();applyPreset(presets[0]);renderCaption();
