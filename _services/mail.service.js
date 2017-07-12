var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;
var messageService = require('../_services/message.service');
var msg = new messageService.Message();

var url = 'http://localhost:8000/';
var senderAddress = 'NGV247 (YukoTesting01@gmail.com)';

var transporter = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    auth: {
        user: 'YukoTesting01@gmail.com',
        pass: '789632145'
    }
}));

var MailService = (function () {
    function MailService() { }

    MailService.prototype.submitMail = (mailOptions, callback) => {
        try {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                return callback(null, info);
            });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    }

    MailService.prototype.sendConfirmForgotPwMail = (email, verifyToken, callback) => {
        var confirmUrl = url + user._id + '-' + verifyToken;

        var mailOptions = {
            from: senderAddress,
            to: user.info.email,
            subject: 'Confirm to get a new password',
            text: 'Click to this follow link (activate in 7 days): ' + confirmUrl,
        };

        var mailService = new MailService();
        mailService.submitMail(mailOptions, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            return callback(null, info);
        });
    }

    MailService.prototype.sendMail = (res, user, verifyToken) => {
        try {
            var confirmUrl = url + user._id + '-' + verifyToken;

            // setup email data with unicode symbols
            var mailOptions = {
                from: 'NGV247', // sender address
                to: user.info.email, // list of receivers
                // to: 'einzweidrei2@gmail.com',
                subject: 'Confirm to get a new password', // Subject line
                text: 'Click to this follow link (activate in 7 days): ' + confirmUrl, // plain text body
                // html: '<b>Test HTML 😋</b>' // html body
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    var objType = Object.prototype.toString.call(error);
                    return msg.msgReturn(res, 3, { error: error.toString() });
                }
                else return msg.msgReturn(res, 0);
            });
        } catch (error) {
            var objType = Object.prototype.toString.call(error);
            return msg.msgReturn(res, 3, { error: error.toString() });
        }
    };

    MailService.prototype.resetPassword = (res, user) => {
        try {
            // setup email data with unicode symbols
            var mailOptions = {
                from: 'NGV247', // sender address
                to: email, // list of receivers
                subject: 'Reset your password', // Subject line
                text: 'Your new password: ' + newPw, // plain text body
                // html: '<b>Test HTML</b>' // html body
            };

            // send mail with defined transport object
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return msg.msgReturn(res, 3);
                }
                // console.log('Message %s sent: %s', info.messageId, info.response);
                return msg.msgReturn(res, 0);
            });
        } catch (error) {
            return msg.msgReturn(res, 3);
        }
    };

    return MailService;
}());

exports.MailService = MailService;
