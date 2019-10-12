const fs = require("fs");
const demofile = require("demofile");

/**
 * Parses demo header data at demoPath
 *
 * @param demoPath
 * @returns {Promise<any>}
 */
exports.analyse = function (demoPath) {
    return new Promise((res, rej) => {
        fs.readFile(demoPath, (err, buffer) => {
            // Check for errors
            if (err) rej(err);

            // Create parser
            const demoFile = new demofile.DemoFile();

            let demoInfo = {};
            let chat = [];

            // Only listen for meta data
            demoFile.on("start", () => {
                console.log('Raw demo header information', JSON.stringify(demoFile.header));
                let ticks = demoFile.header.playbackTicks;

                if (ticks === 0 || isNaN(ticks) || ticks < 3000) rej('Invalid tick count');

                demoInfo = {
                    ticks: ticks,
                    tickRate: demoFile.tickRate,
                };

                demoFile.cancel();
            });

            demoFile.userMessages.on('SayText2', (message) => {
                let idx = message.entIdx;
                let player = undefined;
                let players = demoFile.entities.players.filter((p) => p.index === idx);

                // Check if player entity was found
                if (players.length === 1)
                    player = players[0];

                // Avoids duplicate messages
                if (chat.length !== 0 && chat[chat.length - 1].message.msgName === message.msgName) return;

                // Print message
                console.log(player ? player.steamId : '---', ':', message.msgName);

                // Push message to chat stack
                chat.push({
                    steamid: player ? player.steamId : null,
                    message
                })
            });

            demoFile.on('end', () => {
                let playerData = demoFile.stringTables.findTableByName("userinfo").entries
                    .filter(e => e.userData)
                    .filter(e => !e.userData.fakePlayer)
                    .filter(e => !e.userData.isHltv);

                res({
                    ...demoInfo,
                    chat,
                    playerData,
                });
            });

            // Start parsing
            demoFile.parse(buffer);
        });
    });
};