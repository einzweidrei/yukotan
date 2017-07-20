var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseIntl = require('mongoose-intl');
var Schema = mongoose.Schema;

//create type ObjectId
var ObjectId = Schema.ObjectId;

//create Account
var ContactSchema = new Schema({
    name: { type: String },
    email: { type: String },
    content: { type: String },
    process: { type: Boolean },
    phone: { type: String },
    history: {
        createAt: { type: Date },
        updateAt: { type: Date }
    },
    status: { type: Boolean }
});

ContactSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Contact', ContactSchema);