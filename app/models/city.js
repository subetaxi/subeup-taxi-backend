var mongoose = require('mongoose'),
        Schema = mongoose.Schema;

var citySchema = new Schema({
    countryid: {type: Schema.Types.ObjectId},
    countryname: {type: String, default: ""},
    full_cityname: {type: String, default: ""},
    timezone: {type: String, default: ""},
    cityname: {type: String, default: ""},
    is_use_city_boundary: {type: Boolean, default: false},
    city_locations: {type: Array, index1: '3d', default: []},
    payment_gateway: {
        type: [Number],
        index1: '2d'
    },
    unit: {type: Number, default: 1},
    is_payment_mode_cash: {type: Number, default: 1},
    is_payment_mode_card: {type: Number, default: 1},
    isPromoApplyForCash: {type: Number, default: 1},
    isPromoApplyForCard: {type: Number, default: 1},
    isBusiness: {type: Number, default: 1},
    airport_business: {type: Number, default: 1},
    city_business: {type: Number, default: 1},
    zone_business: {type: Number, default: 1},
    isCountryBusiness: {type: Number, default: 1},
    destination_city: {
        type: [Schema.Types.ObjectId],
        default: []
    },
    citycode:{type: String, default: ""},
    cityLatLong: {
        type: [Number],
        index: '2d'
    },
    cityRadius: {type: Number, default: 50},
    // Start 6 March //
    is_ask_user_for_fixed_fare: {type: Boolean, default: false},
    provider_min_wallet_amount_set_for_received_cash_request: {type: Number, default: 0},
    is_check_provider_wallet_amount_for_received_cash_request: {type: Boolean, default: false},
    is_provider_earning_set_in_wallet_on_cash_payment: {type: Boolean, default: false},
    is_provider_earning_set_in_wallet_on_other_payment: {type: Boolean, default: false},

    // End 6 March //
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

citySchema.index({countryid: 1, isBusiness: 1}, {background: true});
citySchema.index({countryname: 1, isBusiness: 1}, {background: true});
citySchema.index({cityname: 1}, {background: true});

citySchema.index({created_at: 1, cityname: 1}, {background: true});
citySchema.index({countryid: 1}, {background: true});

var City = mongoose.model('City', citySchema);
module.exports = City;

