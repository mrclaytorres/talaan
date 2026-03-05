<script lang="ts">
	import type { TradeImage } from '$lib/types/index.js';
	import { getDataService } from '$lib/services/index.js';
	import { validateMimeType } from '$lib/utils/validators.js';

	interface Props {
		tradeId: string;
		images: TradeImage[];
		editable?: boolean;
	}

	let { tradeId, images = $bindable([]), editable = false }: Props = $props();

	let uploading = $state(false);
	let error = $state('');
	let lightboxIndex = $state<number | null>(null);

	function fullSrc(image: TradeImage): string {
		return image.sizes?.medium?.url ?? image.url ?? image.filePath ?? '';
	}

	function thumbSrc(image: TradeImage): string {
		return image.sizes?.thumbnail?.url ?? image.url ?? image.filePath ?? '';
	}

	function openLightbox(index: number) {
		lightboxIndex = index;
	}

	function closeLightbox() {
		lightboxIndex = null;
	}

	function prev() {
		if (lightboxIndex !== null) {
			lightboxIndex = (lightboxIndex - 1 + images.length) % images.length;
		}
	}

	function next() {
		if (lightboxIndex !== null) {
			lightboxIndex = (lightboxIndex + 1) % images.length;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (lightboxIndex === null) return;
		if (e.key === 'Escape') closeLightbox();
		if (e.key === 'ArrowLeft') prev();
		if (e.key === 'ArrowRight') next();
	}

	async function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const files = input.files;
		if (!files || files.length === 0) return;

		error = '';
		uploading = true;

		try {
			const ds = getDataService();
			for (const file of Array.from(files)) {
				if (!validateMimeType(file.type)) {
					error = `Invalid file type: ${file.type}. Use PNG, JPEG, WebP, or GIF.`;
					continue;
				}
				const uploaded = await ds.uploadImage(tradeId, file);
				images = [...images, uploaded];
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Upload failed';
		} finally {
			uploading = false;
			const input2 = e.target as HTMLInputElement;
			input2.value = '';
		}
	}

	async function deleteImage(imageId: string) {
		try {
			const ds = getDataService();
			await ds.deleteImage(imageId);
			images = images.filter((img) => img.id !== imageId);
			if (lightboxIndex !== null && lightboxIndex >= images.length) {
				lightboxIndex = images.length > 0 ? images.length - 1 : null;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Delete failed';
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="image-attachment">
	{#if images.length > 0}
		<div class="image-grid">
			{#each images as image, i}
				<div class="image-item">
					<button
						class="thumb-btn"
						type="button"
						onclick={() => openLightbox(i)}
						aria-label="View {image.fileName}"
					>
						<img src={thumbSrc(image)} alt={image.fileName} class="image-thumb" />
					</button>
					{#if editable}
						<button
							class="delete-btn"
							type="button"
							onclick={() => deleteImage(image.id)}
							aria-label="Delete {image.fileName}"
						>
							&times;
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	{#if editable}
		<div class="upload-area">
			<label class="upload-label">
				<input
					type="file"
					accept="image/png,image/jpeg,image/webp,image/gif"
					multiple
					class="upload-input"
					onchange={handleFileSelect}
					disabled={uploading}
				/>
				<span class="upload-text">
					{#if uploading}
						Uploading...
					{:else}
						+ Add Images
					{/if}
				</span>
			</label>
		</div>
	{/if}

	{#if error}
		<p class="error" role="alert">{error}</p>
	{/if}
</div>

<!-- Lightbox -->
{#if lightboxIndex !== null}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="lightbox-overlay"
		role="dialog"
		aria-modal="true"
		aria-label="Image viewer"
		onclick={closeLightbox}
		onkeydown={handleKeydown}
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="lightbox-content" onclick={(e) => e.stopPropagation()}>
			<img
				src={fullSrc(images[lightboxIndex])}
				alt={images[lightboxIndex].fileName}
				class="lightbox-img"
			/>

			{#if images.length > 1}
				<button class="lb-arrow lb-prev" type="button" onclick={prev} aria-label="Previous">&#8249;</button>
				<button class="lb-arrow lb-next" type="button" onclick={next} aria-label="Next">&#8250;</button>
				<span class="lb-counter">{lightboxIndex + 1} / {images.length}</span>
			{/if}
		</div>

		<button class="lb-close" type="button" onclick={closeLightbox} aria-label="Close">&times;</button>
	</div>
{/if}

<style>
	.image-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.image-item {
		position: relative;
		border-radius: 0.375rem;
		overflow: hidden;
		aspect-ratio: 1;
	}

	.thumb-btn {
		display: block;
		width: 100%;
		height: 100%;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
	}

	.image-thumb {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: opacity 0.15s;
	}

	.thumb-btn:hover .image-thumb {
		opacity: 0.85;
	}

	.delete-btn {
		position: absolute;
		top: 0.25rem;
		right: 0.25rem;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 50%;
		border: none;
		background: rgba(0, 0, 0, 0.6);
		color: white;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.upload-label {
		display: inline-block;
		cursor: pointer;
	}

	.upload-input {
		display: none;
	}

	.upload-text {
		display: inline-flex;
		align-items: center;
		padding: 0.5rem 1rem;
		border: 2px dashed var(--color-border, #d1d5db);
		border-radius: 0.5rem;
		color: var(--color-text-muted, #6b7280);
		font-size: 0.875rem;
		transition: border-color 0.15s;
	}

	.upload-text:hover {
		border-color: var(--color-primary, #2563eb);
	}

	.error {
		font-size: 0.75rem;
		color: var(--color-danger, #dc2626);
		margin: 0.25rem 0 0;
	}

	/* ── Lightbox ── */
	.lightbox-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.92);
		z-index: 2000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.lightbox-content {
		position: relative;
		max-width: 100%;
		max-height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.lightbox-img {
		max-width: min(90vw, 1200px);
		max-height: 85vh;
		object-fit: contain;
		border-radius: 0.5rem;
		display: block;
	}

	.lb-close {
		position: fixed;
		top: 1rem;
		right: 1rem;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		border: none;
		background: rgba(255, 255, 255, 0.15);
		color: white;
		font-size: 1.5rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	.lb-close:hover {
		background: rgba(255, 255, 255, 0.25);
	}

	.lb-arrow {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 50%;
		border: none;
		background: rgba(255, 255, 255, 0.15);
		color: white;
		font-size: 1.75rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	.lb-arrow:hover {
		background: rgba(255, 255, 255, 0.25);
	}

	.lb-prev {
		left: -3.5rem;
	}

	.lb-next {
		right: -3.5rem;
	}

	@media (max-width: 640px) {
		.lb-prev {
			left: 0.25rem;
		}
		.lb-next {
			right: 0.25rem;
		}
	}

	.lb-counter {
		position: absolute;
		bottom: -2rem;
		left: 50%;
		transform: translateX(-50%);
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.875rem;
	}
</style>
