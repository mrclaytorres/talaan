/**
 * Platform detection utilities for Capacitor + Electron.
 */

/**
 * Returns true when running inside an Electron renderer process.
 * Works because Electron's renderer exposes `window.process` with type 'renderer'.
 */
export function isElectron(): boolean {
	return (
		typeof window !== 'undefined' &&
		typeof window.process === 'object' &&
		(window.process as NodeJS.Process)?.type === 'renderer'
	);
}
