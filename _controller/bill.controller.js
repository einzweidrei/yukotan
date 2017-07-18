var mBill = require('../_model/bill');
var as = require('../_services/app.service');
var AppService = new as.App();
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var Bill = (function () {
    function Bill() { }

    Bill.prototype.aggregate = (aggregateQuery, callback) => {
        mBill.aggregate(aggregateQuery, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            return callback(null, data);
        });
    };

    Bill.prototype.save = (owner, maid, taskId, price, period, callback) => {
        var bill = new mBill();
        bill.owner = owner;
        bill.maid = maid;
        bill.task = taskId;
        bill.isSolved = false;
        bill.date = new Date();
        bill.createAt = new Date();
        bill.method = 1;
        bill.status = true;
        bill.price = price;
        bill.period = period;

        bill.save((error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else return callback(null, data);
        });
    };

    Bill.prototype.statistical = (startAt, endAt, isSolved, callback) => {
        try {
            var matchQuery = { status: true }

            if (isSolved) matchQuery['isSolved'] = isSolved;

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

                matchQuery['date'] = timeQuery;
            }

            mBill.aggregate(
                [
                    {
                        $match: matchQuery
                    },
                    {
                        $group: {
                            _id: '$maid',
                            taskNumber: {
                                $sum: 1
                            },
                            price: {
                                $sum: '$price'
                            }
                        }
                    }
                ], (error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else {
                        var totalPrice = 0;
                        data.map(a => {
                            totalPrice += a.price
                        });

                        var d = {
                            data: data,
                            totalPrice: totalPrice
                        }

                        return callback(null, d);
                    }
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    return Bill;
}());

exports.Bill = Bill;
