var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var reviewsSchema = new Schema({

    userRating: {type: Number, default: 0},
    userReview: { type : String, default:""},
    providerRating: {type: Number, default: 0},
    providerReview: { type : String, default:""},
    trip_id: { type: Schema.Types.ObjectId},
    trip_unique_id:Number,
    user_id: { type: Schema.Types.ObjectId},
    provider_id: { type: Schema.Types.ObjectId},
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

reviewsSchema.index({trip_id: 1}, {background: true});
reviewsSchema.index({created_at: 1}, {background: true});


var Reviews = mongoose.model('Reviews', reviewsSchema);
module.exports = Reviews;

