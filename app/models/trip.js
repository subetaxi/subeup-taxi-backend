var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');

var Trip = new Schema({
    unique_id: Number,
    invoice_number: {type: String, default: ""},
    provider_language: [{type: Schema.Types.ObjectId}],
    received_trip_from_gender: [{type: String}],
    accessibility: [{type: String}],
    service_type_id: {type: Schema.Types.ObjectId},
    confirmed_provider: {type: Schema.Types.ObjectId},
    current_provider: {type: Schema.Types.ObjectId},
    current_providers: [{type: Schema.Types.ObjectId}],
    providers_id_that_rejected_trip: [{type: Schema.Types.ObjectId}],
    user_id: {type: Schema.Types.ObjectId},
    provider_id: {type: Schema.Types.ObjectId},
    trip_service_city_type_id: {type: Schema.Types.ObjectId},
    is_trip_inside_zone_queue: {type: Boolean, default: false},
    is_favourite_provider: {type: Boolean, default: false},
    speed:{type: Number, default: 0},
    bearing: {type: Number, default: 0},
    trip_type: Number,
    car_rental_id: {type: Schema.Types.ObjectId},
    user_type: Number,
    provider_type: Number,
    user_type_id: {type: Schema.Types.ObjectId},
    provider_type_id: {type: Schema.Types.ObjectId},
    payment_id: Number,
    room_number: {type: String, default: ""},
    floor: {type: Number, default: 0},
    provider_first_name: {type: String, default: ""},
    provider_last_name: {type: String, default: ""},
    user_first_name: {type: String, default: ""},
    user_last_name: {type: String, default: ""},
    is_provider_accepted: {type: Number, default: 0},
    is_provider_status: {type: Number, default: 0},
    is_trip_end: {type: Number, default: 0},
    is_trip_completed: {type: Number, default: 0},
    is_trip_cancelled: {type: Number, default: 0},
    is_trip_cancelled_by_user: {type: Number, default: 0},
    trip_type_amount: {type: Number, default: 0},
    is_trip_cancelled_by_provider: {type: Number, default: 0},
    is_min_fare_used: {type: Number, default: 0},
    is_user_rated: {type: Number, default: 0},
    is_provider_rated: {type: Number, default: 0},

    provider_to_user_estimated_distance: {type: Number},
    provider_to_user_estimated_time: {type: Number},

    is_user_invoice_show: {
        type: Number,
        default: 0
    },
    is_provider_invoice_show: {
        type: Number,
        default: 0
    },
    is_surge_hours: {type: Number, default: 0},
    surge_multiplier: {type: Number, default: 0},
    is_cancellation_fee: {type: Number,
        default: 0
    },
    is_paid: {type: Number, default: 0},
    is_pending_payments: {type: Number, default: 0},
    wallet_payment: {type: Number, default: 0},
    total_after_wallet_payment: {type: Number, default: 0},
    remaining_payment: {type: Number,
        default: 0
    },
    is_tip: {type: Boolean, default: false},
    tip_amount: {type: Number,
        default: 0
    },
    is_toll: {type: Boolean, default: false},
    toll_amount: {type: Number,
        default: 0
    },
    source_address: {type: String, default: ""},
    destination_address: {type: String, default: ""},
    sourceLocation: {
        type: [Number],
        index: '2d'
    },
    destinationLocation: {
        type: [Number],
        index1: '2d'
    },
    providerPreviousLocation: {
        type: [Number],
        index: '2d'
    },
    providerLocation: {
        type: [Number],
        index1: '2d'
    },
    find_nearest_provider_time: {type: Date},
    server_start_time_for_schedule: {
        type: Date,
        default: Date.now
    },
    no_of_time_send_request: {type: Number, default: 0},
    is_schedule_trip: {type: Boolean, default: false},
        

    complete_date_tag: {type: String, default: ""},
    complete_date_in_city_timezone: {
        type: Date
    },

    promo_id: {type: Schema.Types.ObjectId},
    currency: {type: String, default: ""},
    currencycode: {type: String, default: ""},
    admin_currency: {type: String, default: ""},
    admin_currencycode: {type: String, default: ""},
    unit: {type: Number, default: 0},
    timezone: {type: String, default: ""},
    cancel_reason: {type: String, default: ""},
    payment_error: {type: String, default: ""},
    payment_error_message: {type: String, default: ""},
    total_distance: {type: Number, default: 0},
    total_time: {type: Number, default: 0},
    total_waiting_time: {type: Number, default: 0},
    base_distance_cost: {type: Number, default: 0},

    // Start 6 March //
    city_id: {type: Schema.Types.ObjectId},
    country_id: {type: Schema.Types.ObjectId},
    is_fixed_fare: {type: Boolean, default: false},
    fixed_price: {type: Number, default: 0},
    is_provider_earning_set_in_wallet: {type: Boolean, default: false},
    is_transfered: {type: Boolean, default: false},
    provider_have_cash: {type: Number, default: 0},
    pay_to_provider: {type: Number, default: 0},
    provider_income_set_in_wallet: {type: Number, default: 0},
    payment_transaction: {type: Array, default: []},

    refund_amount: {type: Number, default: 0},
    is_amount_refund: {type: Boolean, default: false},

    // End 6 March //
    distance_cost: {type: Number,
        default: 0
    },
    time_cost: {type: Number,
        default: 0
    },
    waiting_time_cost: {type: Number,
        default: 0
    },
    total_service_fees: {type: Number,
        default: 0
    },
    tax_fee: {type: Number,
        default: 0
    },

    user_miscellaneous_fee: {type: Number,
        default: 0
    },
    provider_miscellaneous_fee: {type: Number,
        default: 0
    },
    user_tax_fee: {type: Number,
        default: 0
    },
    provider_tax_fee: {type: Number,
        default: 0
    },

    total_after_tax_fees: {type: Number,
        default: 0
    },
    surge_fee: {type: Number,
        default: 0
    },
    total_after_surge_fees: {type: Number,
        default: 0
    },
    promo_payment: {type: Number,
        default: 0
    },
    total_after_promo_payment: {type: Number,
        default: 0
    },
    referral_payment: {type: Number,
        default: 0
    },

    total_after_referral_payment: {type: Number,
        default: 0
    },
    total: {type: Number,
        default: 0
    },
    payment_mode: Number,
    cash_payment: {type: Number,
        default: 0
    },
    card_payment: {type: Number,
        default: 0
    },
    current_rate: Number,
    wallet_current_rate: Number,
    provider_service_fees: {type: Number,
        default: 0
    },
    total_in_admin_currency: {type: Number,
        default: 0
    },
    service_total_in_admin_currency: {type: Number,
        default: 0
    },
    provider_service_fees_in_admin_currency: {type: Number,
        default: 0
    },
    promo_referral_amount: {type: Number,
        default: 0
    },
    user_create_time: {
        type: Date,
        default: Date.now
    },
    schedule_start_time: {
        type: Date,
        default: Date.now
    },
    accepted_time: {
        type: Date,
        default: Date.now
    },
    provider_arrived_time: {
        type: Date,
        default: Date.now
    },
    provider_trip_start_time: {
        type: Date,
        default: Date.now
    },
    provider_trip_end_time: {
        type: Date,
        default: Date.now
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date
    }
},{
//   usePushEach: true 
// }, {
    strict: true,
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

///for find
Trip.index({user_id: 1, is_trip_cancelled: 1, is_trip_completed: 1}, {background: true});
Trip.index({user_id: 1, is_pending_payments: 1}, {background: true});
Trip.index({is_provider_status: 1, is_trip_cancelled: 1}, {background: true});
Trip.index({is_provider_status: 1, current_provider: 1}, {background: true});
Trip.index({is_provider_status: 1, current_provider: 1}, {background: true});
Trip.index({confirmed_provider: 1, is_trip_cancelled_by_provider: 1, provider_trip_end_time: 1}, {background: true});
Trip.index({service_type_id: 1, is_trip_completed: 1, created_at: 1}, {background: true});
Trip.index({user_id: 1, is_trip_cancelled: 1, is_trip_cancelled_by_provider: 1, is_user_invoice_show: 1}, {background: true});


/////for aggregate
Trip.index({country_id: 1, city_id: 1, is_trip_completed: 1, is_trip_cancelled_by_user: 1, provider_type: 1}, {background: true});
Trip.index({provider_type_id: 1, complete_date_in_city_timezone: 1, is_trip_completed: 1, is_trip_cancelled_by_user: 1}, {background: true});
Trip.index({is_schedule_trip: 1, is_trip_cancelled: 1, is_trip_completed: 1, is_trip_end: 1, current_provider: 1, user_type_id: 1}, {background: true});
Trip.index({user_type_id: 1, is_trip_cancelled: 1, is_trip_completed: 1, is_provider_accepted: 1, is_provider_status: 1}, {background: true});
Trip.index({provider_id: 1, provider_trip_end_time: 1, is_trip_completed: 1, is_trip_cancelled: 1, is_trip_cancelled_by_provider: 1});
Trip.index({provider_type_id: 1, created_at: 1});
Trip.index({promo_id: 1});
Trip.index({confirmed_provider: 1, is_trip_completed: 1, provider_trip_end_time: 1});
Trip.index({payment_mode: 1, is_trip_completed: 1, is_trip_cancelled: 1, created_at: 1});
Trip.index({is_trip_cancelled_by_user: 1, is_trip_completed: 1, is_trip_cancelled: 1, user_id: 1, provider_trip_end_time: 1});
Trip.index({confirmed_provider: 1, is_trip_completed: 1, is_transfered: 1, is_provider_earning_set_in_wallet: 1});
Trip.index({provider_type_id: 1, is_trip_completed: 1, is_transfered: 1, is_provider_earning_set_in_wallet: 1});


Trip.plugin(autoIncrement.plugin, {model: 'Trip', field: 'unique_id', startAt: 1, incrementBy: 1});
var Trip = mongoose.model('Trip', Trip);
module.exports = Trip;
