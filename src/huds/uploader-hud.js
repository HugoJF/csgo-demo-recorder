const _cliProgress = require('cli-progress');

let bar = undefined;

const start = (bytes) => {
    bar = new _cliProgress.Bar({
        format: `Uploading recording [{bar}] {percentage}% | ETA: {eta}s | {value} bytes / {total} bytes`
    }, _cliProgress.Presets.shades_classic);

    bar.start(bytes, 0);
};

const update = (frames) => {
    bar.update(frames);
};

const stop = () => {
    bar.stop();
};

exports.start = start;
exports.update = update;
exports.stop = stop;