var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var user_promo_useSchema = new Schema({
    promo_id: { type: Schema.Types.ObjectId},
    promocode: {type: String, default: ""},
    user_id: { type: Schema.Types.ObjectId},
    promo_type:Number,
    promo_value:{type: Number, default: 0},
    trip_id:{ type: Schema.Types.ObjectId},
    user_used_amount:{type: Number, default: 0},
    user_used_amount_in_admin_currency:Number,
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }

});
user_promo_useSchema.index({user_id: 1, promo_id: 1}, {background: true});
user_promo_useSchema.index({trip_id: 1}, {background: true});

var User_promo_use = mongoose.model('User_promo_use', user_promo_useSchema);

module.exports = User_promo_use;

