// GLOWING AI — AI SHORTS FRONTEND
// Step 2: YouTube URL + 5 Best Clips UI + Caption Presets

const $ = (id) => document.getElementById(id);

// -------------------------
// ELEMENTS
// -------------------------

const youtubeUrl = $("youtubeUrl");
const analyzeYoutube = $("analyzeYoutube");
const youtubeProcessing = $("youtubeProcessing");
const youtubeProgress = $("youtubeProgress");
const youtubeProgressText = $("youtubeProgressText");

const clipsGrid = $("clipsGrid");
const clipsCount = $("clipsCount");

const videoInput = $("videoInput");
const chooseVideo = $("chooseVideo");
const uploadTop = $("uploadTop");
const dropZone = $("dropZone");

const video = $("video");
const videoStage = $("videoStage");
const emptyState = $("emptyState");
const status = $("status");

const generateCaptions = $("generateCaptions");
const captionOverlay = $("captionOverlay");

const stylesGrid = $("stylesGrid");
const presetCount = $("presetCount");

const wordsPerCaption = $("wordsPerCaption");
const wordCount = $("wordCount");

const fontSize = $("fontSize");
const fontSizeValue = $("fontSizeValue");

const captionPosition = $("captionPosition");
const aspectRatio = $("aspectRatio");

const playBtn = $("playBtn");
const seek = $("seek");
const currentTime = $("currentTime");
const duration = $("duration");


// -------------------------
// STATE
// -------------------------

let selectedClip = null;
let captions = [];

let selectedStyle = {
  name: "Neon Glow",
  color: "#d7ff34",
  effect: "pop",
  glow: true
};


// -------------------------
// CAPTION PRESETS
// -------------------------

const styles = [

  {
    name: "Neon Glow",
    color: "#d7ff34",
    effect: "pop",
    glow: true
  },

  {
    name: "Clean Pop",
    color: "#ffffff",
    effect: "pop",
    glow: false
  },

  {
    name: "Orange Bounce",
    color: "#ff7a00",
    effect: "bounce",
    glow: true
  },

  {
    name: "Purple Slide",
    color: "#b76cff",
    effect: "slide",
    glow: true
  },

  {
    name: "Ice Blue",
    color: "#6ee7ff",
    effect: "fade",
    glow: true
  },

  {
    name: "Karaoke",
    color: "#ffe600",
    effect: "karaoke",
    glow: true
  },

  {
    name: "Bold Viral",
    color: "#ffffff",
    effect: "viral",
    glow: false
  },

  {
    name: "Glitch",
    color: "#00ffff",
    effect: "glitch",
    glow: true
  }

];


// -------------------------
// RENDER PRESETS
// -------------------------

function renderStyles() {

  if (!stylesGrid) return;

  stylesGrid.innerHTML = "";

  if (presetCount) {
    presetCount.textContent = `${styles.length} presets`;
  }

  styles.forEach((style, index) => {

    const card = document.createElement("button");

    card.type = "button";
    card.className = "style-card";

    card.innerHTML = `
      <div
        class="style-preview"
        style="
          color:${style.color};
          text-shadow:${style.glow ? `0 0 18px ${style.color}` : "none"};
        "
      >
        Aa
      </div>

      <b>${style.name}</b>
      <small>${style.effect}</small>
    `;

    card.addEventListener("click", () => {

      selectedStyle = style;

      document
        .querySelectorAll(".style-card")
        .forEach(el => el.classList.remove("active"));

      card.classList.add("active");

      renderCaption();

    });

    stylesGrid.appendChild(card);

    if (index === 0) {
      card.classList.add("active");
    }

  });

}


// -------------------------
// YOUTUBE ID
// -------------------------

function getYouTubeId(url) {

  try {

    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.substring(1);
    }

    if (
      parsed.hostname.includes("youtube.com") &&
      parsed.searchParams.get("v")
    ) {
      return parsed.searchParams.get("v");
    }

    if (
      parsed.hostname.includes("youtube.com") &&
      parsed.pathname.startsWith("/shorts/")
    ) {
      return parsed.pathname.split("/shorts/")[1].split("/")[0];
    }

    return null;

  } catch {

    return null;

  }

}


// -------------------------
// ANALYZE YOUTUBE
// -------------------------

if (analyzeYoutube) {

  analyzeYoutube.addEventListener("click", async () => {

    const url = youtubeUrl.value.trim();

    if (!url) {

      setStatus("⚠️ Paste a YouTube URL first");

      youtubeUrl.focus();

      return;
    }

    const videoId = getYouTubeId(url);

    if (!videoId) {

      setStatus("⚠️ Invalid YouTube URL");

      return;
    }

    startYouTubeProcessing();

    /*
      IMPORTANT:

      This frontend currently creates the 5 result cards.

      The actual authorized video download/processing,
      AI highlight detection and MP4 generation will be
      connected to the backend in the next step.
    */

    const clips = await simulateAnalysis();

    showClips(clips);

    finishYouTubeProcessing();

  });

}


// -------------------------
// PROCESSING UI
// -------------------------

function startYouTubeProcessing() {

  youtubeProcessing?.classList.add("active");

  analyzeYoutube.disabled = true;

  youtubeProgress.style.width = "5%";

  youtubeProgressText.textContent =
    "Analyzing video...";

  setStatus("● AI analyzing video");

}


function finishYouTubeProcessing() {

  youtubeProgress.style.width = "100%";

  youtubeProgressText.textContent =
    "5 best clips found.";

  analyzeYoutube.disabled = false;

  setStatus("● 5 Shorts ready");

}


// -------------------------
// SHOW CLIPS
// -------------------------

function showClips(clips) {

  clipsGrid.innerHTML = "";

  clipsCount.textContent =
    `${clips.length} clips`;

  clips.forEach((clip, index) => {

    const card = document.createElement("div");

    card.className = "clip-card";

    card.innerHTML = `

      <div class="clip-thumb">

        <span>▶</span>

      </div>

      <b>
        ${clip.title}
      </b>

      <small>
        ${clip.duration}
      </small>

      <div class="score">
        🔥 ${clip.score}% viral score
      </div>

    `;

    card.addEventListener("click", () => {

      document
        .querySelectorAll(".clip-card")
        .forEach(el =>
          el.classList.remove("selected")
        );

      card.classList.add("selected");

      selectedClip = clip;

      setStatus(
        `● Clip ${index + 1} selected`
      );

      /*
        Backend-generated clip URL will be
        connected here later.
      */

    });

    clipsGrid.appendChild(card);

  });

}


// -------------------------
// VIDEO UPLOAD
// -------------------------

function openVideoPicker() {

  videoInput?.click();

}

chooseVideo?.addEventListener(
  "click",
  openVideoPicker
);

uploadTop?.addEventListener(
  "click",
  openVideoPicker
);


videoInput?.addEventListener(
  "change",
  () => {

    const file = videoInput.files?.[0];

    if (!file) return;

    loadVideoFile(file);

  }
);


// -------------------------
// LOAD LOCAL VIDEO
// -------------------------

function loadVideoFile(file) {

  const url = URL.createObjectURL(file);

  video.src = url;

  video.load();

  emptyState.style.display = "none";

  setStatus(
    `● ${file.name}`
  );

}


// -------------------------
// DRAG & DROP
// -------------------------

dropZone?.addEventListener(
  "dragover",
  event => {

    event.preventDefault();

    dropZone.classList.add("dragging");

  }
);


dropZone?.addEventListener(
  "dragleave",
  () => {

    dropZone.classList.remove(
      "dragging"
    );

  }
);


dropZone?.addEventListener(
  "drop",
  event => {

    event.preventDefault();

    dropZone.classList.remove(
      "dragging"
    );

    const file =
      event.dataTransfer.files?.[0];

    if (
      file &&
      file.type.startsWith("video/")
    ) {

      loadVideoFile(file);

    }

  }
);


// -------------------------
// STATUS
// -------------------------

function setStatus(text) {

  if (status) {
    status.textContent = text;
  }

}


// -------------------------
// VIDEO CONTROLS
// -------------------------

playBtn?.addEventListener(
  "click",
  () => {

    if (video.paused) {

      video.play();

      playBtn.textContent = "❚❚";

    } else {

      video.pause();

      playBtn.textContent = "▶";

    }

  }
);


video?.addEventListener(
  "loadedmetadata",
  () => {

    duration.textContent =
      formatTime(video.duration);

  }
);


video?.addEventListener(
  "timeupdate",
  () => {

    if (!video.duration) return;

    const value =
      (video.currentTime / video.duration) * 1000;

    seek.value = value;

    currentTime.textContent =
      formatTime(video.currentTime);

  }
);


seek?.addEventListener(
  "input",
  () => {

    if (!video.duration) return;

    video.currentTime =
      (Number(seek.value) / 1000) *
      video.duration;

  }
);


function formatTime(seconds) {

  if (!Number.isFinite(seconds)) {
    return "00:00.0";
  }

  const minutes =
    Math.floor(seconds / 60);

  const secs =
    Math.floor(seconds % 60);

  const ms =
    Math.floor((seconds % 1) * 10);

  return `${String(minutes).padStart(2,"0")}:${String(secs).padStart(2,"0")}.${ms}`;

}


// -------------------------
// CAPTION SETTINGS
// -------------------------

wordsPerCaption?.addEventListener(
  "input",
  () => {

    wordCount.textContent =
      wordsPerCaption.value;

  }
);


fontSize?.addEventListener(
  "input",
  () => {

    fontSizeValue.textContent =
      fontSize.value;

    renderCaption();

  }
);


captionPosition?.addEventListener(
  "change",
  renderCaption
);


aspectRatio?.addEventListener(
  "change",
  () => {

    if (!videoStage) return;

    videoStage.dataset.ratio =
      aspectRatio.value;

  }
);


// -------------------------
// CAPTION GENERATION
// -------------------------

generateCaptions?.addEventListener(
  "click",
  async () => {

    if (!video.src) {

      setStatus(
        "⚠️ Upload/select a video first"
      );

      return;

    }

    generateCaptions.disabled = true;

    setStatus(
      "● Generating captions..."
    );

    await new Promise(
      resolve => setTimeout(resolve, 1200)
    );

    captions = [

      {
        start: 0,
        end: 3,
        text: "This is your AI generated caption"
      },

      {
        start: 3,
        end: 6,
        text: "With viral style animation"
      }

    ];

    renderCaption();

    setStatus(
      "● Captions ready"
    );

    generateCaptions.disabled = false;

  }
);


// -------------------------
// RENDER CAPTION
// -------------------------

function renderCaption() {

  if (!captionOverlay) return;

  if (!captions.length) {

    captionOverlay.textContent =
      "Your captions will appear here";

    return;

  }

  const current =
    video.currentTime || 0;

  const active =
    captions.find(
      caption =>
        current >= caption.start &&
        current <= caption.end
    );

  if (!active) {

    captionOverlay.textContent = "";

    return;

  }

  captionOverlay.textContent =
    active.text;

  captionOverlay.style.fontSize =
    `${fontSize.value}px`;

  captionOverlay.style.color =
    selectedStyle.color;

  captionOverlay.dataset.effect =
    selectedStyle.effect;

  captionOverlay.dataset.position =
    captionPosition.value;

}


// -------------------------
// CAPTION UPDATE
// -------------------------

video?.addEventListener(
  "timeupdate",
  renderCaption
);


// -------------------------
// INITIALIZE
// -------------------------

renderStyles();

console.log(
  "GLOWING AI Shorts Studio loaded."
);
