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

var Owner = require('../_model/owner');
var Session = require('../_model/session');
var Package = require('../_model/package');

var cloudinary = require('cloudinary');
var bodyparser = require('body-parser');

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

router.use(multipartMiddleware);

router.use(function (req, res, next) {
    console.log('uploadImage_router is connecting');
    next();
});

router.post('/upload', multipartMiddleware, (req, res) => {
    console.log(req.body);
    console.log(req.file);
    console.log(req.files);

    // cloudinary.uploader.upload(
    //     req.files.avatar.path,
    //     function (result) {
    //         console.log(result);
    //     }
    //     // {
    //     //     public_id: 'sample_id',
    //     //     crop: 'limit',
    //     //     width: 2000,
    //     //     height: 2000,
    //     //     eager: [
    //     //         {
    //     //             width: 200, height: 200, crop: 'thumb', gravity: 'face',
    //     //             radius: 20, effect: 'sepia'
    //     //         },
    //     //         { width: 100, height: 150, crop: 'fit', format: 'png' }
    //     //     ],
    //     //     tags: ['special', 'for_homepage']
    //     // }
    // )
});

module.exports = router;