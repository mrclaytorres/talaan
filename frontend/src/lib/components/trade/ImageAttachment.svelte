<script lang="ts">
	import type { TradeImage } from '$lib/types/index.js';
	import { getDataService } from '$lib/services/index.js';
	import { validateMimeType } from '$lib/utils/validators.js';
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		tradeId: string;
		images: TradeImage[];
		editable?: boolean;
	}

	let { tradeId, images = $bindable([]), editable = false }: Props = $props();

	let uploading = $state(false);
	let error = $state('');

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
			// Reset input
			const input2 = e.target as HTMLInputElement;
			input2.value = '';
		}
	}

	async function deleteImage(imageId: string) {
		try {
			const ds = getDataService();
			await ds.deleteImage(imageId);
			images = images.filter((img) => img.id !== imageId);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Delete failed';
		}
	}
</script>

<div class="image-attachment">
	{#if images.length > 0}
		<div class="image-grid">
			{#each images as image}
				<div class="image-item">
					<img
						src={image.sizes?.thumbnail?.url ?? image.url ?? image.filePath}
						alt={image.fileName}
						class="image-thumb"
					/>
					{#if editable}
						<button
							class="delete-btn"
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

	.image-thumb {
		width: 100%;
		height: 100%;
		object-fit: cover;
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
</style>
