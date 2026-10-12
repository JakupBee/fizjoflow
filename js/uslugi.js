// Strona usług: obsługa okna (modala) z opisem usługi.
//
// Karty i opisy usług są zwykłym, statycznym HTML-em generowanym z data/services.json
// (node build/build-services.js). Ten skrypt niczego nie pobiera – tylko kopiuje
// opis z wybranej karty do okna i obsługuje otwieranie / zamykanie / linki bezpośrednie
// (uslugi.html#id-uslugi).

(function () {
	"use strict";

	var modal, overlay, modalTitle, modalDescription, closeBtn;
	var lastTrigger = null;

	function isOpen() {
		return modal.classList.contains("active");
	}

	function setHash(hash) {
		// replaceState nie dokłada wpisu do historii i nie wywołuje hashchange.
		try {
			history.replaceState(null, "", hash || location.pathname + location.search);
		} catch (e) {
			/* np. file:// – pomijamy */
		}
	}

	function openService(id, trigger) {
		var card = document.getElementById(id);
		if (!card || !card.classList.contains("service-card")) return false;

		var title = card.querySelector(".service-card__title");
		var details = card.querySelector(".service-card__details");

		modalTitle.textContent = title ? title.textContent : "";
		modalDescription.innerHTML = details ? details.innerHTML : "";

		lastTrigger = trigger || card.querySelector(".service-card__btn");

		modal.classList.add("active");
		overlay.classList.add("active");
		document.body.classList.add("no-scroll");
		setHash("#" + id);

		setTimeout(function () {
			closeBtn.focus();
		}, 100);
		return true;
	}

	function closeModal() {
		if (!isOpen()) return;

		modal.classList.remove("active");
		overlay.classList.remove("active");
		document.body.classList.remove("no-scroll");
		setHash("");

		if (lastTrigger && typeof lastTrigger.focus === "function") {
			lastTrigger.focus({ preventScroll: true });
		}
		lastTrigger = null;
	}

	function openFromHash() {
		var id = decodeURIComponent(location.hash.slice(1));
		if (id) openService(id);
	}

	document.addEventListener("DOMContentLoaded", function () {
		modal = document.getElementById("serviceModal");
		overlay = document.getElementById("modalOverlay");
		modalTitle = document.getElementById("modalTitle");
		modalDescription = document.getElementById("modalDescription");
		closeBtn = modal && modal.querySelector(".modal__close");

		if (!modal || !overlay || !modalTitle || !modalDescription || !closeBtn) return;

		document.querySelectorAll(".service-card__btn").forEach(function (button) {
			button.addEventListener("click", function (e) {
				e.preventDefault();
				openService(button.getAttribute("data-service-id"), button);
			});
		});

		closeBtn.addEventListener("click", closeModal);
		overlay.addEventListener("click", closeModal);

		document.addEventListener("keydown", function (e) {
			if (e.key === "Escape") closeModal();
		});

		// Link bezpośredni, np. uslugi.html#fizjoterapia-neurologiczna
		openFromHash();
		window.addEventListener("hashchange", function () {
			if (location.hash.length > 1) openFromHash();
			else closeModal();
		});
	});
})();
