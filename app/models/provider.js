var mongoose = require('mongoose'),
        mongoosePaginate = require('mongoose-paginate'),
        Schema = mongoose.Schema;
var mongoosePages = require('mongoose-pages');
var autoIncrement = require('mongoose-auto-increment');

var provider = new Schema({
    provider_type: Number,
    provider_type_id: {type: Schema.Types.ObjectId},
    unique_id: Number,
    first_name: {type: String, default: ""},
    languages: [{type: Schema.Types.ObjectId}],
    received_trip_from_gender: [{type: String}],
    is_trip: [{type: Schema.Types.ObjectId}],
    wallet: {type: Number, default: 0},
    wallet_currency_code: {type: String, default: ""},
    last_name: {type: String, default: ""},
    email: {type: String, default: ""},
    gender: {type: String, default: ""},
    country_phone_code: {type: String, default: ""},

    // 25 May //
    is_documents_expired: {type: Boolean, default: false},
    account_id: {type: String, default: ""},
    bank_id: {type: String, default: ""},
    //  //    

    is_vehicle_document_uploaded: {type: Boolean, default: false},
    phone: {type: String, default: ""},
    password: {type: String, default: ""},
    picture: {type: String, default: ""},
    token: {type: String, default: ""},
    service_type: {type: Schema.Types.ObjectId},
    admintypeid: {type: Schema.Types.ObjectId},
    car_model: {type: String, default: ''},
    car_number: {type: String, default: ''},
    device_token: {type: String, default: ""},
    device_type: {type: String, default: ""},
    app_version: {type: String, default: ""},
    bio: {type: String, default: ""},
    address: {type: String, default: ""},
    zipcode: {type: String, default: ""},
    social_unique_id: {type: String, default: ""},
    login_by: {type: String, default: ""},
    device_timezone: {type: String, default: ""},
    bearing: {type: Number, default: 0},
    city: {type: String, default: ""},
    cityid: {type: Schema.Types.ObjectId},
    country: {type: String, default: ""},
    country_id: {type: Schema.Types.ObjectId},
    is_use_google_distance: {
        type: Boolean,
        default: false
    },
    vehicle_detail: {type: Array, default: []},

    providerPreviousLocation: {
        type: [Number],
        index1: '2d'
    },
    providerLocation: {
        type: [Number],
        index: '2d'
    },
    is_available: {type: Number, default: 0},
    total_request: {type: Number, default: 0},
    accepted_request: {type: Number, default: 0},
    completed_request: {type: Number, default: 0},
    cancelled_request: {type: Number, default: 0},
    rejected_request: {type: Number, default: 0},
    is_active: {type: Number, default: 0},
    is_approved: {type: Number, default: 0},
    is_partner_approved_by_admin: {type: Number, default: 0},
    is_document_uploaded: {type: Number, default: 0},
    device_unique_code: {type: String, default: ""},
    rate:{type: Number, default: 0},
    rate_count: {type: Number, default: 0},
    // 13 march 
    start_online_time: {
        type: Date
    },

    referred_by: {type: Schema.Types.ObjectId, default: null},
    is_referral: {type: Number, default: 1},
    referral_code: {type: String, default: ""},
    total_referrals: {type: Number, default: 0},

    /// 21 oct

    in_zone_queue: {type: Boolean, default: false},
    zone_queue_no: {type: Number, default: Math.max()},
    zone_queue_id: {type: Schema.Types.ObjectId},


    //
    location_updated_time: {
        type: Date,
        default: Date.now
    },
    last_transferred_date: {
        type: Date,
        default: Date.now
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
},{
//     usePushEach: true 
// }, {
    strict: true,
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
})

provider.index({country: 1, service_type: 1, provider_type: 1, is_approved: 1, is_partner_approved_by_admin: 1}, {background: true});
provider.index({device_type: 1, unique_id: 1, device_token: 1}, {background: true});

provider.index({country: 1}, {background: true});
provider.index({email: 1}, {background: true});
provider.index({provider_type_id: 1}, {background: true});
provider.index({is_approved: 1, cityid: 1}, {background: true});
provider.index({is_active: 1, is_trip: 1}, {background: true});
provider.index({social_unique_id: 1}, {background: true});
provider.index({phone: 1, country_phone_code: 1}, {background: true});
provider.index({providerLocation: 1, is_active: 1, is_available: 1, is_vehicle_document_uploaded: 1}, {background: true});


provider.plugin(autoIncrement.plugin, {model: 'provider', field: 'unique_id', startAt: 1, incrementBy: 1});
provider.plugin(mongoosePaginate);
mongoosePages.skip(provider);

// set up a mongoose model and pass it using module.export
module.exports = mongoose.model('Provider', provider);