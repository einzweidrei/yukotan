var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

var ObjectId = Schema.ObjectId;

var RoleSchema = new Schema(
    {
        name: { type: String },
        perm: [
            {
                func: { type: ObjectId, ref: 'Function' },
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

RoleSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Role', RoleSchema);		