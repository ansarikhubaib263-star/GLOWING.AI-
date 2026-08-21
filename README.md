# GlowCaption AI v2

A static GitHub Pages auto-caption app using Whisper in the browser.

## Files
- `index.html`
- `style.css`
- `app.js`

## Deploy
Upload all three files to the repository root and keep GitHub Pages set to:
- Source: Deploy from a branch
- Branch: `main`
- Folder: `/ (root)`

## Notes
The Whisper model is downloaded by the browser on first use. Large/long videos can be slow or memory-heavy on phones. This version intentionally does not pretend that browser transcription is perfect: it shows errors instead of silently producing a successful-looking result.
