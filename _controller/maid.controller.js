var mMaid = require('../_model/maid');
var as = require('../_services/app.service');
var AppService = new as.App();
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var Maid = (function () {
    function Maid() { }

    Maid.prototype.findOne = (searchQuery, callback) => {
        mMaid.findOne(searchQuery).exec((error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            return callback(null, data);
        });
    }

    Maid.prototype.findOneAndUpdate = (searchQuery, setQuery, callback) => {
        mMaid.findOneAndUpdate(
            searchQuery,
            {
                $set: setQuery
            },
            (error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                return callback(null, data);
            }
        );
    }

    Maid.prototype.aggregate = (aggregateQuery, callback) => {
        mMaid.aggregate(aggregateQuery, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            return callback(null, data);
        });
    }

    Maid.prototype.getAllMaids = (minDistance, maxDistance, limit, page, skip, priceMin,
        priceMax, ageMin, ageMax, workId, gender, sortBy, sortType, location, callback) => {
        var sortQuery = {};

        if (sortType == 'desc') {
            sortBy == 'price' ? sortQuery = { 'work_info.price': -1 } : sortQuery = { 'dist.calculated': -1 }
        } else {
            sortBy == 'price' ? sortQuery = { 'work_info.price': 1 } : sortQuery = { 'dist.calculated': 1 }
        };

        var matchQuery = { status: true };

        if (ageMin || ageMax) {
            var query = {};
            if (ageMin) query['$gte'] = parseFloat(ageMin);
            if (ageMax) query['$lte'] = parseFloat(ageMax);
            matchQuery['info.age'] = query;
        }

        if (priceMin || priceMax) {
            var query = {};
            if (priceMin) query['$gte'] = parseFloat(priceMin);
            if (priceMax) query['$lte'] = parseFloat(priceMax);
            matchQuery['work_info.price'] = query;
        }

        if (workId) matchQuery['work_info.ability'] = new ObjectId(workId);
        if (gender) matchQuery['info.gender'] = parseFloat(gender);

        var maid = new Maid();

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
                    info: 1,
                    work_info: 1
                }
            }
        ];

        maid.aggregate(aggregateQuery, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            return callback(null, data);
        });
    }

    return Maid;
}());

exports.Maid = Maid;
