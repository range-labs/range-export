#!/usr/bin/env node

import Range from 'range-sdk';
import { basename, dirname, join, resolve } from 'path';
import { writeFileSync, statSync, createWriteStream, existsSync, mkdirSync } from 'fs';
import https from 'https';

import pkg from 'json-2-csv';
const { json2csvAsync } = pkg;

import { createRequire } from 'module';
const meow = createRequire(import.meta.url)('meow');

import { log, fatal, error } from './lib/printer.js';
import exportCheckins from './lib/export-checkins.js';
import renderCheckinsToHtml from './lib/render-checkins-to-html.js';

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
    --target      Return data just for this target ID (user ID or team ID)
    --fmt         json, csv, or html
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
      target: {
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

if (['csv', 'json', 'html'].indexOf(cli.flags.fmt) === -1) {
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

// Set up image export directory for formats with image export.
let saveImage = undefined;
if (cli.flags.fmt === 'html') {
  const imgDirname = 'range-export';
  const imgPath = resolve(join(dirname(cli.flags.out), imgDirname));
  if (!existsSync(imgPath)) {
    mkdirSync(imgPath);
  }
  saveImage = (name, url) => {
    const baseName = basename(name);
    const imgFile = createWriteStream(join(imgPath, baseName));
    https.get(url, function(resp) {
      const { statusCode } = resp;
      if (statusCode !== 200) {
        error(`Failed to download image: (${statusCode}) ${url}`);
        resp.resume();
        return;
      }
      resp.pipe(imgFile);
      imgFile.on("finish", () => {
        imgFile.close();
      })
    });
    return join(imgDirname, baseName);
  }
}

(async () => {
  try {
    const client = new Range();
    const cmd = commands[cli.input[0]];
    if (!cmd) fatal(`Unknown command\n${cli.input[0]}`);

    const data = await cmd(client, { ...cli.flags, saveImage });
    let fileData;
    if (cli.flags.fmt === 'csv') {
      fileData = await json2csvAsync(data, {
        unwindArrays: true,
        expandArrayObjects: true,
        emptyFieldValue: '',
      });
    } else if (cli.flags.fmt === 'html') {
      fileData = renderCheckinsToHtml(data);
    } else {
      fileData = JSON.stringify(data, null, 2);
    }
    log(`Writing data as ${cli.flags.fmt} to ${cli.flags.out}`);
    writeFileSync(cli.flags.out, fileData);
  } catch (e) {
    fatal(e.stack);
  }
})();
