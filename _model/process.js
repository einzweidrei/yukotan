var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseIntl = require('mongoose-intl');
var Schema = mongoose.Schema;

//create type ObjectId
var ObjectId = Schema.ObjectId;

//create Account
var ProcessSchema = new Schema(
    {
        name: { type: String, intl: true },
        status: { type: Boolean },
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

ProcessSchema.plugin(mongooseIntl, { languages: ['en', 'vi'], defaultLanguage: 'en' })

module.exports = mongoose.model('Process', ProcessSchema);		