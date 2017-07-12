var mTask = require('../_model/task');
var mWork = require('../_model/work');
var mPackage = require('../_model/package');
var mProcess = require('../_model/process');
var mOwner = require('../_model/owner');
var ObjectId = require('mongoose').Types.ObjectId;
var as = require('../_services/app.service');
var AppService = new as.App();
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();

var Task = (function () {
    function Task() { }

    Task.prototype.find = (findQuery, populateQuery, sortQuery, limit, selectQuery, callback) => {
        mTask
            .find(findQuery)
            .populate(populateQuery)
            .sort(sortQuery)
            .limit(parseFloat(limit))
            .select(selectQuery).exec((error, data) => {
                if (error) return callback(error);
                return callback(null, data);
            });
    }

    Task.prototype.paginate = (findQuery, options, callback) => {
        mTask.paginate(findQuery, options).then(data => {
            return callback(null, data);
        });
    }

    Task.prototype.aggregate = (aggregateQuery, callback) => {
        mTask.aggregate(aggregateQuery, (error, data) => {
            if (error) return callback(error);
            return callback(null, data);
        });
    }

    Task.prototype.getTaskAround = (minDistance, maxDistance, sortBy, sortType, location, callback) => {
        var sortQuery = {};

        if (sortType == "desc") {
            if (sortBy == "price") {
                sortQuery = {
                    'info.price': -1
                }
            } else {
                sortQuery = {
                    'dist.calculated': -1
                }
            }
        } else {
            if (sortBy == "price") {
                sortQuery = {
                    'info.price': 1
                }
            } else {
                sortQuery = {
                    'dist.calculated': 1
                }
            }
        };

        var now = new Date();
        var matchQuery = {
            process: new ObjectId('000000000000000000000001'),
            'info.time.startAt': {
                $gt: now
            },
            status: true
        };

        var aggregateQuery = [
            {
                $geoNear: {
                    near: location,
                    distanceField: 'dist.calculated',
                    minDistance: parseFloat(minDistance),
                    maxDistance: parseFloat(maxDistance) * 1000,
                    spherical: true
                }
            },
            {
                $match: matchQuery
            },
            {
                $group: {
                    _id: '$info.work',
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: sortQuery
            }
        ];

        var task = new Task();
        task.aggregate(aggregateQuery, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            else {
                mWork.populate(data, { path: '_id', select: 'name image' }, (error, data) => {
                    return callback(null, data);
                });
            }
        });
    }

    Task.prototype.getTaskByWork = (minDistance, maxDistance, limit, page, skip, title, package, work, sortBy, sortType, location, callback) => {
        var sortQuery = {};

        if (sortType == 'desc') {
            sortBy == 'price' ? sortQuery = { 'info.price': -1 } : sortQuery = { 'dist.calculated': -1 };
        } else {
            sortBy == 'price' ? sortQuery = { 'info.price': 1 } : sortQuery = { 'dist.calculated': 1 };
        };

        var now = new Date()
        var matchQuery = {
            process: new ObjectId('000000000000000000000001'),
            'info.time.startAt': {
                $gt: now
            },
            status: true
        };

        if (package) matchQuery['info.package'] = new ObjectId(package);
        if (work) matchQuery['info.work'] = new ObjectId(work);
        if (title) matchQuery['info.title'] = new RegExp(title, 'i');

        var task = new Task();

        var aggregateQuery = [
            {
                $geoNear: {
                    near: location,
                    distanceField: 'dist.calculated',
                    minDistance: parseFloat(minDistance),
                    maxDistance: parseFloat(maxDistance) * 1000,
                    spherical: true
                }
            },
            {
                $match: matchQuery
            },
            {
                $sort: sortQuery
            },
            {
                $project: {
                    process: 1,
                    history: 1,
                    stakeholders: 1,
                    info: 1,
                    dist: 1
                }
            }
        ];

        task.aggregate(aggregateQuery, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            else {
                mOwner.populate(data, { path: 'stakeholders.owner', select: 'info' }, (error, data) => {
                    mWork.populate(data, { path: 'info.work', select: 'name image' }, (error, data) => {
                        mPackage.populate(data, { path: 'info.package', select: 'name' }, (error, data) => {
                            mProcess.populate(data, { path: 'process', select: 'name' }, (error, data) => {
                                result = []
                                for (i = skip; i < skip + parseFloat(limit); i++) {
                                    if (!data[i] || data[i] == null) break
                                    result.push(data[i])
                                }

                                var d = {
                                    docs: result,
                                    total: data.length,
                                    limit: limit,
                                    page: page,
                                    pages: Math.ceil(data.length / limit)
                                }
                                return callback(null, d);
                            });
                        });
                    });
                });
            }
        });
    }

    return Task;
}());

exports.Task = Task;
