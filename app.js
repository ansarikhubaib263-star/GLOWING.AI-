const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={
  captions:[], preset:"neon", font:"Inter", weight:"800", style:"normal", size:42, glow:22, outline:2, radius:18,
  text:"#ffffff",accent:"#00e5ff",glowColor:"#00e5ff",bg:"#05060b",spacing:0,lineHeight:1.05,animation:"pop",speed:1,highlight:"none"
};
const presets=[
 ["neon","NEON GLOW","theme-neon"],["clean","CLEAN","theme-clean"],["box","DARK BOX","theme-box"],
 ["marker","MARKER","theme-marker"],["glass","GLASS","theme-glass"],["fire","FIRE","theme-fire"],
 ["punch","PUNCH","theme-punch"],["purple","PURPLE GLOW","theme-purple"],["gold","GOLD","theme-gold"],["kinetic","KINETIC","theme-kinetic"]
];
const fonts=[
 ["Inter","Modern sans-serif","Inter,system-ui,sans-serif"],["Arial","Clean classic","Arial,sans-serif"],["Trebuchet MS","Friendly","Trebuchet MS,sans-serif"],
 ["Georgia","Elegant serif","Georgia,serif"],["Times New Roman","Classic serif","Times New Roman,serif"],["Impact","Heavy display","Impact,sans-serif"],
 ["Courier New","Typewriter","Courier New,monospace"],["Verdana","Readable","Verdana,sans-serif"],["Palatino Linotype","Editorial","Palatino Linotype,serif"],
 ["Lucida Console","Retro mono","Lucida Console,monospace"],["Brush Script MT","Script","Brush Script MT,cursive"],["Comic Sans MS","Playful","Comic Sans MS,cursive"]
];
const anims=[["none","None"],["pop","Pop"],["fade","Fade Up"],["zoom","Zoom"],["slide","Slide"],["bounce","Bounce"],["type","Typewriter"],["float","Float"],["shake","Kinetic Shake"]];

function renderPresets(){
  $("#presetGrid").innerHTML=presets.map(p=>`<button class="preset ${p[0]===state.preset?"selected":""}" data-p="${p[0]}"><span class="${p[2]}"><b>${p[0]==="fire"?"HOT":p[0]==="gold"?"GOLD":p[0]==="marker"?"MARK":p[1]}</b></span><small>${p[1]}</small></button>`).join("");
  $$(".preset").forEach(b=>b.onclick=()=>{state.preset=b.dataset.p;apply()});
}
function renderFonts(){
  $("#fontGrid").innerHTML=fonts.map(f=>`<button class="font ${f[0]===state.font?"selected":""}" data-font="${f[0]}" style="font-family:${f[2]}"><b>Quick Brown</b><small>${f[1]}</small></button>`).join("");
  $$(".font").forEach(b=>b.onclick=()=>{state.font=b.dataset.font;apply()});
}
function renderAnims(){
  $("#animGrid").innerHTML=anims.map(a=>`<button class="anim ${a[0]===state.animation?"selected":""}" data-a="${a[0]}">${a[1]}</button>`).join("");
  $$(".anim").forEach(b=>b.onclick=()=>{state.animation=b.dataset.a;apply()});
}
function apply(){
  const stage=$("#stage"), t=$("#captionText");
  stage.className=`stage theme-${state.preset}`;
  t.style.fontFamily=fonts.find(f=>f[0]===state.font)?.[2]||"Inter,sans-serif";
  t.style.fontWeight=state.weight;t.style.fontStyle=state.style;t.style.fontSize=state.size+"px";
  t.style.letterSpacing=state.spacing+"px";t.style.lineHeight=state.lineHeight;t.style.textShadow=`0 4px 8px #000,0 0 ${state.glow}px ${state.glowColor}`;
  t.style.webkitTextStroke=`${state.outline}px #061018`;t.style.borderRadius=state.radius+"px";t.style.setProperty("--accent",state.accent);
  t.style.animation=state.animation==="none"?"none":`${state.animation} ${Math.max(.2, .55/state.speed)}s both`;
  $("#textColor").value=state.text;$("#accentColor").value=state.accent;$("#glowColor").value=state.glowColor;$("#bgColor").value=state.bg;
  $("#sizeOut").value=state.size;$("#glowOut").value=state.glow;$("#outlineOut").value=state.outline;$("#radiusOut").value=state.radius;
  renderPresets();renderFonts();renderAnims();
}
function setCaptionText(txt){$("#captionText").textContent=txt||"Your captions will appear here";$("#captionText").style.animation="none";void $("#captionText").offsetWidth;$("#captionText").style.animation=state.animation==="none"?"none":`${state.animation} ${Math.max(.2,.55/state.speed)}s both`}

$("#mediaInput").onchange=e=>{const f=e.target.files[0];if(!f)return;const v=$("#video");v.src=URL.createObjectURL(f);v.load();$("#stage").classList.add("has-video");$("#statusPill").textContent=f.name;$("#emptyStage").style.display="none"};
$("#dropZone").addEventListener("dragover",e=>{e.preventDefault()});
$("#video").ontimeupdate=()=>{const v=$("#video");$("#currentTime").textContent=fmt(v.currentTime);if(v.duration)$("#seek").value=v.currentTime/v.duration*100;showCurrent()};
$("#video").onloadedmetadata=()=>{$("#duration").textContent=fmt($("#video").duration);$("#seek").max=100};
$("#seek").oninput=()=>{const v=$("#video");if(v.duration)v.currentTime=v.duration*$("#seek").value/100};
function fmt(n){n=Math.max(0,n||0);return `${String(Math.floor(n/60)).padStart(2,"0")}:${String(Math.floor(n%60)).padStart(2,"0")}`}
function showCurrent(){
 const t=$("#video").currentTime;const c=state.captions.find(x=>t>=x.start&&t<=x.end);
 setCaptionText(c?c.text:"");
}
$$(".tab").forEach(b=>b.onclick=()=>{$$(".tab,.tab-panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#"+b.dataset.tab).classList.add("active")});
$("#size").oninput=e=>{state.size=+e.target.value;apply()};$("#glow").oninput=e=>{state.glow=+e.target.value;apply()};$("#outline").oninput=e=>{state.outline=+e.target.value;apply()};$("#radius").oninput=e=>{state.radius=+e.target.value;apply()};
$("#spacing").oninput=e=>{state.spacing=+e.target.value;apply()};$("#lineHeight").oninput=e=>{state.lineHeight=+e.target.value;apply()};$("#animSpeed").oninput=e=>{state.speed=+e.target.value;apply()};
$("#highlightMode").onchange=e=>{state.highlight=e.target.value};
["textColor","accentColor","glowColor","bgColor"].forEach(id=>$("#"+id).oninput=e=>{const k={textColor:"text",accentColor:"accent",glowColor:"glowColor",bgColor:"bg"}[id];state[k]=e.target.value;apply()});
$$("[data-weight]").forEach(b=>b.onclick=()=>{state.weight=b.dataset.weight;$$("[data-weight]").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");apply()});
$$("[data-style]").forEach(b=>b.onclick=()=>{state.style=b.dataset.style;$$("[data-style]").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");apply()});

function renderCaptions(){
 $("#segmentCount").textContent=`${state.captions.length} segment${state.captions.length===1?"":"s"}`;
 const list=$("#captionList");
 if(!state.captions.length){list.innerHTML='<div class="empty-list">No caption segments yet.</div>';return}
 list.innerHTML="";
 state.captions.forEach((c,i)=>{
  const n=$("#captionItemTemplate").content.cloneNode(true), item=n.querySelector(".caption-item");
  n.querySelector(".start").value=c.start.toFixed(1);n.querySelector(".end").value=c.end.toFixed(1);n.querySelector(".caption-edit").value=c.text;
  n.querySelector(".start").onchange=e=>{c.start=+e.target.value;sortCaptions();};
  n.querySelector(".end").onchange=e=>c.end=+e.target.value;
  n.querySelector(".caption-edit").oninput=e=>{c.text=e.target.value;if($("#video").currentTime>=c.start&&$("#video").currentTime<=c.end)setCaptionText(c.text)};
  n.querySelector(".playSeg").onclick=()=>{$("#video").currentTime=c.start;$("#video").play()};
  n.querySelector(".deleteSeg").onclick=()=>{state.captions.splice(i,1);renderCaptions()};
  list.appendChild(n);
 });
}
function sortCaptions(){state.captions.sort((a,b)=>a.start-b.start);renderCaptions()}
$("#addCaptionBtn").onclick=()=>{const start=$("#video").currentTime||0;state.captions.push({start,end:start+3,text:"New caption"});sortCaptions()};
function normalizeText(s){return (s||"").replace(/\s+/g," ").trim()}
function addSpeechCaption(text,start,end){text=normalizeText(text);if(!text)return;state.captions.push({start,end,text});sortCaptions()}
$("#generateBtn").onclick=async()=>{
 const v=$("#video"); if(!v.src){alert("Pehle video/audio choose karo.");return}
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){alert("Is browser me speech recognition available nahi hai. Chrome me try karo, ya captions manually add/edit karo.");return}
 $("#statusPill").textContent="Listening…";
 state.captions=[];renderCaptions();
 const rec=new SR();rec.lang=$("#language").value;rec.continuous=true;rec.interimResults=false;
 let started=false, base=0;
 rec.onstart=()=>{started=true;base=v.currentTime||0;v.play().catch(()=>{})};
 rec.onresult=e=>{
   for(let i=e.resultIndex;i<e.results.length;i++){
     const r=e.results[i];if(!r.isFinal)continue;
     const end=Math.min(v.duration||Infinity,v.currentTime||base+3);
     const start=Math.max(base,end-Math.max(2,Math.min(5,normalizeText(r[0].transcript).split(/\s+/).length*.32)));
     addSpeechCaption(r[0].transcript,start,end);base=end;
   }
 };
 rec.onerror=e=>{if(e.error!=="aborted")$("#statusPill").textContent="Recognition error"};
 rec.onend=()=>{$("#statusPill").textContent=`${state.captions.length} captions`;renderCaptions()};
 rec.start();
 v.onended=()=>{try{rec.stop()}catch{}};
 setTimeout(()=>{if(started)try{rec.stop()}catch{}},Math.max(1000,(v.duration||60)*1000));
};
function srtTime(sec){const ms=Math.floor((sec%1)*1000);const d=new Date(sec*1000);return `${String(Math.floor(sec/3600)).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}:${String(d.getUTCSeconds()).padStart(2,"0")},${String(ms).padStart(3,"0")}`}
$("#exportBtn").onclick=()=>{
 if(!state.captions.length){alert("Pehle captions generate/add karo.");return}
 const body=state.captions.map((c,i)=>`${i+1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text}\n`).join("\n");
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([body],{type:"text/plain;charset=utf-8"}));a.download="glowing-ai-captions.srt";a.click();URL.revokeObjectURL(a.href);
};
$("#clearBtn").onclick=()=>{state.captions=[];$("#video").removeAttribute("src");$("#video").load();$("#stage").classList.remove("has-video");setCaptionText("");renderCaptions();$("#statusPill").textContent="Ready"};
renderPresets();renderFonts();renderAnims();renderCaptions();apply();
