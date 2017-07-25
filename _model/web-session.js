var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var WebSessionSchema = new Schema(
    {
        auth: {
            userId: { type: ObjectId },
            token: { type: String }
        },
        loginAt: { type: Date },
        status: { type: Boolean }
    }
);

WebSessionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('WebSession', WebSessionSchema);		