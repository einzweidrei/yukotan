var mMaid = require('../_model/maid');
var as = require('../_services/app.service');
var AppService = new as.App();
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();

var Maid = (function () {
    function Maid() { }

    Maid.prototype.findOne = (searchQuery, callback) => {
        mMaid.findOne(searchQuery).exec((error, data) => {
            if (error) return callback(error);
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
                if (error) return callback(error);
                return callback(null, data);
            }
        );
    }

    return Maid;
}());

exports.Maid = Maid;
