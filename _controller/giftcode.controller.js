var mGiftCode = require('../_model/giftcode');
var as = require('../_services/app.service');
var AppService = new as.App();
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var Giftcode = (function () {
    function Giftcode() { }

    Giftcode.prototype.getAll = (page, limit, name, valueMin, valueMax, limitStartAt, limitEndAt, startAt, endAt, count, sort, callback) => {
        try {
            var findQuery = { status: true };

            if (name) findQuery['info.name'] = new RegExp(name, 'i');
            if (valueMin || valueMax) {
                var valueQuery = {};

                if (valueMin) {
                    valueQuery['$gte'] = valueMin;
                }

                if (valueMax) {
                    valueQuery['$lte'] = valueMax;
                }

                findQuery['info.value'] = valueQuery;
            }

            if (limitStartAt) findQuery['limit.startAt'] = { $gte: new Date(startAt) }
            if (limitEndAt) findQuery['limit.endAt'] = { $lte: new Date(endAt) }
            if (count) findQuery['limit.count'] = count;

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

                findQuery['history.createAt'] = timeQuery;
            }

            var sortQuery = {}
            sort == 'asc' ? sortQuery['history.createAt'] = 1 : sortQuery['history.createAt'] = -1

            var options = {
                select: '-status -__v',
                sort: sortQuery,
                page: parseFloat(page),
                limit: parseFloat(limit)
            };

            mGiftCode.paginate(findQuery, options).then((data) => {
                if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                return callback(null, data);
            });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    GiftCode.prototype.getById = (id, callback) => {
        try {
            mGiftCode.findOne({ _id: id, status: true }, (error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return msg.msgReturn(res, 4);
                return msg.msgReturn(res, 0, data);
            });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    GiftCode.prototype.create = (name, value, descriptionVi, descriptionEn, startAt, endAt, count, callback) => {
        try {
            var giftcode = new mGiftCode();
            giftcode.name = name;
            giftcode.value = value;

            giftcode.set('description.all', {
                en: descriptionEn,
                vi: descriptionVi
            });

            giftcode.limit = {
                startAt: new Date(startAt),
                endAt: new Date(endAt),
                count: count
            };

            giftcode.history = {
                createAt: new Date(),
                updateAt: new Date()
            }

            giftcode.status = true

            giftcode.save((error) => {
                return error ? callback(ms.EXCEPTION_FAILED) : msg.msgReturn(null, giftcode);
            });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    GiftCode.prototype.update = (id, name, value, descriptionVi, descriptionEn, startAt, endAt, count, callback) => {
        try {
            mGiftCode.findOneAndUpdate(
                {
                    _id: id,
                    status: true
                }, {
                    $set: {
                        name: name,
                        value: value,
                        description: {
                            vi: descriptionVi,
                            en: descriptionEn
                        },
                        'limit.startAt': new Date(startAt),
                        'limit.endAt': new Date(endAt),
                        'limit.count': count,
                        'history.updateAt': new Date()
                    }
                }, (error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    return callback(null, data);
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    GiftCode.prototype.delete = (id, callback) => {
        try {
            mGiftCode.findOneAndUpdate(
                {
                    _id: id,
                    status: true
                }, {
                    $set: {
                        status: false,
                        'history.updateAt': new Date()
                    }
                }, (error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    return callback(null, data);
                }
            );
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    return Giftcode;
}());

exports.Giftcode = Giftcode;