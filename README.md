# ClipForge AI

A starter YouTube-to-Shorts web app for content you own or are licensed to use.

## Architecture
- GitHub Pages: frontend (`index.html`, `style.css`, `app.js`)
- Render: Node/Express backend (`server.js`)
- FFmpeg: creates 9:16 clips
- yt-dlp: obtains the source video when the URL/content is permitted for your use

## Deploy backend
1. Create a GitHub repository and upload `server.js`, `package.json`, `render.yaml`.
2. In Render, create a Web Service from the repository.
3. Set build command: `npm install && apt-get update && apt-get install -y ffmpeg`
4. Set start command: `npm start`.
5. Copy the Render service URL.
6. In `app.js`, replace `YOUR-RENDER-SERVICE.onrender.com` with that URL.
7. Upload the frontend files to GitHub Pages.

## Important
This starter uses evenly spaced candidate segments. It does NOT yet have a true AI "viral moment" classifier or automatic speech captions. Those can be added with a speech-to-text API and an AI scoring step.
