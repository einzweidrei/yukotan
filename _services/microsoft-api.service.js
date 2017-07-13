var request = require('request');
var as = require('../_services/app.service');
var AppService = new as.App();
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var MicrosoftAPI = (function () {
    function MicrosoftAPI() { }

    MicrosoftAPI.prototype.detectFace = (imageUrl, callback) => {
        var subs_key = AppService.getAzureKey();
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
                    url: imageUrl
                }
            )
        }, function (error, response, body) {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else {
                var data = JSON.parse(body);
                if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else return callback(null, data[0].faceId);
            }
        });
    };

    MicrosoftAPI.prototype.verifyFace = (faceId1, faceId2, callback) => {
        var subs_key = AppService.getAzureKey();
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
                    "faceId1": faceId1,
                    "faceId2": faceId2
                }
            )
        },
            function (error, response, body) {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else {
                    var item = JSON.parse(body);
                    if (validate.isNullorEmpty(item)) return callback(ms.DATA_NOT_EXIST);
                    else return callback(null, item);
                }
            });
    };

    return MicrosoftAPI;
}());

exports.MicrosoftAPI = MicrosoftAPI;
