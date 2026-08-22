const $ = id => document.getElementById(id);
const videoInput = $("videoInput"), video = $("video"), stage = $("videoStage");
const status = $("status"), generateBtn = $("generateCaptions"), overlay = $("captionOverlay");
const track = $("captionsTrack"), stylesGrid = $("stylesGrid"), seek = $("seek");
const currentTime = $("currentTime"), durationEl = $("duration"), playBtn = $("playBtn");
const wordsRange = $("wordsPerCaption"), wordCount = $("wordCount");

let captions = [], currentCue = -1;
let selectedStyle = {name:"Neon Glow", color:"#d7ff34", effect:"pop", glow:true};

const styles = [
  {name:"Neon Glow",color:"#d7ff34",effect:"glow",glow:true},
  {name:"Clean Pop",color:"#ffffff",effect:"pop",glow:false},
  {name:"Orange Bounce",color:"#ff8a00",effect:"bounce",glow:true},
  {name:"Purple Slide",color:"#b46cff",effect:"slide",glow:true},
  {name:"Ice Blue",color:"#63dcff",effect:"pop",glow:true},
  {name:"Red Impact",color:"#ff4b4b",effect:"bounce",glow:true},
  {name:"Gold",color:"#ffd24d",effect:"slide",glow:true},
  {name:"White Cinema",color:"#fff",effect:"glow",glow:true},
  {name:"Green Punch",color:"#4dff9a",effect:"bounce",glow:true}
];

function setStatus(text, type="") {
  status.textContent = "● " + text;
  status.className = "status " + type;
}
function fmt(t){ if(!isFinite(t)) return "00:00.0"; const m=Math.floor(t/60),s=Math.floor(t%60); return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}.${Math.floor((t%1)*10)}`; }

function renderStyles(){
  stylesGrid.innerHTML="";
  styles.forEach((s,i)=>{
    const b=document.createElement("button");
    b.className="style-card"+(i===0?" active":"");
    b.textContent="the quick BROWN fox";
    b.style.color=s.color;
    b.style.textShadow=s.glow?`0 0 12px ${s.color}`:"none";
    b.onclick=()=>{
      selectedStyle=s;
      document.querySelectorAll(".style-card").forEach(x=>x.classList.remove("active"));
      b.classList.add("active");
      refreshCaption(true);
    };
    stylesGrid.appendChild(b);
  });
}

videoInput.addEventListener("change",()=>{
  const f=videoInput.files[0];
  if(!f) return;
  video.src=URL.createObjectURL(f);
  stage.classList.remove("empty");
  captions=[]; currentCue=-1; track.innerHTML=""; overlay.textContent="";
  setStatus("Media loaded: "+f.name,"ready");
});

video.addEventListener("loadedmetadata",()=>{durationEl.textContent=fmt(video.duration);});
video.addEventListener("timeupdate",()=>{
  currentTime.textContent=fmt(video.currentTime);
  seek.value=video.duration ? Math.round(video.currentTime/video.duration*1000) : 0;
  refreshCaption(false);
});
seek.addEventListener("input",()=>{if(video.duration) video.currentTime=(seek.value/1000)*video.duration;});
playBtn.onclick=()=>video.paused?video.play():video.pause();
video.addEventListener("play",()=>playBtn.textContent="❚❚");
video.addEventListener("pause",()=>playBtn.textContent="▶");

wordsRange.addEventListener("input",()=>wordCount.textContent=wordsRange.value);

function renderTrack(){
  track.innerHTML="";
  captions.forEach((c,i)=>{
    const el=document.createElement("div"); el.className="cue"; el.dataset.i=i;
    el.innerHTML=`<b>${c.text}</b><span>${fmt(c.start)} - ${fmt(c.end)}</span>`;
    el.onclick=()=>{video.currentTime=c.start;video.play();};
    track.appendChild(el);
  });
}

function refreshCaption(force){
  const idx=captions.findIndex(c=>video.currentTime>=c.start && video.currentTime<c.end);
  if(idx===currentCue && !force) return;
  currentCue=idx;
  const c=captions[idx];
  overlay.className="caption-overlay";
  if(!c){overlay.textContent="";return;}
  overlay.textContent=c.text;
  overlay.style.color=selectedStyle.color;
  void overlay.offsetWidth;
  overlay.classList.add(selectedStyle.effect);
  if(selectedStyle.glow) overlay.classList.add("glow");
  document.querySelectorAll(".cue").forEach(x=>x.classList.toggle("active",Number(x.dataset.i)===idx));
}

function chunksToCaptions(chunks, text){
  if(!chunks?.length){
    return text?.trim() ? [{text:text.trim(),start:0,end:Math.max(video.duration||5,1)}] : [];
  }
  const out=[], group=[], limit=Number(wordsRange.value);
  let start=null,end=null;
  for(const ch of chunks){
    const tx=String(ch.text||"").trim(); if(!tx) continue;
    const ts=ch.timestamp||[0,0];
    if(start===null) start=Number(ts[0])||0;
    end=Number(ts[1])||start+.8;
    group.push(tx);
    if(group.join(" ").split(/\s+/).length>=limit || /[.!?]$/.test(tx)){
      out.push({text:group.join(" ").trim(),start,end:Math.max(end,start+.5)});
      group.length=0;start=null;end=null;
    }
  }
  if(group.length) out.push({text:group.join(" ").trim(),start:start??0,end:Math.max(end??2,(start??0)+.5)});
  return out;
}

async function getAudio(file){
  const ctx=new (window.AudioContext||window.webkitAudioContext)();
  const buf=await file.arrayBuffer();
  const decoded=await ctx.decodeAudioData(buf.slice(0));
  const mono=new Float32Array(decoded.length);
  for(let ch=0;ch<decoded.numberOfChannels;ch++){
    const data=decoded.getChannelData(ch);
    for(let i=0;i<data.length;i++) mono[i]+=data[i]/decoded.numberOfChannels;
  }
  return {array:mono,sampling_rate:decoded.sampleRate};
}

generateBtn.onclick=async()=>{
  const file=videoInput.files[0];
  if(!file){setStatus("Pehle media upload karo.");return;}
  try{
    generateBtn.disabled=true;
    setStatus("AI model loading... first time thoda wait karein.","loading");
    const {pipeline,env}=await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2");
    env.allowLocalModels=false;
    const audio=await getAudio(file);
    setStatus("Audio detect ho raha hai aur captions ban rahe hain...","loading");
    const transcriber=await pipeline("automatic-speech-recognition","Xenova/whisper-tiny",{dtype:"q8"});
    const lang=$("language").value;
    const result=await transcriber(audio,{chunk_length_s:30,stride_length_s:5,return_timestamps:true,language:lang==="auto"?undefined:lang,task:"transcribe"});
    captions=chunksToCaptions(result.chunks,result.text);
    renderTrack(); refreshCaption(true);
    setStatus(`${captions.length} captions generated!`,"ready");
  }catch(e){
    console.error(e);
    setStatus("Auto caption failed. Chrome me MP3/WAV try karo, ya video audio format unsupported ho sakta hai.");
  }finally{generateBtn.disabled=false;}
};

function download(name,text,type){
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href);
}
$("downloadSrt").onclick=()=>{
  const s=captions.map((c,i)=>`${i+1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text}\n`).join("\n");
  download("captions.srt",s,"text/plain");
};
$("downloadJson").onclick=()=>download("caption-style.json",JSON.stringify({style:selectedStyle,captions},null,2),"application/json");
function srtTime(t){const h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=Math.floor(t%60),ms=Math.floor((t%1)*1000);return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")},${String(ms).padStart(3,"0")}`;}

renderStyles();
setStatus("Waiting for media");
