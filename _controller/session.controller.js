var mSession = require('../_model/session');
var as = require('../_services/app.service');
var AppService = new as.App();
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();

var Session = (function () {
    function Session() { }

    Session.prototype.verifyToken = (token, callback) => {
        mSession.findOne({ 'auth.token': token }).exec((error, data) => {
            if (error) return callback(error);
            return callback(null, data);
        });
    }

    return Session;
}());

exports.Session = Session;
