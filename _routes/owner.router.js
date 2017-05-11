var express = require('express');
var mongoose = require('mongoose');
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
var Work = require('../_model/work');
var Task = require('../_model/task');
var Process = require('../_model/process');
var Maid = require('../_model/maid');

var ObjectId = require('mongoose').Types.ObjectId;

var bodyparser = require('body-parser');

router.use(bodyparser.json({
    limit: '50mb',
}));

// setting limit of FILE
router.use(bodyparser.urlencoded({
    limit: '50mb',
    parameterLimit: 1000000,
    extended: true
}));

// // parse application/json
router.use(bodyparser.json());

/** Middle Ware
 * 
 */
router.use(function (req, res, next) {
    console.log('owner_router is connecting');

    try {
        var baseUrl = req.baseUrl;
        var language = baseUrl.substring(baseUrl.indexOf('/') + 1, baseUrl.lastIndexOf('/'));

        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            if (req.headers.hbbgvauth) {
                let token = req.headers.hbbgvauth;
                Session.findOne({ 'auth.token': token }).exec((error, data) => {
                    if (error) {
                        return msg.msgReturn(res, 3);
                    } else {
                        if (validate.isNullorEmpty(data)) {
                            return msg.msgReturn(res, 14);
                        } else {
                            req.cookies['userId'] = data.auth.userId;
                            next();
                        }
                    }
                });
            } else {
                return msg.msgReturn(res, 14);
            }
        }
        else {
            return msg.msgReturn(res, 6);
        }
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

/** GET - Get Owner By Owner ID
 * info {
 *      type: GET
 *      url: /getById
 *      name: Get Owner By Owner ID
 *      description: Get one owner's information by Owner's ID
 * }
 * 
 * params {
 *      id: owner_ID
 * }
 * 
 * body {
 *      null
 * } 
 */
router.route('/getById').get((req, res) => {
    try {
        var id = req.query.id;

        Owner.findOne({ _id: id }).select('-status -location -__v').exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4);
                } else {
                    return msg.msgReturn(res, 0, data);
                }
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/getAllDeniedTasks').get((req, res) => {
    try {
        let ownerId = req.cookies.userId;

        var populateQuery = [
            {
                path: 'info.package',
                select: 'name'
            },
            {
                path: 'info.work',
                select: 'name'
            },
            {
                path: 'stakeholders.received',
                select: 'info'
            },
            {
                path: 'process',
                select: 'name'
            }
        ];

        Task.find(
            {
                'stakeholders.owner': ownerId,
                process: {
                    $in: ['000000000000000000000003', '000000000000000000000004']
                },
                status: false
            }
        ).populate(populateQuery).exec((error, data) => {
            if (error) return msg.msgReturn(res, 3);
            return msg.msgReturn(res, 0, data);
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

/** GET - Get All Tasks By Owner ID
 * info {
 *      type: GET
 *      url: /getAllTasks
 *      name: Get All Tasks By Owner ID
 *      description: Get tasks by Owner's ID
 * }
 * 
 * params {
 *      id: owner_ID
 *      process: process_ID
 * }
 * 
 * body {
 *      null
 * } 
 */
router.route('/getAllTasks').get((req, res) => {
    try {
        var id = req.cookies.userId;
        var process = req.query.process;

        var findQuery = {
            'stakeholders.owner': id,
            status: true
        }

        if (process) {
            findQuery['process'] = process;
        }

        var populateQuery = [
            {
                path: 'info.package',
                select: 'name'
            },
            {
                path: 'info.work',
                select: 'name'
            },
            {
                path: 'process',
                select: 'name'
            }
        ]

        Task.find(findQuery).populate(populateQuery).select('-location -status -__v').exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4);
                } else {
                    return msg.msgReturn(res, 0, data);
                }
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/getAllWorkedMaid').get((req, res) => {
    try {
        let id = req.cookies.userId;

        var matchQuery = {
            process: new ObjectId('000000000000000000000005'),
            'stakeholders.owner': new ObjectId(id)
        };

        Task.aggregate([
            {
                $match: matchQuery
            },
            {
                $group: {
                    _id: '$stakeholders.received',
                }
            }
        ],
            // {
            //     allowDiskUse: true
            // },
            (error, data) => {
                if (error) {
                    return msg.msgReturn(res, 3);
                } else {
                    if (validate.isNullorEmpty(data)) {
                        return msg.msgReturn(res, 4);
                    } else {
                        Maid.populate(data, { path: '_id', select: 'info' }, (error, owner) => {
                            if (error) {
                                return msg.msgReturn(res, 3);
                            } else {
                                if (validate.isNullorEmpty(owner)) {
                                    return msg.msgReturn(res, 4);
                                } else {
                                    return msg.msgReturn(res, 0, owner);
                                }
                            }
                        });
                    }
                }
            }
        );
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

module.exports = router;