import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.0';

const $ = id => document.getElementById(id);
const file=$('file'), video=$('video'), drop=$('dropZone'), status=$('status');
const text=$('text'), caption=$('captionText'), bar=$('bar'), modelInfo=$('modelInfo');
let mediaFile=null, transcription=[], transcriber=null, wordsTimer=null;

function fmt(s){s=Math.max(0,Math.floor(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function apply(){
 caption.textContent=text.value||'CAPTION';
 caption.style.color=$('textColor').value;
 caption.parentElement.style.fontSize=$('fontSize').value+'px';
 caption.style.textShadow=`0 0 8px ${$('glowColor').value},0 0 ${$('glowStrength').value}px ${$('glowColor').value},0 0 ${+$('glowStrength').value+16}px ${$('glowColor').value}`;
 const p=$('position').value, box=caption.parentElement;
 box.style.top=p==='top'?'8%':p==='center'?'50%':'auto';
 box.style.bottom=p==='bottom'?'8%':'auto';
 box.style.transform=p==='center'?'translateY(-50%)':'';
}
['text','textColor','glowColor','fontSize','glowStrength','position'].forEach(id=>$(id).addEventListener('input',apply));
$('fontSize').addEventListener('input',()=>$('fsVal').textContent=$('fontSize').value+'px');
$('glowStrength').addEventListener('input',()=>$('gsVal').textContent=$('glowStrength').value);
$('apply').onclick=apply;

file.onchange=e=>{
 mediaFile=e.target.files[0]; if(!mediaFile)return;
 video.src=URL.createObjectURL(mediaFile); video.style.display='block'; drop.style.display='none';
 status.textContent='● Video loaded'; status.style.color='#83f7c5';
};

$('play').onclick=()=>video.paused?video.play():video.pause();
video.ontimeupdate=()=>{
 const d=video.duration||0;$('seek').value=d?video.currentTime/d*100:0;
 $('time').textContent=fmt(video.currentTime)+' / '+fmt(d);
 if(transcription.length && $('animate').checked){
   const item=transcription.find(x=>video.currentTime>=x.start&&video.currentTime<x.end);
   if(item && caption.textContent!==item.text){caption.textContent=item.text;caption.classList.remove('pop');void caption.offsetWidth;caption.classList.add('pop')}
 }
};
$('seek').oninput=e=>{if(video.duration)video.currentTime=video.duration*e.target.value/100};

$('generate').onclick=async()=>{
 if(!mediaFile){alert('Pehle video upload karo.');return}
 try{
   status.textContent='● Loading AI model...';status.style.color='#ffd166';bar.style.width='5%';
   modelInfo.textContent='Loading Whisper model in your browser cache...';
   // Browser-side Whisper. Small model is chosen to keep first download practical.
   transcriber ??= await pipeline('automatic-speech-recognition','onnx-community/whisper-tiny.en',{
     dtype:'q8',
     progress_callback:x=>{
       if(x.status==='progress'&&x.progress){bar.style.width=Math.min(70,Math.round(x.progress*0.7))+'%';modelInfo.textContent='Downloading model: '+Math.round(x.progress)+'%'}
     }
   });
   bar.style.width='75%';status.textContent='● Transcribing locally...';modelInfo.textContent='Extracting speech from your selected media...';
   const result=await transcriber(URL.createObjectURL(mediaFile),{return_timestamps:true,chunk_length_s:30,stride_length_s:5});
   const chunks=result.chunks||[];
   transcription=chunks.map(c=>({text:c.text.trim(),start:c.timestamp?.[0]||0,end:c.timestamp?.[1]||((c.timestamp?.[0]||0)+2)})).filter(x=>x.text);
   if(!transcription.length && result.text) transcription=[{text:result.text,start:0,end:video.duration||10}];
   text.value=transcription.map(x=>x.text).join(' ');
   apply();bar.style.width='100%';status.textContent='● Captions ready';status.style.color='#83f7c5';
   modelInfo.textContent=`Generated ${transcription.length} timed caption segments locally.`;
 }catch(err){
   console.error(err);bar.style.width='0%';status.textContent='● Transcription failed';status.style.color='#ff6b6b';
   modelInfo.textContent='Browser-side AI could not process this file. Try a short MP4/audio clip, Chrome/Edge, or a computer.';
 }
};

$('downloadSrt').onclick=()=>{
 let data='';
 const items=transcription.length?transcription:[{text:text.value,start:0,end:Math.max(3,video.duration||5)}];
 const ts=s=>{const h=Math.floor(s/3600),m=Math.floor(s%3600/60),sec=Math.floor(s%60),ms=Math.floor((s%1)*1000);return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')},${String(ms).padStart(3,'0')}`};
 items.forEach((x,i)=>data+=`${i+1}\n${ts(x.start)} --> ${ts(x.end)}\n${x.text}\n\n`);
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'text/plain'}));a.download='glowing-captions.srt';a.click();
};
apply();
