var mMaidRegister = require('../_model/maid-register');
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var MaidRegister = (function() {
    function MaidRegister() {}

    MaidRegister.prototype.register = (name, address, phone, note, callback) => {
        try {
            var maidRegister = new mMaidRegister();
            maidRegister.name = name;
            maidRegister.address = address;
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

    MaidRegister.prototype.update = (id, name, address, phone, note, process, callback) => {
        try {
            mMaidRegister.findOneAndUpdate({
                    _id: id,
                    status: true
                }, {
                    $set: {
                        name: name,
                        address: address,
                        phone: phone,
                        note: note,
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

    return MaidRegister;
}());

exports.MaidRegister = MaidRegister;