var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

var messageService = require('../_services/message.service');
var msg = messageService.Message;
var msgRep = new messageService.Message();

var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();

var Owner = require('../_model/owner');
var Session = require('../_model/session');

router.use(function (req, res, next) {
    console.log('owner_router is connecting');
    next();
});

router.route('/getById').get((req, res) => {
    var id = req.query.id;

    Owner.findOne({ _id: id }).exec((error, data) => {
        if (validate.isNullorEmpty(data)) {
            return res.status(200).send(msgRep.msgData(false, msg.msg_data_not_exist));
        } else {
            if (error) {
                return res.status(500).send(msgRep.msgData(false, msg.msg_failed));
            } else {
                return res.status(200).send(msgRep.msgData(true, msg.msg_success, data));
            }
        }
    })
});

router.route('/getAround').get((req, res) => {
    var id = req.query.id;

    Owner.findOne({ _id: id }).exec((error, data) => {
        if (validate.isNullorEmpty(data)) {
            return res.status(200).send(msgRep.msgData(false, msg.msg_data_not_exist));
        } else {
            if (error) {
                return res.status(500).send(msgRep.msgData(false, msg.msg_failed));
            } else {
                var location = data.info.address.location;

                // Owner.find({
                //     'info.address.location': {
                //         $nearSphere: {
                //             $geometry: {
                //                 type: 'Point',
                //                 coordinates: [106.687583, 10.767292]
                //             },
                //             $maxDistance: 5000
                //         }
                //     }
                // }, (error, data) => {
                //     console.log(data);
                //     if (validate.isNullorEmpty(data)) {
                //         return res.status(200).send(msgRep.msgData(false, msg.msg_data_not_exist));
                //     } else {
                //         return res.status(200).send(msgRep.msgData(true, msg.msg_success, data));
                //     }
                // });

                // Owner.find({}).near('info.address.location.coordinates', { center: [106.687583, 10.767292], spherical: true })
                //     .exec((error, data) => {
                //         if (validate.isNullorEmpty(data)) {
                //             return res.status(200).send(msgRep.msgData(false, msg.msg_data_not_exist));
                //         } else {
                //             return res.status(200).send(msgRep.msgData(true, msg.msg_success, data));
                //         }
                //     })

                // Owner.find({
                //     'info.address.location.coordinates': {
                //         '$near': {
                //             '$maxDistance': 1,
                //             '$geometry': {
                //                 type: 'Point', coordinates: [106.687583, 10.767292]
                //             }
                //         }
                //     }
                // }).exec((error, data) => {
                //     if (validate.isNullorEmpty(data)) {
                //         return res.status(200).send(msgRep.msgData(false, msg.msg_data_not_exist));
                //     } else {
                //         return res.status(200).send(msgRep.msgData(true, msg.msg_success, data));
                //     }
                // })

                Owner.aggregate([
                    {
                        $geoNear: {
                            near: { type: 'Point', coordinates: [106.687583, 10.767292] },
                            // near: location,
                            distanceField: 'dist.calculated',
                            maxDistance: 2000,
                            includeLocs: 'dist.location',
                            num: 5,
                            spherical: true
                        }
                    }
                ], (error, places) => {
                    if (validate.isNullorEmpty(places)) {
                        return res.status(200).send(msgRep.msgData(false, msg.msg_data_not_exist));
                    } else {
                        return res.status(200).send(msgRep.msgData(true, msg.msg_success, places));
                    }
                })
            }
        }
    })
});

function waitForIndex() {
    return new Promise((resolve, reject) => {
        Owner.on('index', error => error ? reject(error) : resolve());
    });
}

module.exports = router;