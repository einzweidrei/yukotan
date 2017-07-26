var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;
var messageService = require('../_services/message.service');
var msg = new messageService.Message();

// const url = 'http://localhost:8000/vi/more/ownerResetPassword?url=';
const url = 'http://api.ngv247.com/vi/more/ownerResetPassword?url=';
const senderAddress = '"NGV247"';

var transporter = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    auth: {
        user: 'ngiupviec247@gmail.com',
        pass: 'T123456789'
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
    };

    MailService.prototype.sendConfirmForgotPwMail = (user, verifyToken, callback) => {
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
            return callback(null, data);
        });
    };

    MailService.prototype.sendNewPassword = (user, newPw, callback) => {
        try {
            var mailOptions = {
                from: senderAddress,
                to: user.info.email,
                subject: 'Reset your password',
                text: 'This is your new password: ' + newPw,
            };

            var mailService = new MailService();
            mailService.submitMail(mailOptions, (error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                return callback(null, data);
            });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    return MailService;
}());

exports.MailService = MailService;
