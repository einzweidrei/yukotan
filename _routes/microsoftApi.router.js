var express = require('express');
var mongoose = require('mongoose');
var requestLanguage = require('express-request-language');
var cookieParser = require('cookie-parser');
var router = express.Router();
var async = require('promise-async');

var messageService = require('../_services/message.service');
var msg = new messageService.Message();

var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();

var languageService = require('../_services/language.service');
var lnService = new languageService.Language();

var Owner = require('../_model/owner');
var Session = require('../_model/session');
var Package = require('../_model/package');

var cloudinary = require('cloudinary');
var bodyparser = require('body-parser');

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var request = require('request');

router.use(multipartMiddleware);

router.use(function (req, res, next) {
    console.log('uploadImage_router is connecting');
    next();
});

router.post('/test', multipartMiddleware, (req, res) => {
    async.parallel({
        faceId1: function (callback) {
            request({
                method: 'POST',
                preambleCRLF: true,
                postambleCRLF: true,
                uri: 'https://southeastasia.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false',
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': '8f22becb14664c0c87864d840dfcf114'
                },
                body: JSON.stringify(
                    {
                        "url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGsD2BH0tSR6OqIl7_qqXqN0U3abzvQlD0tWMyRS3GsUCUa2T3"
                    }
                )
            },
                function (error, response, body) {
                    if (error) {
                        console.error('upload failed:', error);
                        callback(null, null);
                    }
                    console.log('Upload successful!  Server responded with:', body);
                    var data = JSON.parse(body);
                    callback(null, data[0].faceId);
                });
        },
        faceId2: function (callback) {
            request({
                method: 'POST',
                preambleCRLF: true,
                postambleCRLF: true,
                uri: 'https://southeastasia.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false',
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': '8f22becb14664c0c87864d840dfcf114'
                },
                body: JSON.stringify(
                    {
                        "url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGsD2BH0tSR6OqIl7_qqXqN0U3abzvQlD0tWMyRS3GsUCUa2T3"
                    }
                )
            },
                function (error, response, body) {
                    if (error) {
                        console.error('upload failed:', error);
                        callback(null, null);
                    }
                    console.log('Upload successful!  Server responded with:', body);
                    var data = JSON.parse(body);
                    callback(null, data[0].faceId);
                });
        }
    }, (error, data) => {
        console.log(data);
        if (error) {

        } else {
            if (validate.isNullorEmpty(data.faceId)) {

            }
            else {
                var result = verifyFaceId(faceId, faceId2);
                console.log('Ta-da!');
            }
        }
    });
});

function getFaceId(imageUrl, callback) {
    request({
        method: 'POST',
        preambleCRLF: true,
        postambleCRLF: true,
        uri: 'https://southeastasia.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false',
        headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': '8f22becb14664c0c87864d840dfcf114'
        },
        body: JSON.stringify(
            {
                "url": imageUrl
            }
        )
    },
        function (error, response, body) {
            setTimeout(function () {
                if (error) {
                    console.error('upload failed:', error);
                    callback(null, null);
                }
                console.log('Upload successful!  Server responded with:', body);
                callback(null, body.faceId);
            }, 5000);
        });
}

function verifyFaceId(faceId1, faceId2) {
    request({
        method: 'POST',
        preambleCRLF: true,
        postambleCRLF: true,
        uri: 'https://southeastasia.api.cognitive.microsoft.com/face/v1.0/verify',
        headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': '8f22becb14664c0c87864d840dfcf114'
        },
        body: JSON.stringify(
            {
                "faceId1": faceId1,
                "faceId2": faceId2
            }
        )
    },
        function (error, response, body) {
            if (error) {
                console.error('upload failed:', error);
                return null;
            }
            console.log('Verify successful!  Server responded with:', body);
            return body;
        });
}

router.post('/verify', multipartMiddleware, (req, res) => {
    var imgUrl = 'http://res.cloudinary.com/einzweidrei2/image/upload/v1494992955/v6dghizgtrmrizvamoy4.jpg';
    var subs_key = '8f22becb14664c0c87864d840dfcf114';

    cloudinary.uploader.upload(
        req.files.avatar.path,
        function (result) {
            async.parallel({
                faceId1: function (callback) {
                    request({
                        method: 'POST',
                        preambleCRLF: true,
                        postambleCRLF: true,
                        uri: 'https://southeastasia.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false',
                        headers: {
                            'Content-Type': 'application/json',
                            'Ocp-Apim-Subscription-Key': subs_key
                        },
                        body: JSON.stringify(
                            {
                                "url": imgUrl
                            }
                        )
                    },
                        function (error, response, body) {
                            if (error) {
                                console.error('upload failed:', error);
                                callback(null, null);
                            }
                            console.log('FaceId1 successful!  Server responded with:', body);
                            var data = JSON.parse(body);
                            callback(null, data[0].faceId);
                        });
                },
                faceId2: function (callback) {
                    request({
                        method: 'POST',
                        preambleCRLF: true,
                        postambleCRLF: true,
                        uri: 'https://southeastasia.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false',
                        headers: {
                            'Content-Type': 'application/json',
                            'Ocp-Apim-Subscription-Key': subs_key
                        },
                        body: JSON.stringify(
                            {
                                "url": result.url
                            }
                        )
                    },
                        function (error, response, body) {
                            if (error) {
                                // console.error('upload failed:', error);
                                callback(null, null);
                            }
                            console.log('FaceId2 successful!  Server responded with:', body);
                            var data = JSON.parse(body);
                            callback(null, data[0].faceId);
                        });
                }
            }, (error, data) => {
                if (error) {
                    return msg.msgReturn(res, 3);
                } else {
                    if (validate.isNullorEmpty(data.faceId1) || validate.isNullorEmpty(data.faceId2)) {
                        return msg.msgReturn(res, 3);
                    }
                    else {
                        request({
                            method: 'POST',
                            preambleCRLF: true,
                            postambleCRLF: true,
                            uri: 'https://southeastasia.api.cognitive.microsoft.com/face/v1.0/verify',
                            headers: {
                                'Content-Type': 'application/json',
                                'Ocp-Apim-Subscription-Key': subs_key
                            },
                            body: JSON.stringify(
                                {
                                    "faceId1": data.faceId1,
                                    "faceId2": data.faceId2
                                }
                            )
                        },
                            function (error, response, body) {
                                if (error) {
                                    console.error('upload failed:', error);
                                    return msg.msgReturn(res, 3);
                                }
                                console.log('Verify successful!  Server responded with:', body);
                                return msg.msgReturn(res, 0, body);
                            });
                    }
                }
            });
        }
    )
});

module.exports = router;