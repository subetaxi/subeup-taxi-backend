var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var zonevalueSchema = new Schema({
    cityid: { type: Schema.Types.ObjectId },
    service_type_id: { type: Schema.Types.ObjectId },
    from: { type: Schema.Types.ObjectId },
    to: { type: Schema.Types.ObjectId },
    amount: {type: Number, default: 0}, 
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }

});
zonevalueSchema.index({from: 1, to: 1}, {background: true});

var ZoneValue = mongoose.model('ZoneValue', zonevalueSchema);
module.exports = ZoneValue;

