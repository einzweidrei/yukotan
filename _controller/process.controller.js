var mProcess = require('../_model/process');
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var Process = (function () {
    function Process() { }

    Process.prototype.find = (searchQuery, selectQuery, callback) => {
        mProcess.find(searchQuery).select(selectQuery).exec((error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            return callback(null, data);
        });
    }

    Process.prototype.getAll = (callback) => {
        var process = new Process();

        var searchQuery = {
            status: true
        };

        var selectQuery = 'name';

        process.find(searchQuery, selectQuery, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            return callback(null, data);
        });
    }

    return Process;
}());

exports.Process = Process;
