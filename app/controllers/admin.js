var utils = require('./utils');
var Settings = require('mongoose').model('Settings');
var moment = require('moment');
var array = [];
var User = require('mongoose').model('User');
var User_Document = require('mongoose').model('User_Document');
var Provider_Document = require('mongoose').model('Provider_Document');
var Provider = require('mongoose').model('Provider');
var console = require('./console');
var Language = require('mongoose').model('language');

exports.sendmasssms = function (req, res) {
    //utils.sendMassSMS();
//    User.find({"country" : "Greece"}, function (err, users) {
//            users.forEach(function (user_detail) {
//                utils.sendSMS(user_detail.country_phone_code+user_detail.phone, "hi");
//               
//            });
//         });
//    
//    res.json({success: true});
};

//exports.updateDatabaseTable = function (req, res) {
//    utils.updateNewTable();
//    res.json({success: true});
//};

exports.updateDatabaseTable = function (req, res) {
    //utils.updateNewTable();
    var today = new Date();
    var city_timezone = "Asia/Kolkata";
    var date_in_city_timezone = utils.get_date_in_city_timezone(today, city_timezone);
    var date_in_utc_from_city_date = utils.get_date_in_utc_from_city_date(today, city_timezone);
    var date_now_at_city = utils.get_date_now_at_city(today, city_timezone);

    res.json({success: true, today: today, date_in_city_timezone: date_in_city_timezone, date_in_utc_from_city_date: date_in_utc_from_city_date, date_now_at_city: date_now_at_city});
};



exports.getlanguages = function (req, res) {
    Language.find({}).then((languages) => { 
        if (languages.length == 0)
        {
            res.json({success: false, error_code: error_message.ERROR_CODE_LANGUAGES_NOT_FOUND});
        } else
        {
            res.json({success: true, message: success_messages.MESSAGE_CODE_LANGUAGES_GET_SUCCESSFULLY, languages: languages});
        }
    });
}


//// getappkeys 
exports.getappkeys = function (req, res, next) {
    Settings.findOne({}).then((setting) => { 

        var terms_and_condition_url = req.protocol + '://' + req.get('host') + "/terms";
        var privacy_policy_url = req.protocol + '://' + req.get('host') + "/support";

        if (!setting) {
            res.json({success: false, error_code: error_message.ERROR_CODE_APP_KEYS_NOT_FOUND});
        } else {

            res.json({
                success: true,
                terms_and_condition_url: terms_and_condition_url,
                privacy_policy_url: privacy_policy_url,
                stripe_publishable_key: setting.stripe_publishable_key,
                twilio_number: setting.twilio_number,
                android_user_app_google_key: setting.android_user_app_google_key,
                android_provider_app_google_key: setting.android_provider_app_google_key,
                ios_user_app_google_key: setting.ios_user_app_google_key,
                ios_provider_app_google_key: setting.ios_provider_app_google_key,
                hotline_app_id: setting.hotline_app_id,
                hotline_app_key: setting.hotline_app_key,
                userEmailVerification: setting.userEmailVerification,
                providerEmailVerification: setting.providerEmailVerification,
                userSms: setting.userSms,
                providerSms: setting.providerSms,
                admin_phone: setting.admin_phone,
                contactUsEmail: setting.contactUsEmail,
                scheduledRequestPreStartMinute: setting.scheduled_request_pre_start_minute,
                userPath: setting.userPath,
                providerPath: setting.providerPath,
                is_tip: setting.is_tip,
                android_user_app_version_code: setting.android_user_app_version_code,
                android_user_app_force_update: setting.android_user_app_force_update,
                android_provider_app_version_code: setting.android_provider_app_version_code,
                android_provider_app_force_update: setting.android_provider_app_force_update,
                ios_user_app_version_code: setting.ios_user_app_version_code,
                ios_user_app_force_update: setting.ios_user_app_force_update,
                ios_provider_app_version_code: setting.ios_provider_app_version_code,
                ios_provider_app_force_update: setting.ios_provider_app_force_update,
                is_provider_initiate_trip: setting.is_provider_initiate_trip

            });
        }

    });
};


//// getsettingdetail /////
exports.getsettingdetail = function (req, res) {
    Settings.findOne({}).then((setting) => { 
        if (!setting) {
            res.json({success: false, error_code: error_message.ERROR_CODE_SETTING_DETAIL_NOT_FOUND});
        } else {
            res.json({
                success: true,
                userEmailVerification: setting.userEmailVerification,
                providerEmailVerification: setting.providerEmailVerification,
                userSms: setting.userSms,
                providerSms: setting.providerSms,
                admin_phone: setting.admin_phone,
                contactUsEmail: setting.contactUsEmail,
                scheduledRequestPreStartMinute: setting.scheduled_request_pre_start_minute,
                userPath: setting.userPath,
                providerPath: setting.providerPath,
                is_tip: setting.is_tip,
                android_user_app_version_code: setting.android_user_app_version_code,
                android_user_app_force_update: setting.android_user_app_force_update,
                android_provider_app_version_code: setting.android_provider_app_version_code,
                android_provider_app_force_update: setting.android_provider_app_force_update,
                ios_user_app_version_code: setting.ios_user_app_version_code,
                ios_user_app_force_update: setting.ios_user_app_force_update,
                ios_provider_app_version_code: setting.ios_provider_app_version_code,
                ios_provider_app_force_update: setting.ios_provider_app_force_update,
                is_provider_initiate_trip: setting.is_provider_initiate_trip
            });
        }

    });
};




exports.delete_users = function (req, res) {
    var userarray = [
        'demo@driver.com',
        'sv@gmail.com',
        'rochdykamali1@gmail.com',
        'rochdykamali2@gmail.com',
        'khassouani.r@hotmail.fr',
        'driver@blinc.ma',
        's@v.com',
        's@v.in',
        'rochdykamali@bichbich.com',
        'tom@gmail.com',
        's_vala@elluminati.in',
        'ios@driver.com',
        'rochdykamali@hotmail.com',
        'tom@ladgo.com',
        'amine.sari123@hotmail.com',
        'jalal.mountassir1985@gmail.com',
        'jalal.elmountassir123@gmail.com',
        'tom@cruise.com'
    ]
    Provider.find({email: {$in: userarray}}, function (error, user_list) {
        console.log("user_list: " + user_list.length)
        user_list.forEach(function (user_data) {
            Provider_Document.remove({user_id: user_data._id}, function (error, user_documents) {
                Provider.findOneAndRemove({_id: user_data._id}, function (error, user) {

                })
            })
        });
    });
}