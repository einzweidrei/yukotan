var mAppInfo = require('../_model/app-info');
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var AppInfo = (function () {
    function AppInfo() { }

    AppInfo.prototype.getContact = (callback) => {
        mAppInfo
            .findOne({ _id: '000000000000000000000001', status: true })
            .select('-status -history -__v').exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                return callback(null, data);
            });
    }

    AppInfo.prototype.getContact4Admin = (callback) => {
        try {
            mAppInfo
                .findOne({ _id: '000000000000000000000001', status: true })
                .select('-status -history -__v')
                .exec((error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else {
                        var g = {
                            _id: data._id,
                            name: data.get('name.all'),
                            address: data.get('address.all'),
                            phone: data.phone,
                            note: data.get('note.all'),
                            email: data.email,
                            status: data.status,
                            history: data.history,
                            bank: data.get('bank.all')
                        }
                        return callback(null, g);
                    }
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    AppInfo.prototype.update = (nameVi, nameEn, addressVi, addressEn, phone, noteVi, noteEn, email, bankVi, bankEn, callback) => {
        try {
            mAppInfo.findOneAndUpdate(
                {
                    _id: '000000000000000000000001',
                    status: true
                },
                {
                    $set: {
                        name: {
                            vi: nameVi,
                            en: nameEn
                        },
                        address: {
                            vi: addressVi,
                            en: addressEn
                        },
                        note: {
                            vi: noteVi,
                            en: noteEn
                        },
                        bank: {
                            vi: bankVi,
                            en: bankEn
                        },
                        email: email,
                        phone: phone,
                        'history.updateAt': new Date()
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

    return AppInfo;
}());

exports.AppInfo = AppInfo;
