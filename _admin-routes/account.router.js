var express = require('express');
var router = express.Router();
var messageService = require('../_services/message.service');
var msg = new messageService.Message();
var languageService = require('../_services/language.service');
var lnService = new languageService.Language();
var as = require('../_services/app.service');
var AppService = new as.App();
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var contAccount = require('../_controller/account.controller');
var accountController = new contAccount.Account();
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
            if (req.headers.token) {
                var token = req.headers.token;
                sessionController.verifyWebToken(token, (error, data) => {
                    if (error) return msg.msgReturn(res, error);
                    else {
                        req.cookies['userId'] = data.auth.userId;
                        next();
                    }
                });
            } else return msg.msgReturn(res, ms.UNAUTHORIZED);
        } else return msg.msgReturn(res, ms.LANGUAGE_NOT_SUPPORT);
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/getAll').get((req, res) => {
    var startAt = req.query.startAt;
    var endAt = req.query.endAt;
    var page = req.query.page || 1;
    var limit = req.query.limit || 10;
    var sort = req.query.sort || 'asc';

    var email = req.query.email;
    var username = req.query.username;
    var name = req.query.name;
    var gender = req.query.gender;

    accountController.getAll(page, limit, startAt, endAt, sort,
        email, username, name, gender, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
        });
});

router.route('/getById').get((req, res) => {
    var id = req.query.id;

    accountController.getById(id, (error, data) => {
        return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
    });
});

router.route('/create').post((req, res) => {
    var username = req.body.username;
    var email = req.body.email;
    var name = req.body.name;
    var phone = req.body.phone;
    var image = req.body.image;
    var address = req.body.address;
    var gender = req.body.gender;
    var password = req.body.password;
    var acc = req.body.Account || false;
    var owner = req.body.Owner || false;
    var maid = req.body.Maid || false;
    var task = req.body.Task || false;
    var bill = req.body.Bill || false;
    var giftcode = req.body.GiftCode || false;
    var work = req.body.Work || false;
    var aboutus = req.body.AboutUs || false;
    var report = req.body.Report || false;
    var contact = req.body.Contact || false;
    var billCharge = req.body.BillCharge || false;
    var suggest = req.body.Suggest || false;
    var cms = req.body.CMS || false;

    var perm = []
    perm = AppService.getPerm(acc, owner, maid, task, bill,
        giftcode, work, aboutus, report, contact, billCharge, suggest, cms);

    accountController.create(username, password, email, name, phone, image,
        address, gender, perm, (error) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
});

router.route('/update').post((req, res) => {
    var id = req.body.id;
    var email = req.body.email;
    var name = req.body.name || '';
    var phone = req.body.phone || '';
    var image = req.body.image || '';
    var address = req.body.address || '';
    var gender = req.body.gender || 0;
    var acc = req.body.Account || false;
    var owner = req.body.Owner || false;
    var maid = req.body.Maid || false;
    var task = req.body.Task || false;
    var bill = req.body.Bill || false;
    var giftcode = req.body.GiftCode || false;
    var work = req.body.Work || false;
    var aboutus = req.body.AboutUs || false;
    var report = req.body.Report || false;
    var contact = req.body.Contact || false;
    var billCharge = req.body.BillCharge || false;
    var suggest = req.body.Suggest || false;
    var cms = req.body.CMS || false;

    var perm = [];
    perm = AppService.getPerm(acc, owner, maid, task, bill,
        giftcode, work, aboutus, report, contact, billCharge, suggest, cms);

    accountController.update(id, email, name, phone, image, address,
        gender, perm, (error) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
});

router.route('/delete').post((req, res) => {
    var id = req.query.id;

    accountController.delete(id, (error) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
    });
});

router.route('/changePassword').post((req, res) => {
    var id = req.body.id;
    var password = req.body.password;

    accountController.changePassword(id, password, (error) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
    });
});

module.exports = router;