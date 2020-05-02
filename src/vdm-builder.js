import {promises} from 'fs';
import config from './config';
import ejs from 'ejs';
import * as paths from './paths';
import * as logger from "./logger";

const {readFile, writeFile} = promises;

const DEBUG_MODE = false;
const [log, error] = logger.build('VDM_BUILDER');

class VdmBuilder {
    constructor(demo) {
        this.demo = demo;
        this.vdm = [];
    }

    addCommand(data) {
        this.vdm.push(data);
    }

    async serialize() {
        const template = (await readFile(paths.template('vdmCommand'))).toString();

        let index = 0;
        const context = {commands: {}};

        for (let command of this.vdm) {
            context.commands[index++] = command;
        }

        return ejs.render(template, context);
    }

    async writeToFile() {
        const data = await this.serialize();
        const path = paths.vdmLocation(this.demo.id);

        await writeFile(path, data);

        log(`.vdm written to ${path}`);
    }
}

export async function build(demo, data) {
    const builder = new VdmBuilder(demo);

    function addCommand(command) {
        builder.addCommand({
            factory: 'PlayCommands',
            name: 'spec',
            ...command
        })
    }

    config.csgoOptionalCommands.forEach((item) => {
        addCommand({
            starttick: config.csgoOptionalCommandsTick,
            commands: item,
        });
    });

    config.csgoRequiredCommands.forEach((item) => {
        addCommand({
            starttick: config.csgoRequiredCommandsTick,
            commands: item,
        });
    });

    addCommand({
        starttick: config.csgoRequiredCommandsTick,
        commands: 'mirv_streams record name \\"Z:\\\\CSGO_Recordings\\\\raw\\"',
    });

    addCommand({
        starttick: config.csgoStartRecordingTick,
        commands: `spec_lock_to_accountid ${demo.target_steam_id_64}`,
    });

    addCommand({
        starttick: config.csgoStartRecordingTick + config.csgoWarmupTicks,
        commands: 'mirv_streams add normal defaultNormal; mirv_streams edit defaultNormal settings afxFfmpegLosslessFast; mirv_streams record start'
    });

    addCommand({
        starttick: DEBUG_MODE ? config.csgoStartRecordingTick + config.csgoWarmupTicks + 200 : data.ticks - config.csgoWarmupTicks / 2,
        commands: 'mirv_streams record end'
    });

    addCommand({
        starttick: DEBUG_MODE ? config.csgoStartRecordingTick + config.csgoWarmupTicks + 250 : data.ticks - config.csgoWarmupTicks,
        commands: 'quit'
    });

    await builder.writeToFile();
}