var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var citytypeSchema = new Schema({
    countryid:{type: Schema.Types.ObjectId},
    is_hide:{type: Number, default: 1},
    surge_multiplier:{type: Number, default: 0},
    surge_start_hour:{type: Number, default: 0},
    surge_end_hour:{type: Number, default: 0},
    is_surge_hours:{type: Number, default: 0},
    is_zone:{type: Number, default: 0},
    rich_area_surge: {type: Array, default: []},
    surge_hours: {type: Array, default: [
        {
            "is_surge": false,
            "day": "0",
            "day_time": []
        },
        {
            "is_surge": false,
            "day": "1",
            "day_time": []
        },
        {
            "is_surge": false,
            "day": "2",
            "day_time": []
        },
        {
            "is_surge": false,
            "day": "3",
            "day_time": []
        },
        {
            "is_surge": false,
            "day": "4",
            "day_time": []
        },
        {
            "is_surge": false,
            "day": "5",
            "day_time": []
        },
        {
            "is_surge": false,
            "day": "6",
            "day_time": []
        }
    ]},
    // zone_multiplier:{type: Number, default: 1},
    is_business:{type: Number, default: 1},
    countryname:{type: String, default: ""},
    cityid:{ type: Schema.Types.ObjectId},
    cityname:{type: String, default: ""},
    typeid:{ type: Schema.Types.ObjectId},
    type_image:{type: String, default: ""},
    min_fare:{type: Number, default: 0},
    provider_profit:{type: Number, default: 0},

    typename: {type: String, default: ''},
    is_car_rental_business: {type: Number, default: 0},
    car_rental_ids: [{type: Schema.Types.ObjectId, default: [] }],
    base_price_distance: {type: Number, default: 0},
    base_price_time: {type: Number, default: 0},
    base_price: {type: Number, default: 0},
    price_per_unit_distance: {type: Number, default: 0},    
    price_for_total_time: {type: Number, default: 0},

    waiting_time_start_after_minute:{type: Number, default: 0},
    price_for_waiting_time: {type: Number, default: 0},
    
    tax: {type: Number, default: 0},
    max_space: {type: Number, default: 0},
    cancellation_fee: {type: Number, default: 0},

    user_miscellaneous_fee:{type: Number, default: 0},
    provider_miscellaneous_fee:{type: Number, default: 0},
    user_tax:{type: Number, default: 0},
    provider_tax:{type: Number, default: 0},
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    
    // 21 oct
    total_provider_in_zone_queue: {type: Array, default: []},
    zone_ids: [{type: Schema.Types.ObjectId, default: []}]

});

citytypeSchema.index({created_at: 1}, {background: true});
citytypeSchema.index({countryid: 1, cityid: 1, is_business: 1}, {background: true});


var Citytype = mongoose.model('city_type', citytypeSchema);
module.exports = Citytype;

