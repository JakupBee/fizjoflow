

// Funkcja escape HTML
function escapeHtml(text) {
	if (!text) return "";
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

// Helper function to render Contentful Rich Text to HTML
function renderRichText(node) {
	if (!node) return "";
	if (typeof node === "string") return node;

	// Handle Text Nodes (bold, italic, etc.)
	if (node.nodeType === "text") {
		let text = escapeHtml(node.value || "");
		if (node.marks) {
			node.marks.forEach((mark) => {
				if (mark.type === "bold") text = `<strong>${text}</strong>`;
				if (mark.type === "italic") text = `<em>${text}</em>`;
				if (mark.type === "underline") text = `<u>${text}</u>`;
				if (mark.type === "code") text = `<code>${text}</code>`;
			});
		}
		return text;
	}

	// Process children recursively
	const content = node.content
		? node.content.map((child) => renderRichText(child)).join("")
		: "";

	// Map Contentful nodes to HTML tags
	switch (node.nodeType) {
		case "document":
			return content;
		case "paragraph":
			return `<p>${content}</p>`;
		case "heading-1":
			return `<h3>${content}</h3>`;
		case "heading-2":
			return `<h4>${content}</h4>`;
		case "heading-3":
			return `<h5>${content}</h5>`;
		case "heading-4":
			return `<h6>${content}</h6>`;
		case "heading-5":
			return `<h6>${content}</h6>`;
		case "heading-6":
			return `<h6>${content}</h6>`;
		case "unordered-list":
			return `<ul>${content}</ul>`;
		case "ordered-list":
			return `<ol>${content}</ol>`;
		case "list-item":
			return `<li>${content}</li>`;
		case "blockquote":
			return `<blockquote>${content}</blockquote>`;
		case "hr":
			return "<hr />";
		case "hyperlink":
			const uri = node.data && node.data.uri ? node.data.uri : "#";
			return `<a href="${uri}" target="_blank" rel="noopener noreferrer">${content}</a>`;
		default:
			return content;
	}
}

// Funkcja generująca HTML karty - IDENTYCZNA jak w uslugi-cards.js
function createServiceCard(service) {
	return `
		<article class="service-card" data-service-id="${service.id}">
			<div class="service-card__badge">
				<div class="service-card__badge-content">
					<span class="service-card__price">${service.price} zł</span>
					<span class="service-card__time">${service.time} min</span>
				</div>
			</div>
			<div class="service-card__content">
				<h3 class="service-card__title">${escapeHtml(service.name)}</h3>
				<button class="service-card__btn" data-service-id="${
					service.id
				}" aria-label="Pokaż opis usługi ${escapeHtml(service.name)}">
					Opis <span class="service-card__btn-arrow">→</span>
				</button>
			</div>
		</article>
	`;
}

// Funkcja renderująca opis (obsługa HTML)
function renderDescription(description) {
	if (!description) return "";
	// Jeśli to Rich Text z Contentful, renderuj go
	if (typeof description === "object" && description.nodeType) {
		return renderRichText(description);
	}
	// Jeśli to string z HTML, zwróć go
	if (typeof description === "string" && description.includes("<")) {
		return description;
	}
	return escapeHtml(description);
}

// Funkcja otwierająca modal - IDENTYCZNA jak w uslugi-cards.js
function openModal(service) {
	const modal = document.getElementById("serviceModal");
	const modalTitle = document.getElementById("modalTitle");
	const modalDescription = document.getElementById("modalDescription");
	const modalOverlay = document.getElementById("modalOverlay");

	if (!modal || !modalTitle || !modalDescription || !modalOverlay) return;

	modalTitle.textContent = service.name;
	modalDescription.innerHTML = renderDescription(service.description);

	modal.classList.add("active");
	modalOverlay.classList.add("active");
	document.body.classList.add("no-scroll");

	const closeBtn = modal.querySelector(".modal__close");
	if (closeBtn) {
		setTimeout(() => closeBtn.focus(), 100);
	}
}

// Funkcja zamykająca modal - IDENTYCZNA jak w uslugi-cards.js
function closeModal() {
	const modal = document.getElementById("serviceModal");
	const modalOverlay = document.getElementById("modalOverlay");

	if (modal) modal.classList.remove("active");
	if (modalOverlay) modalOverlay.classList.remove("active");
	document.body.classList.remove("no-scroll");
}

// Inicjalizacja po załadowaniu DOM
document.addEventListener("DOMContentLoaded", async () => {
	const uslugiWrapper = document.querySelector(".uslugi__wrapper");

	if (!uslugiWrapper) return;

	try {
		// Show loading state
		uslugiWrapper.innerHTML =
			'<div class="uslugi__loading">Ładowanie usług...</div>';

		// Fetch services from Contentful with content type "service"
		const response = await fetch('./json/uslugi-data.json');
		const services = await response.json();

		if (services.length === 0) {
			uslugiWrapper.innerHTML = `
				<div class="uslugi__empty">
					<h2>Brak usług</h2>
					<p>Obecnie nie ma dostępnych usług do wyświetlenia.</p>
				</div>
			`;
			return;
		}

		// Map Contentful services to format compatible with uslugi-cards.js
		const servicesData = services.map((service, index) => {
			const fields = service.fields;
			return {
				id: index + 1, // Numeracja od 1, tak jak w uslugi-cards.js
				name: fields.name || "Bez nazwy",
				time: fields.time || 0,
				price: fields.cost || 0,
				description: fields.description || "",
			};
		});

		// Generuj HTML dla wszystkich kart - IDENTYCZNY kod jak w uslugi-cards.js
		const cardsHTML = servicesData
			.map((service) => createServiceCard(service))
			.join("");

		// Wstaw karty do wrappera - IDENTYCZNY kod jak w uslugi-cards.js
		uslugiWrapper.innerHTML = `
			<div class="uslugi__grid">
				${cardsHTML}
			</div>
		`;

		// Dodaj event listenery do przycisków "Opis" - IDENTYCZNY kod jak w uslugi-cards.js
		const descriptionButtons = document.querySelectorAll(".service-card__btn");
		descriptionButtons.forEach((button) => {
			button.addEventListener("click", (e) => {
				e.preventDefault();
				const serviceId = parseInt(button.getAttribute("data-service-id"));
				const service = servicesData.find((s) => s.id === serviceId);
				if (service) {
					openModal(service);
				}
			});
		});

		// Obsługa zamykania modala - IDENTYCZNY kod jak w uslugi-cards.js
		const closeBtn = document.querySelector(".modal__close");
		const modalOverlay = document.getElementById("modalOverlay");

		if (closeBtn) {
			closeBtn.addEventListener("click", closeModal);
		}

		if (modalOverlay) {
			modalOverlay.addEventListener("click", closeModal);
		}

		// Zamykanie modala klawiszem ESC - IDENTYCZNY kod jak w uslugi-cards.js
		document.addEventListener("keydown", (e) => {
			if (e.key === "Escape") {
				const modal = document.getElementById("serviceModal");
				if (modal && modal.classList.contains("active")) {
					closeModal();
				}
			}
		});
	} catch (error) {
		console.error("Error fetching services:", error);
		uslugiWrapper.innerHTML = `
			<div class="uslugi__error">
				<h2>Wystąpił błąd</h2>
				<p>Nie udało się załadować usług. Spróbuj ponownie później.</p>
				<p style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.7;">Błąd: ${error.message}</p>
			</div>
		`;
	}
});
