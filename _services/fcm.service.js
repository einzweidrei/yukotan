var admin = require('firebase-admin');
var messageService = require('../_services/message.service');
var msg = new messageService.Message();

var title = 'NGV247'
var bodyVi = ' đã gửi yêu cầu trực tiếp cho bạn.'
var bodyEn = ' has sent the request directly to you.'

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
                body += bodyVi
            } else {
                body += bodyEn
            }

            d = new Date()
            var payload = {
                content_available: true,
                // notification: {
                //     title: title,
                //     body: body
                // },
                data: {
                    title: title,
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

    FCMService.prototype.pushPayDirect = (res, user, language, status, data, billId) => {
        try {
            registrationToken = user.auth.device_token || '';
            var data = data || []
            body = user.info.name
            if (language == 'vi') {
                body += bodyVi
            } else {
                body += bodyEn
            }

            d = new Date()
            var payload = {
                content_available: true,
                // notification: {
                //     title: title,
                //     body: body
                // },
                data: {
                    title: title,
                    body: body,
                    bill: billId,
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
