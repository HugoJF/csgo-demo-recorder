const fs = require('fs');
const config = require('./config');

let commandsIndex = 1;

exports.build = function (demo, data) {
    return new Promise((res, rej) => {
        let vdm = {};

        console.log('Building .vdm commands...');

        buildOptionalCommands(vdm);
        buildRequiredCommands(vdm);

        buildCommand(vdm, {
            factory: "PlayCommands",
            name: "spec",
            starttick: config.csgoRequiredCommandsTick,
            // TODO: dynamic
            // commands: "mirv_streams record name \\\"c:\\\\program files (x86)\\\\steam\\\\steamapps\\\\common\\\\Counter-Strike Global Offensive\\\\csgo\\\\raw\\\""
            commands: "mirv_streams record name \\\"Z:\\\\CSGO_Recordings\\\\raw\\\""
        });

        // buildCommand(vdm, {
        //     factory: "SkipAhead",
        //     name: "spec",
        //     starttick: config.csgoStartRecordingTick,
        //     skiptotick: config.csgoStartRecordingTick,
        // });

        buildCommand(vdm, {
            factory: "PlayCommands",
            name: "spec",
            starttick: config.csgoStartRecordingTick,
            commands: `spec_lock_to_accountid ${demo.target_steam_id_64}`,
        });

        buildCommand(vdm, {
            factory: "PlayCommands",
            name: "spec",
            starttick: config.csgoStartRecordingTick + config.csgoWarmupTicks,
            commands: "mirv_streams add normal defaultNormal; mirv_streams edit defaultNormal settings afxFfmpegLosslessFast; mirv_streams record start"
        });

        buildCommand(vdm, {
            factory: "PlayCommands",
            name: "spec",
            starttick: data.ticks - config.csgoWarmupTicks / 2,
            // starttick: config.csgoStartRecordingTick + config.csgoWarmupTicks + config.csgoDurationTicks,
            commands: "mirv_streams record end"
        });

        buildCommand(vdm, {
            factory: "PlayCommands",
            name: "spec",
            starttick: data.ticks - config.csgoWarmupTicks,
            // starttick: config.csgoStartRecordingTick + config.csgoWarmupTicks + config.csgoDurationTicks + 64,
            commands: "quit"
        });

        console.log('Building .vdm content...');
        let file = buildFile(vdm);

        console.log('.vdm built');
        fs.writeFile(config.csgoDemoPath + demo.id + '.vdm', file, () => {
            console.log('.vdm written to file!');
            res(file);
        });
    });
};

const buildFile = (vdm) => {
    let commandContents = buildCommandContents(vdm);
    return `demoactions
{
    ${commandContents}    
}`;
};

const buildCommandContents = (vdm) => {
    return Object.entries(vdm).map(buildCommandContent).join('');
};

const buildCommandContent = (command) => {
    let data = buildCommandData(command[1]);
    return `
    "${command[0]}"
    {
${data}
    }`;
};

const buildCommandData = (data) => {
    let space = ' '.repeat(8);
    return Object.entries(data).map((d) => `${space}${d[0]} "${d[1]}"`).join('\n')
};

const buildCommand = (vdm, data) => {
    return vdm[commandsIndex++] = data;
};

const buildRequiredCommands = (vdm) => {
    config.csgoRequiredCommands.forEach((item) => {
        buildCommand(vdm, {
            factory: "PlayCommands",
            name: "spec",
            starttick: config.csgoRequiredCommandsTick,
            commands: item,
        });
    });
};

const buildOptionalCommands = (vdm) => {
    config.csgoOptionalCommands.forEach((item) => {
        buildCommand(vdm, {
            factory: "PlayCommands",
            name: "spec",
            starttick: config.csgoOptionalCommandsTick,
            commands: item,
        });
    });
};