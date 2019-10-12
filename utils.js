const math = require('mathjs');
const fs = require('fs');


const modifiedAt = (base, a, b) => fs.statSync(base + b).atimeMs - fs.statSync(base + a).atimeMs;
const wavExtension = (file) => file.match('.wav$');
const ticksToFrames = (ticks, tickrate, framerate) => math.round(ticks / tickrate * framerate);
const secondsToHumans = (s) => ({min: math.floor(s / 60), sec: math.floor(s % 60)});

const findLatestModifiedFile = (path, filter) => {
    return new Promise((res, rej) => {
        fs.readdir(path, (err, files) => {
            if (err) rej(err);

            if (filter)
                files = files.filter(filter);

            if (!files) {
                rej(false);
                return;
            }

            files.sort(modifiedAt.bind(null, path));

            if (files.length === 0) {
                rej(false);
                return;
            }

            res(files[0]);
        });
    });
};

exports.findLatestModifiedFile = findLatestModifiedFile;
exports.wavExtension = wavExtension;
exports.ticksToFrames = ticksToFrames;
exports.secondsToHumans = secondsToHumans;
exports.modifiedAt = modifiedAt;