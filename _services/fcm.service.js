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

    FCMService.prototype.pushNotification = (res, device_token) => {
        try {
            // This registration token comes from the client FCM SDKs.
            registrationToken = device_token

            // See the "Defining the message payload" section below for details
            // on how to define a message payload.
            var payload = {
                notification: {
                    title: 'This is title',
                    body: 'This is body'
                },
                data: {
                    content: 'This is content'
                }
                // data: {
                //     score: "850",
                //     time: "10:16"
                // }
            };

            // console.log(payload)

            // console.log(admin);

            admin.messaging().sendToDevice(registrationToken, payload)
                .then(function (response) {
                    // See the MessagingDevicesResponse reference documentation for
                    // the contents of response.
                    console.log(response)
                    if (!response || response.results.error) {
                        return msg.msgReturn(res, 17);
                    } else {

                        return msg.msgReturn(res, 0);
                    }
                })
                .catch(function (error) {
                    console.log(error)
                    return msg.msgReturn(res, 17);
                });

            // let message = {
            //     to: 'env4CfmHrCI:APA91bEvgdvxQXsxCn7qq6s9nYfpe6pRg5glY33Ppogt8tNSj49cGpyiJp1miQBEQY5JkvhY5-oGpIyC3ku7-__DNAn9JCMvFvnlnal7Kyv1EoRllnXYvzxQe2VYPkrwqpWcfZaIUcZ5', // required fill with device token or topics
            //     collapse_key: 'AIzaSyAw0qJ9zxI1Ltte71TJHiLXN9J0nGkPDIc',
            //     data: {
            //         content: 'Test Notification'
            //     },
            //     notification: {
            //         title: 'Title of your push notification',
            //         body: 'Body of your push notification'
            //     }
            // };

            // fcm.send(message, function (err, response) {
            //     if (err) {
            //         console.log(err);
            //         console.log("Something has gone wrong!");
            //         console.log(response);
            //         return res.send(fcm);
            //     } else {
            //         console.log("Successfully sent with response: ", response);
            //     }
            // });

            // var device_token = 'env4CfmHrCI:APA91bEvgdvxQXsxCn7qq6s9nYfpe6pRg5glY33Ppogt8tNSj49cGpyiJp1miQBEQY5JkvhY5-oGpIyC3ku7-__DNAn9JCMvFvnlnal7Kyv1EoRllnXYvzxQe2VYPkrwqpWcfZaIUcZ5';

            // request({
            //     url: 'https://fcm.googleapis.com/fcm/send',
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': ' application/json',
            //         'Authorization': 'key=' + serverKey
            //     },
            //     body: JSON.stringify(
            //         {
            //             "data": {
            //                 "message": 'message pushing'
            //             },
            //             "to": device_token
            //         }
            //     )
            // }, function (error, response, body) {
            //     if (error) {
            //         console.error(error, response, body);
            //     }
            //     else if (response.statusCode >= 400) {
            //         console.error('HTTP Error: ' + response.statusCode + ' - ' + response.statusMessage + '\n' + body);
            //     }
            //     else {
            //         console.log(response);
            //         console.log(body);
            //         console.log('Done!')
            //     }
            // });


        } catch (error) {
            console.error(error);
        }
    }

    return FCMService;
}());

exports.FCMService = FCMService;
