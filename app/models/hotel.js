var mongoose = require('mongoose'),
    mongoosePaginate = require('mongoose-paginate'),
    
    Schema = mongoose.Schema;
var mongoosePages = require('mongoose-pages');

var hotel = new Schema({
    unique_id: Number,
    hotel_name: {type: String, default: ""},
    password:{type: String, default: ""},
    token:{type: String, default: ""},
    email: {type: String, default: ""},
    country_phone_code: {type: String, default: ""},
    phone: {type: String, default: ""},
    country: {type: String, default: ""},
    countryid:{ type: Schema.Types.ObjectId},
    city:{type: String, default: ""},
    address:{type: String, default: ""},
    latitude:{type: Number, default: 22},
    longitude:{type: Number, default: 70},
    cityid:{ type: Schema.Types.ObjectId},
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }

});
hotel.index({phone: 1}, {background: true});
hotel.index({email: 1}, {background: true});

hotel.plugin( mongoosePaginate );
mongoosePages.skip(hotel);


module.exports =  mongoose.model('Hotel', hotel);
