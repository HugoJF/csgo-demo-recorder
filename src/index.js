import fs from 'fs';
import axios from 'axios';
import _ from 'lodash';
import Multispinner from 'node-multispinner';
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

let progress;

const spinnerConfiguration = {
    download_demo: 'Download demo',
    upload_demo: 'Upload demo',
    analyse_demo: 'Analysis',
    metadata: 'Upload metadata',
    build_vdm: 'Build .vdm file',
    record_demo: 'Record demo',
    transcode_render: 'Transcode',
    cleanup: 'Cleanup',
    upload_render: 'Upload render',
};

async function processDemo(demo) {
    progress = new Multispinner(spinnerConfiguration, {});
    const started = Date.now();
    const {id: demoId, demoUrl} = demo;
    const demoPath = paths.demoPath(demoId);

    // Fetch demo
    log(`Fetching demo at ${demoUrl}`);
    await downloadDemo(demo);
    progress.success('download_demo');

    // Upload to bucket
    log(`Uploading file to Minio`);
    try {
        await minio.uploadFile(`${demoId}.dem`, demoPath, 'demos');

        progress.success('upload_demo');
    } catch (e) {
        error('Error uploading .dem to Minio', e);
    }

    // Parse demo header
    log(`Started demo analysis`);
    const demoData = await analyser.analyse(demoPath);
    progress.success('analyse_demo');

    // Upload metadata
    const playerData = metaUploader.uploadPlayerData(demoId, demoData.playerData)
        .catch(e => error('Error uploading player data to Calladmin', e));

    const chatData = metaUploader.uploadChatData(demoId, demoData.chat)
        .catch(e => error('Error uploading chat data to Calladmin', e));

    Promise.all([playerData, chatData])
        .then(() => progress.success('metadata'));

    // Debug
    let {min, sec} = utils.secondsToHumans(demoData.ticks / demoData.tickRate);
    log(`Total demo duration ${min}mins ${sec} seconds`);

    // Build .vdm for demo
    log('Building demo VDM');
    await vdmBuilder.build(demo, demoData);
    progress.success('build_vdm');

    // Record demo to .mp4
    log('Starting recorder...');
    await recorder.record(demoPath, demoData);
    progress.success('record_demo');

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
    progress.success('transcode_render');

    rimraf(paths.csgoRawRecordingsPath(), () => {
        log('Raw files deleted');
    });
    progress.success('cleanup');

    const finished = Date.now();
    let renderTime = utils.secondsToHumans((finished - started) / 1000);

    log('Transcoding finished!');
    log(`Demo processing took ${renderTime.min} minutes and ${renderTime.sec} seconds.`);

    // WTF is dis
    minio.uploadFile(`${demo.id}.mp4`, paths.transcodedPath(demo.id), 'video').then(() => {
        progress.success('upload_render');
    });
}

async function downloadDemo(demo) {
    let {id, legacyDemoUrl} = demo;
    let demoPath = paths.demoPath(id);

    function handleDownloadProgress(progress) {
        if (!progress.lengthComputable) {
            log('Demo download progress does not have a computable length');
            return;
        }

        downloadHud.start(demo.id, progress.total);
        downloadHud.update(progress.loaded);
    }

    const request = await axios.get(legacyDemoUrl, {
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
            Object.keys(spinnerConfiguration).forEach(progress.error.bind(progress));
            await sleep(5000);
            continue;
        }

        log(`Demo ${demo.id} fully processed!`);
        log(`Currently uploaded ${uploads} demos`);
    }
}

run();