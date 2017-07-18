var mReport = require('../_model/report');
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
        });
    };

    Report.prototype.getAll4Admin = (page, limit, from, callback) => {
        var query = {
            status: true
        };

        if (from) query['from'] = from;

        var populateQuery = [
            { path: 'ownerId', select: 'info' },
            { path: 'maidId', select: 'info' }
        ];

        var options = {
            select: '-status -__v',
            populate: populateQuery,
            sort: {
                'createAt': -1
            },
            page: parseFloat(page),
            limit: parseFloat(limit)
        };

        mReport.paginate(query, options).then((data) => {
            if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            else return callback(null, data);
        });
    };

    Report.prototype.delete = (id, callback) => {
        mReport.findByIdAndUpdate(
            {
                _id: id,
                status: true
            },
            {
                $set: {
                    status: false,
                    updateAt: new Date()
                }
            }, (error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else return callback(null, data);
            });
    };

    return Report;
}());

exports.Report = Report;
