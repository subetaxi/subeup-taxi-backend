var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bank_detail_Schema = new Schema({
    bank_holder_type: Number,
    bank_holder_id: { type: Schema.Types.ObjectId },
    unique_id: Number,
    bank_name: String,
    bank_branch: String,
    bank_account_number: String,
    bank_account_holder_name: String,
    
    bank_beneficiary_address: String,
    bank_unique_code: String,
    bank_swift_code: String,
   
    is_updated: Number,
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

bank_detail_Schema.index({bank_holder_type: 1, bank_holder_id: 1}, {background: true});

var bank_detail = mongoose.model('bank_detail', bank_detail_Schema);
module.exports = bank_detail;
