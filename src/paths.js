import config from "./config";

export function root() {
    return './';
}

export function csgoDemoPath() {
    return `${config.csgoDemoPath}`;
}

export function csgoRawRecordingsPath(file = '') {
    if (file) {
        file = `\\${file}`;
    }
    return `${config.csgoRecordPath}${file}`;
}

export function csgoRecordingsPath() {
    return `${config.csgoRecordingsPath}`;
}

export function csgoRecordingPath(file) {
    return `${csgoRecordingsPath()}${file}`;
}

export function hlaeExecPath() {
    return `${config.hlaeExecPath}`;
}

export function csgoExecPath() {
    return `${config.csgoExecPath}`;
}

export function template(file) {
    return `${root()}templates/${file}.ejs`;
}

export function vdmLocation(file) {
    return `${csgoDemoPath()}${file}.vdm`;
}

export function demoPath(id) {
    return `${csgoDemoPath()}${id}.dem`;
}

export function transcodedPath(file) {
    return `${csgoRecordingsPath()}${file}.mp4`;
}