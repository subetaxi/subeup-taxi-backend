var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var documentSchema = new Schema({
    unique_id: Number,
    countryid: {type: Schema.Types.ObjectId},
    title: {type: String, default: ""},
    type: {type: Number, default: 8},
    option: {type: Number, default: 0},
    expired_date: {
        type: Date
    },
    is_unique_code: {type: Boolean, default: false},
    is_expired_date: {type: Boolean, default: false},
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

documentSchema.index({countryid: 1, type: 1}, {background: true});
documentSchema.index({title: 1, created_at: 1}, {background: true});

var Document = mongoose.model('Document', documentSchema);
module.exports = Document;

