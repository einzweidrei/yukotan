var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

//create type ObjectId
var ObjectId = Schema.ObjectId;

//create Account
var PaymentKeySchema = new Schema(
    {
        token: { type: String },
        verify: {
            key: { type: String },
            date: { type: Date }
        }
    }
);

//plugin Pagination
PaymentKeySchema.plugin(mongoosePaginate);

module.exports = mongoose.model('PaymentKey', PaymentKeySchema);		