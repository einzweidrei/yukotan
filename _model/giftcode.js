var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseIntl = require('mongoose-intl');
var Schema = mongoose.Schema;

var ObjectId = Schema.ObjectId;

var GiftCodeSchema = new Schema(
    {
        name: { type: String },
        value: { type: Number },
        description: { type: String, intl: true },
        limit: {
            startAt: { type: Date },
            endAt: { type: Date },
            count: { type: Number }
        },
        history: {
            createAt: { type: Date },
            updateAt: { type: Date }
        },
        status: { type: Boolean }
    }
);

GiftCodeSchema.plugin(mongoosePaginate);
GiftCodeSchema.plugin(mongooseIntl, { languages: ['en', 'vi'], defaultLanguage: 'en' })

module.exports = mongoose.model('GiftCode', GiftCodeSchema);		