import * as migration_20260228_071855_initial from './20260228_071855_initial';
import * as migration_20260228_120000_add_starting_capital from './20260228_120000_add_starting_capital';

export const migrations = [
  {
    up: migration_20260228_071855_initial.up,
    down: migration_20260228_071855_initial.down,
    name: '20260228_071855_initial'
  },
  {
    up: migration_20260228_120000_add_starting_capital.up,
    down: migration_20260228_120000_add_starting_capital.down,
    name: '20260228_120000_add_starting_capital'
  },
];
