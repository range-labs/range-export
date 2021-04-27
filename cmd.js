#!/usr/bin/env node

import Range from 'range-sdk';
import { join, resolve } from 'path';
import { writeFileSync, statSync } from 'fs';

import pkg from 'json-2-csv';
const { json2csvAsync } = pkg;

import { createRequire } from 'module';
const meow = createRequire(import.meta.url)('meow');

import { log, fatal } from './lib/printer.js';
import exportCheckins from './lib/export-checkins.js';

const commands = {
  'check-ins': exportCheckins,
};

const cli = meow(
  `
  Usage
    $ range-export <options> <cmd>

  Commands
    check-ins    Export check-in data

  Options
    --after, -a   Return data after this ISO timestamp
    --before, -b  Return data before this ISO timestamp
    --fmt         json or csv
    --out, -o     Output destination (default : ./)

  Examples
    $ range-export check-ins -a 2020-01-01 -b 2020-02-01 -o tmp.json
`,
  {
    autoHelp: true,
    allowUnknownFlags: false,
    flags: {
      after: {
        alias: 'a',
        type: 'string',
      },
      before: {
        alias: 'b',
        type: 'string',
      },
      fmt: {
        type: 'string',
        default: 'json',
      },
      out: {
        alias: 'o',
        type: 'string',
        default: '.',
      },
      help: {
        alias: 'h',
        type: 'boolean',
      },
    },
  }
);

if (['csv', 'json'].indexOf(cli.flags.fmt) === -1) {
  fatal(`Invalid flag value\n--fmt=${cli.flags.fmt}`);
}

if (cli.flags.after) {
  cli.flags.after = new Date(cli.flags.after);
  if (isNaN(cli.flags.after.valueOf())) {
    fatal(`Invalid date\n--after=${cli.flags.after}`);
  }
}

if (cli.flags.before) {
  cli.flags.before = new Date(cli.flags.before);
  if (isNaN(cli.flags.before.valueOf())) {
    fatal(`Invalid date\n--before=${cli.flags.before}`);
  }
}

cli.flags.out = resolve(cli.flags.out);
let stats;
try {
  stats = statSync(cli.flags.out);
  if (stats.isDirectory()) {
    cli.flags.out = join(cli.flags.out, `range-export.${cli.flags.fmt}`);
  }
} catch (e) {}

try {
  writeFileSync(cli.flags.out, '');
} catch (e) {
  fatal(`Out file isn't writable\n${e.message}`);
}

(async () => {
  try {
    const client = new Range();
    const cmd = commands[cli.input[0]];
    if (!cmd) fatal(`Unknown command\n${cli.input[0]}`);

    const data = await cmd(client, cli.flags);
    let fileData;
    if (cli.flags.fmt === 'csv') {
      fileData = await json2csvAsync(data, {
        unwindArrays: true,
        expandArrayObjects: true,
        emptyFieldValue: '',
      });
      log(`Writing data as CSV to ${cli.flags.out}`);
    } else {
      fileData = JSON.stringify(data, null, 2);
      log(`Writing data as JSON to ${cli.flags.out}`);
    }
    writeFileSync(cli.flags.out, fileData);
  } catch (e) {
    fatal(e.stack);
  }
})();
