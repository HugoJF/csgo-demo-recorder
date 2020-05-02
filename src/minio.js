import {Client} from 'minio';
import {promisify} from 'util';
import {secondsToHumans} from "./utils";
import * as logger from './logger';

const [log, error] = logger.build('MINIO');

const minio = new Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: Number(process.env.MINIO_PORT),
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    useSSL: false
});

const bucketExists = promisify(minio.bucketExists.bind(minio));
const makeBucket = promisify(minio.makeBucket.bind(minio));
const setBucketPolicy = promisify(minio.setBucketPolicy.bind(minio));
const fPutObject = promisify(minio.fPutObject.bind(minio));

export async function prepare() {
    let exists = await bucketExists('calladmin');

    if (!exists) {
        log('Could not find bucket `calladmin`, creating it....');

        try {
            await makeBucket('calladmin');

            log('Bucket `calladmin` created successfully!');
        } catch (e) {
            console.error(err);
            process.exit(1);
        }
    }

    log('Found `calladmin` bucket!');

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

    try {
        setBucketPolicy('calladmin', JSON.stringify(policy));

        log(`Bucket 'calladmin' set policy: ${policy}`);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

export function fileExists(name, type) {
    return minio.statObject('calladmin', `${type}/${name}`);
}

export async function uploadFile(name, path, type) {
    log(`Uploading ${name} at ${path} to directory ${type}...`);

    const start = Date.now();

    try {
        var etag = await fPutObject('calladmin', `${type}/${name}`, path);
    } catch (e) {
        console.error(`Error (${e.message})while uploading demo at ${path}`);
        process.exit(1);
    }

    const end = Date.now();
    const duration = secondsToHumans((end - start) / 1000);

    log(`File ${name} at ${path} uploaded in ${duration.min}min ${duration.sec}s with etag: ${etag}`);
}