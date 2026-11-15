// Roblox APIs have no CORS, so we go through public mirrors. roproxy.com is often
// rate-limited (429), so rotunnel.com is tried first and roproxy is the backup.
const PROXIES = ["rotunnel.com", "roproxy.com"];
const $ = (id) => document.getElementById(id);

const fmt = (n) => {
  if (n == null || isNaN(n)) return "—";
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
};

const VERIFIED_SVG = `<svg class="verified" viewBox="0 0 320 320" aria-label="Roblox Verified"><title>Roblox Verified</title>
  <path fill="#0066FF" d="M66 0L320 66L254 320L0 254Z"/>
  <path fill="none" stroke="#fff" stroke-width="36" stroke-linecap="round" stroke-linejoin="round" d="M98 162L134 198L222 110"/></svg>`;

const ICONS = {
  roblox: '<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M5.2 1 1 18.8 18.8 23 23 5.2zm8.5 14.4-4.6-1.1 1.1-4.6 4.6 1.1z"/></svg>',
  github: '<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5z"/></svg>',
  discord: '<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.3 18.3 0 0 0-5.5 0L8.6 3a19.7 19.7 0 0 0-4.9 1.5C.5 9.1-.3 13.6.1 18.1a19.9 19.9 0 0 0 6 3l1.3-2a13 13 0 0 1-2-1l.5-.4a14.2 14.2 0 0 0 12.2 0l.5.4c-.6.4-1.3.7-2 1l1.3 2a19.8 19.8 0 0 0 6-3c.5-5.2-.8-9.7-3.6-13.7zM8 15.3c-1.2 0-2.2-1.1-2.2-2.4S6.8 10.5 8 10.5s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4z"/></svg>',
  twitter: '<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M18.2 2h3.4l-7.4 8.5L23 22h-6.8l-5.3-7-6.1 7H1.4l7.9-9L1 2h7l4.8 6.4zm-1.2 18h1.9L7.1 3.9H5.1z"/></svg>',
};
const PLAY_SVG = '<svg width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M6 4l15 8-15 8z"/></svg>';

// ---------- profile ----------
function renderProfile() {
  document.title = CONFIG.name;
  $("name").textContent = CONFIG.name;
  if ($("navName")) $("navName").textContent = CONFIG.name;


  const nr = $("navRoblox");
  if (CONFIG.links.roblox) { nr.href = CONFIG.links.roblox; nr.innerHTML = ICONS.roblox; } else nr.remove();
  const nd = $("navDiscord");
  if (CONFIG.links.discord) { nd.href = CONFIG.links.discord; nd.innerHTML = ICONS.discord + "Discord"; } else nd.remove();
  $("badge").innerHTML = CONFIG.verified ? VERIFIED_SVG : "";
  if ($("role")) $("role").textContent = CONFIG.role;
  
  $("year").textContent = new Date().getFullYear();

  const photo = $("photo");
  photo.src = CONFIG.photo;
  photo.onerror = () => {
    const initials = CONFIG.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    photo.src = "data:image/svg+xml," + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#151826"/><text x="50" y="62" font-family="Inter,sans-serif" font-size="34" font-weight="700" fill="#6ea8ff" text-anchor="middle">${initials}</text></svg>`);
  };

  const html = Object.entries(CONFIG.links).filter(([, url]) => url)
    .map(([k, url]) => `<a class="btn ${k === "discord" ? "btn-discord" : "btn-glass"}" href="${url}" target="_blank" rel="noopener">${ICONS[k] || ""}${k[0].toUpperCase() + k.slice(1)}</a>`).join("");
  $("socials").innerHTML = html;
  if ($("socials2")) $("socials2").innerHTML = Object.entries(CONFIG.links).filter(([, url]) => url)
    .map(([k, url]) => `<a href="${url}" target="_blank" rel="noopener">${ICONS[k] || ""}${k[0].toUpperCase() + k.slice(1)}</a>`).join("");
}

// ---------- experiences ----------
function skeletonCard() {
  return `<article class="card glass show"><div class="card-icon skeleton"></div>
    <div class="card-head"><h3 class="skeleton" style="height:22px;border-radius:6px"></h3></div>
    <div class="stats">${'<div class="stat skeleton" style="height:52px"></div>'.repeat(3)}</div></article>`;
}

function cardHTML(g, pending) {
  const v = (n) => (pending ? "—" : fmt(n));
  return `<article class="card glass">
    <img class="card-icon" src="${g.icon || ""}" alt="${g.name}" loading="lazy" onerror="this.removeAttribute('src')">
    <div class="card-head"><span class="mono">${g.role || ""}</span><h3>${g.name}</h3></div>
    <div class="stats">
      <div class="stat"><b>${v(g.visits)}</b><small>Visits</small></div>
      <div class="stat"><b><i class="dot"></i>${v(g.playing)}</b><small>CCU</small></div>
      <div class="stat"><b>${v(g.favorites)}</b><small>Favorites</small></div>
    </div>
    <a class="btn play" href="https://www.roblox.com/games/${g.placeId}" target="_blank" rel="noopener">${PLAY_SVG} Play</a>
  </article>`;
}

// Always bypass browser/HTTP caches: unique query param + no-store.
async function getJSON(url) {
  const fresh = url + (url.includes("?") ? "&" : "?") + "_=" + Date.now() + Math.random().toString(36).slice(2, 7);
  const r = await fetch(fresh, { cache: "no-store", signal: AbortSignal.timeout(5000) });
  if (!r.ok) throw new Error(r.status);
  return r.json();
}
// try each proxy in order until one answers
async function api(sub, path) {
  let err;
  for (const p of PROXIES) {
    try { return await getJSON(`https://${sub}.${p}${path}`); } catch (e) { err = e; }
  }
  throw err;
}
// placeId -> universeId never changes, so remember it (one less request per refresh)
async function universeOf(placeId) {
  const k = "u" + placeId;
  try { const c = localStorage.getItem(k); if (c) return +c; } catch {}
  const { universeId } = await api("apis", `/universes/v1/places/${placeId}/universe`);
  try { localStorage.setItem(k, universeId); } catch {}
  return universeId;
}

// data.json is refreshed every ~15 min by a GitHub Action (same origin, always loads).
let snapshot = {};
async function loadSnapshot() {
  try { snapshot = (await (await fetch("data.json?t=" + Date.now(), { cache: "no-store" })).json()).games || {}; } catch {}
}
const fromSnapshot = (exp) => {
  const s = snapshot[exp.placeId];
  return s ? { ...exp, ...exp.fallback, ...s, name: exp.fallback?.name || s.name } : { ...exp, ...exp.fallback };
};

async function loadGame(exp) {
  const base = fromSnapshot(exp);
  try {
    const universeId = await universeOf(exp.placeId);
    const [info, favs, icon] = await Promise.all([
      api("games", `/v1/games?universeIds=${universeId}`),
      api("games", `/v1/games/${universeId}/favorites/count`).catch(() => ({})),
      api("thumbnails", `/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png`).catch(() => ({ data: [] })),
    ]);
    const d = info.data?.[0];
    if (!d) throw new Error("empty response");
    // never let a partial/rate-limited live response wipe out cached numbers
    const g = {
      ...base,
      name: base.name || d.sourceName || d.name,
      visits: d.visits ?? base.visits,
      playing: d.playing ?? base.playing,
      favorites: favs.favoritesCount ?? d.favoritedCount ?? base.favorites,
      icon: icon.data?.[0]?.imageUrl || base.icon,
    };
    try { localStorage.setItem("g" + exp.placeId, JSON.stringify(g)); } catch {}
    return g;
  } catch (e) {
    console.warn("Live data unavailable for", exp.placeId, e);
    if (snapshot[exp.placeId]) return base;
    try { const c = JSON.parse(localStorage.getItem("g" + exp.placeId)); if (c) return { ...c, ...exp }; } catch {}
    return base;
  }
}

function animateCount(el, value, withDot) {
  const dur = 1200, start = performance.now();
  const step = (t) => {
    const p = Math.min((t - start) / dur, 1);
    const v = Math.floor(value * (1 - Math.pow(1 - p, 3)));
    el.innerHTML = (withDot ? '<i class="dot"></i>' : "") + fmt(v);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const byPlaying = (a, b) => (b.playing || 0) - (a.playing || 0);

// hero: highlight the experience with the most live players
function renderFeatured(games) {
  const el = $("featured"), g = games[0];
  if (!el || !g) return;
  el.innerHTML = `<img class="feat-img" src="${g.icon || ""}" alt="${g.name}" onerror="this.removeAttribute('src')">
    <div class="feat-body">
      <span class="feat-tag"><i class="dot"></i>${fmt(g.playing)} playing now</span>
      <h3>${g.name}</h3>
      <div class="feat-meta"><span><b>${fmt(g.visits)}</b> visits</span><span><b>${fmt(g.favorites)}</b> favorites</span></div>
      <a class="btn btn-primary" href="https://www.roblox.com/games/${g.placeId}" target="_blank" rel="noopener">${PLAY_SVG} Play on Roblox</a>
    </div>`;
}

function updateLive(games) {
  renderFeatured(games);
  $("cards").innerHTML = games.map((g) => cardHTML(g)).join("");
  $("cards").querySelectorAll(".card").forEach((c) => c.classList.add("show"));
  const sum = (k) => games.reduce((a, g) => a + (g[k] || 0), 0);
  $("tVisits").textContent = fmt(sum("visits"));
  $("tFavs").textContent = fmt(sum("favorites"));
  $("tPlaying").innerHTML = '<i class="dot"></i>' + fmt(sum("playing"));
  $("navLive").textContent = fmt(sum("playing"));
}

async function refreshLive() {
  const games = (await Promise.all(CONFIG.experiences.map(loadGame))).sort(byPlaying);
  updateLive(games);
}

async function renderExperiences() {
  const cards = $("cards");
  cards.innerHTML = CONFIG.experiences.map(skeletonCard).join("");
  await loadSnapshot();
  // show cards (name/icon) with "—" numbers until the live refresh finishes
  if (Object.keys(snapshot).length > 0) {
    cards.innerHTML = CONFIG.experiences.map(fromSnapshot).map((g) => cardHTML(g, true)).join("");
  }
  const games = (await Promise.all(CONFIG.experiences.map(loadGame))).sort(byPlaying);
  cards.innerHTML = games.map((g) => cardHTML(g)).join("");
  renderFeatured(games);

  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("show"); io.unobserve(e.target); }
  }), { threshold: 0.1 });
  cards.querySelectorAll(".card").forEach((c, i) => { c.style.transitionDelay = `${i * 80}ms`; io.observe(c); });

  const sum = (k) => games.reduce((a, g) => a + (g[k] || 0), 0);
  animateCount($("tVisits"), sum("visits"));
  animateCount($("tPlaying"), sum("playing"), true);
  $("navLive").textContent = fmt(sum("playing"));
  animateCount($("tFavs"), sum("favorites"));
  $("tGames").textContent = games.length;
}

renderProfile();
renderExperiences();

// nav: background on scroll + active section highlight
const nav = $("nav");
const onScroll = () => nav.classList.toggle("scrolled", scrollY > 20);
addEventListener("scroll", onScroll, { passive: true }); onScroll();
const links = document.querySelectorAll("#navLinks a");
const secObs = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (e.isIntersecting) links.forEach((l) => l.classList.toggle("active", l.dataset.sec === e.target.id));
}), { rootMargin: "-45% 0px -50% 0px" });
["experiences", "stats"].forEach((id) => secObs.observe($(id)));
// refresh live players every 60s
setInterval(async () => { await loadSnapshot(); refreshLive(); }, 60000);

// discourage saving the profile photo (right-click / drag / long-press)
document.querySelectorAll(".avatar-wrap").forEach((el) => {
  el.addEventListener("contextmenu", (e) => e.preventDefault());
  el.addEventListener("dragstart", (e) => e.preventDefault());
});
