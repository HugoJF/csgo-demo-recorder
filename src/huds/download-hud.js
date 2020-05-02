const _cliProgress = require('cli-progress');

let bar = undefined;

const start = (id, length) => {
    bar = new _cliProgress.Bar({
        format: `Downloading demo ${id} [{bar}] {percentage}% | ETA: {eta}s | {value}MB / {total}MB`
    }, _cliProgress.Presets.shades_classic);

    bar.start(Math.round(length / 1024 / 1024), 0);
};

const update = (totalDownloaded) => {
    bar.update(Math.round(totalDownloaded / 1024 / 1024));
};

const stop = () => {
    bar.stop();
    console.log();
};

exports.start = start;
exports.update = update;
exports.stop = stop;