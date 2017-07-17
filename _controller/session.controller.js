var mSession = require('../_model/session');
var as = require('../_services/app.service');
var AppService = new as.App();
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var Session = (function() {
    function Session() {}

    Session.prototype.verifyToken = (token, callback) => {
        mSession.findOne({ 'auth.token': token }).exec((error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.UNAUTHORIZED);
            else return callback(null, data);
        });
    };

    Session.prototype.findOneAndUpdate = (searchQuery, setQuery, upsert, callback) => {
        mSession.findOneAndUpdate(
            searchQuery, {
                $set: setQuery
            }, {
                upsert: upsert
            },
            (error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else return callback(null, data);
            }
        );
    };

    return Session;
}());

exports.Session = Session;