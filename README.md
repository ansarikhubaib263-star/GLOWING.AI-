# Kaption Forge

Script → timed, styled video captions. Runs fully in your browser, no server, no upload leaves your device.

## What it does

You paste a transcript and load the audio/video it belongs to. The tool spreads your words evenly across the media's duration, lets you preview them in a phone-style frame with a caption style of your choice, and exports timed captions as `.srt`.

**Important limitation:** this tool does not listen to your audio and figure out the words itself — no browser can reliably do that for an uploaded file. You provide the transcript; the tool handles timing and styling. If you need real speech-to-text, run the audio through a transcription tool/app first, then paste the result here.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure — upload control, transcript box, style picker, phone preview, transport bar |
| `style.css` | Visual design + the 8 caption style presets |
| `app.js` | All logic: media loading, word timing, playback sync, scrubbing, export |
| `README.md` | This file |

## How to use it

1. Open `index.html` in a browser (double-click it, or serve the folder with any static server).
2. **Load media** — tap the drop zone and pick the audio/video file your captions are for.
3. **Paste script** — paste the exact transcript, in order.
4. **Timing** — set how many words appear per caption (default 3), and an optional start delay if the speech doesn't begin at 0:00. Tap **Generate captions**.
5. **Style** — pick a look from the grid. Every style re-times instantly, no need to regenerate.
6. Press play to preview captions synced over your media.
7. **Export** — download `.srt` to use in any video editor, or the style `.json` if you want to reuse the word-level timing/style data elsewhere.

## Styles included

Glow Green, Shadow, Highlight (two-tone), Clean, Bubble, Bold Outline, Block, Deep Glow — covering the bold-neon, karaoke-highlight, and clean-minimal looks common in short-form video captioning.

## Notes for editing

- Timing is currently a straight even split across the media duration. If your speech has long pauses, nudge **Start delay** or manually stretch cues by editing the exported JSON's `start`/`end` values.
- To add a new style: add a card entry to `STYLES` in `app.js`, then add a matching `[data-style="your-id"]` rule block in `style.css`.
- Fonts (`Bebas Neue`, `Space Grotesk`, `Inter`, `JetBrains Mono`) load from Google Fonts — an internet connection is needed the first time the page loads.
- 
