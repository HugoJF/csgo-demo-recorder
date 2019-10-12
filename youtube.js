const Youtube = require("youtube-api");
const fs = require("fs");
const readJson = require("r-json");
const Lien = require("lien");
const opn = require("opn");
const {start, update, stop} = require('./huds/uploader-hud');

// I downloaded the file from OAuth2 -> Download JSON
const CREDENTIALS = readJson(`${__dirname}/credentials.json`);

// Init lien server
let server = new Lien({
    host: "localhost",
    port: 5000
});

let oauth = Youtube.authenticate({
    type: "oauth",
    client_id: CREDENTIALS.installed.client_id,
    client_secret: CREDENTIALS.installed.client_secret,
    redirect_url: CREDENTIALS.installed.redirect_uris[0],
});

let resolve = undefined;
let interval = undefined;

opn(oauth.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/youtube.upload"]
}));

// Handle oauth2 callback
server.addPage("/login", lien => {
    console.log("Trying to get the token using the following code: " + lien.query.code);
    oauth.getToken(lien.query.code, (err, tokens) => {

        if (err) {
            lien.end(err, 400);
            return console.log(err);
        }

        console.log("Got the tokens.");

        oauth.setCredentials(tokens);
        resolve();
        lien.end('logged');
    });
});

function upload(stream, title) {
    return new Promise((res, rej) => {
        let req = Youtube.videos.insert({
            resource: {
                // Video title and description
                snippet: {
                    title: title,
                    description: "Test video upload via YouTube API"
                },
                status: {
                    privacyStatus: "unlisted"
                }
            },
            part: "snippet,status",
            media: {
                body: stream
            }
        }, (err, data) => {
            console.log("Upload finished");
            clearInterval(interval);
            stop();
            res(data);
        });

        start(fs.statSync(stream.path).size);
        interval = setInterval(function () {
            update(req.req.connection._bytesDispatched);
        }, 1000);
    });
}

function boot() {
    return new Promise((res, rej) => {
        resolve = res;
        console.log('Waiting login resolve');
    });
}

module.exports = {
    boot: boot,
    upload: upload,
};