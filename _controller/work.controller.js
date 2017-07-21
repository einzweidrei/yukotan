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

    Work.prototype.getAll = (sort, callback) => {
        try {
            var searchQuery = {
                status: true
            };

            var selectQuery = '-status -history -__v';

            var sortQuery = { 'weight': sort };

            mWork
                .find(searchQuery)
                .populate({ path: 'suggest', select: 'name' })
                .select(selectQuery)
                .sort(sortQuery)
                .exec((error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    return callback(null, data);
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Work.prototype.create = (nameVi, nameEn, image, titleVi, titleEn, descriptionVi, descriptionEn, price, suggest, weight, callback) => {
        var work = new mWork();
        work.image = image;
        work.status = true;
        work.history.createAt = new Date();
        work.history.updateAt = new Date();

        work.set('name.all', {
            en: nameEn,
            vi: nameVi
        });

        work.set('title.all', {
            en: titleEn,
            vi: titleVi
        });

        work.set('description.all', {
            en: descriptionEn,
            vi: descriptionVi
        });

        var temp = [];
        temp = suggest.split(',');

        work.suggest = temp;
        work.weight = weight;
        work.price = price;

        work.save((error) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else return callback(null, work);
        });
    };

    Work.prototype.update = (id, nameVi, nameEn, image, titleVi, titleEn, descriptionVi, descriptionEn, price, suggest, weight, callback) => {
        try {
            var temp = [];
            temp = suggest.split(',');

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
                        title: {
                            vi: titleVi,
                            en: titleEn
                        },
                        description: {
                            vi: descriptionVi,
                            en: descriptionEn
                        },
                        suggest: temp,
                        weight: weight,
                        price: price,
                        image: image,
                        'history.updateAt': new Date()
                    }
                },
                (error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else return callback(null, data);
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
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
            .populate({ path: 'suggest', select: 'name' })
            .select('-history -__v')
            .exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else {
                    var m = [];
                    data.map(a => {
                        var d = {
                            _id: a._id,
                            name: a.get('name.all'),
                            title: a.get('title.all'),
                            description: a.get('description.all'),
                            suggest: a.suggest,
                            price: a.price,
                            image: a.image,
                            weight: a.weight
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
            .populate({ path: 'suggest', select: 'name' })
            .select('-history -__v')
            .exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else {
                    var g = {
                        _id: data._id,
                        name: data.get('name.all'),
                        title: data.get('title.all'),
                        description: data.get('description.all'),
                        suggest: data.suggest,
                        weight: data.weight,
                        price: data.price,
                        image: data.image
                    };
                    return callback(null, g);
                }
            });
    };

    return Work;
}());

exports.Work = Work;
