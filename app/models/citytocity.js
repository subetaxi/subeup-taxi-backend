var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var citytocitySchema = new Schema({
    city_id: { type: Schema.Types.ObjectId },
    destination_city_id: { type: Schema.Types.ObjectId },
    price: {type :Number,default : 0},
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
citytocitySchema.index({city_id: 1, destination_city_id: 1, service_type_id: 1}, {background: true});

var CitytoCity = mongoose.model('City_to_City', citytocitySchema);
module.exports = CitytoCity;

