var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseIntl = require('mongoose-intl');
var Schema = mongoose.Schema;

//create type ObjectId
var ObjectId = Schema.ObjectId;

//create Account
var ContactSchema = new Schema(
    {
        name: { type: String },
        email: { type: String },
        content: { type: String },
        process: { type: Boolean },
        history: {
            createAt: { type: Date },
            updateAt: { type: Date }
        },
        status: { type: Boolean }
    }
    // ,
    // {
    //     toJSON: {
    //         virtuals: true,
    //         transform: function (doc, ret) {
    //             delete ret.id;
    //         }
    //     }
    // }
);

ContactSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Contact', ContactSchema);		