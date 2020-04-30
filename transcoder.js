const ffmpeg = require('fluent-ffmpeg');
const config = require('./config');

const transcode = (options) => {
    return new Promise((res, rej) => {
        ffmpeg()
            .input(options.videoPath + 'video.mp4')
            .inputFps(60)
            .input(options.audioPath)
            .audioCodec('libmp3lame')
            .videoCodec('libx264')
            .audioBitrate('256k')
            .videoBitrate('16000k')
            .outputFps(60)
            .output(transcodedPath(options.fileName))
            .on('progress', options.onProgress)
            .on('end', () => {
                res();
            })
            .on('stderr', function (stderrLine) {
                // console.log('Stderr output: ' + stderrLine);
            })
            .run();
    });
};

transcodedPath = (fileName) => `${config.csgoRecordingsPath}${fileName}.mp4`;

module.exports = {
    transcode: transcode,
    transcodedPath: transcodedPath,
};