import { randomBytes } from 'crypto';
import { ipcRenderer, contextBridge } from 'electron';
import { EventEmitter } from 'events';

////////////////////////////////////////////////////////
let plugins: any = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  plugins = require('./electron-plugins');
} catch (err) {
  console.error('[electron-rt] Failed to load electron-plugins:', err);
}

const randomId = (length = 5) => randomBytes(length).toString('hex');

const contextApi: {
  [plugin: string]: { [functionName: string]: () => Promise<any> };
} = {};

/**
 * Resolve the actual plugin classes from a plugin module export.
 * `cap sync` generates: { CapacitorCommunitySqlite } where the value is the
 * raw CJS module `{ default: { CapacitorSQLite: [class] } }`.
 * The manual fix writes: { CapacitorCommunitySqlite: module.default } which is
 * already `{ CapacitorSQLite: [class] }`.
 * This helper unwraps `.default` when needed so both formats work.
 */
function resolvePluginClasses(pluginModule: any): Record<string, any> {
  const keys = Object.keys(pluginModule).filter((k) => k !== 'default');
  if (keys.length > 0) {
    // Already unwrapped (manual fix format): { CapacitorSQLite: [class] }
    return pluginModule;
  }
  // Raw CJS module: only has 'default' key — unwrap it
  if (pluginModule.default && typeof pluginModule.default === 'object') {
    return pluginModule.default;
  }
  return pluginModule;
}

Object.keys(plugins).forEach((pluginKey) => {
  try {
    const pluginClasses = resolvePluginClasses(plugins[pluginKey]);
    Object.keys(pluginClasses)
      .filter((className) => className !== 'default')
      .forEach((classKey) => {
        const pluginClass = pluginClasses[classKey];
        if (!pluginClass || !pluginClass.prototype) return;

        const functionList = Object.getOwnPropertyNames(pluginClass.prototype).filter(
          (v) => v !== 'constructor'
        );

        if (!contextApi[classKey]) {
          contextApi[classKey] = {};
        }

        functionList.forEach((functionName) => {
          if (!contextApi[classKey][functionName]) {
            contextApi[classKey][functionName] = (...args) => ipcRenderer.invoke(`${classKey}-${functionName}`, ...args);
          }
        });

        // Events
        if (pluginClass.prototype instanceof EventEmitter) {
          const listeners: { [key: string]: { type: string; listener: (...args: any[]) => void } } = {};
          const listenersOfTypeExist = (type) =>
            !!Object.values(listeners).find((listenerObj) => listenerObj.type === type);

          Object.assign(contextApi[classKey], {
            addListener(type: string, callback: (...args) => void) {
              const id = randomId();

              // Deduplicate events
              if (!listenersOfTypeExist(type)) {
                ipcRenderer.send(`event-add-${classKey}`, type);
              }

              const eventHandler = (_, ...args) => callback(...args);

              ipcRenderer.addListener(`event-${classKey}-${type}`, eventHandler);
              listeners[id] = { type, listener: eventHandler };

              return id;
            },
            removeListener(id: string) {
              if (!listeners[id]) {
                throw new Error('Invalid id');
              }

              const { type, listener } = listeners[id];

              ipcRenderer.removeListener(`event-${classKey}-${type}`, listener);

              delete listeners[id];

              if (!listenersOfTypeExist(type)) {
                ipcRenderer.send(`event-remove-${classKey}-${type}`);
              }
            },
            removeAllListeners(type: string) {
              Object.entries(listeners).forEach(([id, listenerObj]) => {
                if (!type || listenerObj.type === type) {
                  ipcRenderer.removeListener(`event-${classKey}-${listenerObj.type}`, listenerObj.listener);
                  ipcRenderer.send(`event-remove-${classKey}-${listenerObj.type}`);
                  delete listeners[id];
                }
              });
            },
          });
        }
      });
  } catch (err) {
    console.error(`[electron-rt] Failed to register plugin "${pluginKey}":`, err);
  }
});

contextBridge.exposeInMainWorld('CapacitorCustomPlatform', {
  name: 'electron',
  plugins: contextApi,
});

// Also expose SQLite plugin methods directly as a top-level bridge.
// This serves as a fallback if CapacitorCustomPlatform.plugins.CapacitorSQLite
// is not accessible from the renderer (contextBridge serialization edge cases).
if (contextApi['CapacitorSQLite']) {
  contextBridge.exposeInMainWorld('electronCapSQLite', contextApi['CapacitorSQLite']);
}
////////////////////////////////////////////////////////
