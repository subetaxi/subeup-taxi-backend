var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var typeSchema = new Schema({
    typename: {type: String, default: ""},
    description: {type: String, default: ""},
    type_image_url: {type: String, default: ""},
    map_pin_image_url:{type: String, default: ""},
    service_type: Number,
    priority: { type: Number, default: 0 },
    is_business:{
        type: Number,
        default: 1
    },
    is_default_selected: {type: Boolean, default: false},
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }

});
typeSchema.index({typename: 1}, {background: true});

var Type = mongoose.model('Type', typeSchema);
module.exports = Type;

