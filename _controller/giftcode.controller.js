var mGiftCode = require('../_model/giftcode');
var as = require('../_services/app.service');
var AppService = new as.App();
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var Giftcode = (function() {
    function Giftcode() {}

    Giftcode.prototype.verifyToken = (token, callback) => {};

    return Giftcode;
}());

exports.Giftcode = Giftcode;