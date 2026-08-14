(function () {
	const STORAGE_KEY = "nimssey-theme";

	function systemTheme() {
		return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
	}

	function currentTheme() {
		return document.documentElement.getAttribute("data-theme") || systemTheme();
	}

	function applyTheme(theme) {
		document.documentElement.setAttribute("data-theme", theme);
		const toggle = document.querySelector("[data-theme-toggle]");
		if (!toggle) {
			return;
		}
		toggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
		toggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
	}

	const saved = localStorage.getItem(STORAGE_KEY);
	applyTheme(saved === "light" || saved === "dark" ? saved : systemTheme());

	document.querySelector("[data-theme-toggle]")?.addEventListener("click", function () {
		const next = currentTheme() === "dark" ? "light" : "dark";
		localStorage.setItem(STORAGE_KEY, next);
		applyTheme(next);
	});

	window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (event) {
		if (localStorage.getItem(STORAGE_KEY)) {
			return;
		}
		applyTheme(event.matches ? "dark" : "light");
	});

	const toggle = document.querySelector("[data-nav-toggle]");
	const panel = document.querySelector("[data-nav-panel]");
	if (!toggle || !panel) {
		return;
	}

	function setOpen(open) {
		toggle.setAttribute("aria-expanded", open ? "true" : "false");
		panel.classList.toggle("is-open", open);
		document.body.classList.toggle("nav-open", open);
	}

	toggle.addEventListener("click", function () {
		setOpen(toggle.getAttribute("aria-expanded") !== "true");
	});

	panel.querySelectorAll("a").forEach(function (link) {
		link.addEventListener("click", function () {
			setOpen(false);
		});
	});

	window.addEventListener("keydown", function (event) {
		if (event.key === "Escape") {
			setOpen(false);
		}
	});
})();
