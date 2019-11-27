var mongoose = require('mongoose'),
        mongoosePaginate = require('mongoose-paginate'),
        Schema = mongoose.Schema;
var mongoosePages = require('mongoose-pages');


var partnerSchema = new Schema({
    unique_id: Number,
    first_name: {type: String, default: ""},
    last_name: {type: String, default: ""},
    password: {type: String, default: ""},
    email: {type: String, default: ""},
    country_phone_code: {type: String, default: ""},
    phone: {type: String, default: ""},
    country: {type: String, default: ""},

    country_id: {type: Schema.Types.ObjectId},
    wallet_currency_code: {type: String, default: ""},
    is_vehicle_document_uploaded: {type: Boolean, default: false},
    city_id: {type: Schema.Types.ObjectId},
    vehicle_detail: {type: Array, default: []},
    

    // FOR BANK DETAIL //
    stripe_doc: {type: String, default: ""},
    account_id: {type: String, default: ""},
    bank_id: {type: String, default: ""},
    ////    

    city: {type: String, default: ""},
    address: {type: String, default: ""},
    picture: {type: String, default: ""},
    token: {type: String, default: ""},
    partner_company_name: {type: String, default: ""},
    government_id_proof: {type: String, default: ""},
    is_approved: {type: Number, default: 0},
    wallet: {type: Number, default: 0},
    
    refferal_code: {type: String, default: ""},
    last_transferred_date: {
        type: Date,
        default: Date.now
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }

});
partnerSchema.index({phone: 1}, {background: true});
partnerSchema.index({email: 1}, {background: true});

partnerSchema.plugin(mongoosePaginate);
mongoosePages.skip(partnerSchema);

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Partner', partnerSchema);

