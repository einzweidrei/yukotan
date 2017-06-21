// var FCM = require('fcm-push');
// var serverKey = 'AAAAMUtn3Cc:APA91bGAI3xTxpWwv08xKltWjsUapH--PL7c5BLKNt-CJ55JcmMK5frPFaKuoErcWgys8Bw1CjrTbLaBk3rrKQCdV5s22pgwjMH42C7_12P1DRbpgQVic9KepT7CWo2sUpDR_bkxGgnC';
// var serverKey = 'AAAAMUtn3Cc:APA91bFAuFdhIIjHNCAe-MwWMEyahDH_N2LHPTcq-U2b6goX-uHPc08UNnUNHA5JoIFXGNKETDw4Sys-uphccj29nkkiStiT2D99KFL6t7xG1aRfidpZXORZgqeXHqlTtlbQldPD-fLC';
// var fcm = new FCM(serverKey);
// var request = require('request');
var admin = require('firebase-admin');
var messageService = require('../_services/message.service');
var msg = new messageService.Message();

var FCMService = (function () {
    function FCMService() { }

    FCMService.prototype.pushNotification = (res, user, language, status, data) => {
        try {
            // This registration token comes from the client FCM SDKs.
            registrationToken = user.auth.device_token || ''

            var data = data || []
            // data = []
            // if (data) data = data
            // console.log(device_token)

            body = user.info.name
            if (language == 'vi') {
                body += ' đã gửi yêu cầu trực tiếp cho bạn.'
            } else {
                body += ' has sent the request directly to you.'
            }

            d = new Date()
            var payload = {
                // notification: {
                //     title: 'This is title',
                //     body: 'This is body'
                // },
                data: {
                    title: 'GV24H',
                    body: body,
                    status: status.toString(),
                    time: d.toString()
                }
            };
            admin.messaging().sendToDevice(registrationToken, payload)
                .then(function (response) {
                    // See the MessagingDevicesResponse reference documentation for
                    // the contents of response.
                    if (!response || response.results.error) {
                        return msg.msgReturn(res, 17, data);
                    } else {
                        return msg.msgReturn(res, 0, data);
                    }
                })
                .catch(function (error) {
                    console.log(error)
                    return msg.msgReturn(res, 17, data);
                });
        } catch (error) {
            return msg.msgReturn(res, 17, data);
        }
    }

    return FCMService;
}());

exports.FCMService = FCMService;
