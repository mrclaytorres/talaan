/**
 * Platform detection utilities for Capacitor + Electron.
 */

/**
 * Returns true when running inside an Electron renderer process.
 * Detects via the `electronFS` bridge exposed by the preload script
 * (contextIsolation prevents access to `window.process`).
 */
export function isElectron(): boolean {
	return typeof window !== 'undefined' && window.electronFS !== undefined;
}
