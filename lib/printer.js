import chalk from 'chalk';

const errorColor = chalk.bold.red;

export function fatal(str) {
  error(str);
  process.exit(1);
}

export function error(str) {
  console.error(errorColor(str));
}

export function info(str) {
  console.log(chalk.bold(str));
}

export function log(str) {
  console.log(str);
}

import { createRequire } from 'module';
const cliProgress = createRequire(import.meta.url)('cli-progress');

export function progress(total, start) {
  let bar = new cliProgress.SingleBar({}, cliProgress.Presets.rect);
  bar.start(total, start);

  return {
    increment: () => bar.increment(),
    setTotal: v => bar.setTotal(v),
    update: v => bar.update(v),
    stop: () => {
      bar.stop();
      bar = null;
    },
  };
}
