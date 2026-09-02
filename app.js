const API = window.CLIPFORGE_API || "https://glowing-ai.onrender.com";
const urlEl = document.getElementById("url");
const countEl = document.getElementById("count");
const lengthEl = document.getElementById("length");
const button = document.getElementById("generate");
const status = document.getElementById("status");
const results = document.getElementById("results");

button.onclick = async () => {
  const url = urlEl.value.trim();
  if (!url) return setStatus("Paste a YouTube URL first.");
  button.disabled = true; results.innerHTML = "";
  setStatus("Analyzing video and finding the best moments…");
  try {
    const r = await fetch(`${API}/api/clips`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({url, count:Number(countEl.value), maxSeconds:Number(lengthEl.value)})
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Generation failed");
    setStatus(`Done — ${data.clips.length} clips generated.`);
    results.innerHTML = data.clips.map((c,i)=>`
      <article class="clip">
        <video controls playsinline src="${API}${c.url}"></video>
        <h3>Clip ${i+1}</h3>
        <p>${escapeHtml(c.start)} → ${escapeHtml(c.end)} • ${escapeHtml(c.reason)}</p>
        <a class="download" href="${API}${c.url}" download>Download</a>
      </article>`).join("");
  } catch(e) { setStatus(e.message); }
  finally { button.disabled = false; }
};
function setStatus(x){status.textContent=x}
function escapeHtml(x){return String(x).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
