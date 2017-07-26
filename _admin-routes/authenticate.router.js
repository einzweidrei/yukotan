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
var contAuth = require('../_controller/authenticate.controller');
var authController = new contAuth.Authenticate();
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
        } else return msg.msgReturn(res, ms.LANGUAGE_NOT_SUPPORT);
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/login').post((req, res) => {
    var username = req.body.username;
    var password = req.body.password;

    authController.login4Admin(username, password, (error, data) => {
        return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
    });
});

router.route('/testToken').get((req, res) => {
    try {
        if (req.headers.token) {
            var token = req.headers.token;
            return msg.msgReturn(res, ms.SUCCESS, { token: token });
        } else {
            return msg.msgReturn(res, ms.DATA_NOT_EXIST);
        }
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/test').get((req, res) => {
    res.redirect('https://www.google.com.vn/?gws_rd=ssl');
})

module.exports = router;