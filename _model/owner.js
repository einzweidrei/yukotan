var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

//create type ObjectId
var ObjectId = Schema.ObjectId;

//create Account
var OwnerSchema = new Schema(
    {
        info: {
            username: { type: String },
            password: { type: String },
            email: { type: String },
            name: { type: String },
            phone: { type: String },
            image: { type: String },
            address: {
                name: { type: String },
                coordinates: {
                    lat: { type: Number },
                    lng: { type: Number }
                },
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
                }
            },
            gender: { type: Number }
        },
        auth: {
            device_token: { type: String }
        },
        history: {
            createAt: { type: Date },
            updateAt: { type: Date }
        },
        status: { type: Boolean }
    }
);

OwnerSchema.index({ 'info.address.location': '2dsphere' });

//plugin Pagination
// OwnerSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Owner', OwnerSchema);		