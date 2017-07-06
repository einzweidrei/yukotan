var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

var ObjectId = Schema.ObjectId;

var RoleSchema = new Schema(
    {
        name: { type: String },
        
        status: { type: Boolean }
    }
);

RoleSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Role', RoleSchema);		