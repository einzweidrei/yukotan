var mBillCharge = require('../_model/bill_charge');
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var BillCharge = (function () {
    function BillCharge() { }

    BillCharge.prototype.getAll = (page, limit, isSolved, startAt, endAt, sort, callback) => {
        try {
            var findQuery = {
                status: true
            }

            if (isSolved) findQuery['isSolved'] = isSolved;

            if (startAt || endAt) {
                var timeQuery = {};

                if (startAt) {
                    var date = new Date(startAt);
                    date.setUTCHours(0, 0, 0, 0);
                    timeQuery['$gte'] = date;
                }

                if (endAt) {
                    var date = new Date(endAt);
                    date.setUTCHours(0, 0, 0, 0);
                    date = new Date(date.getTime() + 1000 * 3600 * 24 * 1);
                    timeQuery['$lt'] = date;
                }

                findQuery['createAt'] = timeQuery;
            }

            var sortQuery = {}
            sort == 'asc' ? sortQuery['createAt'] = 1 : sortQuery['createAt'] = -1

            var options = {
                select: '-verify -status -__v',
                populate: [{ path: 'owner', select: 'info' }],
                sort: sortQuery,
                page: parseFloat(page),
                limit: parseFloat(limit)
            };

            mBillCharge.paginate(findQuery, options).then((data) => {
                if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else return callback(null, data);
            });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    BillCharge.prototype.getById = (id, callback) => {
        try {
            mBillCharge
                .findOne({ _id: id, status: true })
                .populate([{ path: 'owner', select: 'info' }])
                .select('-verify -status -__v')
                .exec((error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else return callback(null, data);
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    BillCharge.prototype.update = (id, isSolved, callback) => {
        try {
            mBillCharge.findOneAndUpdate(
                {
                    _id: id,
                    status: true
                },
                {
                    $set: {
                        isSolved: isSolved,
                        date: new Date()
                    }
                }, (error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else return callback(null, data);
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    return BillCharge;
}());

exports.BillCharge = BillCharge;