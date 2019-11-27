var config = require('./config'),
        mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var autoIncrement = require('mongoose-auto-increment');


module.exports = function () {
    var db = mongoose.connect(config.db, {useMongoClient: true});
    autoIncrement.initialize(db);

    require('../app/models/user');
    require('../app/models/provider');
    require('../app/models/country');
    require('../app/models/city');
    require('../app/models/type');
    require('../app/models/citytype');
    require('../app/models/trip');
    require('../app/models/card');
    require('../app/models/trip_service');
    require('../app/models/reviews');
    require('../app/models/trip_location');
    require('../app/models/promo_code');
    require('../app/models/user_promo_used');
    require('../app/models/documents');
    require('../app/models/provider_document');
    require('../app/models/provider_vehicle_document');
    require('../app/models/user_document');
    require('../app/models/admin');
    require('../app/models/admin_settings');
    require('../app/models/information');
    require('../app/models/payment_transaction');
    //require('../app/models/provider_earning');
    require('../app/models/sms_detail');
    require('../app/models/email_detail');
    require('../app/models/emergency_contact_detail');
    require('../app/models/provider_daily_earning');
    require('../app/models/provider_weekly_earning');
    //require('../app/models/provider_trip_detail');
    require('../app/models/partner_weekly_earning');
    require('../app/models/partner');
    require('../app/models/dispatcher');
    require('../app/models/bank_detail');
    require('../app/models/hotel');
    require('../app/models/citytocity');
    require('../app/models/airport');
    require('../app/models/airporttocity');
    require('../app/models/cityzone');
    require('../app/models/redzone_area');
    require('../app/models/zonevalue');
    require('../app/models/wallet_history');
    require('../app/models/provider_daily_analytic');
    require('../app/models/languages');
    require('../app/models/corporate');

    // 28 May //
    
    require('../app/models/partner_vehicle_document');
     require('../app/models/transfer_history');

    return db;
};