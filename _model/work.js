var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseIntl = require('mongoose-intl');
var Schema = mongoose.Schema;

//create type ObjectId
var ObjectId = Schema.ObjectId;

//create Account
var WorkSchema = new Schema(
    {
        name: { type: String, intl: true },
        title: { type: String, intl: true },
        description: { type: String, intl: true },
        price: { type: Number },
        status: { type: Boolean },
        image: { type: String },
        weight: { type: Number },
        suggest: [{ type: ObjectId, ref: 'Suggest' }],
        tools: { type: Boolean, default: false },
        history: {
            createAt: { type: Date },
            updateAt: { type: Date }
        },
    },
    {
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.id;
            }
        }
    }
);

WorkSchema.plugin(mongooseIntl, { languages: ['en', 'vi'], defaultLanguage: 'en' })

module.exports = mongoose.model('Work', WorkSchema);		