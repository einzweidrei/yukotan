var mComment = require('../_model/comment');
var as = require('../_services/app.service');
var AppService = new as.App();
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var Comment = (function () {
    function Comment() { }

    Comment.prototype.save = (fromId, toId, task, content, evaluation_point, callback) => {
        var comment = new mComment();
        comment.fromId = fromId;
        comment.toId = toId;
        comment.task = task;
        comment.content = content;
        comment.evaluation_point = evaluation_point;
        comment.createAt = new Date();
        comment.status = true;

        comment.save((error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            return callback(null, data);
        });
    }

    Comment.prototype.findOne = (searchQuery, callback) => {
        mComment.findOne(searchQuery).exec((error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            return callback(null, data);
        });
    }

    Comment.prototype.paginate = (searchQuery, options, callback) => {
        mComment.paginate(searchQuery, options).then((data) => {
            return callback(null, data);
        });
    }

    return Comment;
}());

exports.Comment = Comment;
