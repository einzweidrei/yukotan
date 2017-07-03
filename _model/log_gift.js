var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

var ObjectId = Schema.ObjectId;

var LogGiftSchema = new Schema(
    {
        fromId: { type: ObjectId, ref: 'Owner' },
        giftId: { type: ObjectId, ref: 'GiftCode' },
        createAt: { type: Date },
        status: { type: Boolean }
    }
);

LogGiftSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('LogGift', LogGiftSchema);		