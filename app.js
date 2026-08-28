// ======================================================
// GLOWING AI — AI SHORTS FRONTEND
// YouTube URL + AI Clips + Caption Presets
// ======================================================

const $ = (id) => document.getElementById(id);


// ======================================================
// BACKEND
// ======================================================

const BACKEND_URL =
  "https://glowing-ai-backend.onrender.com";


// ======================================================
// ELEMENTS
// ======================================================

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


// ======================================================
// STATE
// ======================================================

let selectedClip = null;
let captions = [];

let selectedStyle = {
  name: "Neon Glow",
  color: "#d7ff34",
  effect: "pop",
  glow: true
};


// ======================================================
// CAPTION PRESETS
// ======================================================

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


// ======================================================
// RENDER PRESETS
// ======================================================

function renderStyles() {

  if (!stylesGrid) return;

  stylesGrid.innerHTML = "";

  if (presetCount) {
    presetCount.textContent =
      `${styles.length} presets`;
  }

  styles.forEach((style, index) => {

    const card =
      document.createElement("button");

    card.type = "button";

    card.className =
      "style-card";

    card.innerHTML = `
      <div
        class="style-preview"
        style="
          color:${style.color};
          text-shadow:${
            style.glow
              ? `0 0 18px ${style.color}`
              : "none"
          };
        "
      >
        Aa
      </div>

      <b>${style.name}</b>
      <small>${style.effect}</small>
    `;

    card.addEventListener(
      "click",
      () => {

        selectedStyle = style;

        document
          .querySelectorAll(".style-card")
          .forEach(el =>
            el.classList.remove("active")
          );

        card.classList.add("active");

        renderCaption();

      }
    );

    stylesGrid.appendChild(card);

    if (index === 0) {
      card.classList.add("active");
    }

  });

}


// ======================================================
// YOUTUBE ID
// ======================================================

function getYouTubeId(url) {

  try {

    const parsed =
      new URL(url);

    if (
      parsed.hostname.includes(
        "youtu.be"
      )
    ) {

      return parsed.pathname
        .substring(1)
        .split("/")[0];

    }

    if (
      parsed.hostname.includes(
        "youtube.com"
      ) &&
      parsed.searchParams.get("v")
    ) {

      return parsed.searchParams
        .get("v");

    }

    if (
      parsed.hostname.includes(
        "youtube.com"
      ) &&
      parsed.pathname.startsWith(
        "/shorts/"
      )
    ) {

      return parsed.pathname
        .split("/shorts/")[1]
        .split("/")[0];

    }

    return null;

  } catch {

    return null;

  }

}


// ======================================================
// ANALYZE YOUTUBE
// ======================================================

if (analyzeYoutube) {

  analyzeYoutube.addEventListener(
    "click",
    async () => {

      const url =
        youtubeUrl?.value.trim();

      if (!url) {

        setStatus(
          "⚠️ Paste a YouTube URL first"
        );

        youtubeUrl?.focus();

        return;

      }

      const videoId =
        getYouTubeId(url);

      if (!videoId) {

        setStatus(
          "⚠️ Invalid YouTube URL"
        );

        return;

      }

      analyzeYoutube.disabled =
        true;

      youtubeProcessing?.classList
        .add("active");

      if (youtubeProgress) {
        youtubeProgress.style.width =
          "10%";
      }

      if (youtubeProgressText) {
        youtubeProgressText.textContent =
          "Preparing AI analysis...";
      }

      setStatus(
        "● AI analyzing YouTube video..."
      );

      try {

        if (youtubeProgress) {
          youtubeProgress.style.width =
            "30%";
        }

        if (youtubeProgressText) {
          youtubeProgressText.textContent =
            "Sending video to AI...";
        }

        /*
         * Backend endpoint:
         *
         * POST /api/find-clips
         *
         * IMPORTANT:
         * Current backend expects a FILE upload.
         * YouTube URL downloading must be supported
         * by the backend before this can work.
         */

        const response =
          await fetch(
            `${BACKEND_URL}/api/find-clips`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                youtubeUrl: url
              })
            }
          );

        if (youtubeProgress) {
          youtubeProgress.style.width =
            "70%";
        }

        if (youtubeProgressText) {
          youtubeProgressText.textContent =
            "Finding best moments...";
        }

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.ok
        ) {

          throw new Error(
            data.error ||
            "Clip analysis failed"
          );

        }

        if (
          !Array.isArray(
            data.clips
          ) ||
          !data.clips.length
        ) {

          throw new Error(
            "No clips were found."
          );

        }

        if (youtubeProgress) {
          youtubeProgress.style.width =
            "100%";
        }

        if (youtubeProgressText) {
          youtubeProgressText.textContent =
            `${data.clips.length} best clips found.`;
        }

        showClips(
          data.clips
        );

        setStatus(
          `● ${data.clips.length} Shorts ready`
        );

      } catch (error) {

        console.error(
          "YouTube analysis error:",
          error
        );

        if (youtubeProgress) {
          youtubeProgress.style.width =
            "0%";
        }

        if (youtubeProgressText) {
          youtubeProgressText.textContent =
            "Analysis failed";
        }

        setStatus(
          "❌ " +
          (
            error?.message ||
            "Clip generation failed"
          )
        );

      } finally {

        analyzeYoutube.disabled =
          false;

      }

    }
  );

}


// ======================================================
// SHOW CLIPS
// ======================================================

function showClips(clips) {

  if (!clipsGrid) return;

  clipsGrid.innerHTML = "";

  if (clipsCount) {
    clipsCount.textContent =
      `${clips.length} clips`;
  }

  clips
