var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

var messageService = require('../_services/message.service');
var msg = new messageService.Message();

var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();

var languageService = require('../_services/language.service');
var lnService = new languageService.Language();

var as = require('../_services/app.service');
var AppService = new as.App();

var Owner = require('../_model/owner');
var Session = require('../_model/session');
var Maid = require('../_model/maid');

var cloudinary = require('cloudinary');
var ObjectId = require('mongoose').Types.ObjectId;
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var contAuth = require('../_controller/authenticate.controller');
var authController = new contAuth.Authenticate();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

router.use(multipartMiddleware);

router.use(function(req, res, next) {
    try {
        var baseUrl = req.baseUrl;
        var language = AppService.getAppLanguage(baseUrl);

        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            next();
        } else {
            return msg.msgReturn(res, ms.LANGUAGE_NOT_SUPPORT);
        }
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/login').post((req, res) => {
    try {
        var username = req.body.username || "";
        var password = req.body.password || "";
        var device_token = req.body.device_token || "";

        authController.login(username, password, device_token, (error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED, {});
    }
});

router.route('/register').post((req, res) => {
    try {
        var username = req.body.username || '';
        var email = req.body.email || '';
        var phone = req.body.phone || '';
        var name = req.body.name || '';
        var age = req.body.age || '';
        var addressName = req.body.addressName || '';
        var lat = req.body.lat || 1;
        var lng = req.body.lng || 1;
        var gender = req.body.gender || 0;
        var password = req.body.password || '';
        var device_token = req.body.device_token || '';
        var image = '';

        if (!req.files.image) {
            authController.register(username, email, phone, name, age, addressName,
                lat, lng, gender, password, device_token, image, (error, data) => {
                    return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
                });
        } else {
            cloudinary.uploader.upload(
                req.files.image.path,
                function(result) {
                    image = result.url;
                    authController.register(username, email, phone, name, age, addressName,
                        lat, lng, gender, password, device_token, image, (error, data) => {
                            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
                        });
                });
        }
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED, {});
    }
});

router.route('/check').get((req, res) => {
    try {
        var username = req.query.username;
        authController.checkOwnerExist(username, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/maid/login').post((req, res) => {
    try {
        var username = req.body.username || "";
        var password = AppService.hashString(req.body.password) || "";
        var device_token = req.body.device_token || "";

        Maid.findOne({ 'info.username': username })
            .populate({ path: 'work_info.ability', select: 'name image' })
            .select('_id info work_info auth').exec((error, data) => {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4, {});
                } else {
                    if (error) {
                        return msg.msgReturn(res, 3, {});
                    } else {
                        if (data.auth.password != password) {
                            return msg.msgReturn(res, 5, {});
                        } else {
                            Maid.findOneAndUpdate({
                                _id: data._id,
                                status: true
                            }, {
                                $set: {
                                    'auth.device_token': device_token
                                }
                            }, {
                                upsert: true
                            }, (error) => {
                                if (error) return msg.msgReturn(res, 3, {});
                                else {
                                    Session.findOne({ 'auth.userId': data._id }).exec((error, result) => {
                                        if (error) {
                                            return msg.msgReturn(res, 3, {});
                                        } else {
                                            var newToken = AppService.getToken();

                                            var d = {
                                                token: newToken,
                                                user: {
                                                    _id: data._id,
                                                    info: data.info,
                                                    work_info: data.work_info
                                                }
                                            }

                                            if (validate.isNullorEmpty(result)) {
                                                var session = new Session();
                                                session.auth.userId = data._id;
                                                session.auth.token = newToken;
                                                session.loginAt = new Date();
                                                session.auth.device_token = device_token;
                                                session.status = true;
                                                session.save((error) => {
                                                    if (error) return msg.msgReturn(res, 3, {});
                                                    return msg.msgReturn(res, 0, d);

                                                    // return res.status(200).json({
                                                    //     status: true,
                                                    //     message: msg.msg_success,
                                                    //     data: {
                                                    //         token: newToken,
                                                    //         user: {
                                                    //             _id: data._id,
                                                    //             info: data.info,
                                                    //             work_info: data.work_info
                                                    //         }
                                                    //     }
                                                    // });

                                                });
                                            } else {
                                                Session.findOneAndUpdate({
                                                        'auth.userId': data._id,
                                                        status: true
                                                    }, {
                                                        $set: {
                                                            'auth.token': newToken,
                                                            'auth.device_token': device_token,
                                                            loginAt: new Date()
                                                        }
                                                    }, {
                                                        upsert: true
                                                    },
                                                    (error) => {
                                                        if (error) return msg.msgReturn(res, 3, {});
                                                        return msg.msgReturn(res, 0, d);

                                                        // return res.status(200).json({
                                                        //     status: true,
                                                        //     message: msg.msg_success,
                                                        //     data: {
                                                        //         token: newToken,
                                                        //         user: {
                                                        //             _id: data._id,
                                                        //             info: data.info,
                                                        //             work_info: data.work_info
                                                        //         }
                                                        //     }
                                                        // });
                                                    }
                                                )
                                            }
                                        }
                                    });
                                }
                            })
                        }
                    }
                }
            });
    } catch (error) {
        return msg.msgReturn(res, 3, {});
    }
});

function remakeId(n) {
    while (n.length < 24) {
        n += '0';
    };
    return n;
}

router.route('/thirdLogin').post((req, res) => {
    try {
        var id = req.body.id;
        var token = req.body.token;
        var device_token = req.body.device_token;
        var realId = remakeId(id);

        Owner.findOne({ _id: realId, status: true }).exec((error, data) => {
            if (error) return msg.msgReturn(res, 3, {})
            else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4, {})
                } else {
                    Owner.findOneAndUpdate({
                        _id: data._id,
                        status: true
                    }, {
                        $set: {
                            'auth.device_token': device_token
                        }
                    }, {
                        upsert: true
                    }, (error) => {
                        Session.findOne({ 'auth.userId': data._id }).exec((error, result) => {
                            if (error) {
                                return msg.msgReturn(res, 3, {});
                            } else {
                                console.log('here')
                                if (validate.isNullorEmpty(result)) {
                                    var session = new Session();
                                    session.auth.userId = data._id;
                                    session.auth.token = token;
                                    session.loginAt = new Date();
                                    session.status = true;

                                    // console.log(session)

                                    session.save((error) => {
                                        if (error) {
                                            return msg.msgReturn(res, 3, {});
                                        } else {
                                            var dt = {
                                                token: token,
                                                user: {
                                                    _id: data._id,
                                                    info: data.info,
                                                    evaluation_point: data.evaluation_point,
                                                    wallet: data.wallet
                                                }
                                            };

                                            return msg.msgReturn(res, 0, dt);
                                        }
                                    });
                                } else {
                                    Session.findOneAndUpdate({
                                            'auth.userId': data._id,
                                            status: true
                                        }, {
                                            $set: {
                                                'auth.token': token,
                                                // 'auth.device_token': device_token,
                                                loginAt: new Date()
                                            }
                                        }, {
                                            upsert: true
                                        },
                                        (error, result) => {
                                            if (error) return msg.msgReturn(res, 3, {});
                                            var dt = {
                                                token: token,
                                                user: {
                                                    _id: data._id,
                                                    info: data.info,
                                                    evaluation_point: data.evaluation_point,
                                                    wallet: data.wallet
                                                }
                                            };

                                            return msg.msgReturn(res, 0, dt);
                                        }
                                    )
                                }
                            }
                        });
                    })
                }
            }
        })
    } catch (error) {
        console.log(error)
        return msg.msgReturn(res, 3, {});
    }
})

router.route('/thirdRegister').post((req, res) => {
    try {
        var id = req.body.id;
        var token = req.body.token;
        var device_token = req.body.device_token;
        // var email = req.body.email;

        realId = remakeId(id)

        var owner = new Owner();
        owner._id = new ObjectId(realId)

        owner.info = {
            username: req.body.username || "",
            email: req.body.email || "",
            phone: req.body.phone || "",
            name: req.body.name || "",
            age: req.body.age || 18,
            address: {
                name: req.body.addressName || "",
                coordinates: {
                    lat: req.body.lat || 0,
                    lng: req.body.lng || 0
                }
            },
            gender: req.body.gender || 0,
            image: req.body.image || ""
        };

        owner.evaluation_point = 3;

        owner.wallet = 0;

        owner.auth = {
            device_token: device_token
        }

        owner.history = {
            createAt: new Date(),
            updateAt: new Date()
        };

        owner.status = true;

        owner.location = {
            type: 'Point',
            coordinates: [req.body.lng, req.body.lat]
        };

        Owner.findOne({ $or: [{ _id: realId }, { 'info.email': req.body.email }], status: true }).exec((error, data) => {
            if (error) return msg.msgReturn(res, 3, {})
            else {
                if (validate.isNullorEmpty(data)) {
                    owner.save((error, data) => {
                        if (error) {
                            return msg.msgReturn(res, 3, {});
                        } else {
                            var session = new Session();
                            session.auth.userId = data._id;
                            session.auth.token = token;
                            session.loginAt = new Date();
                            session.status = true;

                            session.save((error) => {
                                if (error) {
                                    return msg.msgReturn(res, 3, {});
                                } else {
                                    var dt = {
                                        token: session.auth.token,
                                        user: {
                                            _id: data._id,
                                            info: data.info,
                                            evaluation_point: data.evaluation_point,
                                            wallet: data.wallet
                                        }
                                    };
                                    return msg.msgReturn(res, 0, dt);
                                }
                            });
                        }
                    });
                } else {
                    return msg.msgReturn(res, 2, {});
                }
            }
        })
    } catch (error) {
        // console.log(error)
        return msg.msgReturn(res, 3)
    }
})

/** POST - Create Maid's Information
 * info {
 *      type: POST
 *      url: /create
 *      name: Create Maid's Information
 *      description: Create one Maid's information
 * }
 * 
 * params {
 *      null
 * }
 * 
 * body {
 *      username: String
 *      email: String
 *      phone: String
 *      image: String
 *      addressName: String
 *      lat: Number
 *      lng: Number
 *      gender: Number
 * }
 */
router.route('/maid/register').post((req, res) => {
    try {
        var maid = new Maid();

        maid.info = {
            username: req.body.username || "",
            email: req.body.email || "",
            phone: req.body.phone || "",
            name: req.body.name || "",
            age: req.body.age || 18,
            address: {
                name: req.body.addressName || "",
                coordinates: {
                    lat: req.body.lat || 0,
                    lng: req.body.lng || 0
                }
            },
            gender: req.body.gender || 0,
        };

        // maid.evaluation_point = 0;

        maid.work_info = {
            evaluation_point: 0,
            price: 0
        };

        maid.auth = {
            password: AppService.hashString(req.body.password),
            device_token: req.body.device_token
        };

        maid.history = {
            createAt: new Date(),
            updateAt: new Date()
        };

        maid.status = true;

        maid.location = {
            type: 'Point',
            coordinates: [req.body.lng, req.body.lat]
        };

        Maid.findOne({ 'info.username': req.body.username }).exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(data)) {
                    if (!req.files.image) {
                        maid.info['image'] = req.body.image || "";
                        maid.save((error) => {
                            if (error) return msg.msgReturn(res, 3);
                            return msg.msgReturn(res, 0);
                        });
                    } else {
                        cloudinary.uploader.upload(
                            req.files.image.path,
                            function(result) {
                                maid.info['image'] = result.url;
                                maid.save((error) => {
                                    if (error) return msg.msgReturn(res, 3);
                                    return msg.msgReturn(res, 0);
                                });
                            });
                    }
                } else {
                    return msg.msgReturn(res, 2);
                }
            }
        });
    } catch (error) {
        console.log(error);
        return msg.msgReturn(res, 3);
    }
});

/** PUT - Update Maid's Information
 * info {
 *      type: PUT
 *      url: /update
 *      name: Update Maid's Information
 *      description: Update one Maid's information
 * }
 * 
 * params {
 *      null
 * }
 * 
 * body {
 *      id: Maid_ID
 *      username: String
 *      email: String
 *      phone: String
 *      image: String
 *      addressName: String
 *      lat: Number
 *      lng: Number
 *      gender: Number
 * }
 */
router.route('/maid/update').put((req, res) => {
    try {
        var id = req.body.id;

        var maid = new Maid();
        maid.info = {
            username: req.body.username || "",
            email: req.body.email || "",
            phone: req.body.phone || "",
            name: req.body.name || "",
            age: req.body.age || 18,
            address: {
                name: req.body.addressName || "",
                coordinates: {
                    lat: req.body.lat || 0,
                    lng: req.body.lng || 0
                }
            },
            gender: req.body.gender || 0,
        };

        maid.work_info = {
            ability: req.body.ability,
            price: 0
        };

        maid.location = {
            type: 'Point',
            coordinates: [req.body.lng, req.body.lat]
        };

        Maid.findOne({ _id: id }).exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4);
                } else {
                    if (!req.files.image) {
                        maid.info['image'] = req.body.image || "";
                        Maid.findOneAndUpdate({
                                _id: id,
                                status: true
                            }, {
                                $set: {
                                    info: maid.info,
                                    work_info: maid.work_info,
                                    location: maid.location,
                                    'history.updateAt': new Date()
                                }
                            }, {
                                upsert: true
                            },
                            (error, result) => {
                                if (error) return msg.msgReturn(res, 3);
                                return msg.msgReturn(res, 0);
                            }
                        );
                    } else {
                        cloudinary.uploader.upload(
                            req.files.image.path,
                            function(result) {
                                maid.info['image'] = result.url;
                                Maid.findOneAndUpdate({
                                        _id: id,
                                        status: true
                                    }, {
                                        $set: {
                                            info: maid.info,
                                            work_info: maid.work_info,
                                            location: maid.location,
                                            'history.updateAt': new Date()
                                        }
                                    }, {
                                        upsert: true
                                    },
                                    (error, result) => {
                                        if (error) return msg.msgReturn(res, 3);
                                        return msg.msgReturn(res, 0);
                                    }
                                );
                            });
                    }
                }
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

module.exports = router;