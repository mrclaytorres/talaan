<script lang="ts">
	import DOMPurify from 'dompurify';
	import { isHtmlContent, plainTextToHtml } from '$lib/utils/formatters.js';

	interface Props {
		content: string;
	}

	let { content }: Props = $props();

	const PURIFY_CONFIG = {
		ALLOWED_TAGS: [
			'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'del',
			'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
			'ul', 'ol', 'li',
			'blockquote', 'pre', 'code',
			'a', 'img', 'iframe',
			'div', 'span',
		],
		ALLOWED_ATTR: [
			'href', 'target', 'rel',
			'src', 'alt', 'width', 'height',
			'class', 'style',
			'allowfullscreen', 'frameborder', 'allow',
		],
		ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
		ADD_ATTR: ['target'],
	};

	const sanitizedHtml = $derived(() => {
		if (!content) return '';
		const html = isHtmlContent(content) ? content : plainTextToHtml(content);
		return DOMPurify.sanitize(html, PURIFY_CONFIG);
	});
</script>

<div class="rich-text-display">
	{@html sanitizedHtml()}
</div>

<style>
	.rich-text-display {
		font-size: 0.875rem;
		line-height: 1.6;
		color: var(--color-text, #374151);
	}

	.rich-text-display :global(h1) {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0.75rem 0 0.5rem;
	}

	.rich-text-display :global(h2) {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0.75rem 0 0.5rem;
	}

	.rich-text-display :global(h3) {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0.5rem 0 0.25rem;
	}

	.rich-text-display :global(p) {
		margin: 0.25rem 0;
	}

	.rich-text-display :global(ul),
	.rich-text-display :global(ol) {
		padding-left: 1.5rem;
		margin: 0.5rem 0;
	}

	.rich-text-display :global(blockquote) {
		border-left: 3px solid var(--color-border, #d1d5db);
		padding-left: 1rem;
		margin: 0.5rem 0;
		color: var(--color-text-muted, #6b7280);
	}

	.rich-text-display :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.375rem;
		margin: 0.5rem 0;
	}

	.rich-text-display :global(iframe) {
		max-width: 100%;
		border-radius: 0.375rem;
		margin: 0.5rem 0;
	}

	.rich-text-display :global(a) {
		color: var(--color-primary, #2563eb);
		text-decoration: underline;
	}
</style>
