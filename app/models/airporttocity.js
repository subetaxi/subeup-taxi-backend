var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var airporttocitySchema = new Schema({
    
    city_id: { type: Schema.Types.ObjectId },
    airport_id: { type: Schema.Types.ObjectId },
    price: {type: Number, default: 0},
    service_type_id: { type: Schema.Types.ObjectId },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }

});
airporttocitySchema.index({city_id: 1, airport_id: 1, service_type_id: 1}, {background: true});

var AirporttoCity = mongoose.model('Airport_to_City', airporttocitySchema);

module.exports = AirporttoCity;

