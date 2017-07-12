var mTerm = require('../_model/term');
var as = require('../_services/app.service');
var AppService = new as.App();
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var Term = (function () {
    function Term() { }

    Term.prototype.findOne = (searchQuery, selectQuery, callback) => {
        mTerm.findOne(searchQuery).select(selectQuery).exec((error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            return callback(null, data);
        });
    }

    Term.prototype.getInfo = (id, callback) => {
        var searchQuery = {
            _id: id,
            status: true
        };

        var selectQuery = 'name content';

        var term = new Term();
        term.findOne(searchQuery, selectQuery, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            return callback(null, data);
        });
    }

    return Term;
}());

exports.Term = Term;
