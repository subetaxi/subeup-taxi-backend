var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var airportSchema = new Schema({
    city_id: { type: Schema.Types.ObjectId },
    title: {type: String, default: ""},
    // radius: {type: Number, default: 0},
    // airportLatLong: {
    //     type: [Number],
    //     index: '2d'
    // },
    kmlzone:{
     type: Array,
     index1: '3d'
    },  
    styleUrl: {type: String, default: ""},
    styleHash: {type: String, default: ""},
    description: {type: String, default: ""},
    stroke: {type: String, default: ""},
    stroke_opacity: {type: Number, default: 0},
    stroke_width: {type: Number, default: 0},
    fill: {type: String, default: ""},
    fill_opacity: {type: Number, default: 0},
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});
airportSchema.index({city_id: 1}, {background: true});

var Airport = mongoose.model('Airport', airportSchema);
module.exports = Airport;

