const fs = require('fs');
const config = require('./config');

exports.check = function () {
};

exports.checkDemo = function (path) {
    if (!fs.existsSync(path))
        throw Error('Invalid demo path provided');
};