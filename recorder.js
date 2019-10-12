const config = require('./config');
const {execFile} = require('child_process');
const {start, stop} = require('./huds/recorder-hud');

exports.record = function (demoPath, demoData) {
    return new Promise((res, rej) => {
        const hlae = config.hlaeExecPath;
        const customOptions = `-novid +playdemo "${demoPath}" -w 1920 -h 1080 -windowed`;
        const params = [
            `-csgoExe ${config.csgoExecPath}`,
            '-csgoLauncher',
            '-noGui',
            '-autoStart',
            `-customLaunchOptions`,
            customOptions
        ];

        console.log('Starting HLAE...');
        start(demoData);
        console.log('Starting CS:GO, please wait...');
        execFile(hlae, params, {}, (error, stdout, stderr) => {
            stop();
            if (error) {
                console.log('HLAE finished with an error.', error);
                rej(error);
                return;
            }

            if (!error) {
                console.log('HLAE successfully finished!');
                res(stdout);
            }
        });
    });
};
