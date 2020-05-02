export default function sleep(dur) {
    return new Promise((res, _) => {
        setTimeout(res, dur);
    })
}