const fs = require('fs');
const config = require('../config');
const {findLatestModifiedFile, ticksToFrames} = require("../utils");

const _cliProgress = require('cli-progress');

const recorded = config.csgoRecordPath;

let bar = undefined;
let timerHandle = undefined;
let first = undefined;
let demo = undefined;

const start = (d) => {
    demo = d;
    timerHandle = setInterval(timer, 1000);
};

const buildBar = () => {
    bar = new _cliProgress.Bar({
        format: `Recording demo [{bar}] {percentage}% | ETA: {eta}s | {value} frames / {total} frames`
    }, _cliProgress.Presets.shades_classic);

    let duration = demo.ticks - 1.5 * config.csgoWarmupTicks - config.csgoStartRecordingTick;
    // TODO: tickrate should match demo
    // TODO: fps should match recording
    let frames = ticksToFrames(duration, 128, 60);
    console.log(`Recording ${duration} frames`);

    bar.start(frames, 0);
};

const update = (frames) => {
    bar.update(frames);
};

const stop = () => {
    if (bar) bar.stop();
    bar = undefined;
    clearInterval(timerHandle);
};

const timer = () => {
    findLatestModifiedFile(recorded).then((file) => {
        fs.readdir(recorded + file + '\\defaultNormal\\', (err, files) => {
            if (err) return;
            if (!files) return;
            if (first === undefined) first = files.length;
            if (files.length === first) return;
            if (!bar) buildBar();

            update(files.length);

            if (err)
                console.log('Error reading recording files dir', err);
        });
    }).catch((e) => {
        console.log('Waiting for recording files...');
    });
};

exports.start = start;
exports.update = update;
exports.stop = stop;