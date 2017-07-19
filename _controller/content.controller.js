var mContent = require('../_model/content');
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var Content = (function () {
    function Content() { }

    Content.prototype.getAll = (type, callback) => {
        try {
            mContent
                .find({ type: type, status: true })
                .select('-status -__v')
                .exec((error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else return callback(null, data);
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Content.prototype.getAll4Admin = (type, callback) => {
        try {
            var searchQuery = { status: true };
            if (type) searchQuery['type'] = type;

            mContent
                .find(searchQuery)
                .select('-status -__v')
                .exec((error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else {
                        var m = []
                        data.map(a => {
                            var d = {
                                _id: a._id,
                                image: a.get('image.all'),
                                title: a.get('title.all'),
                                body: a.get('body.all'),
                                type: a.type,
                                history: a.history,
                            };
                            m.push(d);
                        });
                        return callback(null, m);
                    }
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Content.prototype.getById = (id, callback) => {
        try {
            mContent
                .findOne({ _id: id, status: true })
                .select('-status -__v')
                .exec((error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else {
                        var g = {
                            _id: data._id,
                            image: data.get('image.all'),
                            title: data.get('title.all'),
                            body: data.get('body.all'),
                            type: data.type,
                            history: data.history
                        };

                        return callback(null, g);
                    }
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Content.prototype.create = (type, imageVi, imageEn, titleVi, titleEn, contentVi, contentEn, callback) => {
        try {
            var ct = new mContent();
            ct.type = type;

            ct.set('image.all', {
                en: imageEn,
                vi: imageVi
            });

            ct.set('title.all', {
                en: titleEn,
                vi: titleVi
            });

            ct.set('body.all', {
                en: contentEn,
                vi: contentVi
            });

            ct.history = {
                createAt: new Date(),
                updateAt: new Date()
            };

            ct.status = true
            ct.save((error) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else return callback(null, ct);
            });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Content.prototype.update = (id, imageVi, imageEn, titleVi, titleEn, contentVi, contentEn, callback) => {
        try {
            mContent.findOneAndUpdate({
                _id: id,
                status: true
            }, {
                    $set: {
                        image: {
                            vi: imageVi,
                            en: imageEn
                        },
                        title: {
                            vi: titleVi,
                            en: titleEn
                        },
                        body: {
                            vi: contentVi,
                            en: contentEn
                        },
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

    Content.prototype.delete = (id, callback) => {
        try {
            mContent.findOneAndRemove(
                {
                    _id: id,
                    status: true
                }, (error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else return callback(null, data);
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    return Content;
}());

exports.Content = Content;