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
// ANALYZE VIDEO — REAL AI CLIP GENERATION
// ======================================================

if (analyzeYoutube) {

  analyzeYoutube.addEventListener(
    "click",
    async () => {

      const file =
        videoInput?.files?.[0];

      // ----------------------------------------
      // CHECK VIDEO
      // ----------------------------------------

      if (!file) {

        setStatus(
          "⚠️ Pehle video upload karo"
        );

        alert(
          "Pehle video upload karo, phir Analyze AI dabao."
        );

        return;
      }


      // ----------------------------------------
      // START
      // ----------------------------------------

      analyzeYoutube.disabled = true;

      youtubeProcessing?.classList.add(
        "active"
      );

      if (youtubeProgress) {
        youtubeProgress.style.width =
          "5%";
      }

      if (youtubeProgressText) {
        youtubeProgressText.textContent =
          "Uploading video...";
      }

      setStatus(
        "● Video AI backend ko bheja ja raha hai..."
      );


      try {

        // --------------------------------------
        // FORM DATA
        // --------------------------------------

        const formData =
          new FormData();

        formData.append(
          "file",
          file
        );


        if (youtubeProgress) {
          youtubeProgress.style.width =
            "25%";
        }

        if (youtubeProgressText) {
          youtubeProgressText.textContent =
            "AI is transcribing your video...";
        }


        // --------------------------------------
        // SEND TO RENDER BACKEND
        // --------------------------------------

        const response =
          await fetch(
            `${BACKEND_URL}/api/find-clips`,
            {
              method: "POST",
              body: formData
            }
          );


        if (youtubeProgress) {
          youtubeProgress.style.width =
            "60%";
        }

        if (youtubeProgressText) {
          youtubeProgressText.textContent =
            "AI is finding the best moments...";
        }


        // --------------------------------------
        // READ RESPONSE
        // --------------------------------------

        const data =
          await response.json();


        if (
          !response.ok ||
          !data.ok
        ) {

          throw new Error(
            data.error ||
            "Clip generation failed"
          );

        }


        // --------------------------------------
        // CHECK CLIPS
        // --------------------------------------

        if (
          !Array.isArray(data.clips) ||
          !data.clips.length
        ) {

          throw new Error(
            "AI could not find suitable clips."
          );

        }


        // --------------------------------------
        // CONVERT CLIP URL
        // --------------------------------------

        const clips =
          data.clips.map(
            (clip, index) => {

              return {

                ...clip,

                id:
                  clip.id ||
                  index + 1,

                title:
                  `AI Best Moment #${index + 1}`,

                duration:
                  formatTime(
                    Number(
                      clip.duration || 0
                    )
                  ),

                videoUrl:
                  clip.url
                    ? `${BACKEND_URL}${clip.url}`
                    : null

              };

            }
          );


        // --------------------------------------
        // COMPLETE
        // --------------------------------------

        if (youtubeProgress) {
          youtubeProgress.style.width =
            "100%";
        }

        if (youtubeProgressText) {
          youtubeProgressText.textContent =
            `${clips.length} best clips found!`;
        }


        showClips(clips);


        setStatus(
          `● ${clips.length} AI Shorts ready`
        );


      } catch (error) {

        console.error(
          "AI CLIP ERROR:",
          error
        );


        if (youtubeProgress) {
          youtubeProgress.style.width =
            "0%";
        }

        if (youtubeProgressText) {
          youtubeProgressText.textContent =
            "Clip generation failed";
        }


        setStatus(
          "❌ " +
          (
            error?.message ||
            "Clip generation failed"
          )
        );


        alert(
          "AI Clip Generation Failed:\n\n" +
          (
            error?.message ||
            "Unknown error"
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
