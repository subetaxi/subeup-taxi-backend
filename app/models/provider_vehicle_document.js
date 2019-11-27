var mongoose = require('mongoose'),
        Schema = mongoose.Schema;


var providervehicledocumentSchema = new Schema({
    document_id: {type: Schema.Types.ObjectId},
    vehicle_id: {type: Schema.Types.ObjectId},
    name: { type : String, default:""},
    provider_id: {type: Schema.Types.ObjectId},
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
providervehicledocumentSchema.index({provider_id: 1, vehicle_id: 1}, {background: true});
providervehicledocumentSchema.index({provider_id: 1, vehicle_id: 1, option: 1, is_uploaded: 1}, {background: true});



var Provider_Vehicle_Document = mongoose.model('Provider_Vehicle_Document', providervehicledocumentSchema);

module.exports = Provider_Vehicle_Document;

