const Minio = require('minio');
const fs = require('fs');
const log = require('./logger').default('UPLOADER');

const minio = new Minio.Client({
    endPoint: '',
    port: 9500,
    useSSL: false,
    accessKey: '',
    secretKey: ''
});

function prepare() {
    return new Promise((res, rej) => {
        minio.bucketExists('calladmin', (err, exists) => {
            if (!exists) {
                log('Could not find bucket `calladmin`, creating it....');
                minio.makeBucket('calladmin', (err) => {
                    if (err) {
                        console.error(err);
                        process.exit(1);
                    } else {
                        log('Bucket `calladmin` created successfully!');
                    }
                })
            } else {
                log('Found `calladmin` bucket!');
            }

            // TODO: check aws namespaces
            let policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "AddPerm",
                        "Effect": "Allow",
                        "Principal": "*",
                        "Action": ["s3:GetObject"],
                        "Resource": ["arn:aws:s3:::calladmin/*"]
                    }
                ]
            };

            minio.setBucketPolicy('calladmin', JSON.stringify(policy), (err) => {
                if (err) {
                    console.error(err);
                    process.exit(1);
                }
                log('Bucket `calladmin` set policy: ', policy);
                res(true);
            });
        })
    });
}

function fileExists(name, type) {
    return minio.statObject('calladmin', `${type}/${name}`);
}

function uploadFile(name, path, type) {
    return new Promise((res, rej) => {
        log(`Uploading ${name} at ${path} to directory ${type}...`);

        minio.fPutObject('calladmin', `${type}/${name}`, path, {}, (err, etag) => {
            if (err) rej(err);

            log(`File ${name} at ${path} uploaded with etag:${etag}`);
            res(err);
        })
    });
}

module.exports = {prepare, uploadFile, fileExists};