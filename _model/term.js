var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseIntl = require('mongoose-intl');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var TermSchema = new Schema(
    {
        name: { type: String, intl: true },
        content: { type: String, intl: true },
        status: { type: Boolean },
        history: {
            createAt: { type: Date },
            updateAt: { type: Date }
        }
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

TermSchema.plugin(mongooseIntl, { languages: ['en', 'vi'], defaultLanguage: 'en' })

module.exports = mongoose.model('Term', TermSchema);		