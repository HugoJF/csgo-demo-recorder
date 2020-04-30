function createLogger(prefix) {
    return (log) => {
        console.log(`[${prefix}]`, log)
    };
}

exports.default = createLogger;