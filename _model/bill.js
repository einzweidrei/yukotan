var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var BillSchema = new Schema(
    {
        task: { type: ObjectId, ref: 'Task' },
        price: { type: Number },
        owner: { type: ObjectId, ref: 'Owner' },
        maid: { type: ObjectId, ref: 'Maid' },
        isSolved: { type: Boolean },
        date: { type: Date },
        period: { type: Date },
        method: { type: Number },
        createAt: { type: Date },
        status: { type: Boolean }
    }
);

//plugin Pagination
BillSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Bill', BillSchema);		