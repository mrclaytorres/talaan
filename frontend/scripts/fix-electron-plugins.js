/**
 * Post-sync script: re-registers the SQLite plugin in electron-plugins.js.
 * `cap sync` resets the file to an empty export, so this must run after every sync.
 */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const pluginFile = join(__dirname, '..', 'electron', 'src', 'rt', 'electron-plugins.js');

const content = `/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const CapacitorCommunitySqlite = require('@capacitor-community/sqlite/electron/dist/plugin.js');
module.exports = {
  CapacitorCommunitySqlite: CapacitorCommunitySqlite.default
};
`;

writeFileSync(pluginFile, content, 'utf-8');
console.log('Restored SQLite plugin registration in electron-plugins.js');
