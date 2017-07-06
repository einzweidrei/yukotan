var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

var ObjectId = Schema.ObjectId;

var FunctionSchema = new Schema(
    {
        name: { type: String },
        createAt: { type: Date },
        status: { type: Boolean }
    }
);

FunctionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Function', FunctionSchema);		