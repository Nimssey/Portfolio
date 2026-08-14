(function () {
	const config = window.Nimssey;
	const catalog = config.games;
	const totalsEl = document.querySelector("[data-totals]");
	const listEl = document.querySelector("[data-games]");

	function setStatus(text) {
		const statusEl = document.querySelector("[data-status]");
		if (statusEl) {
			statusEl.textContent = text;
		}
	}

	function formatCount(value) {
		const n = Number(value) || 0;
		if (n >= 1_000_000) {
			return trimDecimal(n / 1_000_000) + "M";
		}
		if (n >= 10_000) {
			return trimDecimal(n / 1_000) + "K";
		}
		return n.toLocaleString("en-US");
	}

	function trimDecimal(n) {
		return n.toFixed(n >= 10 ? 0 : 1).replace(/\.0$/, "");
	}

	function escapeHtml(value) {
		return String(value)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");
	}

	function cleanName(name) {
		return String(name || "").replace(/^\[[^\]]+\]\s*/, "").trim();
	}

	function formatReleased(value) {
		if (!value) {
			return "";
		}
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) {
			return "";
		}
		return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
	}

	function readLocalPeaks() {
		try {
			return JSON.parse(localStorage.getItem(config.peakKey) || "{}");
		} catch (error) {
			return {};
		}
	}

	function writeLocalPeaks(peaks) {
		localStorage.setItem(config.peakKey, JSON.stringify(peaks));
	}

	function mergePeaks(games) {
		const stored = readLocalPeaks();
		games.forEach(function (game) {
			const id = String(game.universeId);
			stored[id] = Math.max(Number(stored[id]) || 0, Number(game.playing) || 0, Number(game.peak) || 0);
			game.peak = stored[id];
		});
		writeLocalPeaks(stored);
		return games;
	}

	function fallbackGames() {
		return catalog.map(function (entry) {
			return {
				placeId: entry.placeId,
				universeId: entry.universeId,
				name: entry.fallbackName,
				url: entry.url,
				playing: 0,
				visits: 0,
				peak: 0,
				thumbnail: entry.thumbnail || "",
				icon: entry.icon || "",
				released: entry.released || "",
			};
		});
	}

	function thumbnailMap(payload) {
		const map = {};
		(payload.data || []).forEach(function (item) {
			if (item.thumbnails && item.thumbnails[0] && item.thumbnails[0].imageUrl) {
				map[item.universeId] = item.thumbnails[0].imageUrl;
			} else if (item.imageUrl) {
				map[item.targetId] = item.imageUrl;
			}
		});
		return map;
	}

	function fetchJson(url) {
		return fetch(url, { cache: "no-store" }).then(function (response) {
			if (!response.ok) {
				throw new Error("HTTP " + response.status);
			}
			return response.json();
		});
	}

	function normalizeProxyPayload(payload) {
		if (payload && Array.isArray(payload.games)) {
			return payload;
		}
		throw new Error("Unexpected payload");
	}

	function fromRobloxPayload(gamesPayload, thumbsPayload, iconsPayload) {
		const thumbs = thumbnailMap(thumbsPayload || {});
		const icons = thumbnailMap(iconsPayload || {});
		const byId = {};
		((gamesPayload && gamesPayload.data) || []).forEach(function (game) {
			byId[game.id] = game;
		});

		return {
			updatedAt: Date.now(),
			games: catalog.map(function (entry) {
				const live = byId[entry.universeId] || {};
				return {
					placeId: entry.placeId,
					universeId: entry.universeId,
					name: cleanName(live.name) || entry.fallbackName,
					url: entry.url,
					playing: live.playing || 0,
					visits: live.visits || 0,
					peak: 0,
					thumbnail: thumbs[entry.universeId] || entry.thumbnail || "",
					icon: icons[entry.universeId] || entry.icon || "",
					released: live.created || entry.released || "",
				};
			}),
		};
	}

	function loadFromRobloxProxy() {
		const universeIds = catalog.map(function (game) {
			return game.universeId;
		}).join(",");

		return Promise.all([
			fetchJson("https://games.roproxy.com/v1/games?universeIds=" + universeIds),
			fetchJson("https://thumbnails.roproxy.com/v1/games/multiget/thumbnails?universeIds=" + universeIds + "&countPerUniverse=1&size=768x432&format=Png&isCircular=false"),
			fetchJson("https://thumbnails.roproxy.com/v1/games/icons?universeIds=" + universeIds + "&size=150x150&format=Png&isCircular=false"),
		]).then(function (results) {
			return fromRobloxPayload(results[0], results[1], results[2]);
		});
	}

	function loadGames() {
		if (location.protocol === "file:") {
			return loadFromRobloxProxy();
		}

		return fetchJson("/api/games")
			.then(normalizeProxyPayload)
			.catch(function () {
				return loadFromRobloxProxy();
			});
	}

	function render(payload, live) {
		const games = mergePeaks(payload.games || fallbackGames());
		const current = games.reduce(function (sum, game) {
			return sum + (Number(game.playing) || 0);
		}, 0);
		const peak = games.reduce(function (sum, game) {
			return sum + (Number(game.peak) || 0);
		}, 0);

		totalsEl.innerHTML =
			'<article class="stat-card">' +
				'<span><i class="pulse" aria-hidden="true"></i> Current CCU</span>' +
				"<strong>" + (live ? formatCount(current) : "—") + "</strong>" +
				'<p class="status" data-status></p>' +
			"</article>" +
			'<article class="stat-card">' +
				"<span>Peak CCU</span>" +
				"<strong>" + (live ? formatCount(peak) : "—") + "</strong>" +
			"</article>";

		listEl.innerHTML = games.map(function (game) {
			return (
				'<a class="game-card" href="' + escapeHtml(game.url) + '" target="_blank" rel="noreferrer">' +
					'<div class="game-media">' +
						(game.thumbnail ? '<img src="' + escapeHtml(game.thumbnail) + '" alt="">' : "") +
						(game.icon ? '<img class="game-icon" src="' + escapeHtml(game.icon) + '" alt="">' : "") +
					"</div>" +
					'<div class="game-body">' +
						"<h2>" + escapeHtml(game.name) + "</h2>" +
						'<div class="game-meta">' +
							'<div class="game-stats">' +
								'<span>CCU <b class="' + ((Number(game.playing) || 0) > 0 ? "ccu-on" : "ccu-off") + '">' + (live ? formatCount(game.playing) : "—") + "</b></span>" +
								"<span>Visits <b>" + (live ? formatCount(game.visits) : "—") + "</b></span>" +
							"</div>" +
							(formatReleased(game.released) ? '<time class="game-released" datetime="' + escapeHtml(String(game.released).slice(0, 10)) + '">' + escapeHtml(formatReleased(game.released)) + "</time>" : "") +
						"</div>" +
					"</div>" +
				"</a>"
			);
		}).join("");

		if (live) {
			const stamp = new Date(payload.updatedAt || Date.now());
			setStatus("Updated " + stamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " · every 60s");
			document.body.classList.add("has-loaded");
		} else {
			setStatus("Loading live stats…");
		}
	}

	function tick() {
		return loadGames()
			.then(function (payload) {
				render(payload, true);
			})
			.catch(function (error) {
				console.error(error);
				setStatus("Live stats unavailable.");
			});
	}

	render({ games: fallbackGames() }, false);
	tick();
	setInterval(tick, config.pollMs);
	document.addEventListener("visibilitychange", function () {
		if (document.visibilityState === "visible") {
			tick();
		}
	});
})();
