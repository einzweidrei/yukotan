var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

//create type ObjectId
var ObjectId = Schema.ObjectId;

//create Account
var TaskSchema = new Schema(
    {
        info: {
            title: { type: String },
            package: { type: ObjectId },
            work: { type: ObjectId },
            description: { type: String },
            price: { type: Number },
            // image: { type: String },
            address: {
                name: { type: String },
                coordinates: {
                    lat: { type: Number },
                    lng: { type: Number }
                }
            },
            time: {
                startAt: { type: Date },
                endAt: { type: Date },
                hour: { type: Number }
            },
            tools: { type: Boolean }
            // gender: { type: Number }
        },
        stakeholders: {
            owner: { type: ObjectId, ref: 'Owner' },
            request: [
                {
                    maid: { type: ObjectId, ref: '' }
                }
            ],
            receive: { type: ObjectId, ref: '' }
        },
        process: { type: String },
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
        history: {
            createAt: { type: Date },
            updateAt: { type: Date }
        },
        status: { type: Boolean }
    }
);

TaskSchema.index({ 'info.address.location': '2dsphere' });

//plugin Pagination
// OwnerSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Task', TaskSchema);		