var mAccount = require('../_model/account');
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;
var as = require('../_services/app.service');
var AppService = new as.App();

var Account = (function() {
    function Account() {}

    Account.prototype.getAll = (page, limit, startAt, endAt, sort, email, username, name, gender, callback) => {
        try {
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

            var sortQuery = {};
            sort == 'asc' ? sortQuery = { 'history.createAt': 1 } : sortQuery = { 'history.createAt': -1 };

            var query = { status: true };

            if (email) query['info.email'] = new RegExp(email, 'i');
            if (username) query['info.username'] = new RegExp(username, 'i');
            if (name) query['info.name'] = new RegExp(name, 'i');
            if (gender) query['info.gender'] = new RegExp(gender, 'i');

            var options = {
                select: 'info history',
                sort: sortQuery,
                page: parseFloat(page),
                limit: parseFloat(limit)
            };

            mAccount.paginate(query, options).then((data) => {
                if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else return callback(null, data);
            });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Account.prototype.getById = (id, callback) => {
        try {
            mAccount
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

    Account.prototype.create = (username, password, email, name, phone, image, address, gender, permission, callback) => {
        try {
            var account = new mAccount();
            account.info = {
                username: username,
                email: email,
                name: name,
                phone: phone,
                image: image,
                address: address,
                gender: gender
            };

            account.auth = {
                password: AppService.hashString(password)
            };

            account.history = {
                createAt: new Date(),
                updateAt: new Date()
            };

            account.status = true;
            account.permission = permission;

            mAccount
                .findOne({
                    $or: [
                        { 'info.username': username },
                        { 'info.email': email }
                    ]
                })
                .exec((error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) {
                        account.save((error) => {
                            if (error) return callback(ms.EXCEPTION_FAILED);
                            else return callback(null, account);
                        });
                    } else return callback(ms.DUPLICATED);
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Account.prototype.update = (id, email, name, phone, image, address, gender, permission, callback) => {
        try {
            mAccount.findOne({ 'info.email': email, status: true }, (error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) {
                    mAccount.findOneAndUpdate({
                        _id: id,
                        status: true
                    }, {
                        $set: {
                            'info.email': email,
                            'info.name': name,
                            'info.phone': phone,
                            'info.image': image,
                            'info.address': address,
                            'info.gender': gender,
                            permission: permission,
                            'history.updateAt': new Date()
                        }
                    }, (error, data) => {
                        if (error) return callback(ms.EXCEPTION_FAILED);
                        else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                        else return callback(null, data);
                    });
                } else {
                    if (id == data._id) {
                        mAccount.findOneAndUpdate({
                            _id: id,
                            status: true
                        }, {
                            $set: {
                                'info.email': email,
                                'info.name': name,
                                'info.phone': phone,
                                'info.image': image,
                                'info.address': address,
                                'info.gender': gender,
                                permission: permission,
                                'history.updateAt': new Date()
                            }
                        }, (error, data) => {
                            if (error) return callback(ms.EXCEPTION_FAILED);
                            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                            else return callback(null, data);
                        });
                    } else {
                        return callback(ms.DUPLICATED);
                    }
                }
            });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Account.prototype.delete = (id, callback) => {
        try {
            mAccount.findOneAndUpdate({
                    _id: id,
                    status: true
                }, {
                    $set: {
                        status: false,
                        'history.updateAt': new Date()
                    }
                },
                (error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else return callback(null, data);
                }
            )
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    return Account;
}());

exports.Account = Account;