import fs from "fs";
import * as demofile from "demofile";
import _ from 'lodash';
import * as logger from "./logger";

const {readFile} = fs.promises;
const [log, error] = logger.build('ANALYSER');

export async function analyse(demoPath) {
    let analyser = new Analyser(demoPath);

    return await analyser.analyse();
}

class Analyser {
    constructor(demoPath) {
        this.chat = [];
        this.demoPath = demoPath;
    }

    async loadDemo() {
        this.demoContents = await readFile(this.demoPath);
    }

    onStart() {
        log('Raw demo header information:');
        Object.entries(this.demo.header).forEach(([key, value], i, arr) => {
            let last = (arr.length - 1) === i;
            log(last ? '└─' : '├─', `${key}:`, value);
        });

        let ticks = this.demo.header.playbackTicks;

        if (ticks === 0 || isNaN(ticks)) {
            this.reject('Invalid tick count');
            return;
        }

        if (ticks < 3000) {
            this.reject('The demo is too short (<3000 ticks)');
            return;
        }

        this.demoInfo = {
            ticks: ticks,
            tickRate: this.demo.tickRate,
            map: this.demo.header.mapName,
        };

        this.demo.cancel();
    }

    onMessage(message) {
        let idx = message.entIdx;
        let player = undefined;
        let players = this.demo.entities.players.filter((p) => p.index === idx);

        // Check if player entity was found
        if (players.length === 1)
            player = players[0];

        // Avoids duplicate messages
        if (!_.isEmpty(this.chat) && _.last(this.chat).message.msgName === message.msgName) {
            return;
        }

        // Print message
        log(player ? player.steamId : '---', ':', message.msgName);

        // Push message to chat stack
        this.chat.push({
            steamid: player ? player.steamId : null,
            message
        })
    }

    onEnd() {
        let playerData;

        try {
            playerData = this.demo.stringTables
                .findTableByName("userinfo").entries
                .filter(e => e.userData)
                .filter(e => !e.userData.fakePlayer)
                .filter(e => !e.userData.isHltv);
        } catch (e) {
            this.reject(e);

            return;
        }

        if (!this.resolve) {
            throw new Error('Demo analyser ended but there is no promise to resolve!');

            return;
        }

        this.resolve({
            ...this.demoInfo,
            chat: this.chat,
            playerData,
        });
    }

    async analyse() {
        this.promise = new Promise((res, rej) => {
            this.resolve = res;
            this.reject = rej;
        });

        await this.loadDemo();

        this.demo = new demofile.DemoFile();

        this.demo.on("start", this.onStart.bind(this));
        this.demo.userMessages.on('SayText2', this.onMessage.bind(this));
        this.demo.on('end', this.onEnd.bind(this));

        // Start parsing
        this.demo.parse(this.demoContents);

        return await this.promise;
    }
}