var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

//create type ObjectId
var ObjectId = Schema.ObjectId;

var TaskSchema = new Schema(
    {
        info: {
            title: { type: String },
            package: { type: ObjectId, ref: 'Package' },
            work: { type: ObjectId, ref: 'Work' },
            description: { type: String },
            price: { type: Number },
            image: { type: String },
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
        },
        stakeholders: {
            owner: { type: ObjectId, ref: 'Owner' },
            request: [
                {
                    maid: { type: ObjectId, ref: 'Maid' },
                    time: { type: Date }
                }
            ],
            received: { type: ObjectId, ref: 'Maid' }
        },
        check: {
            check_in: { type: Date },
            check_out: { type: Date }
        },
        requestTo: { type: ObjectId, ref: 'Maid' },
        process: { type: ObjectId, ref: 'Process' },
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

TaskSchema.index({ 'location': '2dsphere' });

//plugin Pagination
TaskSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Task', TaskSchema);		