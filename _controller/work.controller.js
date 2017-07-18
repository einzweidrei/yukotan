var mWork = require('../_model/work');
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var Work = (function () {
    function Work() { }

    Work.prototype.find = (searchQuery, selectQuery, callback) => {
        mWork.find(searchQuery).select(selectQuery).exec((error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            return callback(null, data);
        });
    }

    Work.prototype.getAll = (callback) => {
        var work = new Work();

        var searchQuery = {
            status: true
        };

        var selectQuery = 'name';

        work.find(searchQuery, selectQuery, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            return callback(null, data);
        });
    };

    Work.prototype.create = (nameVi, nameEn, image, callback) => {
        var work = new mWork();
        work.image = image;
        work.status = true;
        work.history.createAt = new Date();
        work.history.updateAt = new Date();

        work.set('name.all', {
            en: nameEn,
            vi: nameVi
        });

        work.save((error) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else return callback(null, work);
        });
    };

    Work.prototype.update = (id, nameVi, nameEn, image, callback) => {
        mWork.findOneAndUpdate(
            {
                _id: id,
                status: true
            }, {
                $set: {
                    name: {
                        vi: nameVi,
                        en: nameEn
                    },
                    image: image,
                    'history.updateAt': new Date()
                }
            },
            (error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else return callback(null, data);
            });
    };

    Work.prototype.delete = (id, callback) => {
        mWork.findByIdAndUpdate(
            {
                _id: id,
                status: true
            }, {
                $set: {
                    status: false
                }
            },
            (error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else return callback(null, data);
            });
    };

    Work.prototype.getAll4Admin = (callback) => {
        mWork
            .find({ status: true })
            .select('name image')
            .exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else {
                    var m = [];
                    data.map(a => {
                        var d = {
                            _id: a._id,
                            name: a.get('name.all'),
                            image: a.image
                        };
                        m.push(d);
                    });
                    return callback(null, m);
                }
            });
    };

    Work.prototype.getInfo4Admin = (id, callback) => {
        mWork
            .findOne({ _id: id, status: true })
            .select('name image')
            .exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else {
                    var g = {
                        _id: data._id,
                        name: data.get('name.all'),
                        image: data.image
                    };
                    return callback(null, g);
                }
            });
    };

    return Work;
}());

exports.Work = Work;
