var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var rsSchema = new Schema({

    trip_id: { type: Schema.Types.ObjectId},
    service_type_id: { type: Schema.Types.ObjectId},
    city_id: { type: Schema.Types.ObjectId},
    service_type_name:{type: String, default: ""},
    min_fare: {type: Number, default: 0},
    provider_profit: {type: Number, default: 0},

    typename: {type: String, default: ''},
    is_car_rental_business: {type: Number, default: 0},
    car_rental_ids: [{type: Schema.Types.ObjectId, default: [] }],
    base_price_distance: {type: Number, default: 0},
    base_price_time: {type: Number, default: 0},
    base_price: {type: Number, default: 0},
    price_per_unit_distance: {type: Number, default: 0},    
    price_for_total_time: {type: Number, default: 0},

    price_for_waiting_time: {type: Number, default: 0},
    waiting_time_start_after_minute: {type: Number, default: 0},
    surge_multiplier: {type: Number, default: 0},
    surge_start_hour: {type: Number, default: 0},
    surge_end_hour: {type: Number, default: 0},
    is_surge_hours: {type: Number, default: 0},

    user_miscellaneous_fee:{
        type: Number,
        default: 0
    },
    provider_miscellaneous_fee:{
        type: Number,
        default: 0
    },
    user_tax:{
        type: Number,
        default: 0
    },
    provider_tax:{
        type: Number,
        default: 0
    },

    tax: {type: Number, default: 0},
    max_space: {type: Number, default: 0},
    cancellation_fee: {type: Number, default: 0},
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});
rsSchema.index({city_id: 1, service_type_id: 1}, {background: true});

var Trip_Service = mongoose.model('trip_service', rsSchema);

module.exports = Trip_Service;

