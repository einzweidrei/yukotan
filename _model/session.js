var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

//create type ObjectId
var ObjectId = Schema.ObjectId;

//create Account
var SessionSchema = new Schema(
    {
        auth: {
            // ownerId: { type: ObjectId, path: 'Owner' },
            // maidId: { type: ObjectId, path: 'Maid' },
            userId: { type: ObjectId },
            token: { type: String }
        },
        loginAt: { type: Date },
        status: { type: Boolean }
    }
);

//plugin Pagination
SessionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Session', SessionSchema);		