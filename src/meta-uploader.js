import {cleanMessage} from "./utils";
import axios from 'axios';
import {api} from "./config";
import * as logger from "./logger";

const [log, error] = logger.build('META_UPLOADER');

async function post(url, body) {
    let response = await axios.post(url, body, {
        headers: {
            Accept: 'application/json',
        }
    });

    log(`Post request to ${url} responded with status code ${response.status}: ${response.data}`);
}

export const uploadPlayerData = (id, playerData) => {
    let data = playerData.map(d => {
        let {name, guid} = d.userData;

        return {name, steamid: guid};
    });

    post(`${api}reports/${id}/player-data`, data);
};

export const uploadChatData = (id, chat) => {
    let data = chat.map((m) => {
        let {steamid, message: {msgName}} = m;

        return {steamid, message: cleanMessage(msgName)};
    });

    post(`${api}reports/${id}/chat`, data);
};