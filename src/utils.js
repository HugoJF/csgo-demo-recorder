import fs from 'fs';
import {promisify} from 'util';

const readdir = promisify(fs.readdir);

export const modifiedAt = (base) => (a, b) => fs.statSync(base + b).atimeMs - fs.statSync(base + a).atimeMs;
export const isWav = (file) => file.match('.wav$');
export const ticksToFrames = (ticks, tickrate, framerate) => Math.round(ticks / tickrate * framerate);
export const secondsToHumans = (s) => ({min: Math.floor(s / 60), sec: Math.floor(s % 60)});
export const cleanMessage = (msg) => (msg.replace('\u0001\u000b\u0003', '').replace('\u0001', ''));

export async function findLatestModifiedFile(path, filter) {
    let files = await readdir(path);

    if (filter) {
        files = files.filter(filter);
    }

    if (!files || files.length === 0) {
        throw new Error('Could not find any files in directory');
    }

    files.sort(modifiedAt(path));

    return files[0];
}