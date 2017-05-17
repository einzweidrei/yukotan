var nodemailer = require('nodemailer');
var messageService = require('../_services/message.service');
var msg = new messageService.Message();

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'YukoTesting01@gmail.com',
        pass: '789632145'
    }
});

var MailService = (function () {
    function MailService() { }

    MailService.prototype.sendMail = (res) => {
        try {
            // setup email data with unicode symbols
            let mailOptions = {
                from: '"👑 Yuko Testing 👑" <YukoTesting01@gmail.com>', // sender address
                to: 'tan.truong114@gmail.com', // list of receivers
                subject: 'Testing 😘', // Subject line
                text: 'Sending Mail 😋', // plain text body
                // html: '<b>Test HTML 😋</b>' // html body
            };

            // send mail with defined transport object
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return msg.msgReturn(res, 3);
                }
                console.log('Message %s sent: %s', info.messageId, info.response);
                return msg.msgReturn(res, 0);
            });
        } catch (error) {
            return msg.msgReturn(res, 3);
        }
    };

    MailService.prototype.resetPassword = (email, newPw, res) => {
        try {
            // setup email data with unicode symbols
            let mailOptions = {
                from: '"Admin" <YukoTesting01@gmail.com>', // sender address
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
