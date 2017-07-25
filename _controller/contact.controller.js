var mContact = require('../_model/contact');
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;
var async = require('promise-async');

var Contact = (function () {
    function Contact() { }

    Contact.prototype.getAll = (page, limit, process, sort, callback) => {
        try {
            var query = { status: true }
            if (process) query['process'] = process;

            var sortQuery = {};
            sort == 'asc' ? sortQuery['history.createAt'] = 1 : sortQuery['history.createAt'] = -1;

            var options = {
                select: '-status -__v',
                sort: sortQuery,
                page: parseFloat(page),
                limit: parseFloat(limit)
            };

            mContact.paginate(query, options).then((data) => {
                if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else return callback(null, data);
            });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Contact.prototype.getById = (id, callback) => {
        try {
            mContact
                .findOne({ _id: id, status: true })
                .select('-status -__v')
                .exec((error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else return callback(null, data);
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Contact.prototype.create = (name, email, content, phone, callback) => {
        try {
            var contact = new mContact();
            contact.name = name;
            contact.email = email;
            contact.content = content;
            contact.phone = phone;
            contact.process = false;
            contact.history = {
                createAt: new Date(),
                updateAt: new Date()
            };
            contact.status = true;
            contact.save((error) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else return callback(null, contact);
            });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Contact.prototype.update = (id, process, callback) => {
        try {
            mContact.findOneAndUpdate({
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

    Contact.prototype.delete = (id, callback) => {
        try {
            mContact.findOneAndRemove({
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

    Contact.prototype.statistical = (callback) => {
        try {
            async.parallel(
                {
                    process_1: function (callback) {
                        mContact.find({ process: true, status: true }).exec((error, data) => {
                            if (error) return callback(ms.EXCEPTION_FAILED);
                            else return callback(null, data.length);
                        })
                    },
                    process_2: function (callback) {
                        mContact.find({ process: false, status: true }).exec((error, data) => {
                            if (error) return callback(ms.EXCEPTION_FAILED);
                            else return callback(null, data.length);
                        })
                    }
                }, (error, result) => {
                    if (error) return callback(error);
                    else {
                        var d = {
                            read: result.process_1,
                            unread: result.process_2
                        };
                        return callback(null, d);
                    }
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    return Contact;
}());

exports.Contact = Contact;