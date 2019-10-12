const request = require('request');

const api = require('./config').api;

const post = (url, body) => {
    request.post(url, {
        json: true,
        headers: {'Accept': 'application/json'},
        body,
    }, (err, res, body) => {
        console.log('Post request to', url, 'responded with status code', res.statusCode, 'and body', body);
    });
};

const uploadPlayerData = (id, playerData) => {
    let data = playerData.map(d => {
        let {name, guid} = d.userData;

        return {name, steamid: guid};
    });

    post(`${api}reports/${id}/player-data`, data);
};

const uploadChatData = (id, chat) => {
    let data = chat.map((m) => {
        let {steamid, message: {msgName}} = m;

        return {steamid, message: cleanMessage(msgName)};
    });

    post(`${api}reports/${id}/chat`, data);
};

// TODO: move to config
const cleanMessage = (msg) => (msg.replace('\u0001\u000b\u0003', '').replace('\u0001', ''));

module.exports = {
    uploadChatData,
    uploadPlayerData,
};