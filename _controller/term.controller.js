var mTerm = require('../_model/term');
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var Term = (function () {
    function Term() { }

    Term.prototype.findOne = (searchQuery, selectQuery, callback) => {
        mTerm.findOne(searchQuery).select(selectQuery).exec((error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            return callback(null, data);
        });
    };

    Term.prototype.getInfo = (id, callback) => {
        var searchQuery = {
            _id: id,
            status: true
        };

        var selectQuery = 'name content';

        var term = new Term();
        term.findOne(searchQuery, selectQuery, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            return callback(null, data);
        });
    };

    Term.prototype.getAll4Admin = (callback) => {
        mTerm
            .find({})
            .select('name content')
            .exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else {
                    var m = [];
                    data.map(a => {
                        var d = {
                            _id: a._id,
                            name: a.name,
                            content: a.get('content.all')
                        };
                        m.push(d);
                    });
                    return callback(null, m);
                }
            });
    };

    Term.prototype.getInfo4Admin = (id, callback) => {
        mTerm
            .findOne({ _id: id, status: true })
            .select('name content')
            .exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else {
                    var d = {
                        _id: data._id,
                        name: data.name,
                        content: data.get('content.all')
                    };
                    return callback(null, d);
                }
            });
    };

    Term.prototype.update = (id, contentVi, contentEn, callback) => {
        mTerm.findOneAndUpdate(
            {
                _id: id,
                status: true
            }, {
                $set: {
                    content: {
                        vi: contentVi,
                        en: contentEn
                    }
                }
            }, (error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else return callback(null, data);
            });
    };

    return Term;
}());

exports.Term = Term;
