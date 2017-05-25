var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

//create type ObjectId
var ObjectId = Schema.ObjectId;

//create Account
var BillSchema = new Schema(
    {
        task: { type: ObjectId, ref: 'Task' },
        price: { type: Number },
        owner: { type: ObjectId, ref: 'Owner' },
        maid: { type: ObjectId, ref: 'Maid' },
        isSolved: { type: Boolean },
        date: { type: Date },
        createAt: { type: Date },
        status: { type: Boolean }
    }
);

//plugin Pagination
BillSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Bill', BillSchema);		