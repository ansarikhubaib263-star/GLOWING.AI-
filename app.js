(() => {
  "use strict";

  /* ---------- style catalogue ---------- */
  const STYLES = [
    { id: "glow-green",   name: "Glow Green",    preview: "BROWN" },
    { id: "shadow-white", name: "Shadow",        preview: "BROWN" },
    { id: "two-tone",     name: "Highlight",     preview: "the quick" },
    { id: "clean-minimal",name: "Clean",         preview: "brown" },
    { id: "bubble",       name: "Bubble",        preview: "the fox" },
    { id: "bold-outline", name: "Bold Outline",  preview: "FOX" },
    { id: "block-bg",     name: "Block",         preview: "the fox" },
    { id: "deep-glow",    name: "Deep Glow",     preview: "BROWN" },
  ];

  /* ---------- state ---------- */
  const state = {
    mediaEl: null,        // active <video> or <audio>
    mediaType: null,      // 'video' | 'audio'
    duration: 0,
    cues: [],             // [{start,end,words:[{text,start,end}]}]
    styleId: "glow-green",
    scrubbing: false,
  };

  /* ---------- element refs ---------- */
  const el = (id) => document.getElementById(id);
  const mediaInput   = el("mediaInput");
  const dropzone      = el("dropzone");
  const dropLabel     = el("dropLabel");
  const dropSub       = el("dropSub");
  const transcript     = el("transcript");
  const wordCountEl    = el("wordCount");
  const estCuesEl      = el("estCues");
  const wordsPerCue    = el("wordsPerCue");
  const wordsPerCueVal = el("wordsPerCueVal");
  const startOffset    = el("startOffset");
  const generateBtn    = el("generateBtn");
  const styleGrid       = el("styleGrid");
  const exportSrtBtn    = el("exportSrt");
  const exportJsonBtn   = el("exportJson");

  const videoEl   = el("videoEl");
  const audioEl   = el("audioEl");
  const phoneScreen = el("phoneScreen");
  const noMediaMsg = el("noMediaMsg");
  const captionBox = el("captionBox");

  const playBtn    = el("playBtn");
  const playIcon   = el("playIcon");
  const timeCurrent = el("timeCurrent");
  const timeTotal   = el("timeTotal");
  const scrubber      = el("scrubber");
  const scrubberFill  = el("scrubberFill");
  const scrubberHandle= el("scrubberHandle");
  const cueBlocksEl   = el("cueBlocks");

  const statusPill = el("statusPill");
  const statusText = el("statusText");

  /* ---------- style grid render ---------- */
  function renderStyleGrid(){
    styleGrid.innerHTML = "";
    STYLES.forEach(s => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "style-card" + (s.id === state.styleId ? " active" : "");
      card.dataset.style = s.id;
      card.innerHTML = `
        <span class="style-preview-text" data-style="${s.id}">
          <span class="cap-word active">${s.preview}</span>
        </span>
        <span class="style-name">${s.name}</span>
      `;
      card.addEventListener("click", () => {
        state.styleId = s.id;
        [...styleGrid.children].forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        captionBox.dataset.style = s.id;
      });
      styleGrid.appendChild(card);
    });
  }
  renderStyleGrid();
  captionBox.dataset.style = state.styleId;

  /* ---------- media loading ---------- */
  function humanFileType(file){
    return file.type.startsWith("video") ? "video" : "audio";
  }

  function loadMedia(file){
    const url = URL.createObjectURL(file);
    state.mediaType = humanFileType(file);

    if (state.mediaType === "video"){
      videoEl.src = url;
      videoEl.hidden = false;
      audioEl.removeAttribute("src");
      state.mediaEl = videoEl;
      noMediaMsg.style.display = "none";
    } else {
      audioEl.src = url;
      videoEl.hidden = true;
      state.mediaEl = audioEl;
      noMediaMsg.style.display = "flex";
      noMediaMsg.querySelector("span").textContent = file.name;
    }

    state.mediaEl.addEventListener("loadedmetadata", onMediaReady, { once: true });
    dropLabel.textContent = file.name;
    dropSub.textContent = `${state.mediaType.toUpperCase()} loaded — reading duration…`;
  }

  function onMediaReady(){
    state.duration = state.mediaEl.duration || 0;
    timeTotal.textContent = formatClock(state.duration);
    dropSub.textContent = `Duration ${formatClock(state.duration)}`;
    playBtn.disabled = false;
    setStatus(true, "Media ready");
    bindTransport();
    updateGenerateAvailability();
  }

  dropzone.addEventListener("click", () => mediaInput.click());
  mediaInput.addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (f) loadMedia(f);
  });
  ["dragover","dragenter"].forEach(ev => dropzone.addEventListener(ev, (e) => {
    e.preventDefault(); dropzone.classList.add("drag-over");
  }));
  ["dragleave","drop"].forEach(ev => dropzone.addEventListener(ev, (e) => {
    e.preventDefault(); dropzone.classList.remove("drag-over");
  }));
  dropzone.addEventListener("drop", (e) => {
    const f = e.dataTransfer.files[0];
    if (f) loadMedia(f);
  });

  function setStatus(ready, text){
    statusText.textContent = text;
    statusPill.classList.toggle("ready", ready);
  }

  /* ---------- transcript meta ---------- */
  function getWords(){
    return transcript.value.trim().split(/\s+/).filter(Boolean);
  }
  function refreshTranscriptMeta(){
    const words = getWords();
    wordCountEl.textContent = `${words.length} words`;
    const per = parseInt(wordsPerCue.value, 10);
    const cues = words.length ? Math.ceil(words.length / per) : 0;
    estCuesEl.textContent = `${cues} caption blocks`;
    updateGenerateAvailability();
  }
  transcript.addEventListener("input", refreshTranscriptMeta);
  wordsPerCue.addEventListener("input", () => {
    wordsPerCueVal.textContent = wordsPerCue.value;
    refreshTranscriptMeta();
  });

  function updateGenerateAvailability(){
    generateBtn.disabled = !(state.duration > 0 && getWords().length > 0);
  }

  /* ---------- cue generation ---------- */
  function buildCues(){
    const words = getWords();
    const per = parseInt(wordsPerCue.value, 10);
    const offset = parseFloat(startOffset.value) || 0;
    const usable = Math.max(state.duration - offset, 0.5);
    const groups = [];
    for (let i = 0; i < words.length; i += per){
      groups.push(words.slice(i, i + per));
    }
    const cueDur = usable / groups.length;

    state.cues = groups.map((g, idx) => {
      const cueStart = offset + idx * cueDur;
      const cueEnd = cueStart + cueDur;
      const wordDur = cueDur / g.length;
      const words = g.map((w, wi) => ({
        text: w,
        start: cueStart + wi * wordDur,
        end: cueStart + (wi + 1) * wordDur,
      }));
      return { start: cueStart, end: cueEnd, words };
    });

    renderCueBlocks();
    exportSrtBtn.disabled = false;
    exportJsonBtn.disabled = false;
    setStatus(true, `${state.cues.length} captions generated`);
  }

  generateBtn.addEventListener("click", buildCues);

  function renderCueBlocks(){
    cueBlocksEl.innerHTML = "";
    if (!state.duration) return;
    state.cues.forEach(c => {
      const block = document.createElement("div");
      block.className = "cue-block";
      const widthPct = ((c.end - c.start) / state.duration) * 100;
      block.style.width = `${widthPct}%`;
      cueBlocksEl.appendChild(block);
    });
  }

  /* ---------- playback + caption sync ---------- */
  function bindTransport(){
    state.mediaEl.addEventListener("timeupdate", onTick);
    state.mediaEl.addEventListener("ended", () => setPlayIcon(false));
  }

  function onTick(){
    if (!state.scrubbing){
      const t = state.mediaEl.currentTime;
      timeCurrent.textContent = formatClock(t);
      const pct = state.duration ? (t / state.duration) * 100 : 0;
      scrubberFill.style.width = `${pct}%`;
      scrubberHandle.style.left = `${pct}%`;
    }
    renderActiveCaption();
  }

  function renderActiveCaption(){
    if (!state.cues.length){ captionBox.innerHTML = ""; return; }
    const t = state.mediaEl.currentTime;
    const cue = state.cues.find(c => t >= c.start && t < c.end);
    if (!cue){ captionBox.innerHTML = ""; return; }

    const html = cue.words.map(w => {
      const active = t >= w.start && t < w.end;
      return `<span class="cap-word${active ? " active" : ""}">${escapeHtml(w.text)}</span>`;
    }).join("");
    captionBox.innerHTML = `<span class="cap-line">${html}</span>`;
  }

  playBtn.addEventListener("click", () => {
    if (!state.mediaEl) return;
    if (state.mediaEl.paused){
      state.mediaEl.play();
      setPlayIcon(true);
    } else {
      state.mediaEl.pause();
      setPlayIcon(false);
    }
  });

  function setPlayIcon(isPlaying){
    playIcon.innerHTML = isPlaying
      ? `<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>`
      : `<path d="M8 5v14l11-7z"/>`;
  }

  /* ---------- scrubbing ---------- */
  function seekFromEvent(e){
    const rect = scrubber.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pct = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const t = pct * state.duration;
    if (state.mediaEl) state.mediaEl.currentTime = t;
    scrubberFill.style.width = `${pct * 100}%`;
    scrubberHandle.style.left = `${pct * 100}%`;
    timeCurrent.textContent = formatClock(t);
    renderActiveCaption();
  }
  scrubber.addEventListener("mousedown", (e) => { state.scrubbing = true; seekFromEvent(e); });
  window.addEventListener("mousemove", (e) => { if (state.scrubbing) seekFromEvent(e); });
  window.addEventListener("mouseup", () => { state.scrubbing = false; });
  scrubber.addEventListener("touchstart", (e) => { state.scrubbing = true; seekFromEvent(e); });
  scrubber.addEventListener("touchmove", (e) => { if (state.scrubbing) seekFromEvent(e); });
  window.addEventListener("touchend", () => { state.scrubbing = false; });

  /* ---------- export ---------- */
  function formatSrtTime(t){
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = Math.floor(t % 60);
    const ms = Math.round((t - Math.floor(t)) * 1000);
    const pad = (n, l = 2) => String(n).padStart(l, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
  }

  function buildSrt(){
    return state.cues.map((c, i) => {
      const text = c.words.map(w => w.text).join(" ");
      return `${i + 1}\n${formatSrtTime(c.start)} --> ${formatSrtTime(c.end)}\n${text}\n`;
    }).join("\n");
  }

  function download(filename, content, mime){
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  exportSrtBtn.addEventListener("click", () => {
    download("captions.srt", buildSrt(), "text/plain");
  });
  exportJsonBtn.addEventListener("click", () => {
    const payload = {
      style: state.styleId,
      duration: state.duration,
      cues: state.cues,
    };
    download("captions-style.json", JSON.stringify(payload, null, 2), "application/json");
  });

  /* ---------- helpers ---------- */
  function formatClock(t){
    if (!isFinite(t)) return "00:00.0";
    const m = Math.floor(t / 60);
    const s = (t % 60).toFixed(1).padStart(4, "0");
    return `${String(m).padStart(2, "0")}:${s}`;
  }
  function escapeHtml(str){
    return str.replace(/[&<>"']/g, (c) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  refreshTranscriptMeta();
})();
