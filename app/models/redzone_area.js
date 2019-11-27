var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var redzoneareaSchema = new Schema({
    cityid: { type: Schema.Types.ObjectId },
    title:{type: String, default: ""},
    styleUrl: {type: String, default: ""},
    styleHash: {type: String, default: ""},
    description: {type: String, default: ""},
    stroke: {type: String, default: ""},
    stroke_opacity: {type: Number, default: 0},
    stroke_width: {type: Number, default: 0},
    fill: {type: String, default: ""},
    fill_opacity: {type: Number, default: 0},
    kmlzone:{
     type: Array,
     index1: '3d'
    },    
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});
redzoneareaSchema.index({cityid: 1, title: 1}, {background: true});

var RedZoneArea = mongoose.model('RedZoneArea', redzoneareaSchema);
module.exports = RedZoneArea;

