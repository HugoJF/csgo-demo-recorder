import ffmpeg from 'fluent-ffmpeg';
import * as paths from "./paths";
import * as logger from "./logger";

const [log, error] = logger.build('TRANSCODER');

export function transcode(options) {
    return new Promise((res, rej) => {
        const outputPath = paths.transcodedPath(options.fileName);
        let lastProgress = 0;
        ffmpeg()
            .input(options.videoPath)
            .inputFps(60)
            .input(options.audioPath)
            .audioCodec('libmp3lame')
            .videoCodec('libx264')
            .audioBitrate('256k')
            .videoBitrate('16000k')
            .outputFps(60)
            .output(outputPath)
            .on('progress', (progress) => {
                let p = Math.floor(progress.percent / 10) * 10;
                if (p !== lastProgress) {
                    log(`Processing: ${lastProgress = p}% done`)
                }
            })
            .on('end', res)
            .run();
    });
}