const request = require('request');
const config = require('./config');

const options = {
    json: true,
    headers: {
        'Accept': 'application/json',
    }
};

function fetchDemos() {
    return new Promise((res, rej) => {
        request(`${config.api}reports/missing-video`, options, (err, response, body) => {
            if (err) {
                rej(err);
            } else {
                res(body);
            }
        });
    });
}

function attachVideo(reportId, videoUrl) {
    let data = {
        body: {
            url: videoUrl,
        },
        headers: {
            ...options.headers,
            'Content-Type': 'application/javascript',
            'Accept': 'application/javascript',
        }
    };

    return new Promise((res, rej) => {
        request.patch(`${config.api}reports/${reportId}/attach-video`, data, (err, response, body) => {
            if (err) {
                rej(err);
            } else {
                res(body);
            }
        });
    })
}

exports.fetchDemos = fetchDemos;
exports.attachVideo = attachVideo;