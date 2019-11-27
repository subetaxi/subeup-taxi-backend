var mongoose = require('mongoose'),
        Schema = mongoose.Schema;


var infoSchema = new Schema({
    title: {type: String, default: ""},
    file: {type: String, default: ""},
    description: {type: String, default: ""},
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }

});

var Information = mongoose.model('Information', infoSchema);
module.exports = Information;

