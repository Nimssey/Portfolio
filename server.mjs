import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const GAMES_PATH = path.join(ROOT, "data", "games.json");
const PEAKS_PATH = path.join(ROOT, "data", "peaks.json");

const MIME = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".png": "image/png",
	".jpg": "image/jpeg",
	".svg": "image/svg+xml",
	".ico": "image/x-icon",
	".webp": "image/webp",
};

function cleanName(name) {
	return String(name || "").replace(/^\[[^\]]+\]\s*/, "").trim();
}

async function readJson(filePath, fallback) {
	try {
		return JSON.parse(await readFile(filePath, "utf8"));
	} catch {
		return fallback;
	}
}

async function fetchJson(url) {
	const response = await fetch(url, { cache: "no-store" });
	if (!response.ok) {
		throw new Error(`${url} → ${response.status}`);
	}
	return response.json();
}

function mapThumbnails(payload) {
	const map = {};
	for (const item of payload.data || []) {
		if (item.thumbnails?.[0]?.imageUrl) {
			map[item.universeId] = item.thumbnails[0].imageUrl;
		} else if (item.imageUrl) {
			map[item.targetId] = item.imageUrl;
		}
	}
	return map;
}

async function loadLiveGames() {
	const catalog = await readJson(GAMES_PATH, { games: [] });
	const peaks = await readJson(PEAKS_PATH, {});
	const entries = catalog.games || [];
	const universeIds = entries.map((game) => game.universeId).join(",");

	const [gamesPayload, thumbsPayload, iconsPayload] = await Promise.all([
		fetchJson(`https://games.roblox.com/v1/games?universeIds=${universeIds}`),
		fetchJson(`https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeIds}&countPerUniverse=1&size=768x432&format=Png&isCircular=false`),
		fetchJson(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeIds}&size=150x150&format=Png&isCircular=false`),
	]);

	const thumbs = mapThumbnails(thumbsPayload);
	const icons = mapThumbnails(iconsPayload);
	const byId = new Map((gamesPayload.data || []).map((game) => [game.id, game]));
	let peaksChanged = false;

	const games = entries.map((entry) => {
		const live = byId.get(entry.universeId) || {};
		const playing = Number(live.playing) || 0;
		const id = String(entry.universeId);
		const peak = Math.max(Number(peaks[id]) || 0, playing, Number(entry.peak) || 0);
		if (peak !== Number(peaks[id] || 0)) {
			peaks[id] = peak;
			peaksChanged = true;
		}

		return {
			placeId: entry.placeId,
			universeId: entry.universeId,
			name: cleanName(live.name) || entry.fallbackName,
			url: entry.url,
			playing,
			visits: Number(live.visits) || 0,
			peak,
			thumbnail: thumbs[entry.universeId] || "",
			icon: icons[entry.universeId] || "",
			released: live.created || entry.released || "",
		};
	});

	if (peaksChanged) {
		await writeFile(PEAKS_PATH, `${JSON.stringify(peaks, null, "\t")}\n`);
	}

	return { updatedAt: Date.now(), games };
}

function contentType(filePath) {
	return MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function safePath(urlPath) {
	const decoded = decodeURIComponent(urlPath.split("?")[0]);
	const relative = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
	const resolved = path.normalize(path.join(ROOT, relative));
	if (!resolved.startsWith(ROOT)) {
		return null;
	}
	return resolved;
}

const server = createServer(async (request, response) => {
	try {
		const url = new URL(request.url || "/", `http://${request.headers.host}`);

		if (url.pathname === "/api/games") {
			const payload = await loadLiveGames();
			response.writeHead(200, {
				"Content-Type": "application/json; charset=utf-8",
				"Cache-Control": "no-store",
			});
			response.end(JSON.stringify(payload));
			return;
		}

		if (url.pathname === "/games" || url.pathname === "/games/") {
			url.pathname = "/games.html";
		}

		let filePath = safePath(url.pathname);
		if (!filePath) {
			response.writeHead(400);
			response.end("Bad request");
			return;
		}

		if (!existsSync(filePath) || !statSync(filePath).isFile()) {
			response.writeHead(404);
			response.end("Not found");
			return;
		}

		const body = await readFile(filePath);
		response.writeHead(200, { "Content-Type": contentType(filePath) });
		response.end(body);
	} catch (error) {
		response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
		response.end(error instanceof Error ? error.message : "Server error");
	}
});

server.listen(PORT, () => {
	console.log(`Nimssey site → http://localhost:${PORT}`);
});
