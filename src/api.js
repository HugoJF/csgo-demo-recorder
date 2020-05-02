import {getOptions} from "./config";
import axios from "axios";
import config from "./config";
import * as logger from "./logger";

const [log, error] = logger.build('API');

export async function fetchDemos() {
    return await axios.get(`${config.api}reports/missing-video`, getOptions);
}

export async function attachVideo(reportId, videoUrl) {
    return await axios.patch(`${config.api}reports/${reportId}/attach-video`, {url: videoUrl});
}