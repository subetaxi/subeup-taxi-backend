var mongoose = require('mongoose'),
        mongoosePaginate = require('mongoose-paginate'),
        Schema = mongoose.Schema;
var mongoosePages = require('mongoose-pages');
var autoIncrement = require('mongoose-auto-increment');


var corporateSchema = new Schema({
    unique_id: Number,
    name: {type: String, default: ""},
    password: {type: String, default: ""},
    email: {type: String, default: ""},
    country_phone_code: {type: String, default: ""},
    phone: {type: String, default: ""},

    country_id: {type: Schema.Types.ObjectId},
    country_name: {type: String, default: ''},
    wallet_currency_code: {type: String, default: ""},
    
    // FOR BANK DETAIL //
    stripe_doc: {type: String, default: ""},
    account_id: {type: String, default: ""},
    bank_id: {type: String, default: ""},
    ////    

    token: {type: String, default: ""},
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
corporateSchema.index({phone: 1}, {background: true});
corporateSchema.index({email: 1}, {background: true});

corporateSchema.plugin(mongoosePaginate);
corporateSchema.plugin(autoIncrement.plugin, {model: 'corporateSchema', field: 'unique_id', startAt: 1, incrementBy: 1});
mongoosePages.skip(corporateSchema);

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Corporate', corporateSchema);

