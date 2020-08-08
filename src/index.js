import fs from 'fs';
import axios from 'axios';
import rimraf from 'rimraf';
import PrettyError from "pretty-error";
import * as analyser from './analyser';
import * as recorder from './recorder';
import * as transcoder from './transcoder';
import * as vdmBuilder from './vdm-builder';
import * as metaUploader from './meta-uploader';
import * as api from './api';
import * as minio from './minio';
import * as paths from './paths';
import * as utils from './utils';
import * as downloadHud from './huds/download-hud';
import * as logger from './logger';
import sleep from './sleep';

const [log, error] = logger.build('MAIN');
const pe = new PrettyError();

pe.appendStyle({
    'pretty-error': {
        display: 'block',
        marginTop: 1,
        marginLeft: 4
    },
    'pretty-error > header > title > kind': {
        background: 'bright-red',
        padding: '0 1 0 1',
        color: 'black'
    }
});

const spinnerConfiguration = {
    download_demo: 'Download demo',
    // upload_demo: 'Upload demo',
    analyse_demo: 'Analysis',
    metadata: 'Upload metadata',
    build_vdm: 'Build .vdm file',
    record_demo: 'Record demo',
    transcode_render: 'Transcode',
    cleanup: 'Cleanup',
    upload_render: 'Upload render',
};

async function processDemo(demo) {
    const started = Date.now();
    const {id: demoId, demoUrl} = demo;
    const demoPath = paths.demoPath(demoId);

    await downloadDemo(demo);

    // Upload to bucket
    // log(`Uploading file to Minio`);
    // try {
    //     await minio.uploadFile(`${demoId}.dem`, demoPath, 'demos');
    // } catch (e) {
    //     error('Error uploading .dem to Minio', e);
    // }

    // Parse demo header
    log(`Started demo analysis`);
    const demoData = await analyser.analyse(demoPath);

    // Upload metadata
    metaUploader.uploadPlayerData(demoId, demoData.playerData)
        .catch(e => error('Error uploading player data to Calladmin', e));

    metaUploader.uploadChatData(demoId, demoData.chat)
        .catch(e => error('Error uploading chat data to Calladmin', e));

    // Debug
    let {min, sec} = utils.secondsToHumans(demoData.ticks / demoData.tickRate);
    log(`Total demo duration ${min}mins ${sec} seconds`);

    // Build .vdm for demo
    log('Building demo VDM');
    await vdmBuilder.build(demo, demoData);

    // Record demo to .mp4
    log('Starting recorder...');
    await recorder.record(demoPath, demoData);

    // Find latest takeNNNN folder generated
    let takeNumber = await utils.findLatestModifiedFile(paths.csgoRawRecordingsPath());
    let recordingPath = paths.csgoRawRecordingsPath(takeNumber);
    log(`Demo files were recorded to ${recordingPath}`);

    // Find latest audio file generated
    let audioFile = await utils.findLatestModifiedFile(recordingPath, utils.isWav);
    log(`Audio file is named ${audioFile}`);

    // Transcode recording
    await transcoder.transcode({
        fileName: demoId,
        videoPath: `${recordingPath}\\defaultNormal\\video.mp4`,
        audioPath: `${recordingPath}\\${audioFile}`,
    });

    rimraf(paths.csgoRawRecordingsPath(), () => {
        log('Raw files deleted');
    });

    const finished = Date.now();
    let renderTime = utils.secondsToHumans((finished - started) / 1000);

    log('Transcoding finished!');
    log(`Demo processing took ${renderTime.min} minutes and ${renderTime.sec} seconds.`);

    // WTF is dis
    minio.uploadFile(`${demo.id}.mp4`, paths.transcodedPath(demo.id), 'video');
}

async function downloadDemo(demo) {
    let {id} = demo;
    let demoPath = paths.demoPath(id);

    function handleDownloadProgress(progress) {
        if (!progress.lengthComputable) {
            log('Demo download progress does not have a computable length');
            return;
        }

        downloadHud.start(demo.id, progress.total);
        downloadHud.update(progress.loaded);
    }

    let demoUrl = `https://minio.epsilon.denerdtv.com/calladmin/demos/${demo.id}.dem`;

    log(`Fetching demo at ${demoUrl}`);

    const request = await axios.get(demoUrl, {
        responseType: 'stream',
        onDownloadProgress: handleDownloadProgress
    });

    request.data.pipe(fs.createWriteStream(demoPath));

    if (!request || request.status !== 200) {
        throw new Error(`Error while trying to download demo: Code ${request.status} ${request.statusText}`);
    }

    await new Promise((res, rej) => {
        request.data.on('end', res);
        // TODO: error
    });

    log(`Demo download finished with status ${request.status}`);
}

async function run() {
    await minio.prepare();

    const {data: demos} = await api.fetchDemos();

    log(`API returned ${demos.length} demos`);

    log(`Found ${demos.length} demos to process!`);
    let uploads = 0;

    for (let demo of demos) {
        try {
            await minio.fileExists(`${demo.id}.mp4`, 'video');

            log(`Already found a demo recorded, ignoring ID ${demo.id}`);

            continue;
        } catch (e) {
            log(`MinIO reported video not found for demo ${demo.id}`);
        }

        log(`Processing demo ${demo.id}...`);

        try {
            await processDemo(demo);
        } catch (e) {
            error('Error while processing demo');
            console.error(pe.render(e));
            await sleep(5000);
            continue;
        }

        log(`Demo ${demo.id} fully processed!`);
        log(`Currently uploaded ${uploads} demos`);
    }
}

run();