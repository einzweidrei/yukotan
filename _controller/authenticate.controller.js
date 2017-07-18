var mSession = require('../_model/session');
var mOwner = require('../_model/owner');
var mMaid = require('../_model/maid');
var ObjectId = require('mongoose').Types.ObjectId;
var as = require('../_services/app.service');
var AppService = new as.App();
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var Authenticate = (function () {
    function Authenticate() { }

    Authenticate.prototype.login = (username, password, device_token, callback) => {
        var pw = AppService.hashString(password);

        mOwner
            .findOne({ 'info.username': username })
            .select('_id info evaluation_point wallet auth')
            .exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else if (data.auth.password != pw) return callback(ms.INVALID_PASSWORD);
                else {
                    mOwner.findOneAndUpdate({
                        _id: data._id,
                        status: true
                    }, {
                            $set: {
                                'auth.device_token': device_token
                            }
                        }, (error) => {
                            if (error) return callback(ms.EXCEPTION_FAILED);
                            else {
                                var newToken = AppService.getToken();
                                mSession.findOneAndUpdate({
                                    'auth.userId': data._id,
                                    status: true
                                }, {
                                        $set: {
                                            'auth.token': newToken,
                                            loginAt: new Date()
                                        }
                                    }, {
                                        upsert: true
                                    },
                                    (error, result) => {
                                        if (error) return callback(ms.EXCEPTION_FAILED);
                                        else {
                                            var dt = {
                                                token: newToken,
                                                user: {
                                                    _id: data._id,
                                                    info: data.info,
                                                    evaluation_point: data.evaluation_point,
                                                    wallet: data.wallet
                                                }
                                            }
                                            return callback(null, dt);
                                        }
                                    }
                                );
                            }
                        });
                }
            });
    };

    Authenticate.prototype.register = (username, email, phone, name, age, addressName, lat, lng, gender, password, device_token, image, callback) => {
        var owner = new mOwner();
        owner.info = {
            username: username,
            email: email,
            phone: phone,
            name: name,
            age: age,
            image: image,
            address: {
                name: addressName,
                coordinates: {
                    lat: lat,
                    lng: lng
                }
            },
            gender: gender,
        };
        owner.evaluation_point = 3;
        owner.wallet = 0;
        owner.auth = {
            password: AppService.hashString(password),
            device_token: device_token
        };
        owner.history = {
            createAt: new Date(),
            updateAt: new Date()
        };
        owner.status = true;
        owner.location = {
            type: 'Point',
            coordinates: [lng, lat]
        };

        mOwner
            .findOne({
                $or: [
                    { 'info.username': username },
                    { 'info.email': email }
                ]
            }).exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) {
                    owner.save((error, data) => {
                        if (error) return callback(ms.EXCEPTION_FAILED);
                        else {
                            var newToken = AppService.getToken();
                            var session = new mSession();
                            session.auth.userId = data._id;
                            session.auth.token = newToken;
                            session.loginAt = new Date();
                            session.status = true;

                            session.save((error) => {
                                if (error) return callback(ms.EXCEPTION_FAILED);
                                else {
                                    var dt = {
                                        token: newToken,
                                        user: {
                                            _id: data._id,
                                            info: data.info,
                                            evaluation_point: data.evaluation_point,
                                            wallet: data.wallet
                                        }
                                    };
                                    return callback(null, dt);
                                }
                            });
                        }
                    });
                } else return callback(ms.DUPLICATED);
            });
    };

    Authenticate.prototype.checkOwnerExist = (username, callback) => {
        mOwner.findOne({ 'info.username': username }).exec((error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            else return callback(null, data);
        });
    };

    Authenticate.prototype.loginByMaid = (username, password, device_token, callback) => {
        var pw = AppService.hashString(password);
        mMaid
            .findOne({ 'info.username': username })
            .populate({ path: 'work_info.ability', select: 'name image' })
            .select('_id info work_info auth')
            .exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else if (data.auth.password != pw) return callback(ms.INVALID_PASSWORD);
                else {
                    mMaid.findOneAndUpdate({
                        _id: data._id,
                        status: true
                    }, {
                            $set: {
                                'auth.device_token': device_token
                            }
                        }, (error) => {
                            if (error) return callback(ms.EXCEPTION_FAILED);
                            else {
                                var newToken = AppService.getToken();
                                mSession.findOneAndUpdate({
                                    'auth.userId': data._id,
                                    status: true
                                }, {
                                        $set: {
                                            'auth.token': newToken,
                                            loginAt: new Date()
                                        }
                                    }, {
                                        upsert: true
                                    },
                                    (error, result) => {
                                        if (error) return callback(ms.EXCEPTION_FAILED);
                                        else {
                                            var dt = {
                                                token: newToken,
                                                user: {
                                                    _id: data._id,
                                                    info: data.info,
                                                    work_info: data.work_info
                                                }
                                            }
                                            return callback(null, dt);
                                        }
                                    }
                                );
                            }
                        });
                }
            });
    };

    Authenticate.prototype.thirdLogin = (id, token, device_token, callback) => {
        var realId = AppService.remakeId(id);

        mOwner.findOneAndUpdate({
            _id: realId,
            status: true
        }, {
                $set: {
                    'auth.device_token': device_token
                }
            }, (error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else {
                    mSession.findOneAndUpdate({
                        'auth.userId': data._id,
                        status: true
                    }, {
                            $set: {
                                'auth.token': token,
                                loginAt: new Date()
                            }
                        }, {
                            upsert: true
                        },
                        (error, result) => {
                            if (error) return callback(ms.EXCEPTION_FAILED);
                            else {
                                var dt = {
                                    token: token,
                                    user: {
                                        _id: data._id,
                                        info: data.info,
                                        evaluation_point: data.evaluation_point,
                                        wallet: data.wallet
                                    }
                                }
                                return callback(null, dt);
                            }
                        }
                    );
                }
            });
    };

    Authenticate.prototype.thirdRegister = (id, token, device_token, username, email, phone, name, age, addressName, lat, lng, gender, image, callback) => {
        var realId = AppService.remakeId(id);

        var owner = new mOwner();
        owner._id = new ObjectId(realId);
        owner.info = {
            username: username,
            email: email,
            phone: phone,
            name: name,
            age: age,
            image: image,
            address: {
                name: addressName,
                coordinates: {
                    lat: lat,
                    lng: lng
                }
            },
            gender: gender,
        };
        owner.evaluation_point = 3;
        owner.wallet = 0;
        owner.auth = {
            device_token: device_token
        };
        owner.history = {
            createAt: new Date(),
            updateAt: new Date()
        };
        owner.status = true;
        owner.location = {
            type: 'Point',
            coordinates: [lng, lat]
        };

        mOwner
            .findOne({
                $or: [
                    { _id: realId },
                    { 'info.email': email }
                ]
            }).exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) {
                    owner.save((error, data) => {
                        if (error) return callback(ms.EXCEPTION_FAILED);
                        else {
                            var session = new mSession();
                            session.auth.userId = data._id;
                            session.auth.token = token;
                            session.loginAt = new Date();
                            session.status = true;

                            session.save((error) => {
                                if (error) return callback(ms.EXCEPTION_FAILED);
                                else {
                                    var dt = {
                                        token: token,
                                        user: {
                                            _id: data._id,
                                            info: data.info,
                                            evaluation_point: data.evaluation_point,
                                            wallet: data.wallet
                                        }
                                    };
                                    return callback(null, dt);
                                }
                            });
                        }
                    });
                } else return callback(ms.DUPLICATED);
            });
    };

    return Authenticate;
}());

exports.Authenticate = Authenticate;