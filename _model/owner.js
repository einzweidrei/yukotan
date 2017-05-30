var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

//create type ObjectId
var ObjectId = Schema.ObjectId;

var OwnerSchema = new Schema(
    {
        info: {
            username: { type: String },
            email: { type: String },
            name: { type: String },
            phone: { type: String },
            image: { type: String },
            address: {
                name: { type: String },
                coordinates: {
                    lat: { type: Number },
                    lng: { type: Number }
                }
            },
            gender: { type: Number },
        },
        evaluation_point: { type: Number },
        wallet: { type: Number },
        location: {
            type: {
                type: String,
                enum: 'Point',
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                default: [0, 0]
            }
        },
        auth: {
            password: { type: String },
            device_token: { type: String }
        },
        history: {
            createAt: { type: Date },
            updateAt: { type: Date }
        },
        status: { type: Boolean }
    }
);

// OwnerSchema.index({ 'info.address.location': '2dsphere' });

//plugin Pagination
OwnerSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Owner', OwnerSchema);		