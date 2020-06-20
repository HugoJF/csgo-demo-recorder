import axios from 'axios';
import {api} from "./config";
import {cleanMessage} from "./utils";
import * as logger from "./logger";

const [log, error] = logger.build('META_UPLOADER');

async function post(url, body) {
    log('Sending POST to ', url);

    let response = await axios.post(url, body);

    log(`Post request to ${url} responded with status code ${response.status}: ${response.data}`);

    return response;
}

export const uploadPlayerData = (id, playerData) => {
    let data = playerData.map(d => {
        let {name, guid} = d.userData;

        return {name, steamid: guid};
    });

    return post(`${api}reports/${id}/player-data`, data);
};

export const uploadChatData = (id, chat) => {
    let data = chat.map((m) => {
        let {steamid, message: {msgName}} = m;

        return {steamid, message: cleanMessage(msgName)};
    });

    return post(`${api}reports/${id}/chat`, data);
};