var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

//create type ObjectId
var ObjectId = Schema.ObjectId;

//create Account
var SessionSchema = new Schema(
    {
        auth: {
            ownerId: { type: ObjectId, ref: 'Owner' },
            token: { type: String }
        },
        status: { type: Boolean }
    }
);

//plugin Pagination
SessionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Session', SessionSchema);		