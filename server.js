import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import ffmpeg from "fluent-ffmpeg";
import ytdlp from "yt-dlp-exec";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 10000;
const OUT = path.join(__dirname, "output");
fs.mkdirSync(OUT,{recursive:true});

app.use(cors());
app.use(express.json({limit:"1mb"}));
app.use("/output", express.static(OUT));

function runFfmpeg(args){
  return new Promise((resolve,reject)=>{
    execFile("ffmpeg",args,{maxBuffer:1024*1024*10},(err,stdout,stderr)=>{
      if(err) reject(new Error(stderr || err.message)); else resolve(stdout);
    });
  });
}

app.get("/api/health",(req,res)=>res.json({ok:true}));

app.post("/api/clips", async (req,res)=>{
  try{
    const {url,count=5,maxSeconds=45}=req.body||{};
    if(!/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(url||""))
      return res.status(400).json({error:"Enter a valid YouTube URL."});

    const n=Math.min(Math.max(Number(count)||5,1),10);
    const max=Math.min(Math.max(Number(maxSeconds)||45,15),60);
    const id=crypto.randomBytes(8).toString("hex");
    const dir=path.join(OUT,id); fs.mkdirSync(dir,{recursive:true});
    const source=path.join(dir,"source.mp4");

    // Use only videos you own, have permission to use, or that are otherwise licensed for this use.
    await ytdlp(url,{output:source,format:"bv*[height<=720]+ba/b[height<=720]",mergeOutputFormat:"mp4",noPlaylist:true});

    const infoRaw=await ytdlp(url,{dumpSingleJson:true,noPlaylist:true,skipDownload:true});
    const duration=Number(infoRaw.duration||0);
    if(!duration) throw new Error("Could not read video duration.");

    // Baseline: evenly spaced candidate windows. This is intentionally simple and reliable.
    // Replace this selector with an AI scoring service later for true "viral moment" ranking.
    const clips=[];
    const usable=Math.max(1,duration-max);
    for(let i=0;i<n;i++){
      const start=Math.floor((usable/(n+1))*(i+1));
      const len=Math.min(max,duration-start);
      const outfile=path.join(dir,`clip-${i+1}.mp4`);
      await runFfmpeg([
        "-y","-ss",String(start),"-i",source,"-t",String(len),
        "-vf","scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
        "-c:v","libx264","-preset","veryfast","-crf","24","-c:a","aac","-b:a","128k",outfile
      ]);
      clips.push({url:`/output/${id}/clip-${i+1}.mp4`,start:fmt(start),end:fmt(start+len),reason:"Selected candidate segment"});
    }
    fs.rmSync(source,{force:true});
    res.json({clips});
  }catch(e){
    console.error(e);
    res.status(500).json({error:"Processing failed. On a free server, long videos may exceed available CPU/time."});
  }
});

function fmt(s){const m=Math.floor(s/60),sec=Math.floor(s%60);return `${m}:${String(sec).padStart(2,"0")}`}

app.listen(PORT,()=>console.log(`ClipForge running on ${PORT}`));
