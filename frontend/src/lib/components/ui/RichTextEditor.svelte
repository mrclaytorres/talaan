<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Image from '@tiptap/extension-image';
	import Youtube from '@tiptap/extension-youtube';
	import Placeholder from '@tiptap/extension-placeholder';
	import Link from '@tiptap/extension-link';
	import Underline from '@tiptap/extension-underline';

	interface Props {
		content?: string;
		placeholder?: string;
		onchange?: (html: string) => void;
		uploadImage?: (file: File) => Promise<string>;
	}

	let { content = '', placeholder = 'Write your notes...', onchange, uploadImage }: Props = $props();

	let editorElement: HTMLDivElement;
	let editor: Editor | null = $state(null);
	let fileInput: HTMLInputElement;

	onMount(() => {
		editor = new Editor({
			element: editorElement,
			extensions: [
				StarterKit,
				Underline,
				Image.configure({ inline: false, allowBase64: false }),
				Youtube.configure({ width: 640, height: 360 }),
				Placeholder.configure({ placeholder }),
				Link.configure({ openOnClick: false, autolink: true }),
			],
			content: content || '',
			onUpdate: ({ editor: e }) => {
				onchange?.(e.getHTML());
			},
			onTransaction: () => {
				// Force Svelte reactivity for toolbar active states
				editor = editor;
			},
		});
	});

	onDestroy(() => {
		editor?.destroy();
	});

	function toggleBold() {
		editor?.chain().focus().toggleBold().run();
	}

	function toggleItalic() {
		editor?.chain().focus().toggleItalic().run();
	}

	function toggleUnderline() {
		editor?.chain().focus().toggleUnderline().run();
	}

	function toggleStrike() {
		editor?.chain().focus().toggleStrike().run();
	}

	function toggleH1() {
		editor?.chain().focus().toggleHeading({ level: 1 }).run();
	}

	function toggleH2() {
		editor?.chain().focus().toggleHeading({ level: 2 }).run();
	}

	function toggleH3() {
		editor?.chain().focus().toggleHeading({ level: 3 }).run();
	}

	function toggleBulletList() {
		editor?.chain().focus().toggleBulletList().run();
	}

	function toggleOrderedList() {
		editor?.chain().focus().toggleOrderedList().run();
	}

	function toggleBlockquote() {
		editor?.chain().focus().toggleBlockquote().run();
	}

	function handleImageClick() {
		fileInput?.click();
	}

	async function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file || !uploadImage || !editor) return;

		try {
			const url = await uploadImage(file);
			editor.chain().focus().setImage({ src: url }).run();
		} catch {
			// Upload failed — user sees error via parent component
		}
		input.value = '';
	}

	function handleVideoEmbed() {
		const url = prompt('Enter YouTube or Vimeo URL:');
		if (!url || !editor) return;
		editor.chain().focus().setYoutubeVideo({ src: url }).run();
	}

	function isActive(name: string, attrs?: Record<string, unknown>): boolean {
		return editor?.isActive(name, attrs) ?? false;
	}
</script>

<div class="rich-text-editor">
	<div class="toolbar" role="toolbar" aria-label="Text formatting">
		<div class="toolbar-group">
			<button type="button" class="toolbar-btn" class:active={isActive('bold')} onclick={toggleBold} title="Bold">
				<strong>B</strong>
			</button>
			<button type="button" class="toolbar-btn" class:active={isActive('italic')} onclick={toggleItalic} title="Italic">
				<em>I</em>
			</button>
			<button type="button" class="toolbar-btn" class:active={isActive('underline')} onclick={toggleUnderline} title="Underline">
				<u>U</u>
			</button>
			<button type="button" class="toolbar-btn" class:active={isActive('strike')} onclick={toggleStrike} title="Strikethrough">
				<s>S</s>
			</button>
		</div>

		<span class="toolbar-divider"></span>

		<div class="toolbar-group">
			<button type="button" class="toolbar-btn" class:active={isActive('heading', { level: 1 })} onclick={toggleH1} title="Heading 1">
				H1
			</button>
			<button type="button" class="toolbar-btn" class:active={isActive('heading', { level: 2 })} onclick={toggleH2} title="Heading 2">
				H2
			</button>
			<button type="button" class="toolbar-btn" class:active={isActive('heading', { level: 3 })} onclick={toggleH3} title="Heading 3">
				H3
			</button>
		</div>

		<span class="toolbar-divider"></span>

		<div class="toolbar-group">
			<button type="button" class="toolbar-btn" class:active={isActive('bulletList')} onclick={toggleBulletList} title="Bullet List">
				&bull;
			</button>
			<button type="button" class="toolbar-btn" class:active={isActive('orderedList')} onclick={toggleOrderedList} title="Ordered List">
				1.
			</button>
			<button type="button" class="toolbar-btn" class:active={isActive('blockquote')} onclick={toggleBlockquote} title="Blockquote">
				&ldquo;
			</button>
		</div>

		<span class="toolbar-divider"></span>

		<div class="toolbar-group">
			{#if uploadImage}
				<button type="button" class="toolbar-btn" onclick={handleImageClick} title="Insert Image">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
						<circle cx="8.5" cy="8.5" r="1.5"></circle>
						<polyline points="21 15 16 10 5 21"></polyline>
					</svg>
				</button>
			{/if}
			<button type="button" class="toolbar-btn" onclick={handleVideoEmbed} title="Embed Video">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polygon points="5 3 19 12 5 21 5 3"></polygon>
				</svg>
			</button>
		</div>
	</div>

	<div class="editor-content" bind:this={editorElement}></div>

	<input
		type="file"
		accept="image/png,image/jpeg,image/webp,image/gif"
		class="hidden-input"
		bind:this={fileInput}
		onchange={handleFileChange}
	/>
</div>

<style>
	.rich-text-editor {
		border: 1px solid var(--color-border, #d1d5db);
		border-radius: 0.375rem;
		overflow: hidden;
	}

	.rich-text-editor:focus-within {
		border-color: var(--color-primary, #2563eb);
		box-shadow: 0 0 0 3px var(--color-primary-ring, rgba(37, 99, 235, 0.1));
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.125rem;
		padding: 0.375rem;
		background: var(--color-bg-page, #f9fafb);
		border-bottom: 1px solid var(--color-border, #d1d5db);
	}

	.toolbar-group {
		display: flex;
		gap: 0.125rem;
	}

	.toolbar-divider {
		width: 1px;
		margin: 0.25rem 0.25rem;
		background: var(--color-border, #d1d5db);
	}

	.toolbar-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: none;
		border-radius: 0.25rem;
		background: transparent;
		color: var(--color-text, #374151);
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.toolbar-btn:hover {
		background: var(--color-border, #e5e7eb);
	}

	.toolbar-btn.active {
		background: var(--color-primary, #2563eb);
		color: #ffffff;
	}

	.editor-content {
		min-height: 8rem;
		padding: 0;
	}

	/* Tiptap editor styles */
	.editor-content :global(.tiptap) {
		padding: 0.5rem 0.75rem;
		min-height: 8rem;
		outline: none;
		font-size: 0.875rem;
		line-height: 1.6;
		color: var(--color-text, #374151);
	}

	.editor-content :global(.tiptap p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		float: left;
		color: var(--color-text-muted, #9ca3af);
		pointer-events: none;
		height: 0;
	}

	.editor-content :global(.tiptap h1) {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0.75rem 0 0.5rem;
	}

	.editor-content :global(.tiptap h2) {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0.75rem 0 0.5rem;
	}

	.editor-content :global(.tiptap h3) {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0.5rem 0 0.25rem;
	}

	.editor-content :global(.tiptap ul),
	.editor-content :global(.tiptap ol) {
		padding-left: 1.5rem;
		margin: 0.5rem 0;
	}

	.editor-content :global(.tiptap blockquote) {
		border-left: 3px solid var(--color-border, #d1d5db);
		padding-left: 1rem;
		margin: 0.5rem 0;
		color: var(--color-text-muted, #6b7280);
	}

	.editor-content :global(.tiptap img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.375rem;
		margin: 0.5rem 0;
	}

	.editor-content :global(.tiptap iframe) {
		max-width: 100%;
		border-radius: 0.375rem;
		margin: 0.5rem 0;
	}

	.editor-content :global(.tiptap p) {
		margin: 0.25rem 0;
	}

	.hidden-input {
		display: none;
	}
</style>
