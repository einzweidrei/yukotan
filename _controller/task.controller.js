var mTask = require('../_model/task');
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

    Task.prototype.aggregate = (matchQuery, sortQuery, groupQuery, callback) => {
        mTask.aggregate([{
            $match: matchQuery
        },
        {
            $sort: sortQuery
        },
        {
            $group: groupQuery
        }],
            (error, data) => {
                if (error) return callback(error);
                return callback(null, data);
            }
        );
    }

    return Task;
}());

exports.Task = Task;
