const $ = id => document.getElementById(id);

const videoInput = $("videoInput");
const video = $("video");
const stage = $("videoStage");
const status = $("status");
const generateBtn = $("generateCaptions");
const overlay = $("captionOverlay");
const track = $("captionsTrack");
const stylesGrid = $("stylesGrid");
const seek = $("seek");
const currentTime = $("currentTime");
const durationEl = $("duration");
const playBtn = $("playBtn");
const wordsRange = $("wordsPerCaption");
const wordCount = $("wordCount");

let captions = [];
let currentCue = -1;

let selectedStyle = {
  name: "Neon Glow",
  color: "#d7ff34",
  effect: "glow",
  glow: true
};

const BACKEND_URL = "https://glowing-ai-backend.onrender.com";

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

function setStatus(text, type = "") {
  status.textContent = "● " + text;
  status.className = "status " + type;
}

function fmt(t) {
  if (!isFinite(t)) return "00:00.0";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}.${Math.floor((t % 1) * 10)}`;
}

function renderStyles() {
  stylesGrid.innerHTML = "";

  styles.forEach((s, i) => {
    const b = document.createElement("button");
    b.className = "style-card" + (i === 0 ? " active" : "");
    b.textContent = "the quick BROWN fox";
    b.style.color = s.color;
    b.style.textShadow = s.glow ? `0 0 12px ${s.color}` : "none";

    b.onclick = () => {
      selectedStyle = s;
      document.querySelectorAll(".style-card").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      refreshCaption(true);
    };

    stylesGrid.appendChild(b);
  });
}

videoInput.addEventListener("change", () => {
  const f = videoInput.files[0];
  if (!f) return;

  video.src = URL.createObjectURL(f);
  stage.classList.remove("empty");
  captions = [];
  currentCue = -1;
  track.innerHTML = "";
  overlay.textContent = "";
  setStatus("Media loaded: " + f.name, "ready");
});

video.addEventListener("loadedmetadata", () => {
  durationEl.textContent = fmt(video.duration);
});

video.addEventListener("timeupdate", () => {
  currentTime.textContent = fmt(video.currentTime);
  seek.value = video.duration
    ? Math.round(video.currentTime / video.duration * 1000)
    : 0;
  refreshCaption(false);
});

seek.addEventListener("input", () => {
  if (video.duration) video.currentTime = (seek.value / 1000) * video.duration;
});

playBtn.onclick = () => video.paused ? video.play() : video.pause();
video.addEventListener("play", () => playBtn.textContent = "❚❚");
video.addEventListener("pause", () => playBtn.textContent = "▶");

wordsRange.addEventListener("input", () => wordCount.textContent = wordsRange.value);

function renderTrack() {
  track.innerHTML = "";

  captions.forEach((c, i) => {
    const el = document.createElement("div");
    el.className = "cue";
    el.dataset.i = i;
    el.innerHTML = `<b>${escapeHtml(c.text)}</b><span>${fmt(c.start)} - ${fmt(c.end)}</span>`;
    el.onclick = () => {
      video.currentTime = c.start;
      video.play();
    };
    track.appendChild(el);
  });
}

function refreshCaption(force) {
  const idx = captions.findIndex(c => video.currentTime >= c.start && video.currentTime < c.end);

  if (idx === currentCue && !force) return;

  currentCue = idx;
  const c = captions[idx];

  overlay.className = "caption-overlay";

  if (!c) {
    overlay.textContent = "";
    return;
  }

  overlay.textContent = c.text;
  overlay.style.color = selectedStyle.color;

  void overlay.offsetWidth;
  overlay.classList.add(selectedStyle.effect);

  if (selectedStyle.glow) overlay.classList.add("glow");

  document.querySelectorAll(".cue").forEach(x =>
    x.classList.toggle("active", Number(x.dataset.i) === idx)
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* Backend/OpenAI caption generation */
generateBtn.onclick = async () => {
  const file = videoInput.files[0];

  if (!file) {
    setStatus("Pehle media upload karo.");
    return;
  }

  try {
    generateBtn.disabled = true;

    setStatus("Backend se connection check ho raha hai...", "loading");

    const healthResponse = await fetch(
      `${BACKEND_URL}/api/health`,
      { method: "GET", cache: "no-store" }
    );

    if (!healthResponse.ok) {
      throw new Error(`Backend health check failed (${healthResponse.status})`);
    }

    const health = await healthResponse.json();

    if (!health.ok) {
      throw new Error("Backend health check failed.");
    }

    const formData = new FormData();
    formData.append("file", file, file.name);

    const languageElement = $("language");
    const lang = languageElement ? languageElement.value : "auto";

    formData.append("language", lang === "auto" ? "auto" : lang);

    setStatus("AI transcription chal rahi hai...", "loading");

    const response = await fetch(
      `${BACKEND_URL}/api/captions`,
      {
        method: "POST",
        body: formData
      }
    );

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error(`Backend ne valid response nahi diya (${response.status}).`);
    }

    if (!response.ok || !data.ok) {
      throw new Error(data.error || `Backend error ${response.status}`);
    }

    captions = Array.isArray(data.captions) ? data.captions : [];

    if (!captions.length) {
      throw new Error("Audio me speech/captions detect nahi hui.");
    }

    renderTrack();
    refreshCaption(true);

    setStatus(`${captions.length} captions generated!`, "ready");
  } catch (e) {
    console.error("CAPTION FAILED:", e);

    let message = e?.message || "Unknown error";

    if (message === "Failed to fetch") {
      message = "Backend se connection nahi ho pa raha. Render deployment check karo.";
    }

    setStatus("Caption failed: " + message);
  } finally {
    generateBtn.disabled = false;
  }
};

function download(name, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$("downloadSrt").onclick = () => {
  const s = captions.map((c, i) =>
    `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text}\n`
  ).join("\n");

  download("captions.srt", s, "text/plain");
};

$("downloadJson").onclick = () =>
  download(
    "caption-style.json",
    JSON.stringify({ style: selectedStyle, captions }, null, 2),
    "application/json"
  );

function srtTime(t) {
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  const ms = Math.floor((t % 1) * 1000);

  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")},${String(ms).padStart(3,"0")}`;
}

renderStyles();
setStatus("Waiting for media");
