var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var provider_daily_analytic = new schema({
    unique_id: Number,
    provider_id: {type: schema.Types.ObjectId},
    date_tag: {type: String, default: ""},
    date_server_timezone: {
        type: Date,
        default: Date.now
    },
    received: {type: Number, default: 0},
    accepted: {type: Number, default: 0},
    rejected: {type: Number, default: 0},
    not_answered: {type: Number, default: 0},
    cancelled: {type: Number, default: 0},
    completed: {type: Number, default: 0},
    acception_ratio: {type: Number, default: 0},
    rejection_ratio: {type: Number, default: 0},
    cancellation_ratio: {type: Number, default: 0},
    completed_ratio: {type: Number, default: 0},
    total_online_time: {type: Number, default: 0},
    online_times: {type: Array, default: []},
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }

}, {
    strict: true,
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

provider_daily_analytic.index({partner_id: 1, date_tag: 1}, {background: true});

provider_daily_analytic.plugin(autoIncrement.plugin, {model: 'provider_daily_analytic', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('provider_daily_analytic', provider_daily_analytic);