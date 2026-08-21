# GLOWING.AI — RESET BUILD

This is a clean reset of the caption-editor UI shown in the reference screenshot.

## Files
- `index.html` — app structure
- `styles.css` — responsive dark/neon UI + caption animation CSS
- `app.js` — video player, caption timeline, styles, fonts, animations, SRT import/export, undo/redo

## Important transcription note
A normal static GitHub Pages site cannot truthfully transcribe an uploaded video's audio without a speech-to-text engine. This build therefore does **not** fake automatic transcription.

Use:
1. Upload video.
2. Paste transcript into the transcript box.
3. Tap **Generate from transcript**.
4. Or import an existing `.srt`.
5. Apply Styles / Fonts / Animation.
6. Export SRT.

There is also a browser microphone option (`Live speech`) where supported.

## GitHub Pages
Upload/replace these files in the repository root and deploy the `main` branch `/ (root)` through GitHub Pages.
