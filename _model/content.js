var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseIntl = require('mongoose-intl');
var Schema = mongoose.Schema;

var ObjectId = Schema.ObjectId;
var ContentSchema = new Schema(
    {
        type: { type: Number },
        image: { type: String, intl: true },
        title: { type: String, intl: true },
        body: { type: String, intl: true },
        history: {
            createAt: { type: Date },
            updateAt: { type: Date }
        },
        status: { type: Boolean }
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

ContentSchema.plugin(mongooseIntl, { languages: ['en', 'vi'], defaultLanguage: 'en' })

module.exports = mongoose.model('Content', ContentSchema);		