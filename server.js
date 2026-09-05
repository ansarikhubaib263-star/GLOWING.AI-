import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import ffmpegPath from "ffmpeg-static";
import ytdlp from "yt-dlp-exec";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 10000;

const OUT = path.join(__dirname, "output");

fs.mkdirSync(OUT, { recursive: true });

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/output", express.static(OUT));


// ======================================================
// FFMPEG
// ======================================================

if (!ffmpegPath) {
  console.error("❌ FFmpeg binary was not found.");
} else {
  console.log("✅ FFmpeg:", ffmpegPath);
}


// ======================================================
// RUN FFMPEG
// ======================================================

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {

    if (!ffmpegPath) {
      reject(new Error("FFmpeg binary is not available."));
      return;
    }

    console.log("🎬 FFmpeg command started");

    execFile(
      ffmpegPath,
      args,
      {
        maxBuffer: 50 * 1024 * 1024
      },
      (err, stdout, stderr) => {

        if (err) {
          console.error("❌ FFmpeg error:");
          console.error(stderr);

          reject(
            new Error(
              stderr ||
              err.message ||
              "FFmpeg processing failed."
            )
          );

          return;
        }

        resolve(stdout);
      }
    );
  });
}


// ======================================================
// HEALTH
// ======================================================

app.get("/api/health", (req, res) => {

  res.json({
    ok: true,
    service: "GLOWING AI",
    ffmpeg: Boolean(ffmpegPath),
    node: process.version
  });

});


// ======================================================
// ROOT
// ======================================================

app.get("/", (req, res) => {

  res.json({
    ok: true,
    message: "GLOWING AI backend is live"
  });

});


// ======================================================
// YOUTUBE CLIPS
// ======================================================

app.post("/api/clips", async (req, res) => {

  let dir = null;
  let source = null;

  try {

    const {
      url,
      count = 5,
      maxSeconds = 45
    } = req.body || {};


    // --------------------------------------------------
    // VALIDATE URL
    // --------------------------------------------------

    if (
      !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(
        url || ""
      )
    ) {

      return res.status(400).json({
        error: "Enter a valid YouTube URL."
      });

    }


    // --------------------------------------------------
    // SETTINGS
    // --------------------------------------------------

    const n = Math.min(
      Math.max(Number(count) || 5, 1),
      10
    );

    const max = Math.min(
      Math.max(Number(maxSeconds) || 45, 15),
      60
    );


    // --------------------------------------------------
    // CREATE JOB DIRECTORY
    // --------------------------------------------------

    const id = crypto
      .randomBytes(8)
      .toString("hex");

    dir = path.join(OUT, id);

    fs.mkdirSync(dir, {
      recursive: true
    });

    source = path.join(
      dir,
      "source.mp4"
    );


    console.log("");
    console.log("======================================");
    console.log("🚀 CLIP JOB STARTED");
    console.log("======================================");

    console.log("YouTube URL:", url);
    console.log("Clips:", n);
    console.log("Max seconds:", max);
    console.log("Job ID:", id);


    // ==================================================
    // STEP 1 — GET VIDEO INFORMATION
    // ==================================================

    console.log("");
    console.log("🔎 Reading YouTube information...");

    let infoRaw;

    try {

      infoRaw = await ytdlp(url, {

        dumpSingleJson: true,

        noPlaylist: true,

        skipDownload: true,

        // Enable Node JavaScript runtime
        jsRuntimes: "node",

        // Allow yt-dlp to obtain EJS components
        remoteComponents: "ejs:github"

      });

    catch (infoError) {

  console.error("❌ YOUTUBE ACTUAL ERROR:");
  console.error(infoError);

  throw new Error(
    infoError?.stderr ||
    infoError?.message ||
    String(infoError)
  );

    }

      throw new Error(
        "YouTube extraction failed. " +
        "YouTube may be requiring bot verification " +
        "or the video is not accessible."
      );

    }


    // --------------------------------------------------
    // DURATION
    // --------------------------------------------------

    const duration = Number(
      infoRaw?.duration || 0
    );

    const title =
      infoRaw?.title ||
      "YouTube video";


    console.log("🎥 Title:", title);
    console.log("⏱ Duration:", duration);


    if (!duration) {

      throw new Error(
        "Could not read video duration."
      );

    }


    // ==================================================
    // STEP 2 — DOWNLOAD VIDEO
    // ==================================================

    console.log("");
    console.log("⬇️ Downloading video...");

    try {

      await ytdlp(url, {

        output: source,

        format:
          "bv*[height<=720]+ba/b[height<=720]",

        mergeOutputFormat: "mp4",

        noPlaylist: true,

        // Enable Node JS runtime
        jsRuntimes: "node",

        // Enable yt-dlp EJS components
        remoteComponents: "ejs:github",

        // Use the bundled ffmpeg binary
        ffmpegLocation: path.dirname(ffmpegPath)

      });

    } catch (downloadError) {

      console.error(
        "❌ YouTube download failed:"
      );

      console.error(
        downloadError?.stderr ||
        downloadError?.message ||
        downloadError
      );

      throw new Error(
        "YouTube download failed. " +
        "The server reached YouTube, but YouTube " +
        "did not allow the video to be downloaded."
      );

    }


    // ==================================================
    // CHECK DOWNLOADED FILE
    // ==================================================

    if (
      !fs.existsSync(source)
    ) {

      throw new Error(
        "Video download finished but source file was not created."
      );

    }


    const sourceSize =
      fs.statSync(source).size;


    console.log(
      "✅ Video downloaded:",
      Math.round(sourceSize / 1024 / 1024),
      "MB"
    );


    if (sourceSize < 10000) {

      throw new Error(
        "Downloaded video file is invalid or empty."
      );

    }


    // ==================================================
    // STEP 3 — CREATE CLIPS
    // ==================================================

    console.log("");
    console.log("✂️ Creating clips...");


    const clips = [];

    const usable =
      Math.max(
        1,
        duration - max
      );


    for (
      let i = 0;
      i < n;
      i++
    ) {

      const start =
        Math.floor(
          (usable / (n + 1)) *
          (i + 1)
        );


      const len =
        Math.min(
          max,
          duration - start
        );


      const filename =
        `clip-${i + 1}.mp4`;


      const outfile =
        path.join(
          dir,
          filename
        );


      console.log(
        `🎞 Creating clip ${i + 1}/${n}`,
        `start=${start}s`,
        `duration=${len}s`
      );


      await runFfmpeg([

        "-y",

        "-ss",
        String(start),

        "-i",
        source,

        "-t",
        String(len),

        "-vf",
        "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",

        "-c:v",
        "libx264",

        "-preset",
        "veryfast",

        "-crf",
        "24",

        "-c:a",
        "aac",

        "-b:a",
        "128k",

        "-movflags",
        "+faststart",

        outfile

      ]);


      if (
        !fs.existsSync(outfile)
      ) {

        throw new Error(
          `Clip ${i + 1} was not created.`
        );

      }


      const clipSize =
        fs.statSync(outfile).size;


      console.log(
        `✅ Clip ${i + 1} ready:`,
        Math.round(
          clipSize / 1024 / 1024
        ),
        "MB"
      );


      clips.push({

        url:
          `/output/${id}/${filename}`,

        start:
          fmt(start),

        end:
          fmt(start + len),

        reason:
          "Selected candidate segment"

      });

    }


    // ==================================================
    // CLEAN SOURCE
    // ==================================================

    try {

      fs.rmSync(
        source,
        {
          force: true
        }
      );

    } catch (cleanupError) {

      console.warn(
        "Source cleanup warning:",
        cleanupError.message
      );

    }


    // ==================================================
    // SUCCESS
    // ==================================================

    console.log("");
    console.log("======================================");
    console.log("✅ CLIP JOB COMPLETED");
    console.log("======================================");
    console.log("Job ID:", id);
    console.log("Clips:", clips.length);


    return res.json({

      ok: true,

      title,

      clips

    });


  } catch (e) {

    console.error("");
    console.error("======================================");
    console.error("❌ CLIP JOB FAILED");
    console.error("======================================");

    console.error(
      e?.stderr ||
      e?.message ||
      e
    );


    // --------------------------------------------------
    // CLEANUP
    // --------------------------------------------------

    try {

      if (source) {

        fs.rmSync(
          source,
          {
            force: true
          }
        );

      }

    } catch {}


    // --------------------------------------------------
    // SEND ACTUAL ERROR
    // --------------------------------------------------

    const message =
      e?.message ||
      "Unknown processing error.";


    return res.status(500).json({

      ok: false,

      error: message

    });

  }

});


// ======================================================
// FORMAT TIME
// ======================================================

function fmt(seconds) {

  const m =
    Math.floor(seconds / 60);

  const sec =
    Math.floor(seconds % 60);

  return `${m}:${String(sec).padStart(2, "0")}`;

}


// ======================================================
// START SERVER
// ======================================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log("");
    console.log("======================================");
    console.log("🚀 GLOWING AI BACKEND");
    console.log("======================================");

    console.log(
      `Server running on port ${PORT}`
    );

    console.log(
      "Node:",
      process.version
    );

    console.log(
      "FFmpeg:",
      ffmpegPath || "NOT FOUND"
    );

  }
);
