var express = require('express');
var mongoose = require('mongoose');
var requestLanguage = require('express-request-language');
var cookieParser = require('cookie-parser');
var router = express.Router();

var messageService = require('../_services/message.service');
var msg = new messageService.Message();

var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();

var languageService = require('../_services/language.service');
var lnService = new languageService.Language();

var mail = require('../_services/mail.service');
var mailService = new mail.MailService();

var Owner = require('../_model/owner');
var Session = require('../_model/session');
var Package = require('../_model/package');
var Term = require('../_model/term');

var cloudinary = require('cloudinary');
var bodyparser = require('body-parser');
var randomstring = require("randomstring");

router.use(bodyparser.urlencoded({
    extended: true
}));
router.use(bodyparser.json());

const hash_key = 'LULULUL';
// const hash_key = 'HBBSolution';

function hash(content) {
    const crypto = require('crypto');
    const hash = crypto.createHmac('sha256', hash_key)
        .update(content)
        .digest('hex');
    return hash;
}

router.use(function (req, res, next) {
    console.log('package_router is connecting');

    try {
        var baseUrl = req.baseUrl;
        var language = baseUrl.substring(baseUrl.indexOf('/') + 1, baseUrl.lastIndexOf('/'));

        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            next();
        }
        else {
            return msg.msgReturn(res, 6);
        }
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/create').post((req, res) => {
    try {
        let term = new Term();
        let language = req.cookies.language;
        Term.setDefaultLanguage(language);

        let content = req.body.content;

        content.status = true;
        content.history.createAt = new Date();
        content.history.updateAt = new Date();

        content.set('content.all', {
            en: content,
            vi: content
        });

        content.save((error) => {
            if (error) return msg.msgReturn(res, 3);
            return msg.msgReturn(res, 0);
        })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/getTerm').get((req, res) => {
    try {
        var language = req.cookies.language;
        Term.setDefaultLanguage(language);

        Term.find({}).select('content').exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4);
                } else {
                    return msg.msgReturn(res, 0, data);
                }
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/resetPassword').post((req, res) => {
    try {
        let newPw = randomstring.generate(7);
        let hashPw = hash(newPw);

        var username = req.body.username;
        var email = req.body.email;

        Owner.findOne({ 'info.username': username, 'info.email': email }).exec((error, data) => {
            if (error) {
                console.log(error);
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4);
                } else {
                    Owner.findOneAndUpdate(
                        {
                            'info.username': username,
                            'info.email': email
                        },
                        {
                            $set: {
                                'auth.password': hashPw
                            }
                        },
                        {
                            upsert: true
                        },
                        (error) => {
                            if (error) {
                                return msg.msgReturn(res, 3);
                            } else {
                                mailService.resetPassword(email, newPw, res);

                                // console.log(mailService.resetPassword(email, newPw));
                                // if (boolean) return msg.msgReturn(res, 0);
                                // return msg.msgReturn(res, 0);
                            }
                        }
                    )
                }
            }
        });
    } catch (error) {
        console.log(error);
        return msg.msgReturn(res, 3);
    }
});

module.exports = router;