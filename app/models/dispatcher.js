var mongoose = require('mongoose'),
    mongoosePaginate = require('mongoose-paginate'),
    
    Schema = mongoose.Schema;
var mongoosePages = require('mongoose-pages');

var dispatcher = new Schema({
    unique_id: Number,
    first_name: {type: String, default: ""},
    last_name: {type: String, default: ""},
    password:{type: String, default: ""},
    token:{type: String, default: ""},
    email: {type: String, default: ""},
    country_phone_code: {type: String, default: ""},
    phone: {type: String, default: ""},
    country: {type: String, default: ""},
    countryid:{ type: Schema.Types.ObjectId},
    city:{type: String, default: ""},
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
dispatcher.index({email: 1}, {background: true});
dispatcher.index({phone: 1}, {background: true});

dispatcher.plugin( mongoosePaginate );
mongoosePages.skip(dispatcher);

// set up a mongoose model and pass it using module.exports
module.exports =  mongoose.model('Dispatcher', dispatcher);

