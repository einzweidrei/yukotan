var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

//create type ObjectId
var ObjectId = Schema.ObjectId;

var MaidSchema = new Schema(
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
            gender: { type: Number }
        },
        evaluation_point: { type: Number },
        work_info: {
            ability: [
                {
                    work: { type: ObjectId, ref: 'Work' }
                }
            ],
            price: { type: Number }
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

MaidSchema.index({ 'location': '2dsphere' });

module.exports = mongoose.model('Maid', MaidSchema);		