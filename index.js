require('dotenv').config();
const config = require('./config');
const dependencies = require('./dependencies');
const analyser = require('./analyser');
const recorder = require('./recorder');
const transcoder = require('./transcoder');
const vdmBuilder = require('./vdm-builder');
const metaUploader = require('./meta-uploader');
const api = require('./api');
const request = require('request');
const fs = require('fs');
const {findLatestModifiedFile, secondsToHumans, wavExtension} = require('./utils');
const {start, update, stop} = require('./huds/download-hud');
const rimraf = require('rimraf');
const {prepare, uploadFile, fileExists} = require('./minio');

const started = (new Date()).getTime();
const buildDemoPath = (id) => (config.csgoDemoPath + id + '.dem');


async function processDemo(demo) {
    let {id, demoUrl} = demo;
    let demoPath = buildDemoPath(id);

    // Fetch demo
    console.log('Fetching demo at ' + demoUrl);
    await downloadDemo(demo);

    // Check if path exists
    dependencies.checkDemo(demoPath);

    // Upload to bucket
    uploadFile(`${id}.dem`, demoPath, 'demos');

    // Parse demo header
    let data = await analyser.analyse(demoPath);

    // Upload metadata
    metaUploader.uploadPlayerData(id, data.playerData);
    metaUploader.uploadChatData(id, data.chat);

    // Debug
    let {min, sec} = secondsToHumans(data.ticks / data.tickRate);
    console.log(`Total demo duration ${min}mins ${sec} seconds`);

    // Build .vdm for demo
    await vdmBuilder.build(demo, data);
    console.log('Starting recorder...');

    // Record demo to .mp4
    // TODO: remove HUD
    await recorder.record(demoPath, data);

    // Find latest takeNNNN folder generated
    let file = await findLatestModifiedFile(config.csgoRecordPath);
    let recordingPath = config.csgoRecordPath + file;
    console.log('Demo was recorded on', recordingPath);

    // Find latest audio file generated
    let audioFile = await findLatestModifiedFile(recordingPath, wavExtension);
    console.log('Audio file was', audioFile);

    // Transcode recording
    await transcoder.transcode({
        videoPath: `${recordingPath}\\defaultNormal\\`,
        audioPath: `${recordingPath}\\${audioFile}`,
        fileName: demo.id,
        onProgress: (progress) => {
            console.log(`Processing: ${progress.percent}% done`);
        },
    });

    rimraf(config.csgoRecordPath, () => {
        console.log('Raw files deleted');
    });

    const finished = (new Date()).getTime();
    let transcodeTime = secondsToHumans((finished - started) / 1000);

    min = transcodeTime.min;
    sec = transcodeTime.sec;

    console.log('Transcoding finished!');
    console.log(`Demo processing took ${min} minutes and ${sec} seconds.`);

    uploadFile(`${demo.id}.mp4`, transcoder.transcodedPath(demo.id), 'video');
}

function downloadDemo(demo) {
    return new Promise((res, rej) => {
        let totalDownloaded = 0;

        let {id, demoUrl} = demo;
        let demoPath = buildDemoPath(id);

        request
            .get(demoUrl, {timeout: 2000}, (err, response, body) => {
                stop();

                if (response && response.statusCode === 200) {
                    console.log(`Demo download finished with response code: ${response.statusCode}`);
                    res(true);
                } else {
                    rej(err);
                }
            })
            .on('response', (data) => {
                start(demo.id, data.headers['content-length']);
            })
            .on('data', (chunk) => {
                totalDownloaded += chunk.length;
                update(totalDownloaded);
            })
            .pipe(fs.createWriteStream(demoPath));
    })
}

async function run() {
    await prepare();

    let demos = await api.fetchDemos();
    console.log(`API returned ${demos.length} demos`);

    console.log(`Found ${demos.length} demos to process!`);
    let uploads = 0;

    for (let i = 0; i < demos.length; i++) {
        let demo = demos[i];

        try {
            await fileExists(`${demo.id}.mp4`, 'video');

            console.log(`Already found a demo recorded, ignoring ID ${demo.id}`);

            continue;
        } catch (e) {
            console.log(`MinIO reported video not found for demo ${demo.id}`);
        }

        console.log(`Processing demo ${demo.id}...`);

        try {
            await processDemo(demo);
            uploads++;
        } catch (e) {
            console.log('Error processing demo', e);
        }

        console.log(`Demo ${demo.id} processed!`);
        console.log(`Currently uploaded ${uploads}/6`);
    }
}


run();