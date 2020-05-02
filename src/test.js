import * as utils from "./utils";
import * as paths from "./paths";

const test = require('ejs');
const fs = require('fs');
const c = require('chalk');
// const template = fs.readFileSync('./../templates/vdmCommand.ejs');
const _ = require('lodash');
const logUpdate = require('log-update');
const multispinner = require('node-multispinner');

const frames = ['-', '\\', '|', '/'];
let i = 0;

const spinner = new multispinner({
    'step_1': 'Step 1',
    'step_2': 'Step 2',
    'step_3': 'Step 3',
    'step_4': 'Step 4',
}, {
    interval: 100
});
const spinner2 = new multispinner({
    'step_1': 'ASDASD 1',
    'step_2': 'ASDASD 2',
    'step_3': 'ASDASD 3',
    'step_4': 'ASDASD 4',
}, {
    interval: 100
});

setTimeout(() => {
    spinner.success('step_1');
}, 1000);
setTimeout(() => {
    spinner.success('step_2');
}, 2500);
setTimeout(() => {
    spinner.success('step_3');
}, 4000);

let nn = Date.now();
let aa = setInterval(() => {
    stdout(1);
}, 500);

let bb = setInterval(() => {
    stdout(2);
}, 1000);
let cc = setInterval(() => {
    stdout(3);
}, 2500);

setTimeout(() => {
    clearInterval(aa);
    clearInterval(bb);
    clearInterval(cc);
}, 5000);

function stdout(a) {
    logUpdate.clear();
    logUpdate(Date.now() - nn, 'hey', a);
    logUpdate.done();
}

// const render = ejs.render(template.toString(), {
//     commands: [
//         {
//             factory: 'PlayCommands',
//             name: 'spec',
//             starttick: 16448,
//             commands: 'mirv_streams record end'
//         },
//         {
//             factory: 'PlayCommands',
//             name: 'spec',
//             starttick: 16448,
//             commands: 'mirv_streams record end'
//         }
//     ]
// });
// console.log("===================");
// console.log(render);
// console.log("===================");