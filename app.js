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
["Inter","Inter"],["Poppins","Poppins"],["Montserrat","Montserrat"],["Anton","Anton"],["Bebas Neue","Bebas Neue"],["Oswald","Oswald"],["Roboto Condensed","Roboto Condensed"],["DM Sans","DM Sans"],["Space Grotesk","Space Grotesk"],["Titan One","Titan One"],["Playfair","Playfair Display"],["Pacifico","Pacifico"]
];
const anims=[["None","none"],["Pop","pop"],["Zoom","zoom"],["Slide","slide"],["Bounce","bounce"],["Blur In","blur"],["Glow Up","glow"],["Rise","rise"],["Flip","flip"]];

function toast(t){let x=$("#toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),1800)}
function saveState(){history.push(JSON.stringify({captions,selectedCaption,currentStyle,currentFont,currentAnim,weight,italic,transformCase}));if(history.length>30)history.shift();future=[]}
function renderPresets(){
 $("#presetGrid").innerHTML=presets.map((p,i)=>`<button class="preset ${p[0]===currentStyle?"selected":""}" data-i="${i}" style="background:linear-gradient(145deg,${p[3]}22,${p[4]})"><div class="mini" style="color:${p[1]};font-family:Inter;text-shadow:${p[5]}">${p[0]==="Marker"?"BROWN":"the QUICK"}</div><small>${p[0]}</small></button>`).join("");
 $$("#presetGrid .preset").forEach(b=>b.onclick=()=>{saveState();applyPreset(presets[+b.dataset.i]);renderPresets()});
}
function applyPreset(p){currentStyle=p[0];$("#textColor").value=p[1];$("#accentColor").value=p[2];$("#glowColor").value=p[3];$("#bgColor").value=p[4].startsWith("#")?p[4]:"#000000";overlay.style.setProperty("--glow",p[3]);captionText.style.color=p[1];captionText.style.textShadow=p[5];captionText.style.background=p[0]==="Marker"?"linear-gradient(transparent 38%,#ffe600 38%,#ffe600 82%,transparent 82%)":"none";captionText.style.webkitBackgroundClip="initial";renderCaption()}
function renderFonts(){
 $("#fontGrid").innerHTML=fonts.map(f=>`<button class="font-card ${f[0]===currentFont?"selected":""}" data-font="${f[1]}" style="font-family:'${f[1]}'"><span>${f[0]}</span></button>`).join("");
 $$("#fontGrid .font-card").forEach(b=>b.onclick=()=>{saveState();currentFont=b.dataset.font;captionText.style.fontFamily=`'${currentFont}',sans-serif`;renderFonts()});
}
function renderAnimations(){
 $("#animationGrid").innerHTML=anims.map(a=>`<button class="anim-card ${a[1]===currentAnim?"selected":""}" data-anim="${a[1]}"><span>${a[0]}</span></button>`).join("");
 $$("#animationGrid .anim-card").forEach(b=>b.onclick=()=>{saveState();currentAnim=b.dataset.anim;renderAnimations();renderCaption()});
}
function wrapWords(text){return text.split(/\s+/).filter(Boolean).map((w,i)=>`<span class="word" style="--i:${i}">${w}</span>`).join(" ")}
function getActive(){if(!captions.length)return null;let t=video.currentTime;return captions.find(c=>t>=c.start&&t<=c.end)||captions[selectedCaption]||captions[0]}
function renderCaption(){
 let c=getActive();let text=c?c.text:"Your captions will appear here";if(transformCase==="upper")text=text.toUpperCase();if(transformCase==="lower")text=text.toLowerCase();
 captionText.innerHTML=wrapWords(text);overlay.className=`caption-overlay anim-${currentAnim}`;overlay.style.setProperty("--dur",`${.55/parseFloat($("#speedRange").value||1)}s`);overlay.style.setProperty("--stagger",`${$("#staggerRange").value}s`);
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
$("#generateBtn").onclick=()=>{
 if(!video.src){toast("Upload a video first");return}
 if(!("webkitSpeechRecognition"in window||"SpeechRecognition"in window)){toast("Speech recognition not supported — add captions manually");return}
 let R=window.SpeechRecognition||window.webkitSpeechRecognition,r=new R();r.lang="en-IN";r.continuous=true;r.interimResults=false;
 let start=video.currentTime||0;captions=[];renderCaptionList();toast("Listening… play the video");
 r.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal){let text=e.results[i][0].transcript.trim();let t=video.currentTime;captions.push({start:Math.max(0,t-3),end:t+0.4,text});renderCaptionList();renderCaption()}}};
 r.onerror=()=>toast("Recognition stopped");r.onend=()=>toast("Caption generation finished");r.start();
 video.play().catch(()=>{});
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
$("#capsBtn").onclick=()=>{transformCase="upper";renderCaption()};$("#lowerBtn").onclick=()=>{transformCase="lower";renderCaption()};
["textColor","accentColor","glowColor","bgColor","glowRange","outlineRange","sizeRange","spacingRange","speedRange","staggerRange"].forEach(id=>$("#"+id).oninput=renderCaption);
$("#undoBtn").onclick=()=>{if(!history.length)return;future.push(JSON.stringify({captions,selectedCaption,currentStyle,currentFont,currentAnim,weight,italic,transformCase}));let s=JSON.parse(history.pop());Object.assign(window,s);captions=s.captions;selectedCaption=s.selectedCaption;currentStyle=s.currentStyle;currentFont=s.currentFont;currentAnim=s.currentAnim;weight=s.weight;italic=s.italic;transformCase=s.transformCase;renderPresets();renderFonts();renderAnimations();renderCaptionList();renderCaption()};
$("#redoBtn").onclick=()=>{if(!future.length)return;let s=JSON.parse(future.pop());history.push(JSON.stringify({captions,selectedCaption,currentStyle,currentFont,currentAnim,weight,italic,transformCase}));captions=s.captions;selectedCaption=s.selectedCaption;currentStyle=s.currentStyle;currentFont=s.currentFont;currentAnim=s.currentAnim;weight=s.weight;italic=s.italic;transformCase=s.transformCase;renderPresets();renderFonts();renderAnimations();renderCaptionList();renderCaption()};
renderPresets();renderFonts();renderAnimations();renderCaptionList();applyPreset(presets[0]);renderCaption();
