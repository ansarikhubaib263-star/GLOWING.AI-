const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const video=$("#video"), stage=$("#stage"), overlay=$("#captionOverlay"), empty=$("#emptyPreview");
const state={
  captions:[], selected:0, style:"Neon Glow", font:"Inter", animation:"Pop",
  textColor:"#ffffff", accent:"#00e5ff", glow:"#00e5ff", stroke:"#071017",
  strokeWidth:2, shadow:true, size:42, position:10, maxLines:3, align:"center",
  background:false, bgColor:"#05070c", bgOpacity:.55, radius:12, letterSpacing:-.5,
  animationDuration:.35, ratio:"9:16"
};
let history=[], future=[], lastCaptionId=null, raf=0;

const presets=[
 ["Neon Glow","#fff","#00e5ff","#00e5ff"],["Electric Blue","#fff","#38bdf8","#38bdf8"],
 ["Purple Neon","#fff","#b66cff","#9b5cff"],["Hot Pink","#fff","#ff2bd6","#ff2bd6"],
 ["Lime Pop","#fff","#b8ff00","#8cff00"],["Fire","#fff","#ff7a00","#ff3b00"],
 ["Golden","#fff","#ffd400","#ff9d00"],["Clean White","#fff","#fff","#fff"],
 ["Black Punch","#fff","#000","#000"],["Karaoke","#fff","#00e5ff","#00e5ff"],
 ["Word Pop","#fff","#ffe100","#ffe100"],["Glass","#fff","#70e7ff","#00e5ff"],
 ["Cinematic","#fff","#e9eef7","#7890b5"],["Retro","#ffe8b0","#ff7b00","#ff7b00"],
 ["Editorial","#fff","#ff5c8a","#ff5c8a"],["Cyber","#d9ffff","#00ffd5","#00ffd5"],
 ["Violet","#fff","#a78bfa","#8b5cf6"],["Mint","#06201d","#5fffe1","#34e8d0"],
 ["Sunset","#fff","#ff8a65","#ff4d6d"],["Minimal","#fff","#fff","#aaa"],
 ["Outline","#fff","#00e5ff","#00e5ff"],["Shadow","#fff","#fff","#111"],
 ["Bubble","#071017","#5ee7ff","#5ee7ff"],["Toxic","#111","#a3ff12","#8cff00"],
 ["Ocean","#fff","#00c6ff","#0072ff"],["Rose","#fff","#ff7aa2","#ff3b7d"],
 ["Mono","#fff","#aaa","#666"],["Dream","#fff","#d8b4fe","#c084fc"],
 ["Matrix","#c8ffcc","#16ff5c","#16ff5c"],["Premium Gold","#fff3c4","#ffc400","#ff8a00"]
];
const fonts=[
 ["Inter","Inter,system-ui,sans-serif"],["Arial Black","Arial Black,Arial,sans-serif"],
 ["Impact","Impact,Haettenschweiler,sans-serif"],["Trebuchet","Trebuchet MS,sans-serif"],
 ["Georgia","Georgia,serif"],["Times","Times New Roman,serif"],["Verdana","Verdana,sans-serif"],
 ["Courier","Courier New,monospace"],["Garamond","Garamond,serif"],["Arial","Arial,sans-serif"],
 ["Helvetica","Helvetica,Arial,sans-serif"],["Tahoma","Tahoma,sans-serif"],
 ["Comic","Comic Sans MS,cursive"],["Palatino","Palatino Linotype,serif"],
 ["Lucida","Lucida Sans,sans-serif"],["System","system-ui,sans-serif"],
 ["Black","Arial Black,system-ui,sans-serif"],["Condensed","Arial Narrow,Arial,sans-serif"],
 ["Serif Bold","Georgia,serif"],["Mono","ui-monospace,monospace"]
];
const anims=["None","Fade","Pop","Bounce","Slide Up","Slide Left","Zoom","Glow Pulse","Typewriter","Karaoke"];

function uid(){return Math.random().toString(36).slice(2)+Date.now()}
function clone(x){return JSON.parse(JSON.stringify(x))}
function snapshot(){return clone({captions:state.captions,style:state.style,font:state.font,animation:state.animation,textColor:state.textColor,accent:state.accent,glow:state.glow,stroke:state.stroke,strokeWidth:state.strokeWidth,shadow:state.shadow,size:state.size,position:state.position,maxLines:state.maxLines,align:state.align,background:state.background,bgColor:state.bgColor,bgOpacity:state.bgOpacity,radius:state.radius,letterSpacing:state.letterSpacing,animationDuration:state.animationDuration})}
function restore(s){Object.assign(state,s); renderAll()}
function commit(){history.push(snapshot()); if(history.length>30)history.shift(); future=[]}
function toast(t){const x=$("#toast");x.textContent=t;x.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>x.classList.remove("show"),1800)}
function fmt(sec){sec=Math.max(0,Number(sec)||0);const m=Math.floor(sec/60),s=Math.floor(sec%60);return `${m}:${String(s).padStart(2,"0")}`}
function srtTime(sec){const ms=Math.round((sec%1)*1000);return `${String(Math.floor(sec/3600)).padStart(2,"0")}:${String(Math.floor(sec%3600/60)).padStart(2,"0")}:${String(Math.floor(sec%60)).padStart(2,"0")},${String(ms).padStart(3,"0")}`}
function renderPresets(){
 $("#stylesTab").innerHTML=`<div class="panel-title">Premium presets</div><div class="grid">${presets.map((p,i)=>`<button class="preset ${state.style===p[0]?"selected":""}" data-preset="${i}"><span class="preset-sample" style="color:${p[1]};text-shadow:0 0 9px ${p[3]};">${p[0]}</span></button>`).join("")}</div>
 <div class="panel-title">Style controls</div><div class="control-grid">
 <div class="control"><label>Text color</label><input id="textColor" type="color" value="${state.textColor}"></div>
 <div class="control"><label>Accent / active word</label><input id="accent" type="color" value="${state.accent}"></div>
 <div class="control"><label>Glow color</label><input id="glow" type="color" value="${state.glow}"></div>
 <div class="control"><label>Glow intensity</label><input id="glowRange" type="range" min="0" max="30" value="12"></div>
 <div class="control"><label>Stroke width</label><input id="strokeWidth" type="range" min="0" max="8" value="${state.strokeWidth}"></div>
 <div class="control"><label>Text size</label><input id="size" type="range" min="16" max="80" value="${state.size}"></div>
 <div class="control"><label>Vertical position</label><input id="position" type="range" min="2" max="82" value="${state.position}"></div>
 <div class="control"><label>Alignment</label><select id="align"><option>left</option><option>center</option><option>right</option></select></div>
 <div class="control"><label>Background</label><select id="background"><option value="false">Off</option><option value="true">On</option></select></div>
 <div class="control"><label>Letter spacing</label><input id="letterSpacing" type="range" min="-2" max="8" step=".1" value="${state.letterSpacing}"></div>
 </div>`;
 $("#align").value=state.align;$("#background").value=String(state.background);
 $$("#stylesTab [id]").forEach(el=>el.addEventListener("input",()=>{commit(); const id=el.id; if(id==="textColor")state.textColor=el.value;if(id==="accent")state.accent=el.value;if(id==="glow")state.glow=el.value;if(id==="strokeWidth")state.strokeWidth=+el.value;if(id==="size")state.size=+el.value;if(id==="position")state.position=+el.value;if(id==="align")state.align=el.value;if(id==="background")state.background=el.value==="true";if(id==="letterSpacing")state.letterSpacing=+el.value;renderPreview()}));
 $$("#stylesTab [data-preset]").forEach(b=>b.onclick=()=>{commit();const p=presets[+b.dataset.preset];state.style=p[0];state.textColor=p[1];state.accent=p[2];state.glow=p[3];if(p[0].includes("Outline"))state.strokeWidth=3;if(p[0].includes("Shadow"))state.shadow=true;if(["Glass","Bubble"].includes(p[0]))state.background=true;else state.background=false;renderAll();});
}
function renderFonts(){
 $("#fontsTab").innerHTML=`<div class="panel-title">Fonts</div><div class="grid">${fonts.map((f,i)=>`<button class="preset ${state.font===f[0]?"selected":""}" data-font="${i}"><span class="preset-sample" style="font-family:${f[1]};">${f[0]}</span></button>`).join("")}</div>`;
 $$("#fontsTab [data-font]").forEach(b=>b.onclick=()=>{commit();state.font=fonts[+b.dataset.font][0];state._fontStack=fonts[+b.dataset.font][1];renderFonts();renderPreview();});
}
function renderAnimation(){
 $("#animationTab").innerHTML=`<div class="panel-title">Caption animation</div><div class="grid">${anims.map(a=>`<button class="preset ${state.animation===a?"selected":""}" data-anim="${a}"><span class="preset-sample">${a}</span></button>`).join("")}</div>
 <div class="control-grid" style="margin-top:10px"><div class="control"><label>Duration</label><input id="animDuration" type="range" min=".1" max="1.2" step=".05" value="${state.animationDuration}"></div><div class="control"><label>Max lines</label><input id="maxLines" type="range" min="1" max="5" value="${state.maxLines}"></div></div>`;
 $$("#animationTab [data-anim]").forEach(b=>b.onclick=()=>{commit();state.animation=b.dataset.anim;renderAnimation();renderPreview()});
 $("#animDuration").oninput=e=>{commit();state.animationDuration=+e.target.value;renderPreview()};
 $("#maxLines").oninput=e=>{commit();state.maxLines=+e.target.value;renderPreview()};
}
function renderCaptions(){
 const box=$("#captionsTab");
 box.innerHTML=`<div class="panel-title">Caption track <span style="float:right;color:#7f8799;font-size:11px">${state.captions.length} segments</span></div>${state.captions.length?state.captions.map((c,i)=>`<div class="caption-card ${i===state.selected?"active":""}" data-i="${i}"><textarea class="ctext">${esc(c.text)}</textarea><div class="time-row"><input class="start" type="number" min="0" step=".01" value="${c.start}"><input class="end" type="number" min="0" step=".01" value="${c.end}"><button class="delete">Delete</button></div></div>`).join(""):`<div style="color:#727b8f;font-size:13px;padding:10px 0">No captions yet. Paste a transcript above or import an SRT.</div>`}`;
 $$("#captionsTab .caption-card").forEach(card=>{
  const i=+card.dataset.i;card.onclick=()=>{state.selected=i;video.currentTime=state.captions[i].start;renderCaptions();renderPreview()};
  card.querySelector(".ctext").oninput=e=>{commit();state.captions[i].text=e.target.value;renderPreview()};
  card.querySelector(".start").oninput=e=>{commit();state.captions[i].start=Math.max(0,+e.target.value);normalize();renderCaptions();renderPreview()};
  card.querySelector(".end").oninput=e=>{commit();state.captions[i].end=Math.max(state.captions[i].start+.05,+e.target.value);normalize();renderCaptions();renderPreview()};
  card.querySelector(".delete").onclick=e=>{e.stopPropagation();commit();state.captions.splice(i,1);state.selected=Math.max(0,i-1);renderCaptions();renderPreview()};
 });
}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function normalize(){state.captions.sort((a,b)=>a.start-b.start)}
function renderAll(){renderPresets();renderFonts();renderAnimation();renderCaptions();renderPreview()}
function activeCaption(t=video.currentTime){return state.captions.findIndex(c=>t>=c.start&&t<c.end)}
function renderPreview(){
 const i=activeCaption();overlay.innerHTML="";
 if(i<0){return}
 const c=state.captions[i]; const words=c.text.trim().split(/\s+/).filter(Boolean);
 const progress=(video.currentTime-c.start)/Math.max(.05,c.end-c.start);
 const activeWord=Math.min(words.length-1,Math.floor(progress*words.length));
 const wrap=document.createElement("div");wrap.className="caption";
 const mapFont=fonts.find(x=>x[0]===state.font);wrap.style.fontFamily=state._fontStack||mapFont?.[1]||"system-ui";
 wrap.style.color=state.textColor;wrap.style.fontSize=state.size+"px";wrap.style.textAlign=state.align;
 wrap.style.letterSpacing=state.letterSpacing+"px";wrap.style.setProperty("--accent",state.accent);wrap.style.setProperty("--glow",state.glow);wrap.style.setProperty("--animdur",state.animationDuration+"s");
 wrap.style.webkitTextStroke=`${state.strokeWidth}px ${state.stroke}`;wrap.style.textShadow=state.shadow?`0 3px 16px #000,0 0 ${Math.max(4,state.strokeWidth*4)}px ${state.glow}`:"none";
 if(state.background){wrap.style.background=`${state.bgColor}${Math.round(state.bgOpacity*255).toString(16).padStart(2,"0")}`;wrap.style.padding="10px 15px";wrap.style.borderRadius=state.radius+"px"}
 if(state.position) overlay.style.bottom=state.position+"%";
 const cls={"Fade":"anim-fade","Pop":"anim-pop","Bounce":"anim-bounce","Slide Up":"anim-slide-up","Slide Left":"anim-slide-left","Zoom":"anim-zoom","Glow Pulse":"anim-glow","Typewriter":"anim-type","Karaoke":"anim-karaoke"}[state.animation];
 if(cls)wrap.classList.add(cls);
 words.forEach((w,j)=>{const s=document.createElement("span");s.className="word"+(j===activeWord?" active":"");s.textContent=w;s.style.marginRight="0.28em";if(state.animation==="Typewriter")s.style.animationDelay=(j*.035)+"s";wrap.appendChild(s)});
 overlay.appendChild(wrap);
}
function addCaption(start=video.currentTime,end=Math.min(video.duration||10,video.currentTime+2),text="New caption"){commit();state.captions.push({id:uid(),start:+start.toFixed(2),end:+end.toFixed(2),text});normalize();state.selected=state.captions.length-1;renderCaptions();renderPreview()}
function generateFromTranscript(){
 const text=$("#transcript").value.trim();if(!text){toast("Paste the transcript first");return}
 if(!video.duration){toast("Upload a video first");return}
 commit();
 const parts=text.replace(/\s+/g," ").split(/(?<=[.!?])\s+|(?=\n)/).map(x=>x.trim()).filter(Boolean);
 const chunks=[];let words=[];
 parts.forEach(p=>{p.split(/\s+/).forEach(w=>{words.push(w);if(words.length>=8){chunks.push(words.join(" "));words=[]}});if(words.length){chunks.push(words.join(" "));words=[]}});
 const dur=video.duration, slice=dur/Math.max(1,chunks.length);
 state.captions=chunks.map((t,i)=>({id:uid(),start:+(i*slice).toFixed(2),end:+((i+1)*slice).toFixed(2),text:t}));
 state.selected=0;renderAll();toast(`${state.captions.length} captions created`);
}
function parseSrt(txt){
 const blocks=txt.replace(/\r/g,"").trim().split(/\n\s*\n/);const out=[];
 for(const b of blocks){const lines=b.split("\n");const tm=lines.find(x=>x.includes("-->"));if(!tm)continue;const [a,z]=tm.split("-->").map(x=>x.trim());const parse=x=>{const m=x.match(/(\d+):(\d+):(\d+),(\d+)/);return m?(+m[1]*3600+ +m[2]*60+ +m[3]+ +m[4]/1000):0};const text=lines.slice(lines.indexOf(tm)+1).join(" ").trim();if(text)out.push({id:uid(),start:parse(a),end:parse(z),text})}return out;
}
function exportSrt(){
 if(!state.captions.length){toast("No captions to export");return}
 const txt=state.captions.map((c,i)=>`${i+1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text}\n`).join("\n");
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([txt],{type:"text/plain"}));a.download="glowing-captions.srt";a.click();URL.revokeObjectURL(a.href);toast("SRT exported");
}
$("#fileInput").onchange=e=>{const f=e.target.files[0];if(!f)return;$("#fileName").textContent=f.name;video.src=URL.createObjectURL(f);video.load();empty.style.display="none";state.captions=[];renderAll()};
video.onloadedmetadata=()=>{$("#duration").textContent=fmt(video.duration);$("#scrubber").max=video.duration;toast("Video ready")};
video.ontimeupdate=()=>{$("#currentTime").textContent=fmt(video.currentTime);$("#scrubber").value=video.currentTime;const i=activeCaption();if(i!==state.selected){state.selected=i>=0?i:state.selected;renderCaptions()}renderPreview()};
$("#playBtn").onclick=()=>{if(video.paused)video.play();else video.pause()};
video.onplay=()=>$("#playBtn").textContent="❚❚";video.onpause=()=>$("#playBtn").textContent="▶";
$("#scrubber").oninput=e=>{video.currentTime=+e.target.value;renderPreview()};$("#volume").oninput=e=>video.volume=+e.target.value;
$("#generateBtn").onclick=generateFromTranscript;$("#addCaptionBtn").onclick=()=>addCaption();$("#clearBtn").onclick=()=>{commit();state.captions=[];renderAll()};
$("#exportSrtBtn").onclick=exportSrt;
$("#importSrtBtn").onclick=()=>$("#srtInput").click();
$("#srtInput").onchange=async e=>{const f=e.target.files[0];if(!f)return;commit();state.captions=parseSrt(await f.text());normalize();state.selected=0;renderAll();toast("SRT imported")};
$("#undoBtn").onclick=()=>{if(!history.length)return;future.push(snapshot());restore(history.pop())};
$("#redoBtn").onclick=()=>{if(!future.length)return;history.push(snapshot());restore(future.pop())};
$$(".tab").forEach(b=>b.onclick=()=>{$$(".tab").forEach(x=>x.classList.remove("active"));$$(".tab-panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#"+b.dataset.tab+"Tab").classList.add("active")});
$$(".ratio button").forEach(b=>b.onclick=()=>{const r=b.dataset.ratio;$$(".ratio button").forEach(x=>x.classList.remove("active"));b.classList.add("active");stage.className="stage "+({"9:16":"ratio-916","1:1":"ratio-11","16:9":"ratio-169"}[r])});
$("#micBtn").onclick=()=>{
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){toast("Live speech is not supported in this browser");return}
 const r=new SR();r.lang="en-IN";r.interimResults=false;r.continuous=false;r.onresult=e=>{$("#transcript").value+=(($("#transcript").value?" ":"")+e.results[0][0].transcript);toast("Speech added to transcript")};r.onerror=()=>toast("Microphone speech failed");r.start();toast("Listening… speak now");
};
renderAll();
