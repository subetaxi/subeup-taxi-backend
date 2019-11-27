var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var emergencycontactschema = new Schema({
    user_id: { type: Schema.Types.ObjectId},
    name: {type: String, default: ""},
    phone: {type: String, default: ""},
    is_always_share_ride_detail: {type: Number, default: 0},
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
    },
    {
        strict: true,
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    }
)
emergencycontactschema.index({user_id: 1, phone: 1}, {background: true});
emergencycontactschema.index({user_id: 1, is_always_share_ride_detail: 1}, {background: true});

module.exports = mongoose.model('emergency_contact_detail', emergencycontactschema);
