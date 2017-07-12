var mWork = require('../_model/work');
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var Work = (function () {
    function Work() { }

    Work.prototype.find = (searchQuery, selectQuery, callback) => {
        mWork.find(searchQuery).select(selectQuery).exec((error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            return callback(null, data);
        });
    }

    Work.prototype.getAll = (callback) => {
        var work = new Work();

        var searchQuery = {
            status: true
        };

        var selectQuery = 'name';

        work.find(searchQuery, selectQuery, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            return callback(null, data);
        });
    }

    return Work;
}());

exports.Work = Work;
