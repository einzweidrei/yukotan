var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

var ObjectId = Schema.ObjectId;

var MaidRegisterSchema = new Schema({
    name: { type: String },
    address: { type: String },
    phone: { type: String },
    note: { type: String },
    process: { type: Boolean },
    history: {
        createAt: { type: Date },
        updateAt: { type: Date }
    },
    status: { type: Boolean }
});

MaidRegisterSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('MaidRegister', MaidRegisterSchema);