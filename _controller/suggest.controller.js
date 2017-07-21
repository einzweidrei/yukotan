var mSuggest = require('../_model/suggest');
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var Suggest = (function () {
    function Suggest() { }

    Suggest.prototype.getAll = (callback) => {
        try {
            mSuggest.find({ status: true }).select('-history -status -__v').exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else return callback(null, data);
            });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Suggest.prototype.getAll4Admin = (callback) => {
        try {
            mSuggest.find({ status: true }).exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else {
                    var m = [];
                    data.map(a => {
                        var d = {
                            _id: a._id,
                            name: a.get('name.all')
                        };
                        m.push(d);
                    });
                    return callback(null, m);
                }
            });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Suggest.prototype.getById = (id, callback) => {
        try {
            mSuggest
                .findOne({ _id: id, status: true })
                .select('-status -__v')
                .exec((error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else {
                        var g = {
                            _id: data._id,
                            name: data.get('name.all'),
                        };
                        return callback(null, g);
                    }
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Suggest.prototype.create = (nameVi, nameEn, callback) => {
        try {
            var suggest = new mSuggest();
            suggest.set('name.all', {
                vi: nameVi,
                en: nameEn
            });
            suggest.status = true;
            suggest.history = {
                createAt: new Date(),
                updateAt: new Date()
            };

            suggest.save((error) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else return callback(null, suggest);
            });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Suggest.prototype.update = (id, nameVi, nameEn, callback) => {
        try {
            mSuggest.findOneandUpdate(
                {
                    _id: id,
                    status: true
                },
                {
                    $set: {
                        name: {
                            vi: nameVi,
                            en: nameEn
                        },
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

    Suggest.prototype.delete = (id, callback) => {
        try {
            mSuggest.findOneandUpdate(
                {
                    _id: id,
                    status: true
                },
                {
                    $set: {
                        status: false,
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

    return Suggest;
}());

exports.Suggest = Suggest;