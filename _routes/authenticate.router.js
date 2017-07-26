var express = require('express');
var router = express.Router();
var messageService = require('../_services/message.service');
var msg = new messageService.Message();
var languageService = require('../_services/language.service');
var lnService = new languageService.Language();
var as = require('../_services/app.service');
var AppService = new as.App();
var cloudinary = require('cloudinary');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var contAuth = require('../_controller/authenticate.controller');
var authController = new contAuth.Authenticate();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

router.use(multipartMiddleware);

router.use(function (req, res, next) {
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
                function (result) {
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
        var password = req.body.password || "";
        var device_token = req.body.device_token || "";

        authController.loginByMaid(username, password, device_token, (error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED, {});
    }
});

router.route('/thirdLogin').post((req, res) => {
    try {
        var id = req.body.id;
        var token = req.body.token;
        var device_token = req.body.device_token;

        authController.thirdLogin(id, token, device_token, (error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED, {});
    }
});

router.route('/thirdRegister').post((req, res) => {
    try {
        var id = req.body.id;
        var token = req.body.token;
        var device_token = req.body.device_token;

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
        var image = req.body.image || '';

        authController.thirdRegister(id, token, device_token, username, email,
            phone, name, age, addressName, lat, lng, gender, image, (error, data) => {
                return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
            });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED, {});
    }
});

module.exports = router;