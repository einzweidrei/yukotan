var mPackage = require('../_model/package');
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var Package = (function () {
    function Package() { }

    Package.prototype.find = (searchQuery, selectQuery, callback) => {
        mPackage.find(searchQuery).select(selectQuery).exec((error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            return callback(null, data);
        });
    }

    Package.prototype.getAll = (callback) => {
        var package = new Package();

        var searchQuery = {
            status: true
        };

        var selectQuery = 'name';

        package.find(searchQuery, selectQuery, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            return callback(null, data);
        });
    }

    return Package;
}());

exports.Package = Package;
