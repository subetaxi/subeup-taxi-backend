var mongoose = require('mongoose'),
        Schema = mongoose.Schema;

var countrySchema = new Schema({

    countryname: {type: String, default: ""},
    countrycode: {type: String, default: ""},
    alpha2: {type: String, default: ""},
    currency: {type: String, default: ""},
    flag_url: {type: String, default: ""},
    currencycode: {type: String, default: ""},
    currencysign: {type: String, default: ""},
    countrytimezone: {type: String, default: ""},
    country_all_timezone: {type: Array, default: []},
    countryphonecode: {type: String, default: ""},
    isBusiness: {type: Number, default: 1},
    referral_bonus_to_user: {type: Number, default: 0},
    bonus_to_providerreferral: {type: Number, default: 0},
    referral_bonus_to_provider: {type: Number, default: 0},
    bonus_to_userreferral: {type: Number, default: 0},
    phone_number_min_length: {type: Number, default: 8},
    phone_number_length: {type: Number, default: 10},
    is_referral: {type: Boolean, default: true},
    userreferral: {type: Number, default: 0},
    is_provider_referral: {type: Boolean, default: true},
    providerreferral: {type: Number, default: 0},
    default_selected: {type: Boolean, default: false},
    is_auto_transfer: {type: Boolean, default: true},
    auto_transfer_day: {type: Number, default: 7},
    
    daily_cron_date: {
        type: Date
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
countrySchema.index({countryname: 1, isBusiness: 1}, {background: true});

var Country = mongoose.model('Country', countrySchema);
module.exports = Country;

