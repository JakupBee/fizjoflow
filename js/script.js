document.addEventListener("DOMContentLoaded", () => {
	const hamburger = document.getElementById("hamburger");
	const navMenu = document.getElementById("navMenu");
	const overlay = document.getElementById("overlay");
	const body = document.body;

	// Ustaw automatyczny rok w stopce na wszystkich stronach
	const currentYear = new Date().getFullYear();
	document.querySelectorAll(".js-current-year").forEach((el) => {
		el.textContent = currentYear;
	});

	// Prevent the browser from doing its own "early" hash jump before our offset logic runs.
	// This is especially important when the page layout shifts after load (e.g. 3rd-party widgets).
	if ("scrollRestoration" in history) {
		history.scrollRestoration = "manual";
	}

	const toggleMenu = () => {
		navMenu.classList.toggle("active");
		overlay.classList.toggle("active");
		body.classList.toggle("no-scroll");
		// toggle hamburger X state and update accessibility attr
		hamburger.classList.toggle("active");
		hamburger.setAttribute(
			"aria-expanded",
			navMenu.classList.contains("active") ? "true" : "false"
		);
	};

	hamburger.addEventListener("click", toggleMenu);

	// Zamknij menu po kliknięciu w przyciemnienie
	overlay.addEventListener("click", toggleMenu);

	// --- Przejścia między stronami ---
	// Wejście na stronę (fade-in) jest realizowane czystym CSS (animacja na <body> w inline <style>).
	// Tutaj obsługujemy tylko wyjście (fade-out) przed przejściem do innej podstrony.
	const PAGE_TRANSITION_MS = 400;
	const prefersReducedMotion = window.matchMedia(
		"(prefers-reduced-motion: reduce)"
	).matches;

	const normalizePath = (pathname) => pathname.replace(/index\.html$/, "");

	document.addEventListener("click", (e) => {
		if (prefersReducedMotion) return;
		if (e.defaultPrevented || e.button !== 0) return;
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

		const link = e.target.closest("a[href]");
		if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

		let url;
		try {
			url = new URL(link.href, window.location.href);
		} catch (err) {
			return;
		}

		// Tylko linki http(s)/file do tej samej witryny, prowadzące do INNEJ podstrony
		// (linki kotwic na tej samej stronie obsługuje przewijanie powyżej).
		if (!/^(https?|file):$/.test(url.protocol)) return;
		if (url.origin !== window.location.origin) return;
		if (normalizePath(url.pathname) === normalizePath(window.location.pathname)) return;

		e.preventDefault();

		if (navMenu.classList.contains("active")) {
			toggleMenu();
		}

		body.classList.add("page-transition-out");
		setTimeout(() => {
			window.location.href = url.href;
			// Zabezpieczenie: jeśli nawigacja się nie rozpocznie / długo trwa (wolna sieć, anulowanie),
			// nie zostawiaj użytkownika na pustej stronie – pokaż ponownie bieżącą.
			setTimeout(() => body.classList.remove("page-transition-out"), 2500);
		}, PAGE_TRANSITION_MS);
	});

	// Powrót przyciskiem "wstecz" (bfcache) – przywróć widoczność strony
	window.addEventListener("pageshow", () => {
		body.classList.remove("page-transition-out");
	});

	// Handle anchor clicks: smooth scroll with offset (navbar height + section padding)
	const navLinks = document.querySelectorAll(".nav-menu a");
	function getTopForHash(hash) {
		if (!hash || hash === "#") return;
		const target = document.querySelector(hash);
		if (!target) return;
		const header = document.querySelector(".navbar");
		const headerHeight = header ? header.offsetHeight : 0;
		// Extra breathing room so the section title isn't glued to the navbar.
		// (Do NOT subtract section padding — that was causing "too high" scroll on padded sections.)
		// If you want the section to start exactly under the fixed navbar, keep this at 0.
		const extraOffset = 0; // px
		let top;
		if (hash === "#home") {
			// For home section, scroll to the very top without offset
			top = 0;
		} else {
			top =
				target.getBoundingClientRect().top +
				window.pageYOffset -
				headerHeight +
				extraOffset;
		}
		return top;
	}

	function scrollToSectionAndOffset(hash, behavior = "smooth") {
		const top = getTopForHash(hash);
		if (typeof top !== "number") return;
		window.scrollTo({ top, behavior });
	}

	// When landing on a URL with a hash (e.g. /#contact), the layout may still shift
	// after DOMContentLoaded (images, iframes, and especially 3rd-party widgets).
	// We "settle" the scroll a few times until the target position stabilizes.
	function settleAndScrollToHash(hash) {
		const maxAttempts = 20;
		let attempts = 0;
		let lastDesiredTop = null;

		const tick = () => {
			attempts += 1;
			const desiredTop = getTopForHash(hash);
			if (typeof desiredTop !== "number") return;

			const y = window.pageYOffset;
			const closeEnough = Math.abs(y - desiredTop) <= 2;
			const stableEnough =
				lastDesiredTop !== null && Math.abs(lastDesiredTop - desiredTop) <= 1;

			// "instant" (not "auto"): CSS has scroll-behavior: smooth on <html>, which "auto" would follow
			// and which would fight with the browser's own hash jump.
			if (!closeEnough) {
				window.scrollTo({ top: desiredTop, behavior: "instant" });
			}

			if (attempts >= maxAttempts || (closeEnough && stableEnough)) return;

			lastDesiredTop = desiredTop;
			// Give the browser a moment to apply layout changes between attempts.
			setTimeout(() => requestAnimationFrame(tick), 80);
		};

		// Start on the next frame so initial styles are applied.
		requestAnimationFrame(tick);
	}

	navLinks.forEach((link) => {
		link.addEventListener("click", (e) => {
			const href = link.getAttribute("href");

			if (href && href.startsWith("#")) {
				// All viewports: use offset scrolling so fixed navbar doesn't cover the section.
				e.preventDefault();
				const perform = () => scrollToSectionAndOffset(href);
				if (navMenu.classList.contains("active")) {
					toggleMenu();
					setTimeout(perform, 250);
				} else {
					perform();
				}
			}
		});
	});

	// Also handle other in-page anchor links (e.g., hero button) using same offset rules
	const pageAnchors = document.querySelectorAll(
		'a[href^="#"]:not(.nav-menu a)'
	);
	pageAnchors.forEach((link) => {
		link.addEventListener("click", (e) => {
			const href = link.getAttribute("href");
			if (href && href.startsWith("#")) {
				// All viewports: use offset scrolling so fixed navbar doesn't cover the section.
				e.preventDefault();
				scrollToSectionAndOffset(href);
			}
		});
	});

	// If page loads with a hash, adjust scroll after full load (all viewports),
	// and keep correcting while the page layout settles.
	const shouldHandleInitialHash = !!window.location.hash;
	if (shouldHandleInitialHash) {
		const run = () => settleAndScrollToHash(window.location.hash);
		if (document.readyState === "complete") {
			run();
		} else {
			window.addEventListener("load", run, { once: true });
		}
	}

	/*// --- Ukrywanie znaczka Elfsight "Free Google Reviews" (na potrzeby Demo) ---
	const removeElfsightBadge = setInterval(() => {
		// Szukamy wszystkich linków wstrzykniętych przez widget, które prowadzą do Elfsight
		const elfsightLinks = document.querySelectorAll('a[href*="elfsight.com"]');

		elfsightLinks.forEach(link => {
			// Brutalnie ukrywamy element, nadpisując jego wbudowane style
			link.style.setProperty('display', 'none', 'important');
			link.style.setProperty('opacity', '0', 'important');
			link.style.setProperty('pointer-events', 'none', 'important');
		});
	}, 300); // Skrypt sprawdza obecność znaczka co 300 milisekund

	// Ubijamy nasz sprawdzacz po 8 sekundach, by nie obciążał przeglądarki
	// (do tego czasu widget Elfsight na 100% zdąży się już załadować)
	setTimeout(() => {
		clearInterval(removeElfsightBadge);
	}, 8000);*/

	// --- OPÓŹNIONE ŁADOWANIE ZEWNĘTRZNYCH WIDGETÓW (SEO & PageSpeed) ---
	let widgetsLoaded = false;

	const loadExternalWidgets = () => {
		if (widgetsLoaded) return;
		widgetsLoaded = true;

		// 1. Ładowanie Elfsight (Opinie Google) - tylko na stronach, które mają widget
		if (document.querySelector('[class*="elfsight-app"]')) {
			const elfsightScript = document.createElement('script');
			elfsightScript.src = "https://elfsightcdn.com/platform.js";
			elfsightScript.async = true;
			document.body.appendChild(elfsightScript);
		}

		// 2. Ładowanie Booksy
		const booksyContainer = document.querySelector('.booksy__widget');
		if (booksyContainer) {
			const booksyScript = document.createElement('script');
			booksyScript.src = "https://booksy.com/widget/code.js?id=333038&country=pl&lang=pl";
			booksyScript.type = "text/javascript";
			booksyContainer.appendChild(booksyScript);
		}

		// 3. Ładowanie mapy Google
		const mapIframe = document.querySelector('.lazy-map');
		if (mapIframe && mapIframe.dataset.src) {
			mapIframe.src = mapIframe.dataset.src;
		}
	};

	// Nasłuchuj pierwszej interakcji użytkownika, aby załadować ciężkie skrypty
	['scroll', 'mousemove', 'touchstart', 'keydown'].forEach(event => {
		window.addEventListener(event, loadExternalWidgets, { once: true, passive: true });
	});

	// Zabezpieczenie (Fallback): jeśli użytkownik nie wykona żadnego ruchu przez 5 sekund, załaduj widgety automatycznie
	// setTimeout(loadExternalWidgets, 5000);
}); // <-- To jest prawidłowe zamknięcie całego pliku script.js
