var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

var ObjectId = Schema.ObjectId;

var AccountSchema = new Schema(
    {
        info: {
            username: { type: String },
            email: { type: String },
            name: { type: String },
            phone: { type: String },
            image: { type: String },
            address: { type: String },
            gender: { type: Number },
        },
        auth: {
            password: { type: String }
        },
        permission: [
            {
                name: { type: String },
                isActivated: { type: Boolean }
            }
        ],
        history: {
            createAt: { type: Date },
            updateAt: { type: Date }
        },
        status: { type: Boolean }
    }
);

AccountSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Account', AccountSchema);		