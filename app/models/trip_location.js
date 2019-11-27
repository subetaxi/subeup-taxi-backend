var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var trip_locationschema = new Schema({
    tripID: {type: Schema.Types.ObjectId},
    trip_unique_id: Number,
    providerStartTime: {
        type: Date,
        default: Date.now
    },
    providerStartLocation: {
        type: [Number],
        index: '2d'
    },
    startTripTime: {
        type: Date,
        default: Date.now
    },
    startTripLocation: {
        type: [Number],
        index: '2d'
    },
    endTripTime: {
        type: Date,
        default: Date.now
    },
    endTripLocation: {
        type: [Number],
        index: '2d'
    },
    providerStartToStartTripLocations: {type: Array, "default": []},
    startTripToEndTripLocations: {type: Array, "default": []},
    actual_startTripToEndTripLocations: {type: Array, "default": []},
    googlePathStartLocationToPickUpLocation: {type: String, default: ""},
    googlePickUpLocationToDestinationLocation: {type: String, default: ""},

    index_for_that_covered_path_in_google: {type: Number, default: 0},
    google_total_distance: {type: Number, default: 0},
    google_start_trip_to_end_trip_locations: {type: Array, "default": []},
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, {
  usePushEach: true 
},{
    strict: true,
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

trip_locationschema.index({tripID: 1}, {background: true});
module.exports = mongoose.model('trip_location', trip_locationschema);


