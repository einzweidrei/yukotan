var mReport = require('../_model/report');
var as = require('../_services/app.service');
var AppService = new as.App();
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var Report = (function () {
    function Report() { }

    Report.prototype.save = (ownerId, maidId, from, content, callback) => {
        var report = new mReport();
        report.ownerId = ownerId;
        report.maidId = maidId;
        report.from = from;
        report.content = content;
        report.createAt = new Date();
        report.status = true;

        report.save((error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            return callback(null, data);
        })
    }

    return Report;
}());

exports.Report = Report;
