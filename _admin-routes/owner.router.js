var express = require('express');
var router = express.Router();
var messageService = require('../_services/message.service');
var msg = new messageService.Message();
var languageService = require('../_services/language.service');
var lnService = new languageService.Language();
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var contOwner = require('../_controller/owner.controller');
var ownerController = new contOwner.Owner();
var as = require('../_services/app.service');
var AppService = new as.App();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;
var contSession = require('../_controller/session.controller');
var sessionController = new contSession.Session();

router.use(multipartMiddleware);

router.use(function (req, res, next) {
    try {
        var baseUrl = req.baseUrl;
        var language = AppService.getWebLanguage(baseUrl);

        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            AppService.setLanguage(language);
            next();
            // if (req.headers.token) {
            //     var token = req.headers.token;
            //     sessionController.verifyWebToken(token, (error, data) => {
            //         if (error) return msg.msgReturn(res, error);
            //         else {
            //             req.cookies['userId'] = data.auth.userId;
            //             next();
            //         }
            //     });
            // } else return msg.msgReturn(res, ms.UNAUTHORIZED);
        } else return msg.msgReturn(res, ms.LANGUAGE_NOT_SUPPORT);
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/check').get((req, res) => {
    var username = req.query.username;

    ownerController.checkAccountExist(username, (error) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
    });
});

// router.route('/getAll').get((req, res) => {
//     var startAt = req.query.startAt;
//     var endAt = req.query.endAt;
//     var page = req.query.page || 1;
//     var limit = req.query.limit || 10;
//     var sort = req.query.sort || 'asc';
//     var email = req.query.email;
//     var username = req.query.username;
//     var name = req.query.name;
//     var gender = req.query.gender;

//     ownerController.getAll4Admin(page, limit, startAt, endAt, sort,
//         email, username, name, gender, (error, data) => {
//             return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
//         });
// });

router.route('/getAll').post((req, res) => {
    var startAt = req.query.startAt;
    var endAt = req.query.endAt;
    var page = req.query.page || 1;
    var limit = req.query.limit || 10;
    var sort = req.query.sort || 'asc';
    var email = req.body.email;
    var username = req.body.username;
    var name = req.body.name;
    var gender = req.body.gender;

    ownerController.getAll4Admin(page, limit, startAt, endAt, sort,
        email, username, name, gender, (error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
});

router.route('/getById').get((req, res) => {
    var id = req.query.id;

    ownerController.getInfo4Admin(id, (error, data) => {
        return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
    });
});

router.route('/getAllTasks').get((req, res) => {
    var id = req.query.id;
    var process = req.query.process;
    var startAt = req.query.startAt;
    var endAt = req.query.endAt;
    var limit = req.query.limit || 10;
    var page = req.query.page || 1;
    var sort = req.query.sort || 'asc';
    var title = req.query.title;

    ownerController.getAllTasks4Admin(id, process, startAt, endAt, limit, page,
        sort, title, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
        });
});

router.route('/create').post((req, res) => {
    var username = req.body.username;
    var email = req.body.email || '';
    var phone = req.body.phone || '';
    var name = req.body.name || '';
    var image = req.body.image || '';
    var addressName = req.body.addressName || '';
    var lat = req.body.lat || 1;
    var lng = req.body.lng || 1;
    var gender = req.body.gender || 0;
    var password = req.body.password || '';
    var device_token = '';

    ownerController.create(username, email, phone, name, image, addressName,
        lat, lng, gender, password, device_token, (error) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
});

router.route('/update').post((req, res) => {
    var id = req.body.id;
    var phone = req.body.phone || '';
    var name = req.body.name || '';
    var image = req.body.image || '';
    var addressName = req.body.addressName || '';
    var lat = req.body.lat || 1;
    var lng = req.body.lng || 1;
    var gender = req.body.gender || 0;
    var email = req.body.email || '';

    ownerController.update(id, phone, name, image,
        addressName, lat, lng, gender, email, (error) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
});

router.route('/delete').post((req, res) => {
    var id = req.query.id;

    ownerController.delete(id, (error) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
    });
});

router.route('/getComment').get((req, res) => {
    var id = req.query.id;
    var limit = req.query.limit || 10;
    var page = req.query.page || 1;

    ownerController.getComment(id, limit, page, (error, data) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
    });
});

router.route('/deleteComment').post((req, res) => {
    var id = req.query.id;

    ownerController.deleteComment(id, (error) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
    });
});

router.route('/chargeWallet').post((req, res) => {
    var id = req.body.id;
    var price = req.body.price || 0;

    ownerController.chargeWallet(id, price, (error) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
    });
});

router.route('/statistical').get((req, res) => {
    var id = req.query.id;
    var startAt = req.query.startAt;
    var endAt = req.query.endAt;
    var isSolved = req.query.isSolved || true;

    ownerController.statistical4Admin(id, startAt, endAt, isSolved, (error, data) => {
        return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
    });
});

router.route('/taskStatistic').get((req, res) => {
    var id = req.query.id;
    var startAt = req.query.startAt;
    var endAt = req.query.endAt;
    var method = req.query.method;
    var isSolved = req.query.isSolved || true;

    ownerController.getStatisticalTasks(id, method, startAt, endAt, isSolved, (error, data) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
    });
});

router.route('/changePassword').post((req, res) => {
    var id = req.body.id;
    var password = req.body.password;

    ownerController.changePassword4Admin(id, password, (error) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
    });
});

module.exports = router;