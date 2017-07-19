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

    Bill.prototype.getAll = (page, limit, isSolved, startAt, endAt, sort, callback) => {
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
                select: '-status -__v',
                sort: sortQuery,
                page: parseFloat(page),
                limit: parseFloat(limit)
            };

            mBill.paginate(findQuery, options).then((data) => {
                if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else return callback(null, data);
            });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Bill.prototype.getById = (id, callback) => {
        try {
            mBill.findOne({ _id: id, status: true })
                .populate(
                [
                    {
                        path: 'task', select: 'info'
                    },
                    {
                        path: 'owner', select: 'info'
                    },
                    {
                        path: 'maid', select: 'info'
                    }
                ])
                .select('-status -__v').exec((error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else return callback(null, data);
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Bill.prototype.update = (id, isSolved, method, callback) => {
        try {
            mBill.findOneAndUpdate(
                {
                    _id: id,
                    status: true
                },
                {
                    $set: {
                        isSolved: isSolved,
                        method: method,
                        date: new Date()
                    }
                },
                (error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else return callback(null, data);
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Bill.prototype.delete = (id, callback) => {
        try {
            mBill.findOneAndUpdate(
                {
                    _id: id,
                    status: true
                },
                {
                    $set: {
                        status: false
                    }
                },
                (error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else return callback(null, data);
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Bill.prototype.getUserBills = (id, user, page, limit, isSolved, startAt, endAt, sort, callback) => {
        try {
            var findQuery = {
                status: true
            }

            user == 1 ? findQuery['owner'] = new ObjectId(id) : findQuery['maid'] = new ObjectId(id);

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

                findQuery['date'] = timeQuery;
            }

            var sortQuery = {}
            sort == 'asc' ? sortQuery['date'] = 1 : sortQuery['date'] = -1

            var options = {
                select: '-status -__v',
                sort: sortQuery,
                page: parseFloat(page),
                limit: parseFloat(limit)
            };

            mBill.paginate(findQuery, options).then((data) => {
                if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else return callback(null, data);
            })
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    return Bill;
}());

exports.Bill = Bill;
