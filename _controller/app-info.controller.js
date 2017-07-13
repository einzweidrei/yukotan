var mAppInfo = require('../_model/app-info');
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var AppInfo = (function () {
    function AppInfo() { }

    AppInfo.prototype.getContact = (callback) => {
        mAppInfo
            .findOne({ _id: '000000000000000000000001', status: true })
            .select('-status -history -__v').exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                return callback(null, data);
            });
    }

    return AppInfo;
}());

exports.AppInfo = AppInfo;
