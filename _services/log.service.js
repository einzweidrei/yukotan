var winston = require('winston');

// winston.configure({
//     transports: [
//         new (winston.transports.File)({
//             name: 'info-file',
//             filename: 'logs/filelog-info.log',
//             level: 'info'
//         }),
//         new (winston.transports.File)({
//             name: 'error-file',
//             filename: 'logs/filelog-error.log',
//             level: 'error',
//             handleExceptions: true,
//             humanReadableUnhandledException: true
//         })
//     ]
// });

var d = new Date();
var strToday = d.getUTCDate() + '' + d.getUTCMonth() + '' + d.getUTCFullYear();

var loggerInfo = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({
            name: 'info-file',
            filename: 'logs/info/' + strToday + '.log',
            level: 'info'
        })
    ]
});

var loggerError = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({
            name: 'error-file',
            filename: 'logs/error/' + strToday + '.log',
            level: 'error',
            handleExceptions: true,
            humanReadableUnhandledException: true
        })
    ]
});

var Logs = (function () {
    function Logs() {

    }

    Logs.prototype.info = (type, metadata) => {
        var inf = 'info';
        switch (type) {
            case 0:
                loggerInfo.log(inf, 'success', metadata);
                break;
            case 1:
                loggerInfo.log(inf, 'duplicated', metadata);
                break;
            case 2:
                loggerInfo.log(inf, 'null or empty', metadata);
                break;
            default:
                break;
        }

    }

    Logs.prototype.error = (msg, metadata) => {
        var objType = Object.prototype.toString.call(msg);

        if (objType === '[object Error]') {
            loggerError.log('error', msg.toString(), metadata);
        } else {
            loggerError.log('error', msg, metadata);
        }
    }

    return Logs;
}());

exports.Logs = Logs;
