/**
 * Dynamic song link page for Sonariq.
 *
 * Serves /s/:id with Open Graph tags so shared links show a rich preview
 * (song artwork, title, artist) in messaging apps. Also attempts to open
 * the Sonariq app directly via intent when visited in a browser.
 */
export default async function handler(req, res) {
  const id = (req.query.id || '').toString().trim();
  
  // Fetch song metadata from YouTube oEmbed (no API key needed)
  let title = 'Open in Sonariq';
  let artist = 'Sonariq';
  if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
    try {
      const oembed = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`,
        { headers: { 'User-Agent': 'Sonariq/1.0' } }
      );
      if (oembed.ok) {
        const data = await oembed.json();
        title = data.title || title;
        artist = data.author_name || artist;
      }
    } catch (e) {
      // Fall back to generic tags if oEmbed fails
    }
  }
  
  const artwork = id ? `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg` : null;
  const pageUrl = `https://sonariq.giize.com/s/${encodeURIComponent(id)}`;
  const intentUrl = `intent://s/${encodeURIComponent(id)}#Intent;scheme=sonariq;package=com.sonariq.app;end`;
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} — Sonariq</title>
<meta name="description" content="Open this song in the Sonariq app.">
<meta name="theme-color" content="#0d0a12">
<meta property="og:type" content="music.song">
<meta property="og:site_name" content="Sonariq">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(artist)} · Open in Sonariq">
<meta property="og:url" content="${escapeHtml(pageUrl)}">
${artwork ? `<meta property="og:image" content="${escapeHtml(artwork)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(artist)} · Open in Sonariq">
${artwork ? `<meta name="twitter:image" content="${escapeHtml(artwork)}">` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='4' y='10' width='3.2' height='12' rx='1.6' fill='%23a3e635'/%3E%3Crect x='9.2' y='5' width='3.2' height='22' rx='1.6' fill='%234ade80'/%3E%3Crect x='14.4' y='1' width='3.2' height='30' rx='1.6' fill='%23ffffff'/%3E%3Crect x='19.6' y='8' width='3.2' height='16' rx='1.6' fill='%2334d399'/%3E%3Crect x='24.8' y='4' width='3.2' height='24' rx='1.6' fill='%234ade80'/%3E%3C/svg%3E">
</head>
<body>
<div class="center-page">
  <div class="blob blob-1"></div><div class="blob blob-2"></div><div class="blob blob-3"></div>
  <div class="center-card">
    <a class="brand" href="/" aria-label="Sonariq home">
      <svg class="wave" viewBox="0 0 32 32" fill="#fff" aria-hidden="true">
        <rect x="4" y="10" width="3.2" height="12" rx="1.6"/><rect x="9.2" y="5" width="3.2" height="22" rx="1.6"/><rect x="14.4" y="1" width="3.2" height="30" rx="1.6"/><rect x="19.6" y="8" width="3.2" height="16" rx="1.6"/><rect x="24.8" y="4" width="3.2" height="24" rx="1.6"/>
      </svg>
      Sonariq
    </a>
    <div id="opening">
      <div class="loader-eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <h1>Opening Sonariq…</h1>
      <p>Taking you straight to the song.</p>
    </div>
    <div id="fallback" class="fallback">
      <h1>Get Sonariq to play this song</h1>
      <p>Someone shared a song with you. Open it in the Sonariq app — or download Sonariq free to start listening.</p>
      <button id="retry" class="btn btn-ghost">Try opening the app again</button>
      <a class="btn btn-primary" href="https://github.com/sonariq-source/Sonariq/releases/latest" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 21h16"/></svg>
        Download Sonariq free
      </a>
      <p class="tiny">Free forever · No account needed · Open source</p>
    </div>
  </div>
</div>
<script>
(function () {
  "use strict";
  var id = ${JSON.stringify(id)};
  var opening = document.getElementById("opening");
  var fallback = document.getElementById("fallback");

  function openApp() {
    if (!id) return false;
    window.location.href = ${JSON.stringify(intentUrl)};
    return true;
  }

  if (openApp()) {
    setTimeout(function () {
      opening.style.display = "none";
      fallback.classList.add("show");
    }, 2600);
    document.getElementById("retry").addEventListener("click", openApp);
  } else {
    opening.style.display = "none";
    fallback.classList.add("show");
    document.getElementById("retry").style.display = "none";
  }
})();
</script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(html);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
