var mongoose = require('mongoose'),
        Schema = mongoose.Schema;


var userdocumentSchema = new Schema({
    document_id: {type: Schema.Types.ObjectId},
    name: {type: String, default: ""},
    user_id: {type: Schema.Types.ObjectId},
    option: { type : Number, default:0},
    document_picture: { type : String, default:""},
    is_uploaded: { type : Number, default:0},
    unique_code: { type : String, default:""},
    expired_date: {
        type: Date,
        default: Date.now
    },
    is_unique_code: {type: Boolean, default: false},
    is_expired_date: {type: Boolean, default: false},
    is_document_expired: {type: Boolean, default: false},
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }

});
userdocumentSchema.index({user_id: 1, option: 1, is_uploaded: 1}, {background: true});

var User_Document = mongoose.model('User_Document', userdocumentSchema);

module.exports = User_Document;

