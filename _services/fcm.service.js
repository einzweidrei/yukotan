var admin = require('firebase-admin');
var messageService = require('../_services/message.service');
var msg = new messageService.Message();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var title = 'NGV247'
var bodyVi = 'Bạn nhận được một thông báo.'
var bodyEn = 'You receive a notification.'

var FCMService = (function () {
    function FCMService() { }

    FCMService.prototype.pushNotify = (user, language, status, billId, callback) => {
        var registrationToken = user.auth.device_token || '';
        var body = '';
        language == 'vi' ? body += bodyVi : body += bodyEn;
        var now = new Date();
        var payload = {};

        if (registrationToken != '') {
            var mToken = registrationToken.split('@//@');
            var sendToken = mToken[0];

            if (mToken.length > 1) {
                if (mToken[1] == 'android') {
                    payload = {
                        data: {
                            title: title,
                            body: body,
                            status: status.toString(),
                            time: now.toString()
                        }
                    };
                } else {
                    payload = {
                        notification: {
                            title: title,
                            body: body
                        },
                        data: {
                            title: title,
                            body: body,
                            status: status.toString(),
                            time: now.toString()
                        }
                    };
                }

                if (billId != '') {
                    payload.data.bill = billId;
                }

                admin.messaging().sendToDevice(sendToken, payload)
                    .then(function (response) {
                        if (!response || response.results.error) return callback(ms.PUSH_NOTIFY_FAILED);
                        else return callback(null, response);
                    })
                    .catch(function (error) {
                        return callback(ms.PUSH_NOTIFY_FAILED);
                    });
            }
            else return callback(ms.PUSH_NOTIFY_FAILED);
        }
        else return callback(ms.PUSH_NOTIFY_FAILED);
    }

    FCMService.prototype.pushNotification = (res, user, language, status, data, billId) => {
        try {
            var registrationToken = user.auth.device_token || ''
            var data = data || []
            var body = user.info.name
            language == 'vi' ? body += bodyVi : body += bodyEn
            var d = new Date()
            var payload = {}

            if (registrationToken != '') {
                var mToken = registrationToken.split('@//@')
                var sendToken = mToken[0]

                if (mToken.length > 1) {
                    if (mToken[1] == 'android') {
                        payload = {
                            data: {
                                title: title,
                                body: body,
                                status: status.toString(),
                                time: d.toString()
                            }
                        };
                    } else {
                        payload = {
                            notification: {
                                title: title,
                                body: body
                            },
                            data: {
                                title: title,
                                body: body,
                                status: status.toString(),
                                time: d.toString()
                            }
                        };
                    }

                    if (billId != '') {
                        payload.data.bill = billId;
                    }

                    admin.messaging().sendToDevice(sendToken, payload)
                        .then(function (response) {
                            if (!response || response.results.error) {
                                return msg.msgReturn(res, 17, data);
                            } else {
                                return msg.msgReturn(res, 0, data);
                            }
                        })
                        .catch(function (error) {
                            return msg.msgReturn(res, 17, data);
                        });
                } else {
                    return msg.msgReturn(res, 17, data);
                }
            } else {
                return msg.msgReturn(res, 17, data);
            }
        } catch (error) {
            return msg.msgReturn(res, 17, data);
        }
    }

    return FCMService;
}());

exports.FCMService = FCMService;
