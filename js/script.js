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

	// When landing on a URL with a hash (e.g. index.html#contact), the layout may still shift
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

			// Use "auto" here to correct position without a long smooth animation fight.
			if (!closeEnough) {
				window.scrollTo({ top: desiredTop, behavior: "auto" });
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

	// --- Pobieranie głównego zdjęcia z Contentful (sekcja O mnie) ---
	async function loadMainPhoto() {
		try {
			const response = await fetch('./json/photo-data.json');
			const items = await response.json();
	
			if (items.length > 0) {
				const asset = items[0];
				const imageUrl = asset.fields.file.url;
				const imgElement = document.querySelector(".about__image .image-box img");
	
				if (imgElement) {
					imgElement.src = `https:${imageUrl}`;
					if (asset.fields.description) {
						imgElement.alt = asset.fields.description;
					}
				}
			}
		} catch (error) {
			console.error("Błąd podczas pobierania zdjęcia mainPhoto:", error);
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

	// Wywołujemy funkcję bezpośrednio, bo i tak jesteśmy już wewnątrz
	// głównego document.addEventListener("DOMContentLoaded", ...) na samej górze pliku
	loadMainPhoto();

	// --- OPÓŹNIONE ŁADOWANIE ZEWNĘTRZNYCH WIDGETÓW (SEO & PageSpeed) ---
	let widgetsLoaded = false;

	const loadExternalWidgets = () => {
		if (widgetsLoaded) return;
		widgetsLoaded = true;

		// 1. Ładowanie Elfsight (Opinie Google)
		const elfsightScript = document.createElement('script');
		elfsightScript.src = "https://elfsightcdn.com/platform.js";
		elfsightScript.async = true;
		document.body.appendChild(elfsightScript);

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
