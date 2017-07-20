var express = require('express');
var router = express.Router();
var messageService = require('../_services/message.service');
var msg = new messageService.Message();
var languageService = require('../_services/language.service');
var lnService = new languageService.Language();
var as = require('../_services/app.service');
var AppService = new as.App();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;
var contMaid = require('../_controller/maid.controller');
var maidController = new contMaid.Maid();
var contOwner = require('../_controller/owner.controller');
var ownerController = new contOwner.Owner();
var contTask = require('../_controller/task.controller');
var taskController = new contTask.Task();
var contTerm = require('../_controller/term.controller');
var termController = new contTerm.Term();
var contAppInfo = require('../_controller/app-info.controller');
var appInfoController = new contAppInfo.AppInfo();
var contContact = require('../_controller/contact.controller');
var contactController = new contContact.Contact();
var contMaidRegister = require('../_controller/maid-register.controller');
var maidRegisterController = new contMaidRegister.MaidRegister();

router.use(function(req, res, next) {
    try {
        var baseUrl = req.baseUrl;
        var language = AppService.getAppLanguage(baseUrl);

        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            AppService.setLanguage(language);
            next();
        } else return msg.msgReturn(res, ms.LANGUAGE_NOT_SUPPORT);
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/getAllMaids').get((req, res) => {
    try {
        var minDistance = req.query.minDistance || 0;
        var maxDistance = req.query.maxDistance || 2;
        var limit = req.query.limit || 20;
        var page = req.query.page || 1;
        var skip = (page - 1) * limit;

        var priceMin = req.query.priceMin;
        var priceMax = req.query.priceMax;

        var ageMin = req.query.ageMin;
        var ageMax = req.query.ageMax;

        var workId = req.query.workId;

        var gender = req.query.gender;

        var sortBy = req.query.sortBy || "distance"; //distance & price
        var sortType = req.query.sortType || "asc"; //asc & desc

        var location = {
            type: 'Point',
            coordinates: [
                parseFloat(req.query.lng) || 0,
                parseFloat(req.query.lat) || 0
            ]
        };

        maidController.getAllMaids(minDistance, maxDistance, limit, page, skip, priceMin, priceMax,
            ageMin, ageMax, workId, gender, sortBy, sortType, location, (error, data) => {
                return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
            });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/getTaskAround').get((req, res) => {
    try {
        var minDistance = req.query.minDistance || 0;
        var maxDistance = req.query.maxDistance || 5;
        var sortBy = req.query.sortBy || "distance"; //distance & price
        var sortType = req.query.sortType || "asc"; //asc & desc

        var location = {
            type: 'Point',
            coordinates: [
                parseFloat(req.query.lng) || 0,
                parseFloat(req.query.lat) || 0
            ]
        };

        taskController.getTaskAround(minDistance, maxDistance, sortBy, sortType, location, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/getTaskByWork').get((req, res) => {
    try {
        var minDistance = req.query.minDistance || 0;
        var maxDistance = req.query.maxDistance || 5;
        var limit = req.query.limit || 20;
        var page = req.query.page || 1;
        var skip = (page - 1) * limit;

        var title = req.query.title;
        var package = req.query.package;
        var work = req.query.work;

        var sortBy = req.query.sortBy || "distance"; //distance & price
        var sortType = req.query.sortType || "asc"; //asc & desc

        var location = {
            type: 'Point',
            coordinates: [
                parseFloat(req.query.lng) || 0,
                parseFloat(req.query.lat) || 0
            ]
        };

        taskController.getTaskByWork(minDistance, maxDistance, limit, page, skip, title, package, work,
            sortBy, sortType, location, (error, data) => {
                return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
            });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/getGV24HInfo').get((req, res) => {
    try {
        var id = req.query.id;

        termController.getInfo(id, (error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED, {});
    }
});

router.route('/maidForgotPassword').post((req, res) => {
    try {
        var username = req.body.username;
        var email = req.body.email;

        maidController.forgotPassword(username, email, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/ownerForgotPassword').post((req, res) => {
    try {
        var username = req.body.username;
        var email = req.body.email;

        ownerController.forgotPassword(username, email, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/getContact').get((req, res) => {
    try {
        appInfoController.getContact((error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED, {});
    }
});

router.route('/createContact').post((req, res) => {
    var name = req.body.name;
    var email = req.body.email;
    var content = req.body.content;

    contactController.create(name, email, content, (error) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
    });
});

router.route('/maidRegister').post((req, res) => {
    var name = req.body.name;
    var address = req.body.address;
    var phone = req.body.phone;
    var note = req.body.note;

    maidRegisterController.register(name, address, phone, note, (error) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
    });
});

module.exports = router;