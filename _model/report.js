var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

//create type ObjectId
var ObjectId = Schema.ObjectId;

var ReportSchema = new Schema(
    {
        ownerId: { type: ObjectId, ref: 'Owner' },
        maidId: { type: ObjectId, ref: 'Maid' },
        from: { type: Number },
        content: { type: String },
        createAt: { type: Date },
        status: { type: Boolean }
    }
);

//plugin Pagination
ReportSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Report', ReportSchema);		