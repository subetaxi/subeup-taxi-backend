var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var providerweeklyearningSchema = new Schema({
    provider_id: {type: Schema.Types.ObjectId},
    provider_type: Number,
    provider_type_id: {type: Schema.Types.ObjectId},
    statement_number: {type: String, default: ""},
    total_distance: {type: Number, default: 0},
    total_time: {type: Number, default: 0},
    total_waiting_time: {type: Number, default: 0},
    total_service_fees: {type: Number, default: 0},
    total_service_surge_fees: {type: Number, default: 0},
    total_service_tax_fees: {type: Number, default: 0},
    service_total: {type: Number, default: 0},
    promo_referral_amount: {type: Number, default: 0},
    total: {type: Number, default: 0},
    total_card_payment: {type: Number, default: 0},
    total_cash_payment: {type: Number, default: 0},
    total_wallet_payment: {type: Number, default: 0},
    total_provider_service_fees: {type: Number, default: 0},
    promo_referral_amount_in_admin_currency:{type: Number, default: 0},
    total_cash_payment_in_admin_currency: {type: Number, default: 0},
    total_card_payment_in_admin_currency: {type: Number, default: 0},
    total_wallet_payment_in_admin_currency: {type: Number, default: 0},

    total_in_admin_currency: {type: Number, default: 0},
    service_total_in_admin_currency: {type: Number, default: 0},
    total_provider_service_fees_in_admin_currency: {type: Number, default: 0},
    
    total_provider_have_cash: {type: Number, default: 0},
    total_pay_to_provider: {type: Number, default: 0},
        
    admin_paid: {type: Number, default: 0},
    remaining_amount_to_paid: {type: Number, default: 0},   

    date_tag: {type: String, default: ""},
    date_server_timezone: {
        type: Date,
        default: Date.now
    },
    start_date_tag: {type: String, default: ""},
    end_date_tag: {type: String, default: ""},
    start_date_server_timezone: {
        type: Date
    },
    end_date_server_timezone: {
        type: Date
    },
    provider_daily_earning_ids: [{type: Schema.Types.ObjectId}]
});


var ProviderWeeklyEarning = mongoose.model('provider_weekly_earning', providerweeklyearningSchema);
module.exports = ProviderWeeklyEarning;
