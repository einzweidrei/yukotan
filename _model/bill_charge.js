var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var BillChargeSchema = new Schema(
    {
        price: { type: Number },
        owner: { type: ObjectId, ref: 'Owner' },
        isSolved: { type: Boolean },
        date: { type: Date },
        createAt: { type: Date },
        verify: {
            key: { type: String },
            date: { type: Date }
        },
        status: { type: Boolean }
    }
);

BillChargeSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('BillCharge', BillChargeSchema);		