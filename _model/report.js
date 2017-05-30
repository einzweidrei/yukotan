var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

//create type ObjectId
var ObjectId = Schema.ObjectId;

var ReportSchema = new Schema(
    {
        fromId: { type: ObjectId },
        toId: { type: ObjectId },
        content: { type: String },
        createAt: { type: Date },
        status: { type: Boolean }
    }
);

//plugin Pagination
ReportSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Report', ReportSchema);		