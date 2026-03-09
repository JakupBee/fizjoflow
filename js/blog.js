// Helper function to format date
function formatDate(dateString) {
	const date = new Date(dateString);
	return date.toLocaleDateString('pl-PL', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
}

// Helper function to escape HTML
function escapeHtml(text) {
	if (!text) return '';
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

// Helper function to truncate text
function truncateText(text, maxLength = 200) {
	if (!text || text.length <= maxLength) return text;
	return text.substring(0, maxLength).trim() + '...';
}

// Helper function to process media (images or videos)
function processMedia(media) {
	if (!media) return '';
	
	// Handle array of media
	if (Array.isArray(media)) {
		return media.map(item => processMediaItem(item)).join('');
	}
	
	// Handle single media item
	return processMediaItem(media);
}

// Helper function to process a single media item
function processMediaItem(mediaItem) {
	if (!mediaItem) return '';
	
	// Check if it's a video (has file with video content type or video URL)
	if (mediaItem.fields && mediaItem.fields.file) {
		const file = mediaItem.fields.file;
		const contentType = file.contentType || '';
		const url = file.url || '';
		
		// Check if it's a video
		if (contentType.startsWith('video/') || url.match(/\.(mp4|webm|ogg|mov)$/i)) {
			const videoUrl = url.startsWith('//') ? `https:${url}` : url;
			const title = mediaItem.fields.title || '';
			return `
				<div class="blog-post__media blog-post__media--video">
					<video controls>
						<source src="${videoUrl}" type="${contentType}">
						Twoja przeglądarka nie obsługuje odtwarzania wideo.
					</video>
				</div>
			`;
		}
		
		// Otherwise treat as image
		const imageUrl = url.startsWith('//') ? `https:${url}` : url;
		const imageAlt = mediaItem.fields.title || mediaItem.fields.description || '';
		return `
			<div class="blog-post__media blog-post__media--image">
				<img src="${imageUrl}" alt="${imageAlt}">
			</div>
		`;
	}
	
	// Handle direct URL strings (for videos from external sources)
	if (typeof mediaItem === 'string') {
		// Check if it's a video URL
		if (mediaItem.match(/\.(mp4|webm|ogg|mov)$/i) || mediaItem.includes('youtube.com') || mediaItem.includes('youtu.be') || mediaItem.includes('vimeo.com')) {
			if (mediaItem.includes('youtube.com') || mediaItem.includes('youtu.be')) {
				// Extract YouTube video ID
				const videoId = mediaItem.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
				if (videoId) {
					return `
						<div class="blog-post__media blog-post__media--video">
							<iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
						</div>
					`;
				}
			} else if (mediaItem.includes('vimeo.com')) {
				// Extract Vimeo video ID
				const videoId = mediaItem.match(/vimeo\.com\/(\d+)/)?.[1];
				if (videoId) {
					return `
						<div class="blog-post__media blog-post__media--video">
							<iframe src="https://player.vimeo.com/video/${videoId}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
						</div>
					`;
				}
			} else {
				// Direct video URL
				return `
					<div class="blog-post__media blog-post__media--video">
						<video controls>
							<source src="${mediaItem}">
							Twoja przeglądarka nie obsługuje odtwarzania wideo.
						</video>
					</div>
				`;
			}
		} else {
			// Treat as image URL
			return `
				<div class="blog-post__media blog-post__media--image">
					<img src="${mediaItem}" alt="">
				</div>
			`;
		}
	}
	
	return '';
}

// Helper function to process Rich Text content from Contentful
function processRichText(richText) {
	if (!richText) return '';
	
	// If it's already a string, return it
	if (typeof richText === 'string') {
		return richText;
	}
	
	// If it's a Rich Text document, extract text content
	if (richText.nodeType === 'document' && richText.content) {
		return extractTextFromRichText(richText);
	}
	
	// If it's an object with content array
	if (richText.content && Array.isArray(richText.content)) {
		return extractTextFromRichText(richText);
	}
	
	return String(richText);
}

// Helper function to check if rich text contains special elements that need full view
function hasRichTextElements(node) {
	if (!node) return false;
	if (typeof node === 'string') return false;

	// List of node types that should trigger "Czytaj więcej" button
	const richTextNodeTypes = [
		'unordered-list',
		'ordered-list',
		'list-item',
		'blockquote',
		'table',
		'table-row',
		'table-cell',
		'table-header-cell',
		'hr'
	];

	// Check if current node is one of the special types
	if (node.nodeType && richTextNodeTypes.includes(node.nodeType)) {
		return true;
	}

	// Recursively check children
	if (node.content && Array.isArray(node.content)) {
		return node.content.some(child => hasRichTextElements(child));
	}

	return false;
}

// Helper function to render Contentful Rich Text to HTML
function renderRichText(node) {
	if (!node) return '';
	if (typeof node === 'string') return node;

	// Handle Text Nodes (bold, italic, etc.)
	if (node.nodeType === 'text') {
		let text = escapeHtml(node.value || '');
		if (node.marks) {
			node.marks.forEach(mark => {
				if (mark.type === 'bold') text = `<strong>${text}</strong>`;
				if (mark.type === 'italic') text = `<em>${text}</em>`;
				if (mark.type === 'underline') text = `<u>${text}</u>`;
				if (mark.type === 'code') text = `<code>${text}</code>`;
			});
		}
		return text;
	}

	// Process children recursively
	const content = node.content ? node.content.map(child => renderRichText(child)).join('') : '';

	// Map Contentful nodes to HTML tags
	switch (node.nodeType) {
		case 'document': return content;
		case 'paragraph': return `<p>${content}</p>`;
		case 'heading-1': return `<h3>${content}</h3>`;
		case 'heading-2': return `<h4>${content}</h4>`;
		case 'heading-3': return `<h5>${content}</h5>`;
		case 'heading-4': return `<h6>${content}</h6>`;
		case 'heading-5': return `<h6>${content}</h6>`;
		case 'heading-6': return `<h6>${content}</h6>`;
		case 'unordered-list': return `<ul>${content}</ul>`;
		case 'ordered-list': return `<ol>${content}</ol>`;
		case 'list-item': return `<li>${content}</li>`;
		case 'blockquote': return `<blockquote>${content}</blockquote>`;
		case 'hr': return '<hr />';
		
		// --- NEW TABLE LOGIC STARTS HERE ---
		case 'table': 
			return `<div class="table-wrapper"><table><tbody>${content}</tbody></table></div>`;
		case 'table-row': 
			return `<tr>${content}</tr>`;
		case 'table-header-cell': 
			return `<th>${content}</th>`;
		case 'table-cell': 
			return `<td>${content}</td>`;
		// --- NEW TABLE LOGIC ENDS HERE ---

		case 'hyperlink':
			const uri = node.data && node.data.uri ? node.data.uri : '#';
			return `<a href="${uri}" target="_blank" rel="noopener noreferrer">${content}</a>`;
		default: return content;
	}
}

// Extract plain text from Contentful Rich Text
function extractTextFromRichText(node) {
	if (!node) return '';
	
	if (typeof node === 'string') {
		return node;
	}
	
	// Handle text nodes
	if (node.nodeType === 'text' || node.nodeType === 3) {
		return node.value || node.text || '';
	}
	
	// Handle document or block nodes with content
	if (node.content && Array.isArray(node.content)) {
		return node.content.map(extractTextFromRichText).join(' ');
	}
	
	// Handle nodes with value property
	if (node.value) {
		return node.value;
	}
	
	// Handle nodes with text property
	if (node.text) {
		return node.text;
	}
	
	return '';
}

// Fetch and display blog posts
document.addEventListener('DOMContentLoaded', async () => {
	const blogWrapper = document.querySelector('.blog__wrapper');
	
	if (!blogWrapper) return;

	try {
		// Show loading state
		blogWrapper.innerHTML = '<div class="blog__loading">Ładowanie artykułów...</div>';

		// Fetch blog posts from Contentful with content type "blog"
		const response = await fetch('./json/blog-data.json');
		const posts = await response.json();

		if (posts.length === 0) {
			blogWrapper.innerHTML = `
				<div class="blog__empty">
					<h2>Brak artykułów</h2>
					<p>Obecnie nie ma dostępnych artykułów do wyświetlenia.</p>
				</div>
			`;
			return;
		}

		// Generate HTML for blog posts
		const postsHTML = posts.map((post, index) => {
			const fields = post.fields;
			
			// Get title, article, and media fields
			const title = fields.title || 'Bez tytułu';
			const article = fields.article || '';
			const media = fields.media || null;
			const publishDate = post.sys.createdAt;

			// Format date
			const formattedDate = formatDate(publishDate);

			// 1. Process Plain Text for Preview (removes tags so preview looks clean)
			const plainText = extractTextFromRichText(article);
			const cleanPlainText = plainText.replace(/\s+/g, ' ').trim();
			const truncatedArticle = truncateText(cleanPlainText, 200);
			
			// 2. Check if content has rich text elements (lists, tables, blockquotes, etc.)
			const hasRichElements = hasRichTextElements(article);
			
			// 3. Show "Czytaj więcej" if text is long OR if it contains rich text elements
			const hasMoreContent = cleanPlainText.length > 200 || hasRichElements;

			// 4. Process HTML for Full Content (keeps tags like <ul>, <b>, etc.)
			const fullHtmlContent = renderRichText(article);

			// Create unique ID for this post
			const postId = `blog-post-${index}`;

			return `
				<article class="blog-post" data-post-id="${postId}">
					<div class="blog-post__content">
						<div class="blog-post__meta">
							<time datetime="${publishDate}">${formattedDate}</time>
						</div>
						<h2 class="blog-post__title">${escapeHtml(title)}</h2>
						<div class="blog-post__article">
							<div class="blog-post__article-preview">
								${escapeHtml(truncatedArticle)}
							</div>
							${hasMoreContent ? `
								<div class="blog-post__article-full" style="display: none;">
									${processMedia(media)}
									<div class="blog-post__article-text">
										${fullHtmlContent}
									</div>
								</div>
								<button class="blog-post__read-more btn btn--primary" data-post="${postId}">
									Czytaj więcej
								</button>
								<button class="blog-post__read-less btn btn--primary" data-post="${postId}" style="display: none;">
									Czytaj mniej
								</button>
							` : ''}
						</div>
					</div>
				</article>
			`;
		}).join('');

		// Insert posts into the page
		blogWrapper.innerHTML = `
			<div class="blog__header">
				<h1 class="blog__title">Blog</h1>
				<p class="blog__subtitle">Artykuły i porady dotyczące fizjoterapii i zdrowia</p>
			</div>
			<div class="blog__posts">
				${postsHTML}
			</div>
		`;

		// Simple expand/collapse functionality with smooth animation
		const readMoreButtons = document.querySelectorAll('.blog-post__read-more');
		const readLessButtons = document.querySelectorAll('.blog-post__read-less');

		readMoreButtons.forEach(button => {
			button.addEventListener('click', function() {
				const postId = this.getAttribute('data-post');
				const post = document.querySelector(`[data-post-id="${postId}"]`);
				const preview = post.querySelector('.blog-post__article-preview');
				const full = post.querySelector('.blog-post__article-full');
				const readMore = post.querySelector('.blog-post__read-more');
				const readLess = post.querySelector('.blog-post__read-less');

				if (preview && full && readMore && readLess) {
					// Hide preview and read more button
					preview.style.display = 'none';
					readMore.style.display = 'none';
					
					// Show full content container first
					full.style.display = 'block';
					full.style.maxHeight = '0';
					full.style.opacity = '0';
					
					// Force reflow
					void full.offsetHeight;
					
					// Get actual height and animate
					const fullHeight = full.scrollHeight;
					full.classList.add('expanded');
					full.style.maxHeight = fullHeight + 'px';
					full.style.opacity = '1';
					
					// Show read less button
					readLess.style.display = 'inline-block';
					
					// Smooth scroll to article
					setTimeout(() => {
						post.scrollIntoView({ behavior: 'smooth', block: 'start' });
					}, 100);
				}
			});
		});

		readLessButtons.forEach(button => {
			button.addEventListener('click', function() {
				const postId = this.getAttribute('data-post');
				const post = document.querySelector(`[data-post-id="${postId}"]`);
				const preview = post.querySelector('.blog-post__article-preview');
				const full = post.querySelector('.blog-post__article-full');
				const readMore = post.querySelector('.blog-post__read-more');
				const readLess = post.querySelector('.blog-post__read-less');

				if (preview && full && readMore && readLess) {
					// Collapse animation
					full.style.maxHeight = full.scrollHeight + 'px';
					void full.offsetHeight; // Force reflow
					
					full.classList.remove('expanded');
					full.style.maxHeight = '0';
					full.style.opacity = '0';
					
					// Hide read less button
					readLess.style.display = 'none';
					
					// After animation completes, hide full and show preview
					setTimeout(() => {
						full.style.display = 'none';
						preview.style.display = 'block';
						readMore.style.display = 'inline-block';
						
						// Smooth scroll to article
						post.scrollIntoView({ behavior: 'smooth', block: 'start' });
					}, 800);
				}
			});
		});

	} catch (error) {
		console.error('Error fetching blog posts:', error);
		blogWrapper.innerHTML = `
			<div class="blog__error">
				<h2>Wystąpił błąd</h2>
				<p>Nie udało się załadować artykułów. Spróbuj ponownie później.</p>
				<p style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.7;">Błąd: ${error.message}</p>
			</div>
		`;
	}
});

