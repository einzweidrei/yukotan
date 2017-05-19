var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

//create type ObjectId
var ObjectId = Schema.ObjectId;

//create Account
var CommentSchema = new Schema(
    {
        fromId: { type: ObjectId },
        toId: { type: ObjectId },
        task: { type: ObjectId, ref: 'Task' },
        content: { type: String },
        evaluation_point: { type: Number },
        createAt: { type: Date },
        status: { type: Boolean }
    }
);

//plugin Pagination
CommentSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Comment', CommentSchema);		