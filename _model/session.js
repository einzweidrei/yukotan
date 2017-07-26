var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var SessionSchema = new Schema(
    {
        auth: {
            userId: { type: ObjectId },
            token: { type: String }
        },
        verification: {
            password: {
                date: { type: Date },
                key: { type: String }
            }
        },
        loginAt: { type: Date },
        status: { type: Boolean }
    }
);

SessionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Session', SessionSchema);		