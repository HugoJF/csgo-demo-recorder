import * as logger from "./logger";
import * as paths from './paths';
import {execFile} from "child_process";

const [log, err] = logger.build('RECORDER');

export function record(demoPath, demoData) {
    return new Promise((res, rej) => {
        const args = [
            `-csgoExe "${paths.csgoExecPath()}"`,
            '-csgoLauncher',
            '-noGui',
            '-autoStart',
            `-customLaunchOptions`,
            `-novid +playdemo "${demoPath}" -windowed -w 1920 -h 1080`,
        ];

        log('Starting HLAE with parameters: ');
        args.forEach(arg => log(arg));

        log('Starting CS:GO, please wait...');
        execFile(paths.hlaeExecPath(), args, {}, (error, stdout, stderr) => {
            if (error) {
                err('HLAE finished with an error.', error);
                rej(error);
            } else {
                log('HLAE finished!');
                res(stdout);
            }
        });
    });
}
