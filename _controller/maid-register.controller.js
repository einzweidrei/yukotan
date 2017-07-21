var mMaidRegister = require('../_model/maid-register');
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var MaidRegister = (function () {
    function MaidRegister() { }

    MaidRegister.prototype.register = (name, email, phone, note, callback) => {
        try {
            var maidRegister = new mMaidRegister();
            maidRegister.name = name;
            maidRegister.email = email;
            maidRegister.phone = phone;
            maidRegister.note = note;
            maidRegister.process = false;
            maidRegister.history = {
                createAt: new Date(),
                updateAt: new Date()
            };
            maidRegister.status = true;

            maidRegister.save((error) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else return callback(null, maidRegister);
            });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    MaidRegister.prototype.getAll = (page, limit, sort, callback) => {
        try {
            var sortQuery = {};
            sort == 'asc' ? sortQuery['history.createAt'] = 1 : sortQuery['history.createAt'] = -1;

            var options = {
                select: '-status -__v',
                sort: sortQuery,
                page: parseFloat(page),
                limit: parseFloat(limit)
            };

            mMaidRegister.paginate({}, options, (error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else return callback(null, data);
            });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    MaidRegister.prototype.update = (id, process, callback) => {
        try {
            mMaidRegister.findOneAndUpdate({
                _id: id,
                status: true
            }, {
                    $set: {
                        process: process,
                        'history.updateAt': new Date()
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

    MaidRegister.prototype.delete = (id, callback) => {
        try {
            mMaidRegister.findOneAndRemove({
                _id: id,
                status: true
            }, (error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else return callback(null, data);
            });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    return MaidRegister;
}());

exports.MaidRegister = MaidRegister;