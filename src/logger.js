import chalk from 'chalk';
import logUpdate from 'log-update';

const colors = [
    'red', 'green', 'yellow', 'blue', 'magenta', 'cyan',
    'redBright', 'greenBright', 'yellowBright', 'blueBright', 'magentaBright', 'cyanBright'
];
let index = 0;

export function build(prefix, logParams = [], errorParams = []) {
    return [
        log(prefix, ...logParams),
        error(prefix, ...errorParams),
    ]
}

function stdout(...args) {
    logUpdate.clear();
    logUpdate(args.join(' '));
    logUpdate.done();
}

export function log(prefix, prefixColor = null, bodyColor = 'gray') {
    if (!prefixColor) {
        prefixColor = colors[(++index >= colors.length) ? 0 : index];
    }

    return (...log) => {
        stdout(chalk[prefixColor](`[${prefix}]`), ...log.map((l) => chalk[bodyColor](l)))
    };
}

export function error(prefix, prefixColor = 'redBright', bodyColor = 'red') {
    return (...log) => {
        stdout(chalk.inverse[prefixColor](` ${prefix} `), ...log.map(l => chalk[bodyColor](l)))
    };
}