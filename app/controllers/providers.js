var utils = require('./utils');
require('./constant');
var myAnalytics = require('./provider_analytics');
var allemails = require('./emails');
var Provider = require('mongoose').model('Provider');
var Trip = require('mongoose').model('Trip');
var TripLocation = require('mongoose').model('trip_location');
var Document = require('mongoose').model('Document');
var Provider_Document = require('mongoose').model('Provider_Document');
var Country = require('mongoose').model('Country');
var moment = require('moment');
var City = require('mongoose').model('City');
var Type = require('mongoose').model('Type');
var Settings = require('mongoose').model('Settings');
var console = require('./console');
var Citytype = require('mongoose').model('city_type');
var Partner = require('mongoose').model('Partner');
var Provider_Vehicle_Document = require('mongoose').model('Provider_Vehicle_Document');
var utils = require('./utils');
var CityZone = require('mongoose').model('CityZone');
var User = require('mongoose').model('User');
var mongoose = require('mongoose');
var Wallet_history = require('mongoose').model('Wallet_history');
var geolib = require('geolib');

var Schema = mongoose.Types.ObjectId;
//// PROVIDER REGISTER USING POST SERVICE ///////
exports.provider_register = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'email', type: 'string'},{name: 'country_phone_code', type: 'string'},{name: 'phone', type: 'string'},
        {name: 'first_name', type: 'string'},{name: 'last_name', type: 'string'},
        {name: 'country', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({email: ((req.body.email).trim()).toLowerCase()}).then((provider) => {
                if (provider) {
                    if (provider.login_by == 'manual') {
                        res.json({success: false, error_code: error_message.ERROR_CODE_EMAIL_ID_ALREADY_REGISTERED});
                    } else {
                        res.json({
                            success: false,
                            error_code: error_message.ERROR_CODE_EMAIL_ID_ALREADY_REGISTERED_WITH_SOCIAL
                        });
                    }
                } else {

                    Provider.findOne({
                        phone: req.body.phone,
                        country_phone_code: req.body.country_phone_code
                    }).then((provider) => {

                        if (provider) {
                            res.json({success: false, error_code: error_message.ERROR_CODE_PHONE_NUMBER_ALREADY_USED});
                        } else {
                            var query = {};
                            if (req.body.city_id) {
                                query['_id'] = req.body.city_id;
                            } else {
                                query['cityname'] = req.body.city;
                            }

                            City.findOne(query).then((city) => {
                                console.log(city)
                                var city_id = city._id;
                                var city_name = city.cityname;
                                var country_id = city.countryid;
                                var token = utils.tokenGenerator(32);

                                var gender = req.body.gender;
                                if (gender != undefined) {
                                    gender = ((gender).trim()).toLowerCase();
                                }


                                var first_name = req.body.first_name;
                                first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);

                                var last_name = req.body.last_name;
                                last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);
                                var referral_code = (utils.tokenGenerator(8)).toUpperCase();

                                var provider = new Provider({
                                    first_name: first_name,
                                    last_name: last_name,
                                    country_phone_code: req.body.country_phone_code,
                                    email: ((req.body.email).trim()).toLowerCase(),
                                    phone: req.body.phone,
                                    gender: gender,
                                    service_type: null,
                                    car_model: req.body.car_model,
                                    car_number: req.body.car_number,
                                    device_token: req.body.device_token,
                                    device_type: req.body.device_type,
                                    bio: req.body.bio,
                                    address: req.body.address,
                                    zipcode: req.body.zipcode,
                                    social_unique_id: req.body.social_unique_id,
                                    login_by: req.body.login_by,
                                    device_timezone: req.body.device_timezone,
                                    city: city_name,
                                    cityid: city_id,
                                    country_id: country_id,
                                    country: req.body.country,
                                    wallet_currency_code: "",
                                    token: token,
                                    referral_code: referral_code,
                                    is_available: 1,
                                    is_document_uploaded: 0,
                                    is_referral: 0,
                                    is_partner_approved_by_admin: 1,
                                    is_active: 0,
                                    is_approved: 0,
                                    rate: 0,
                                    rate_count: 0,
                                    is_trip: [],
                                    received_trip_from_gender: [],
                                    languages: [],
                                    admintypeid: null,
                                    wallet: 0,
                                    bearing: 0,
                                    picture: "",
                                    provider_type: Number(constant_json.PROVIDER_TYPE_NORMAL),
                                    provider_type_id: null,
                                    providerLocation: [0, 0],
                                    providerPreviousLocation: [0, 0],
                                    app_version: req.body.app_version

                                });
                                /////////// FOR IMAGE /////////

                                var pictureData = req.body.pictureData;
                                if (pictureData != undefined && pictureData != "") {
                                    var image_name = provider._id + utils.tokenGenerator(4);
                                    var url = utils.getImageFolderPath(req, 2) + image_name + '.jpg';
                                    provider.picture = url;

                                    utils.saveImageAndGetURL(image_name + '.jpg', req, res, 2);
                                }

                                if (req.files != undefined && req.files.length > 0) {
                                    var image_name = provider._id + utils.tokenGenerator(4);
                                    var url = utils.getImageFolderPath(req, 2) + image_name + '.jpg';
                                    provider.picture = url;
                                    utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 2);
                                }
                                ///////////////////////////

                                if (req.body.login_by == "manual") {
                                    var crypto = require('crypto');
                                    var password = req.body.password;
                                    var hash = crypto.createHash('md5').update(password).digest('hex');
                                    provider.password = hash;
                                    provider.social_unique_id = ""
                                    Country.findOne({countryname: provider.country}).then((country) => {
                                        if (country) {
                                            var country_id = country._id;
                                            var wallet_currency_code = country.currencycode;
                                            provider.wallet_currency_code = wallet_currency_code;

                                            utils.insert_documets_for_new_providers(provider,1, country._id, function(document_response){
                                                provider.is_document_uploaded = document_response.is_document_uploaded;
                                                provider.save().then(() => {
                                                    var email_notification = setting_detail.email_notification;
                                                    if (email_notification == true) {
                                                        allemails.sendProviderRegisterEmail(req, provider, provider.first_name + " " + provider.last_name);
                                                    }
                                                    var response = {};
                                                    response.first_name = provider.first_name;
                                                    response.last_name = provider.last_name;
                                                    response.email = provider.email;
                                                    response.country_phone_code = provider.country_phone_code;
                                                    response.is_document_uploaded = provider.is_document_uploaded;
                                                    response.address = provider.address;
                                                    response.is_approved = provider.is_approved;
                                                    response._id = provider._id;
                                                    response.social_ids = provider.social_ids;
                                                    response.social_unique_id = provider.social_unique_id;
                                                    response.phone = provider.phone;
                                                    response.login_by = provider.login_by;
                                                    response.is_documents_expired = provider.is_documents_expired;
                                                    response.account_id = provider.account_id;
                                                    response.bank_id = provider.bank_id;
                                                    response.city = provider.city;
                                                    response.country = provider.country;
                                                    response.rate = provider.rate;
                                                    response.rate_count = provider.rate_count;
                                                    response.is_referral = provider.is_referral;
                                                    response.token = provider.token;
                                                    response.referral_code = provider.referral_code;
                                                    response.is_vehicle_document_uploaded = provider.is_vehicle_document_uploaded;
                                                    response.service_type = provider.service_type;
                                                    response.admintypeid = provider.admintypeid;
                                                    response.is_available = provider.is_available;
                                                    response.is_active = provider.is_active;
                                                    response.is_partner_approved_by_admin = provider.is_partner_approved_by_admin;
                                                    response.picture = provider.picture;
                                                    response.wallet_currency_code = provider.wallet_currency_code;
                                                    response.country_detail = {"is_referral": country.is_provider_referral}


                                                    res.json({
                                                        success: true,
                                                        message: success_messages.MESSAGE_CODE_FOR_PROVIDER_YOU_REGISTERED_SUCCESSFULLY,
                                                        provider_detail: response,
                                                        phone_number_min_length: country.phone_number_min_length,
                                                        phone_number_length: country.phone_number_length
                                                    });
                                                }, (err) => {
                                                    console.log(err);
                                                    res.json({
                                                    success: false,
                                                    error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                });
                                                });

                                            });
                                        }

                                    });
                                } else {
                                    provider.password = "";
                                    Country.findOne({countryname: provider.country}).then((country) => {

                                        if (country) {
                                            var country_id = country._id;
                                            var wallet_currency_code = country.currencycode;
                                            provider.wallet_currency_code = wallet_currency_code;
                                            utils.insert_documets_for_new_providers(provider, 1, country._id, function(document_response){
                                                provider.is_document_uploaded = document_response.is_document_uploaded;
                                                provider.save().then(() => {
                                                    var email_notification = setting_detail.email_notification;
                                                    if (email_notification == true) {
                                                        allemails.sendProviderRegisterEmail(req, provider, provider.first_name + " " + provider.last_name);
                                                    }
                                                    var response = {};
                                                    response.first_name = provider.first_name;
                                                    response.last_name = provider.last_name;
                                                    response.email = provider.email;
                                                    response.country_phone_code = provider.country_phone_code;
                                                    response.is_document_uploaded = provider.is_document_uploaded;
                                                    response.address = provider.address;
                                                    response.is_approved = provider.is_approved;
                                                    response._id = provider._id;
                                                    response.social_ids = provider.social_ids;
                                                    response.social_unique_id = provider.social_unique_id;
                                                    response.phone = provider.phone;
                                                    response.login_by = provider.login_by;
                                                    response.is_documents_expired = provider.is_documents_expired;
                                                    response.account_id = provider.account_id;
                                                    response.bank_id = provider.bank_id;
                                                    response.referral_code = provider.referral_code;
                                                    response.city = provider.city;
                                                    response.is_referral = provider.is_referral;
                                                    response.country = provider.country;
                                                    response.rate = provider.rate;
                                                    response.rate_count = provider.rate_count;
                                                    response.token = provider.token;
                                                    response.is_vehicle_document_uploaded = provider.is_vehicle_document_uploaded;
                                                    response.service_type = provider.service_type;
                                                    response.admintypeid = provider.admintypeid;
                                                    response.is_available = provider.is_available;
                                                    response.is_active = provider.is_active;
                                                    response.is_partner_approved_by_admin = provider.is_partner_approved_by_admin;
                                                    response.picture = provider.picture;
                                                    response.wallet_currency_code = provider.wallet_currency_code;
                                                    response.country_detail = {"is_referral": country.is_provider_referral}

                                                    res.json({
                                                        success: true,
                                                        message: success_messages.MESSAGE_CODE_FOR_PROVIDER_YOU_REGISTERED_SUCCESSFULLY,
                                                        provider_detail: response,
                                                        phone_number_min_length: country.phone_number_min_length,
                                                        phone_number_length: country.phone_number_length

                                                    });
                                                }, (err) => {
                                                    console.log(err);
                                                    res.json({
                                                        success: false,
                                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                    });
                                                });

                                            });
                                        }

                                    });

                                }
                            }, (err) => {
                                console.log(err);
                                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                            });

                        }
                    }, (err) => {
                        console.log(err);
                        res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                    });
                }
            }, (err) => {
                console.log(err);
                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

exports.provider_login = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'email', type: 'string'},{name: 'password', type: 'string'}], function (response) {
        if (response.success) {
            if (req.body.login_by == "manual") {
                var email = req.body.email;
                Provider.findOne({email: email}).then((provider) => {

                    if (!provider) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_NOT_A_REGISTERED_PROVIDER});
                    } else if (provider) {

                        var crypto = require('crypto');
                        var password = req.body.password;
                        var hash = crypto.createHash('md5').update(password).digest('hex');
                        if (provider.password != hash) {
                            res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_PASSWORD});
                        } else {
                            Country.findOne({countryname: provider.country}).then((country) => {
                                Provider_Document.find({
                                    provider_id: provider._id,
                                    option: 1,
                                    is_uploaded: 0
                                }).then((providerdocument) => {

                                    if (providerdocument.length > 0) {
                                        provider.is_document_uploaded = 0;
                                    } else {
                                        provider.is_document_uploaded = 1;
                                    }

                                    var token = utils.tokenGenerator(32);
                                    provider.token = token;
                                    var device_token = "";
                                    var device_type = "";
                                    provider.token = token;
                                    if (provider.device_token != "" && provider.device_token != req.body.device_token) {
                                        device_token = provider.device_token;
                                        device_type = provider.device_type;
                                    }


                                    provider.app_version = req.body.app_version;
                                    provider.device_token = req.body.device_token;
                                    provider.device_type = req.body.device_type;
                                    provider.login_by = req.body.login_by;
                                    Partner.findOne({_id: provider.provider_type_id}, function (err, partnerdata) {

                                        var partner_email = "";
                                        if (partnerdata) {
                                            partner_email = partnerdata.email;
                                        }
                                        provider.save().then(() => {
                                            if (device_token != "") {
                                                utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_PROVIDER_LOGIN_IN_OTHER_DEVICE, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                            }
                                            var response = {};
                                            response.first_name = provider.first_name;
                                            response.last_name = provider.last_name;
                                            response.email = provider.email;
                                            response.country_phone_code = provider.country_phone_code;
                                            response.is_document_uploaded = provider.is_document_uploaded;
                                            response.address = provider.address;
                                            response.is_approved = provider.is_approved;
                                            response._id = provider._id;
                                            response.social_ids = provider.social_ids;
                                            response.social_unique_id = provider.social_unique_id;
                                            response.phone = provider.phone;
                                            response.login_by = provider.login_by;
                                            response.is_documents_expired = provider.is_documents_expired;
                                            response.account_id = provider.account_id;
                                            response.bank_id = provider.bank_id;
                                            response.is_referral = provider.is_referral;
                                            response.referral_code = provider.referral_code;
                                            response.city = provider.city;
                                            response.country = provider.country;
                                            response.rate = provider.rate;
                                            response.rate_count = provider.rate_count;
                                            response.token = provider.token;
                                            response.is_vehicle_document_uploaded = provider.is_vehicle_document_uploaded;
                                            response.service_type = provider.service_type;
                                            response.admintypeid = provider.admintypeid;
                                            response.is_available = provider.is_available;
                                            response.is_active = provider.is_active;
                                            response.is_partner_approved_by_admin = provider.is_partner_approved_by_admin;
                                            response.picture = provider.picture;
                                            response.wallet_currency_code = provider.wallet_currency_code;

                                            Country.findOne({countryphonecode: provider.country_phone_code}).then((country) => {
                                                if (country) {
                                                    response.country_detail = {"is_referral": country.is_provider_referral}
                                                } else {
                                                    response.country_detail = {"is_referral": false}
                                                }

                                                if(provider.is_trip.length>0){
                                                    Trip.findOne({_id: provider.is_trip[0]}).then((trip_detail)=>{
                                                        if(trip_detail){
                                                            var start_time = trip_detail.updated_at;
                                                            var end_time = new Date();
                                                            var res_sec = utils.getTimeDifferenceInSecond(end_time, start_time);
                                                            var provider_timeout = setting_detail.provider_timeout;
                                                            var time_left_to_responds_trip = provider_timeout - res_sec;
                                                            User.findOne({_id: trip_detail.user_id}, function(error, user_detail){
                                                                var trip_details = {
                                                                    trip_id : provider.is_trip[0],
                                                                    user_id : trip_detail.user_id,
                                                                    is_provider_accepted : trip_detail.is_provider_accepted,
                                                                    is_provider_status : trip_detail.is_provider_status,
                                                                    trip_type : trip_detail.trip_type,
                                                                    source_address : trip_detail.source_address,
                                                                    destination_address : trip_detail.destination_address,
                                                                    sourceLocation : trip_detail.sourceLocation,
                                                                    destinationLocation : trip_detail.destinationLocation,
                                                                    is_trip_end : trip_detail.is_trip_end,
                                                                    time_left_to_responds_trip : time_left_to_responds_trip,
                                                                    user: {
                                                                        first_name: user_detail.first_name,
                                                                        last_name: user_detail.last_name,
                                                                        phone: user_detail.phone,
                                                                        country_phone_code: user_detail.country_phone_code,
                                                                        rate: user_detail.rate,
                                                                        rate_count: user_detail.rate_count,
                                                                        picture: user_detail.picture
                                                                    }
                                                                }
                                                                res.json({success: true, provider_detail: response, trip_detail: trip_details,
                                                                    phone_number_min_length: country.phone_number_min_length,
                                                                    phone_number_length: country.phone_number_length
                                                                });   
                                                            });
                                                        } else {
                                                            res.json({success: true, provider_detail: response,
                                                                phone_number_min_length: country.phone_number_min_length,
                                                                phone_number_length: country.phone_number_length
                                                            });   
                                                        }
                                                    });
                                                } else {
                                                    res.json({success: true, provider_detail: response,
                                                        phone_number_min_length: country.phone_number_min_length,
                                                        phone_number_length: country.phone_number_length
                                                    });   
                                                }
                                            });

                                        }, (err) => {
                                            console.log(err);
                                            res.json({
                                            success: false,
                                            error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                        });
                                        });
                                    });
                                });
                            });
                        }

                    }

                }, (err) => {
                    console.log(err);
                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                });
            } else {

                Provider.findOne({social_unique_id: req.body.social_unique_id}).then((provider) => {

                    if (!provider) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_NOT_A_REGISTERED_PROVIDER});
                    } else if (provider) {

                        Country.findOne({countryname: provider.country}).then((country) => {
                            Provider_Document.find({
                                provider_id: provider._id,
                                option: 1,
                                is_uploaded: 0
                            }).then((providerdocument) => {

                                if (providerdocument.length > 0) {
                                    provider.is_document_uploaded = 0;
                                } else {
                                    provider.is_document_uploaded = 1;
                                }

                                var token = utils.tokenGenerator(32);
                                provider.token = token;
                                var device_token = "";
                                var device_type = "";
                                provider.token = token;
                                if (provider.device_token != "" && provider.device_token != req.body.device_token) {
                                    device_token = provider.device_token;
                                    device_type = provider.device_type;
                                }


                                provider.app_version = req.body.app_version;
                                provider.device_token = req.body.device_token;
                                provider.device_type = req.body.device_type;
                                provider.login_by = req.body.login_by;
                                Partner.findOne({_id: provider.provider_type_id}, function (err, partnerdata) {

                                        var partner_email = "";
                                        if (partnerdata) {
                                            partner_email = partnerdata.email;
                                        }
                                        provider.save().then(() => {
                                            if (device_token != "") {
                                                utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_PROVIDER_LOGIN_IN_OTHER_DEVICE, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                            }
                                            var response = {};
                                            response.first_name = provider.first_name;
                                            response.last_name = provider.last_name;
                                            response.email = provider.email;
                                            response.country_phone_code = provider.country_phone_code;
                                            response.is_document_uploaded = provider.is_document_uploaded;
                                            response.address = provider.address;
                                            response.is_approved = provider.is_approved;
                                            response._id = provider._id;
                                            response.social_ids = provider.social_ids;
                                            response.social_unique_id = provider.social_unique_id;
                                            response.phone = provider.phone;
                                            response.login_by = provider.login_by;
                                            response.is_referral = provider.is_referral;
                                            response.referral_code = provider.referral_code;
                                            response.is_documents_expired = provider.is_documents_expired;
                                            response.account_id = provider.account_id;
                                            response.bank_id = provider.bank_id;
                                            response.city = provider.city;
                                            response.country = provider.country;
                                            response.rate = provider.rate;
                                            response.rate_count = provider.rate_count;
                                            response.token = provider.token;
                                            response.is_vehicle_document_uploaded = provider.is_vehicle_document_uploaded;
                                            response.service_type = provider.service_type;
                                            response.admintypeid = provider.admintypeid;
                                            response.is_available = provider.is_available;
                                            response.is_active = provider.is_active;
                                            response.is_partner_approved_by_admin = provider.is_partner_approved_by_admin;
                                            response.picture = provider.picture;
                                            response.wallet_currency_code = provider.wallet_currency_code;
                                            if (country) {
                                                response.country_detail = {"is_referral": country.is_provider_referral}
                                            } else {
                                                response.country_detail = {"is_referral": false}
                                            }

                                            if(provider.is_trip.length>0){
                                                Trip.findOne({_id: provider.is_trip[0]}).then((trip_detail)=>{
                                                    if(trip_detail){
                                                        var start_time = trip_detail.updated_at;
                                                        var end_time = new Date();
                                                        var res_sec = utils.getTimeDifferenceInSecond(end_time, start_time);
                                                        var provider_timeout = setting_detail.provider_timeout;
                                                        var time_left_to_responds_trip = provider_timeout - res_sec;
                                                        User.findOne({_id: trip_detail.user_id}, function(error, user_detail){
                                                            var trip_details = {
                                                                trip_id : provider.is_trip[0],
                                                                user_id : trip_detail.user_id,
                                                                is_provider_accepted : trip_detail.is_provider_accepted,
                                                                is_provider_status : trip_detail.is_provider_status,
                                                                trip_type : trip_detail.trip_type,
                                                                source_address : trip_detail.source_address,
                                                                destination_address : trip_detail.destination_address,
                                                                sourceLocation : trip_detail.sourceLocation,
                                                                destinationLocation : trip_detail.destinationLocation,
                                                                is_trip_end : trip_detail.is_trip_end,
                                                                time_left_to_responds_trip : time_left_to_responds_trip,
                                                                user: {
                                                                    first_name: user_detail.first_name,
                                                                    last_name: user_detail.last_name,
                                                                    phone: user_detail.phone,
                                                                    country_phone_code: user_detail.country_phone_code,
                                                                    rate: user_detail.rate,
                                                                    rate_count: user_detail.rate_count,
                                                                    picture: user_detail.picture
                                                                }
                                                            }
                                                            res.json({success: true, provider_detail: response, trip_detail: trip_details,
                                                                phone_number_min_length: country.phone_number_min_length,
                                                                phone_number_length: country.phone_number_length
                                                            });   
                                                        });
                                                    } else {
                                                        res.json({success: true, provider_detail: response,
                                                            phone_number_min_length: country.phone_number_min_length,
                                                            phone_number_length: country.phone_number_length
                                                        });   
                                                    }
                                                });
                                            } else {
                                                res.json({success: true, provider_detail: response,
                                                    phone_number_min_length: country.phone_number_min_length,
                                                    phone_number_length: country.phone_number_length
                                                });   
                                            }

                                        }, (err) => {
                                            console.log(err);
                                            res.json({
                                            success: false,
                                            error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                        });
                                    });
                                });
                            });
                        });
                    }
                }, (err) => {
                    console.log(err);
                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                });
            }
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

/////// get  provider Info  /////////////
exports.get_provider_info = function (req, res) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (!provider) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_NOT_GET_YOUR_DETAIL});
                } else {

                    var index = provider.vehicle_detail.findIndex((x) => x.is_selected == true)

                    provider.car_model = provider.vehicle_detail[index].model;
                    provider.car_number = provider.vehicle_detail[index].plate_no;
                    res.json({
                        success: true,
                        message: success_messages.MESSAGE_CODE_FOR_PROVIDER_GET_YOUR_DETAIL, provider: provider
                    });
                }
            }, (err) => {
                console.log(err);
                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};
exports.get_provider_detail = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        var partner_detail = {
                            wallet: 0,
                        };

                        Citytype.findOne({_id: provider.service_type}).then((type_detail) => {
                            Partner.findOne({_id: provider.provider_type_id}).then((partner) => {
                                    if (partner) {
                                        partner_detail = {
                                            wallet: partner.wallet,
                                        };
                                    }

                                if (type_detail) {
                                
                                    Country.findOne({_id: type_detail.countryid}).then((country_data) => {
                                        City.findOne({_id: type_detail.cityid}).then((city_data) => {
                                            Type.findOne({_id: type_detail.typeid}).then((type_data) => {
                                                var type_image_url = type_data.type_image_url;
                                                var currency = country_data.currencysign;
                                                var country_id = country_data._id;
                                                var is_auto_transfer = country_data.is_auto_transfer;
                                                var unit = city_data.unit;
                                                var is_check_provider_wallet_amount_for_received_cash_request = city_data.is_check_provider_wallet_amount_for_received_cash_request;
                                                var provider_min_wallet_amount_set_for_received_cash_request = city_data.provider_min_wallet_amount_set_for_received_cash_request;


                                                var type_details = {
                                                    typeid: type_data._id,
                                                    typename: type_data.typename,
                                                    base_price: type_detail.base_price,
                                                    type_image_url: type_image_url,
                                                    map_pin_image_url: type_data.map_pin_image_url,
                                                    base_price_distance: type_detail.base_price_distance,
                                                    distance_price: type_detail.price_per_unit_distance,
                                                    time_price: type_detail.price_for_total_time,
                                                    currency: currency,
                                                    is_auto_transfer: is_auto_transfer,
                                                    country_id: country_id,
                                                    unit: unit,
                                                    is_check_provider_wallet_amount_for_received_cash_request: is_check_provider_wallet_amount_for_received_cash_request,
                                                    provider_min_wallet_amount_set_for_received_cash_request: provider_min_wallet_amount_set_for_received_cash_request,
                                                    server_time: new Date(),
                                                    is_surge_hours: type_detail.is_surge_hours,
                                                    surge_start_hour: type_detail.surge_start_hour,
                                                    surge_end_hour: type_detail.surge_end_hour,
                                                    timezone: city_data.timezone
                                                }
                                                provider.country_detail = {is_referral: country_data.is_provider_referral}

                                                res.json({
                                                    success: true,
                                                    message: success_messages.MESSAGE_CODE_FOR_PROVIDER_GET_YOUR_DETAIL,
                                                    provider: provider,
                                                    type_details: type_details,
                                                    partner_detail: partner_detail
                                                });

                                            });
                                        });
                                    });

                                
                                } else {
                                    res.json({
                                        success: true,
                                        partner_detail: partner_detail,
                                        message: success_messages.MESSAGE_CODE_FOR_PROVIDER_GET_YOUR_DETAIL,
                                        provider: provider
                                    });
                                }
                            });

                        });
                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});

                }
            }, (err) => {
                console.log(err);
                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

exports.provider_heat_map = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {

                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {

                        var now = new Date();
                        now.setHours(now.getHours() - 1);

                        Trip.find({
                            service_type_id: provider.service_type,
                            is_trip_completed: 1,
                            created_at: {$gte: now}
                        }, {_id: 0, sourceLocation: 1}).then((trip_data) => {

                            if (trip_data && trip_data.length > 0) {
                                res.json({success: true, pickup_locations: trip_data});
                            } else {
                                res.json({success: false})
                            }
                        }, (err) => {
                            console.log(err);
                            res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                        })
                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});

                }
            }, (err) => {
                console.log(err);
                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

// update provider
exports.provider_update = function (req, res) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'},{name: 'first_name', type: 'string'},{name: 'last_name', type: 'string'},
        {name: 'phone', type: 'string'},{name: 'country_phone_code', type: 'string'},], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {

                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        if (provider.login_by !== "manual") {
                            
                            if (req.files != undefined && req.files.length > 0) {
                                utils.deleteImageFromFolder(provider.picture, 2);
                                var image_name = provider._id + utils.tokenGenerator(4);
                                var url = utils.getImageFolderPath(req, 2) + image_name + '.jpg';
                                provider.picture = url;
                                utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 2);
                            }

                            var first_name = req.body.first_name;
                            first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
                            var last_name = req.body.last_name;
                            last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);
                            provider.first_name = first_name;
                            provider.last_name = last_name;
                            provider.country_phone_code = req.body.country_phone_code;
                            provider.phone = req.body.phone;
                            provider.bio = req.body.bio;
                            provider.gender = req.body.gender;
                            provider.address = req.body.address;
                            provider.zipcode = req.body.zipcode;
                            provider.languages = req.body.languages;
                            provider.received_trip_from_gender = req.body.received_trip_from_gender;
                            provider.save().then(() => {

                                var response = {};
                                response.first_name = provider.first_name;
                                response.last_name = provider.last_name;
                                response.email = provider.email;
                                response.country_phone_code = provider.country_phone_code;
                                response.is_document_uploaded = provider.is_document_uploaded;
                                response.address = provider.address;
                                response.is_approved = provider.is_approved;
                                response._id = provider._id;
                                response.social_ids = provider.social_ids;
                                response.social_unique_id = provider.social_unique_id;
                                response.phone = provider.phone;
                                response.login_by = provider.login_by;
                                response.is_documents_expired = provider.is_documents_expired;
                                response.account_id = provider.account_id;
                                response.bank_id = provider.bank_id;
                                response.city = provider.city;
                                response.country = provider.country;
                                response.rate = provider.rate;
                                response.referral_code = provider.referral_code;
                                response.rate_count = provider.rate_count;
                                response.is_referral = provider.is_referral;
                                response.token = provider.token;
                                response.is_vehicle_document_uploaded = provider.is_vehicle_document_uploaded;
                                response.service_type = provider.service_type;
                                response.admintypeid = provider.admintypeid;
                                response.is_available = provider.is_available;
                                response.is_active = provider.is_active;
                                response.is_partner_approved_by_admin = provider.is_partner_approved_by_admin;
                                response.picture = provider.picture;

                                res.json({
                                    success: true,
                                    message: success_messages.MESSAGE_CODE_FOR_PROVIDER_YOUR_PROFILE_UPDATED_SUCCESSFULLY,
                                    provider_detail: response
                                });
                            }, (err) => {
                                console.log(err);
                                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                            });
                        } else {
                            var crypto = require('crypto');
                            var old_password = req.body.old_password;
                            var hash_old = crypto.createHash('md5').update(old_password).digest('hex');
                            var crypto = require('crypto');
                            var new_password = req.body.new_password;

                            if (provider.password == hash_old) {

                                if (new_password != '') {
                                    var hash_new = crypto.createHash('md5').update(new_password).digest('hex');
                                    provider.password = hash_new;
                                }
                                if (req.files != undefined && req.files.length > 0) {
                                    utils.deleteImageFromFolder(provider.picture, 2);
                                    var image_name = provider._id + utils.tokenGenerator(4);
                                    var url = utils.getImageFolderPath(req, 2) + image_name + '.jpg';
                                    provider.picture = url;

                                    utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 2);

                                }

                                var first_name = req.body.first_name;
                                first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
                                var last_name = req.body.last_name;
                                last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);


                                provider.first_name = first_name;
                                provider.last_name = last_name;
                                provider.country_phone_code = req.body.country_phone_code;
                                provider.phone = req.body.phone;
                                provider.bio = req.body.bio;
                                provider.gender = req.body.gender;
                                provider.address = req.body.address;
                                provider.zipcode = req.body.zipcode;
                                provider.languages = req.body.languages;
                                provider.received_trip_from_gender = req.body.received_trip_from_gender;
                                provider.save().then(() => {
                                    var response = {};
                                    response.first_name = provider.first_name;
                                    response.last_name = provider.last_name;
                                    response.email = provider.email;
                                    response.country_phone_code = provider.country_phone_code;
                                    response.is_document_uploaded = provider.is_document_uploaded;
                                    response.address = provider.address;
                                    response.is_approved = provider.is_approved;
                                    response._id = provider._id;
                                    response.social_ids = provider.social_ids;
                                    response.social_unique_id = provider.social_unique_id;
                                    response.phone = provider.phone;
                                    response.login_by = provider.login_by;
                                    response.is_documents_expired = provider.is_documents_expired;
                                    response.account_id = provider.account_id;
                                    response.bank_id = provider.bank_id;
                                    response.city = provider.city;
                                    response.country = provider.country;
                                    response.rate = provider.rate;
                                    response.rate_count = provider.rate_count;
                                    response.token = provider.token;
                                    response.is_vehicle_document_uploaded = provider.is_vehicle_document_uploaded;
                                    response.service_type = provider.service_type;
                                    response.admintypeid = provider.admintypeid;
                                    response.is_available = provider.is_available;
                                    response.is_active = provider.is_active;
                                    response.is_partner_approved_by_admin = provider.is_partner_approved_by_admin;
                                response.picture = provider.picture;
                                    
                                    res.json({
                                        success: true,
                                        message: success_messages.MESSAGE_CODE_FOR_PROVIDER_YOUR_PROFILE_UPDATED_SUCCESSFULLY,
                                        provider_detail: response
                                    });
                                }, (err) => {
                                    console.log(err);
                                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                                });

                            } else {
                                res.json({
                                    success: false,
                                    error_code: error_message.ERROR_CODE_YOUR_PASSWORD_IS_NOT_MATCH_WITH_OLD_PASSWORD
                                });
                            }
                        }


                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});

                }
            }, (err) => {
                console.log(err);
                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};


exports.update_location = function (req, res) {
    console.log('update location : '+ new Date().toString())
    utils.check_request_params(req.body, [], function (response) {

        if (response.success && req.body.location && req.body.location.length>0) {
            var location_unique_id = 0;
            if (req.body.location_unique_id != undefined) {
                location_unique_id = req.body.location_unique_id;
            }
            req.body.latitude = req.body.location[0][0]
            req.body.longitude = req.body.location[0][1]
           
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({
                            success: false,
                            error_code: error_message.ERROR_CODE_INVALID_TOKEN
                        });
                    } else {
                        var trip_id = req.body.trip_id;
                        var now = new Date();
                        if(!trip_id){
                            trip_id = null;
                        }
                        Trip.findOne({
                            _id: trip_id,
                            confirmed_provider: req.body.provider_id,
                            is_trip_completed: 0,
                            is_trip_cancelled: 0,
                            is_trip_end: 0
                        }).then((trip) => {

                            if (!trip) {

                                Citytype.findOne({_id: provider.service_type}, function(error, city_type){
                                    if(city_type){
                                        if(!provider.in_zone_queue){
                                            CityZone.find({cityid: provider.cityid, city_type:{$in: city_type.zone_ids}}).then((city_zone_list)=>{
                                                if(city_zone_list && city_zone_list.length>0){
                                                    var i = 0;
                                                    city_zone_list.forEach(function(city_zone_data){
                                                        var geo = geolib.isPointInside(
                                                            {latitude:req.body.latitude, longitude: req.body.longitude},
                                                            city_zone_data.kmlzone
                                                        );

                                                        
                                                        i++;
                                                        if(i==city_zone_list.length){

                                                            if(geo){
                                                                provider.in_zone_queue = true;
                                                                provider.zone_queue_id = city_zone_data._id;
                                                                var index = city_type.total_provider_in_zone_queue.findIndex((x)=>(x.zone_queue_id).toString() == (city_zone_data._id).toString())
                                                                if(index == -1){
                                                                    city_type.total_provider_in_zone_queue.push({zone_queue_id: city_zone_data._id, total_provider_in_zone_queue: 1})
                                                                    provider.zone_queue_no = 1;
                                                                    
                                                                } else {
                                                                    city_type.total_provider_in_zone_queue[index].total_provider_in_zone_queue++;
                                                                    provider.zone_queue_no = city_type.total_provider_in_zone_queue[index].total_provider_in_zone_queue;
                                                                }
                                                                city_type.markModified('total_provider_in_zone_queue');
                                                                city_type.save();
                                                            }

                                                            provider.providerPreviousLocation = provider.providerLocation;
                                                            provider.providerLocation = [req.body.latitude, req.body.longitude];
                                                            provider.bearing = req.body.bearing;
                                                            provider.location_updated_time = now;
                                                            provider.save().then(() => {
                                                                res.json({
                                                                    success: true,
                                                                    in_zone_queue: provider.in_zone_queue,
                                                                    zone_queue_no: provider.zone_queue_no,
                                                                    location_unique_id: location_unique_id,
                                                                    providerLocation: provider.providerLocation

                                                                });
                                                            }, (err) => {
                                                                console.log(err);
                                                                res.json({
                                                                    success: false,
                                                                    error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                                });
                                                            });
                                                        }

                                                    })
                                                } else {
                                                    provider.providerPreviousLocation = provider.providerLocation;
                                                    provider.providerLocation = [req.body.latitude, req.body.longitude];
                                                    provider.bearing = req.body.bearing;
                                                    provider.location_updated_time = now;
                                                    provider.save().then(() => {
                                                        res.json({
                                                            success: true,
                                                            in_zone_queue: provider.in_zone_queue,
                                                            zone_queue_no: provider.zone_queue_no,
                                                            location_unique_id: location_unique_id,
                                                            providerLocation: provider.providerLocation

                                                        });
                                                    }, (err) => {
                                                        console.log(err);
                                                        res.json({
                                                            success: false,
                                                            error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                        });
                                                    });
                                                }
                                            }, (err) => {
                                                provider.providerPreviousLocation = provider.providerLocation;
                                                provider.providerLocation = [req.body.latitude, req.body.longitude];
                                                provider.bearing = req.body.bearing;
                                                provider.location_updated_time = now;
                                                provider.save().then(() => {
                                                    res.json({
                                                        success: true,
                                                        in_zone_queue: provider.in_zone_queue,
                                                        zone_queue_no: provider.zone_queue_no,
                                                        location_unique_id: location_unique_id,
                                                        providerLocation: provider.providerLocation

                                                    });
                                                }, (err) => {
                                                    console.log(err);
                                                    res.json({
                                                        success: false,
                                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                    });
                                                });
                                            });
                                        
                                        } else {
                                            CityZone.findOne({_id: provider.zone_queue_id}, function(error, city_zone_data){
                                                if(city_zone_data){
                                                    var geo = geolib.isPointInside(
                                                        {latitude:req.body.latitude, longitude: req.body.longitude},
                                                        city_zone_data.kmlzone
                                                    );
                                                    if(!geo){
                                                        var index = city_type.total_provider_in_zone_queue.findIndex((x)=>(x.zone_queue_id).toString() == (city_zone_data._id).toString())
                                                        if(index == -1){
                                                            city_type.total_provider_in_zone_queue.push({zone_queue_id: zone_queue_list._id, total_provider_in_zone_queue: 0})
                                                            
                                                        } else {
                                                            city_type.total_provider_in_zone_queue[index].total_provider_in_zone_queue--;
                                                            
                                                        }
                                                        city_type.markModified('total_provider_in_zone_queue');
                                                        city_type.save();
                                                        Provider.update({zone_queue_id: provider.zone_queue_id, zone_queue_no: {$gt: provider.zone_queue_no}, _id:{$ne: provider._id}} ,{'$inc': {zone_queue_no: -1}}, {multi: true}, function(error, providers){
                                                            console.log(providers)
                                                        });
                                                        provider.zone_queue_no = 0;
                                                        provider.in_zone_queue = false;
                                                        provider.zone_queue_id = null;

                                                        provider.providerPreviousLocation = provider.providerLocation;
                                                        provider.providerLocation = [req.body.latitude, req.body.longitude];
                                                        provider.bearing = req.body.bearing;
                                                        provider.location_updated_time = now;
                                                        provider.save().then(() => {
                                                            res.json({
                                                                success: true,
                                                                in_zone_queue: provider.in_zone_queue,
                                                                    zone_queue_no: provider.zone_queue_no,
                                                                location_unique_id: location_unique_id,
                                                                providerLocation: provider.providerLocation

                                                            });
                                                        }, (err) => {
                                                            console.log(err);
                                                            res.json({
                                                                success: false,
                                                                error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                            });
                                                        });

                                                    } else {
                                                        provider.providerPreviousLocation = provider.providerLocation;
                                                        provider.providerLocation = [req.body.latitude, req.body.longitude];
                                                        provider.bearing = req.body.bearing;
                                                        provider.location_updated_time = now;
                                                        provider.save().then(() => {
                                                            res.json({
                                                                success: true,
                                                                in_zone_queue: provider.in_zone_queue,
                                                                    zone_queue_no: provider.zone_queue_no,
                                                                location_unique_id: location_unique_id,
                                                                providerLocation: provider.providerLocation

                                                            });
                                                        }, (err) => {
                                                            console.log(err);
                                                            res.json({
                                                                success: false,
                                                                error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                            });
                                                        });
                                                    }

                                                } else {
                                                    provider.providerPreviousLocation = provider.providerLocation;
                                                    provider.providerLocation = [req.body.latitude, req.body.longitude];
                                                    provider.bearing = req.body.bearing;
                                                    provider.location_updated_time = now;
                                                    provider.save().then(() => {
                                                        res.json({
                                                            success: true,
                                                            in_zone_queue: provider.in_zone_queue,
                                                            zone_queue_no: provider.zone_queue_no,
                                                            location_unique_id: location_unique_id,
                                                            providerLocation: provider.providerLocation

                                                        });
                                                    }, (err) => {
                                                        console.log(err);
                                                        res.json({
                                                            success: false,
                                                            error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                        });
                                                    });
                                                }
                                            })
                                        }
                                    } else {
                                        provider.providerPreviousLocation = provider.providerLocation;
                                        provider.providerLocation = [req.body.latitude, req.body.longitude];
                                        provider.bearing = req.body.bearing;
                                        provider.location_updated_time = now;
                                        provider.save().then(() => {
                                            res.json({
                                                success: true,
                                                in_zone_queue: provider.in_zone_queue,
                                                zone_queue_no: provider.zone_queue_no,
                                                location_unique_id: location_unique_id,
                                                providerLocation: provider.providerLocation

                                            });
                                        }, (err) => {
                                            console.log(err);
                                            res.json({
                                                success: false,
                                                error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                            });
                                        });
                                    }
                                });
                            } else {
                                var unit_set = trip.unit;
                                var is_provider_status = trip.is_provider_status

                                if (provider.providerLocation[0] == undefined || provider.providerLocation[1] == undefined || provider.providerLocation[0] == 0 || provider.providerLocation[1] == 0) {
                                    var location = req.body.location;
                                    provider.providerPreviousLocation = provider.providerLocation;
                                    provider.providerLocation = [Number(req.body.location[location.length - 1][0]), Number(req.body.location[location.length - 1][1])];
                                    provider.bearing = req.body.bearing;
                                    provider.location_updated_time = now;
                                    trip.provider_providerPreviousLocation = provider.providerPreviousLocation;
                                    trip.providerLocation = [Number(req.body.location[location.length - 1][0]), Number(req.body.location[location.length - 1][1])];
                                    trip.bearing = req.body.bearing;
                                    Trip.findByIdAndUpdate(trip._id, trip, (trip_detail)=>{

                                    });
                                    provider.save().then(() => {
                                        res.json({
                                            success: true,
                                            location_unique_id: location_unique_id,
                                            providerLocation: provider.providerLocation,
                                            total_distance: trip.total_distance,
                                            total_time: trip.total_time

                                        });
                                    }, (err) => {
                                        console.log(err);
                                        res.json({
                                    success: false,
                                    error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                });

                                    });
                                } else {
                                    
                                    console.log('trip.total_time: '+trip.total_time)

                                    var all_temp_locations = req.body.location;
                                    var all_locations = [];
                                    var locations = [];
                                    TripLocation.findOne({tripID: trip_id}).then((tripLocation) => {

                                        if (trip.is_provider_status == 6) {

                                            if (trip.provider_trip_start_time != null) {
                                                var minutes = utils.getTimeDifferenceInMinute(now, trip.provider_trip_start_time);
                                                trip.total_time = minutes;
                                                Trip.findByIdAndUpdate(trip._id, {total_time: minutes}, (trip_detail)=>{

                                                });
                                            }
                                    
                                            var store_locations = tripLocation.startTripToEndTripLocations;
                                            var store_locations_size = store_locations.length;
                                            var locations_size = all_temp_locations.length;

                                            if (locations_size > 1) {

                                                for (var i = 0; i < locations_size; i++) {
                                                    is_add = true;
                                                    for (var j = i + 1; j < locations_size; j++) {
                                                        if (Number(all_temp_locations[i][0]) == Number(all_temp_locations[j][0]) && Number(all_temp_locations[i][1]) == Number(all_temp_locations[j][1])) {
                                                            is_add = false;
                                                            break;
                                                        }
                                                    }
                                                    if (is_add) {
                                                        all_locations.push(all_temp_locations[i]);
                                                    }
                                                }
                                            } else {
                                                all_locations = all_temp_locations;
                                            }

                                            locations_size = all_locations.length;

                                            var is_add = false;
                                            for (var i = 0; i < locations_size; i++) {
                                                is_add = true;
                                                for (var j = 0; j < store_locations_size; j++) {
                                                    if (Number(all_locations[i][0]) == Number(store_locations[j][0]) && Number(all_locations[i][1]) == Number(store_locations[j][1])) {
                                                        is_add = false;
                                                        break;
                                                    }
                                                }
                                                if (is_add) {
                                                    locations.push(all_locations[i]);
                                                }
                                            }
                                        } else {
                                            locations = all_temp_locations;
                                        }


                                        if (locations.length > 0) {
                                            var providerPreviousLocation = provider.providerPreviousLocation;
                                            var providerLocation = provider.providerLocation;

                                            var total_distance = trip.total_distance;
                                            var location_updated_time = provider.location_updated_time;
                                            var temp_location_updated_time = 0;
                                            var temp_diff = 0;
                                            var now = null;
                                            var max_distance = 0.05;
                                            var distance_diff = 0;
                                            var time_diff = 0;
                                            var location = [];

                                            for (var i = 0; i < locations.length; i++) {
                                                now = new Date(Number(locations[i][2]));

                                                providerPreviousLocation = providerLocation;
                                                providerLocation = [locations[i][0], locations[i][1]];

                                                distance_diff = Math.abs(utils.getDistanceFromTwoLocation(providerPreviousLocation, providerLocation));
                                                time_diff = Math.abs(utils.getTimeDifferenceInSecond(location_updated_time, now));

                                                if (temp_location_updated_time > 0) {
                                                    temp_diff = (Number(locations[i][2]) - temp_location_updated_time) / 1000;
                                                }
                                                temp_location_updated_time = Number(locations[i][2]);

                                                if ((distance_diff < max_distance * time_diff && distance_diff > 0.005) || time_diff == 0) {

                                                    location = [Number(providerLocation[0]), Number(providerLocation[1]), time_diff, Number(locations[i][2]), temp_diff];
                                                    switch (trip.is_provider_status) {
                                                        case 2:
                                                            tripLocation.providerStartToStartTripLocations.push(location);
                                                            break;
                                                        case 6:
                                                            tripLocation.startTripToEndTripLocations.push(location);
                                                            break;
                                                        default:
                                                            break;
                                                    }

                                                    location_updated_time = now;
                                                    if (trip.is_provider_status == 6) {
                                                        var td = distance_diff; // km                                                    
                                                        if (unit_set == 0) { /// 0 = mile
                                                            td = td * 0.621371;
                                                        }
                                                        total_distance = +total_distance + +td;
                                                    }
                                                }
                                            }

                                            trip.providerPreviousLocation = providerPreviousLocation;
                                            trip.providerLocation = providerLocation;
                                            trip.total_distance = Number(total_distance.toFixed(2));
                                            Trip.findByIdAndUpdate(trip._id, trip, (trip_detail)=>{

                                            // })
                                            // trip.save().then(() => {

                                                tripLocation.save().then(() => {
                                                    res.json({
                                                        success: true,
                                                        location_unique_id: location_unique_id,
                                                        providerLocation: provider.providerLocation,
                                                        total_distance: trip.total_distance,
                                                        total_time: trip.total_time

                                                    });

                                                    if (is_provider_status == 6) {
                                                        utils.set_google_road_api_locations(tripLocation);
                                                    }
                                                }, (err) => {
                                                    res.json({
                                                        success: false,
                                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                    });

                                                });
                                            }, (err) => {
                                                res.json({
                                                    success: false,
                                                    error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                });

                                            });

                                            provider.providerPreviousLocation = providerPreviousLocation;
                                            provider.providerLocation = providerLocation;
                                            provider.location_updated_time = now;
                                            provider.bearing = req.body.bearing;
                                            provider.save();

                                        } else {
                                            res.json({
                                                success: true,
                                                location_unique_id: location_unique_id,
                                                providerLocation: provider.providerLocation,
                                                total_distance: trip.total_distance, total_time: trip.total_time

                                            });
                                        }
                                    });

                                }

                            }
                        }, (err) => {
                                provider.providerPreviousLocation = provider.providerLocation;
                                provider.providerLocation = [req.body.latitude, req.body.longitude];
                                provider.bearing = req.body.bearing;
                                provider.location_updated_time = now;
                                provider.save().then(() => {
                                    res.json({
                                        success: true,
                                        location_unique_id: location_unique_id,
                                        providerLocation: provider.providerLocation

                                    });
                                }, (err) => {
                                    console.log(err);
                                    res.json({
                                    success: false,
                                    error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                });
                                });
                        });

                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});

                }
            });
            
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};


exports.update_location_socket = function (req, res) {
    console.log('update location : '+ new Date().toString())
    utils.check_request_params(req.body, [], function (response) {

        if (response.success && req.body.location && req.body.location.length>0) {
            var location_unique_id = 0;
            if (req.body.location_unique_id != undefined) {
                location_unique_id = req.body.location_unique_id;
            }
            req.body.latitude = req.body.location[0][0]
            req.body.longitude = req.body.location[0][1]
           
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res({
                            success: false,
                            error_code: error_message.ERROR_CODE_INVALID_TOKEN
                        });
                    } else {
                        var trip_id = req.body.trip_id;
                        var now = new Date();
                        if(!trip_id){
                            trip_id = null;
                        }
                        Trip.findOne({
                            _id: trip_id,
                            confirmed_provider: req.body.provider_id,
                            is_trip_completed: 0,
                            is_trip_cancelled: 0,
                            is_trip_end: 0
                        }).then((trip) => {

                            if (!trip) {

                                Citytype.findOne({_id: provider.service_type}, function(error, city_type){
                                    if(city_type){
                                        if(!provider.in_zone_queue){
                                            CityZone.find({cityid: provider.cityid, _id:{$in: city_type.zone_ids}}).then((city_zone_list)=>{
                                                if(city_zone_list && city_zone_list.length>0){
                                                    var i = 0;
                                                        var geo;
                                                        var selected_city_zone_data
                                                    city_zone_list.forEach(function(city_zone_data){

                                                        if(!geo){
                                                            geo = geolib.isPointInside(
                                                                {latitude:req.body.latitude, longitude: req.body.longitude},
                                                                city_zone_data.kmlzone
                                                            );
                                                            selected_city_zone_data = city_zone_data;
                                                        }
                                                        
                                                        i++;
                                                        if(i==city_zone_list.length){

                                                            if(geo){
                                                                provider.in_zone_queue = true;
                                                                provider.zone_queue_id = selected_city_zone_data._id;
                                                                var index = city_type.total_provider_in_zone_queue.findIndex((x)=>(x.zone_queue_id).toString() == (selected_city_zone_data._id).toString())
                                                                if(index == -1){
                                                                    city_type.total_provider_in_zone_queue.push({zone_queue_id: selected_city_zone_data._id, total_provider_in_zone_queue: 1})
                                                                    provider.zone_queue_no = 1;
                                                                    
                                                                } else {
                                                                    city_type.total_provider_in_zone_queue[index].total_provider_in_zone_queue++;
                                                                    provider.zone_queue_no = city_type.total_provider_in_zone_queue[index].total_provider_in_zone_queue;
                                                                }
                                                                city_type.markModified('total_provider_in_zone_queue');
                                                                city_type.save();
                                                            }

                                                            provider.providerPreviousLocation = provider.providerLocation;
                                                            provider.providerLocation = [req.body.latitude, req.body.longitude];
                                                            provider.bearing = req.body.bearing;
                                                            provider.location_updated_time = now;
                                                            provider.save().then(() => {
                                                                res({
                                                                    success: true,
                                                                    in_zone_queue: provider.in_zone_queue,
                                                                    zone_queue_no: provider.zone_queue_no,
                                                                    location_unique_id: location_unique_id,
                                                                    providerLocation: provider.providerLocation

                                                                });
                                                            }, (err) => {
                                                                console.log(err);
                                                                res({
                                                                    success: false,
                                                                    error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                                });
                                                            });
                                                        }

                                                    })
                                                } else {
                                                    provider.providerPreviousLocation = provider.providerLocation;
                                                    provider.providerLocation = [req.body.latitude, req.body.longitude];
                                                    provider.bearing = req.body.bearing;
                                                    provider.location_updated_time = now;
                                                    provider.save().then(() => {
                                                        res({
                                                            success: true,
                                                            in_zone_queue: provider.in_zone_queue,
                                                            zone_queue_no: provider.zone_queue_no,
                                                            location_unique_id: location_unique_id,
                                                            providerLocation: provider.providerLocation

                                                        });
                                                    }, (err) => {
                                                        console.log(err);
                                                        res({
                                                            success: false,
                                                            error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                        });
                                                    });
                                                }
                                            }, (err) => {
                                                provider.providerPreviousLocation = provider.providerLocation;
                                                provider.providerLocation = [req.body.latitude, req.body.longitude];
                                                provider.bearing = req.body.bearing;
                                                provider.location_updated_time = now;
                                                provider.save().then(() => {
                                                    res({
                                                        success: true,
                                                        in_zone_queue: provider.in_zone_queue,
                                                        zone_queue_no: provider.zone_queue_no,
                                                        location_unique_id: location_unique_id,
                                                        providerLocation: provider.providerLocation

                                                    });
                                                }, (err) => {
                                                    console.log(err);
                                                    res({
                                                        success: false,
                                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                    });
                                                });
                                            });
                                        
                                        } else {
                                            CityZone.findOne({_id: provider.zone_queue_id}, function(error, city_zone_data){
                                                if(city_zone_data){
                                                    var geo = geolib.isPointInside(
                                                        {latitude:req.body.latitude, longitude: req.body.longitude},
                                                        city_zone_data.kmlzone
                                                    );
                                                    if(!geo){
                                                        var index = city_type.total_provider_in_zone_queue.findIndex((x)=>(x.zone_queue_id).toString() == (city_zone_data._id).toString())
                                                        if(index == -1){
                                                            city_type.total_provider_in_zone_queue.push({zone_queue_id: city_zone_data._id, total_provider_in_zone_queue: 0})
                                                            
                                                        } else {
                                                            city_type.total_provider_in_zone_queue[index].total_provider_in_zone_queue--;
                                                            if(city_type.total_provider_in_zone_queue[index].total_provider_in_zone_queue < 0){
                                                                city_type.total_provider_in_zone_queue[index].total_provider_in_zone_queue = 0;
                                                            }
                                                            
                                                        }
                                                        city_type.markModified('total_provider_in_zone_queue');
                                                        city_type.save();
                                                        Provider.update({zone_queue_id: provider.zone_queue_id, zone_queue_no: {$gt: provider.zone_queue_no}, _id:{$ne: provider._id}} ,{'$inc': {zone_queue_no: -1}}, {multi: true}, function(error, providers){
                                                            console.log(providers)
                                                        });
                                                        provider.zone_queue_no = Math.max();
                                                        provider.in_zone_queue = false;
                                                        provider.zone_queue_id = null;

                                                        provider.providerPreviousLocation = provider.providerLocation;
                                                        provider.providerLocation = [req.body.latitude, req.body.longitude];
                                                        provider.bearing = req.body.bearing;
                                                        provider.location_updated_time = now;
                                                        provider.save().then(() => {
                                                            res({
                                                                success: true,
                                                                in_zone_queue: provider.in_zone_queue,
                                                                    zone_queue_no: provider.zone_queue_no,
                                                                location_unique_id: location_unique_id,
                                                                providerLocation: provider.providerLocation

                                                            });
                                                        }, (err) => {
                                                            console.log(err);
                                                            res({
                                                                success: false,
                                                                error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                            });
                                                        });

                                                    } else {
                                                        provider.providerPreviousLocation = provider.providerLocation;
                                                        provider.providerLocation = [req.body.latitude, req.body.longitude];
                                                        provider.bearing = req.body.bearing;
                                                        provider.location_updated_time = now;
                                                        provider.save().then(() => {
                                                            res({
                                                                success: true,
                                                                in_zone_queue: provider.in_zone_queue,
                                                                    zone_queue_no: provider.zone_queue_no,
                                                                location_unique_id: location_unique_id,
                                                                providerLocation: provider.providerLocation

                                                            });
                                                        }, (err) => {
                                                            console.log(err);
                                                            res({
                                                                success: false,
                                                                error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                            });
                                                        });
                                                    }

                                                } else {
                                                    provider.providerPreviousLocation = provider.providerLocation;
                                                    provider.providerLocation = [req.body.latitude, req.body.longitude];
                                                    provider.bearing = req.body.bearing;
                                                    provider.location_updated_time = now;
                                                    provider.save().then(() => {
                                                        res({
                                                            success: true,
                                                            in_zone_queue: provider.in_zone_queue,
                                                            zone_queue_no: provider.zone_queue_no,
                                                            location_unique_id: location_unique_id,
                                                            providerLocation: provider.providerLocation

                                                        });
                                                    }, (err) => {
                                                        console.log(err);
                                                        res({
                                                            success: false,
                                                            error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                        });
                                                    });
                                                }
                                            })
                                        }
                                    } else {
                                        provider.providerPreviousLocation = provider.providerLocation;
                                        provider.providerLocation = [req.body.latitude, req.body.longitude];
                                        provider.bearing = req.body.bearing;
                                        provider.location_updated_time = now;
                                        provider.save().then(() => {
                                            res({
                                                success: true,
                                                in_zone_queue: provider.in_zone_queue,
                                                zone_queue_no: provider.zone_queue_no,
                                                location_unique_id: location_unique_id,
                                                providerLocation: provider.providerLocation

                                            });
                                        }, (err) => {
                                            console.log(err);
                                            res({
                                                success: false,
                                                error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                            });
                                        });
                                    }
                                });
                            } else {
                                var unit_set = trip.unit;
                                var is_provider_status = trip.is_provider_status

                                if (provider.providerLocation[0] == undefined || provider.providerLocation[1] == undefined || provider.providerLocation[0] == 0 || provider.providerLocation[1] == 0) {
                                    var location = req.body.location;
                                    provider.providerPreviousLocation = provider.providerLocation;
                                    provider.providerLocation = [Number(req.body.location[location.length - 1][0]), Number(req.body.location[location.length - 1][1])];
                                    provider.bearing = req.body.bearing;
                                    provider.location_updated_time = now;
                                    trip.provider_providerPreviousLocation = provider.providerPreviousLocation;
                                    trip.providerLocation = [Number(req.body.location[location.length - 1][0]), Number(req.body.location[location.length - 1][1])];
                                    trip.bearing = req.body.bearing;
                                    Trip.findByIdAndUpdate(trip._id, trip, (trip_detail)=>{

                                    });
                                    provider.save().then(() => {
                                        res({
                                            success: true,
                                            location_unique_id: location_unique_id,
                                            providerLocation: provider.providerLocation,
                                            total_distance: trip.total_distance,
                                            total_time: trip.total_time

                                        });
                                    }, (err) => {
                                        console.log(err);
                                        res({
                                    success: false,
                                    error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                });

                                    });
                                } else {
                                    if (trip.provider_trip_start_time != null) {
                                        var minutes = utils.getTimeDifferenceInMinute(now, trip.provider_trip_start_time);
                                        trip.total_time = minutes;
                                        Trip.findByIdAndUpdate(trip._id, {total_time: minutes}, (trip_detail)=>{

                                        });
                                    }

                                    var all_temp_locations = req.body.location;
                                    var all_locations = [];
                                    var locations = [];
                                    TripLocation.findOne({tripID: trip_id}).then((tripLocation) => {

                                        if (trip.is_provider_status == 6) {
                                            var store_locations = tripLocation.startTripToEndTripLocations;
                                            var store_locations_size = store_locations.length;
                                            var locations_size = all_temp_locations.length;

                                            if (locations_size > 1) {

                                                for (var i = 0; i < locations_size; i++) {
                                                    is_add = true;
                                                    for (var j = i + 1; j < locations_size; j++) {
                                                        if (Number(all_temp_locations[i][0]) == Number(all_temp_locations[j][0]) && Number(all_temp_locations[i][1]) == Number(all_temp_locations[j][1])) {
                                                            is_add = false;
                                                            break;
                                                        }
                                                    }
                                                    if (is_add) {
                                                        all_locations.push(all_temp_locations[i]);
                                                    }
                                                }
                                            } else {
                                                all_locations = all_temp_locations;
                                            }

                                            locations_size = all_locations.length;

                                            var is_add = false;
                                            for (var i = 0; i < locations_size; i++) {
                                                is_add = true;
                                                for (var j = 0; j < store_locations_size; j++) {
                                                    if (Number(all_locations[i][0]) == Number(store_locations[j][0]) && Number(all_locations[i][1]) == Number(store_locations[j][1])) {
                                                        is_add = false;
                                                        break;
                                                    }
                                                }
                                                if (is_add) {
                                                    locations.push(all_locations[i]);
                                                }
                                            }
                                        } else {
                                            locations = all_temp_locations;
                                        }


                                        if (locations.length > 0) {
                                            var providerPreviousLocation = provider.providerPreviousLocation;
                                            var providerLocation = provider.providerLocation;

                                            var total_distance = trip.total_distance;
                                            var location_updated_time = provider.location_updated_time;
                                            var temp_location_updated_time = 0;
                                            var temp_diff = 0;
                                            var now = null;
                                            var max_distance = 0.05;
                                            var distance_diff = 0;
                                            var time_diff = 0;
                                            var location = [];

                                            for (var i = 0; i < locations.length; i++) {
                                                now = new Date(Number(locations[i][2]));

                                                providerPreviousLocation = providerLocation;
                                                providerLocation = [Number(locations[i][0]), Number(locations[i][1])];

                                                distance_diff = Math.abs(utils.getDistanceFromTwoLocation(providerPreviousLocation, providerLocation));
                                                time_diff = Math.abs(utils.getTimeDifferenceInSecond(location_updated_time, now));

                                                if (temp_location_updated_time > 0) {
                                                    temp_diff = (Number(locations[i][2]) - temp_location_updated_time) / 1000;
                                                }
                                                temp_location_updated_time = Number(locations[i][2]);

                                                if ((distance_diff < max_distance * time_diff && distance_diff > 0.005) || time_diff == 0) {

                                                    location = [Number(providerLocation[0]), Number(providerLocation[1]), time_diff, Number(locations[i][2]), temp_diff];
                                                    switch (trip.is_provider_status) {
                                                        case 2:
                                                            tripLocation.providerStartToStartTripLocations.push(location);
                                                            break;
                                                        case 6:
                                                            tripLocation.startTripToEndTripLocations.push(location);
                                                            break;
                                                        default:
                                                            break;
                                                    }

                                                    location_updated_time = now;
                                                    if (trip.is_provider_status == 6) {
                                                        var td = distance_diff; // km                                                    
                                                        if (unit_set == 0) { /// 0 = mile
                                                            td = td * 0.621371;
                                                        }
                                                        total_distance = +total_distance + +td;
                                                    }
                                                }
                                            }

                                            trip.providerPreviousLocation = providerPreviousLocation;
                                            trip.providerLocation = providerLocation;
                                            trip.total_distance = Number(total_distance.toFixed(2));
                                            Trip.findByIdAndUpdate(trip._id, trip, (trip_detail)=>{

                                            // })
                                            // trip.save().then(() => {

                                                tripLocation.save().then(() => {
                                                    res({
                                                        success: true,
                                                        location_unique_id: location_unique_id,
                                                        providerLocation: provider.providerLocation,
                                                        total_distance: trip.total_distance,
                                                        total_time: trip.total_time

                                                    });

                                                    if (is_provider_status == 6) {
                                                        utils.set_google_road_api_locations(tripLocation);
                                                    }
                                                }, (err) => {
                                                    res({
                                                        success: false,
                                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                    });

                                                });
                                            }, (err) => {
                                                res({
                                                    success: false,
                                                    error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                                });

                                            });

                                            provider.providerPreviousLocation = providerPreviousLocation;
                                            provider.providerLocation = providerLocation;
                                            provider.location_updated_time = now;
                                            provider.bearing = req.body.bearing;
                                            provider.save();

                                        } else {
                                            res({
                                                success: true,
                                                location_unique_id: location_unique_id,
                                                providerLocation: provider.providerLocation,
                                                total_distance: trip.total_distance, total_time: trip.total_time

                                            });
                                        }
                                    });

                                }

                            }
                        }, (err) => {
                                provider.providerPreviousLocation = provider.providerLocation;
                                provider.providerLocation = [req.body.latitude, req.body.longitude];
                                provider.bearing = req.body.bearing;
                                provider.location_updated_time = now;
                                provider.save().then(() => {
                                    res({
                                        success: true,
                                        location_unique_id: location_unique_id,
                                        providerLocation: provider.providerLocation

                                    });
                                }, (err) => {
                                    console.log(err);
                                    res({
                                    success: false,
                                    error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                });
                                });
                        });

                    }
                } else {
                    res({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});

                }
            });
            
        } else {
            res({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};


//// LOGOUT PROVIDER  SERVICE //
exports.logout = function (req, res) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        provider.device_token = "";
                        provider.is_active = 0;

                        provider.save().then(() => {
                            res.json({
                                success: true,
                                message: success_messages.MESSAGE_CODE_FOR_PROVIDER_LOGOUT_SUCCESSFULLY
                            });
                            utils.remove_from_zone_queue(provider);
                        }, (err) => {
                            console.log(err);
                            res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                        });
                        
                        
                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});
                }
            }, (err) => {
                console.log(err);
                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });

            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

////PROVIDER STATE change_provider_status 
exports.change_provider_status = function (req, res) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        City.findOne({_id: provider.cityid}).then((city_detail) => {
                            var city_timezone = city_detail.timezone;
                            var state = Number(req.body.is_active);
                            var start_time = null;
                            var dateNow = new Date();
                            var date1 = moment(dateNow);
                            var tagDate = date1.format(constant_json.DATE_FORMAT_MMDDYYYY);
                            var todayFormat = date1.format(constant_json.DATE_FORMAT_MMM_D_YYYY);


                            var start_time = null;
                            if (provider.is_active != state) {

                                if (state == 1) {
                                    provider.start_online_time = dateNow;
                                    provider.location_updated_time = dateNow;
                                } else {

                                    start_time = provider.start_online_time;
                                    provider.start_online_time = null;

                                }
                                provider.is_active = state;

                                myAnalytics.insert_daily_provider_analytics(city_timezone, provider._id, 0, start_time);


                            }

                        

                                provider.save().then(() => {
                                    utils.remove_from_zone_queue(provider);
                                    res.json({
                                        success: true,
                                        message: success_messages.MESSAGE_CODE_FOR_PROVIDER_YOU_ACTIVE_SUCCESSFULLY,
                                        is_active: provider.is_active
                                    });
                                }, (err) => {
                                    console.log(err);
                                    res.json({
                                            success: false,
                                            error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                        });
                                });
                            });

                    
                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});
                }
            }, (err) => {
                console.log(err);
                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};
//////////////////////////////


/////////// update city type////////////

exports.provider_updatetype = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'},{name: 'typeid', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {

                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        utils.remove_from_zone_queue(provider);
                        var typeid = req.body.typeid;
                        provider.service_type = typeid;

                        Citytype.findOne({_id: typeid}).then((city_type) => {
                            if (city_type) {
                                provider.cityid = city_type.cityid;
                                provider.city = city_type.cityname;

                                // start 2 april //
                                provider.admintypeid = city_type.typeid;
                                // end 2 april //
                                provider.save();
                                res.json({
                                    success: true,
                                    message: success_messages.MESSAGE_CODE_FOR_PROVIDER_TYPE_UPDATE_SUCCESSFULLY
                                });

                            } else {
                                res.json({
                                    success: false,
                                    error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND
                                });
                            }

                        });
                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});
                }
            }, (err) => {
                console.log(err);
                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

exports.getproviderlatlong = function (req, res) {
    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'},{name: 'trip_id', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {

                        Trip.findOne({_id: req.body.trip_id, confirmed_provider: req.body.provider_id}).then((trip) => {

                            if (!trip) {
                                res.json({success: false, error_code: error_message.ERROR_CODE_NO_TRIP});
                            } else {
                                res.json({
                                    success: true,
                                    message: success_messages.MESSAGE_CODE_FOR_PROVIDER_YOU_GET_LATLONG,
                                    providerLocation: provider.providerLocation,
                                    bearing: provider.bearing,
                                    total_distance: trip.total_distance,
                                    total_time: trip.total_time
                                });
                            }

                        });
                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});

                }
            }, (err) => {
                console.log(err);
                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

///////////////   UPDATE DEVICE TOKEN///////
exports.update_device_token = function (req, res) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        provider.device_token = req.body.device_token;
                        provider.save().then(() => {
                            res.json({
                                success: true,
                                message: success_messages.MESSAGE_CODE_FOR_PROVIDER_YOUR_DEVICE_TOKEN_UPDATE_SUCCESSFULLY
                            });
                        }, (err) => {
                            console.log(err);
                            res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                        });
                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});
                }
            }, (err) => {
                console.log(err);
                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

exports.get_provider_vehicle_list = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'}], function (response) {
        if (response.success) {
            var mongoose = require('mongoose');
            var Schema = mongoose.Types.ObjectId;
            var condition = {$match: {"_id": Schema(req.body.provider_id)}};
            var vunwind = {$unwind: "$vehicle_detail"}

            var lookup = {
                $lookup:
                    {
                        from: "types",
                        localField: "vehicle_detail.admin_type_id",
                        foreignField: "_id",
                        as: "type_detail"
                    }
            };
            var unwind = {
                $unwind: {
                    path: "$type_detail",
                    preserveNullAndEmptyArrays: true
                }
            };

            var group = {
                $group: {
                    _id: null,
                    "vehicle_detail": {
                        $push: {
                            is_selected: "$vehicle_detail.is_selected",
                            admin_type_id: "$vehicle_detail.admin_type_id",
                            service_type: "$vehicle_detail.service_type",
                            passing_year: "$vehicle_detail.passing_year",
                            color: "$vehicle_detail.color",
                            model: "$vehicle_detail.model",
                            plate_no: "$vehicle_detail.plate_no",
                            name: "$vehicle_detail.name",
                            _id: "$vehicle_detail._id",
                            is_documents_expired: "$vehicle_detail.is_documents_expired",
                            is_document_uploaded: "$vehicle_detail.is_document_uploaded",
                            is_selected: "$vehicle_detail.is_selected",
                            type_image_url: '$type_detail.type_image_url'
                        }
                    }
                }
            }
            Provider.aggregate([condition, vunwind, lookup, unwind, group]).then((provider) => {

                if (provider.length == 0) {
                    res.json({success: true, vehicle_list: []})
                } else {
                    res.json({success: true, vehicle_list: provider[0].vehicle_detail})
                }
            }, (err) => {
                console.log(err);
                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
            })
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

exports.change_current_vehicle = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'},{name: 'vehicle_id', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        // res.json({success: true, vehicle_list:provider.vehicle_detail})
                        var index = provider.vehicle_detail.findIndex((x) => x.is_selected == true)
                        provider.vehicle_detail[index].is_selected = false;
                        var new_index = provider.vehicle_detail.findIndex((x) => (x._id).toString() == (req.body.vehicle_id).toString())

                        if (provider.vehicle_detail[new_index].service_type == null) {
                            res.json({success: false})
                        } else {

                            provider.vehicle_detail[new_index].is_selected = true;
                            provider.service_type = provider.vehicle_detail[new_index].service_type;
                            provider.admintypeid = provider.vehicle_detail[new_index].admin_type_id;
                            provider.is_vehicle_document_uploaded = provider.vehicle_detail[new_index].is_document_uploaded;
                            provider.markModified('vehicle_detail');
                            provider.save().then(()=>{
                                utils.remove_from_zone_queue(provider)
                                res.json({success: true})
                            });
                                  
                        }

                    }
                }
            }, (err) => {
                console.log(err);
                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

exports.get_provider_vehicle_detail = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'},{name: 'vehicle_id', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        var index = provider.vehicle_detail.findIndex((x) => (x._id).toString() == (req.body.vehicle_id).toString())

                        if (index == -1) {
                            res.json({success: false})
                        } else {
                            Provider_Vehicle_Document.find({vehicle_id: req.body.vehicle_id}).then((provider_vehicle_document) => {

                                Type.findOne({_id: provider.vehicle_detail[index].admin_type_id}).then((type) => {
                                    if (type) {
                                        provider.vehicle_detail[index].type_image_url = type.type_image_url;
                                        res.json({
                                            success: true,
                                            vehicle_detail: provider.vehicle_detail[index],
                                            document_list: provider_vehicle_document
                                        })

                                    } else {
                                        provider.vehicle_detail[index].type_image_url = '';
                                        res.json({
                                            success: true,
                                            vehicle_detail: provider.vehicle_detail[index],
                                            document_list: provider_vehicle_document
                                        })

                                    }
                                }, (err) => {
                                    console.log(err);
                                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                                })
                            });
                        }
                    }
                }
            }, (err) => {
                console.log(err);
                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

exports.upload_vehicle_document = function (req, res, next) {
    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'},{name: 'vehicle_id', type: 'string'},{name: 'document_id', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        Provider_Vehicle_Document.findOne({
                            _id: req.body.document_id,
                            vehicle_id: req.body.vehicle_id,
                            provider_id: req.body.provider_id
                        }).then((providervehicledocument) => {

                            if (providervehicledocument) {
                                if (req.files != undefined && req.files.length > 0) {
                                    utils.deleteImageFromFolder(providervehicledocument.document_picture, 3);
                                    var image_name = providervehicledocument._id + utils.tokenGenerator(4);
                                    var url = utils.getImageFolderPath(req, 3) + image_name + '.jpg';
                                    providervehicledocument.document_picture = url;
                                    utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 3);
                                    providervehicledocument.save();
                                }
                                providervehicledocument.is_uploaded = 1;
                                providervehicledocument.unique_code = req.body.unique_code;
                                providervehicledocument.expired_date = req.body.expired_date;
                                providervehicledocument.is_document_expired = false;


                                providervehicledocument.save().then(() => {
                                    // if (provider.is_vehicle_document_uploaded == false) {
                                    Provider_Vehicle_Document.find({
                                        vehicle_id: req.body.vehicle_id,
                                        option: 1,
                                        provider_id: req.body.provider_id,
                                        is_uploaded: 0
                                    }).then((providervehicledocumentuploaded) => {
                                        Provider_Vehicle_Document.find({
                                            vehicle_id: req.body.vehicle_id,
                                            option: 1,
                                            provider_id: req.body.provider_id,
                                            is_document_expired: true
                                        }).then((expired_providervehicledocumentuploaded) => {
                                            var index = provider.vehicle_detail.findIndex((x) => x._id == req.body.vehicle_id);

                                            if (expired_providervehicledocumentuploaded.length == 0) {
                                                provider.vehicle_detail[index].is_documents_expired = false;
                                            } else {
                                                provider.vehicle_detail[index].is_documents_expired = true;
                                            }
                                            if (providervehicledocumentuploaded.length == 0) {
                                                provider.vehicle_detail[index].is_document_uploaded = true;
                                            } else {
                                                provider.vehicle_detail[index].is_document_uploaded = false;
                                            }
                                            provider.markModified('vehicle_detail');
                                            if(provider.vehicle_detail[index].is_selected){
                                                if (providervehicledocumentuploaded.length == 0) {
                                                    provider.is_vehicle_document_uploaded = true;
                                                } else {
                                                    provider.is_vehicle_document_uploaded = false;
                                                }
                                            }
                                            provider.save();
                                        });

                                    });
                                    // }
                                    res.json({success: true, document_detail: providervehicledocument})
                                }, (err) => {
                                    console.log(err);
                                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                                });

                            } else {
                                res.json({success: false})
                            }
                        });
                    }
                }
            }, (err) => {
                console.log(err);
                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

exports.provider_update_vehicle_detail = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'},{name: 'vehicle_name', type: 'string'},{name: 'plate_no', type: 'string'},
        {name: 'model', type: 'string'},{name: 'color', type: 'string'},{name: 'passing_year', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        var index = provider.vehicle_detail.findIndex((x) => (x._id).toString() == (req.body.vehicle_id).toString())

                        if (index == -1) {
                            res.json({success: false})
                        } else {
                            provider.vehicle_detail[index].name = req.body.vehicle_name;
                            provider.vehicle_detail[index].plate_no = req.body.plate_no;
                            provider.vehicle_detail[index].model = req.body.model;
                            provider.vehicle_detail[index].color = req.body.color;
                            provider.vehicle_detail[index].accessibility = req.body.accessibility;
                            provider.vehicle_detail[index].passing_year = req.body.passing_year;
                            Provider.findOneAndUpdate({_id: req.body.provider_id}, {vehicle_detail: provider.vehicle_detail}, {new: true}).then((providerupdate) => {
                                res.json({success: true, vehicle_detail: providerupdate.vehicle_detail[index]})
                            })
                        }
                    }
                }
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
}

exports.provider_add_vehicle = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'},{name: 'vehicle_name', type: 'string'},
        {name: 'passing_year', type: 'string'},{name: 'model', type: 'string'},{name: 'color', type: 'string'},
        {name: 'plate_no', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {

                        if (provider.vehicle_detail.length == 0) {
                            provider.service_type = null;
                            provider.admintypeid = null;
                        }
                        var mongoose = require('mongoose');
                        var ObjectId = mongoose.Types.ObjectId;
                        var x = new ObjectId();
                        var vehicel_json = {
                            _id: x,
                            name: req.body.vehicle_name,
                            accessibility: req.body.accessibility,
                            plate_no: req.body.plate_no,
                            model: req.body.model,
                            color: req.body.color,
                            passing_year: req.body.passing_year,
                            service_type: null,
                            admin_type_id: null,
                            is_documents_expired: false,
                            is_selected: false,
                            is_document_uploaded: false
                        }
                        
                        var files = req.files;
                        Country.findOne({countryname: provider.country}).then((country) => {

                            Document.find({countryid: country._id, type: 2}).then((document) => {

                                var is_document_uploaded = false;

                                var document_size = document.length;

                                if (document_size !== 0) {

                                    var count = 0;
                                    for (var i = 0; i < document_size; i++) {

                                        if (document[i].option == 0) {
                                            count++;
                                        } else {
                                            break;
                                        }
                                        if (count == document_size) {
                                            is_document_uploaded = true;
                                        }
                                    }

                                    document.forEach(function (entry, index) {
                                        var providervehicledocument = new Provider_Vehicle_Document({
                                            vehicle_id: x,
                                            provider_id: provider._id,
                                            document_id: entry._id,
                                            name: entry.title,
                                            option: entry.option,
                                            document_picture: "",
                                            unique_code: entry.unique_code,
                                            expired_date: "",
                                            is_unique_code: entry.is_unique_code,
                                            is_expired_date: entry.is_expired_date,
                                            is_document_expired: false,
                                            is_uploaded: 0
                                        });
                                        providervehicledocument.save().then(() => {
                                        });
                                    });
                                    vehicel_json.is_document_uploaded = is_document_uploaded;
                                } else {
                                    vehicel_json.is_document_uploaded = true;
                                }
                                provider.vehicle_detail.push(vehicel_json);
                                provider.save().then(() => {
                                    Provider_Vehicle_Document.find({vehicle_id: x}, function (err, provider_vehicle_document) {
                                        res.json({
                                            success: true,
                                            vehicle_detail: vehicel_json,
                                            document_list: provider_vehicle_document
                                        })
                                    });
                                }, (err) => {
                                    console.log(err);
                                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                                });
                            });

                        });
                    }
                }
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });

};

exports.provider_delete_vehicle_detail = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'},{name: 'vehicle_id', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        var index = provider.vehicle_detail.findIndex((x) => (x._id).toString() == (req.body.vehicle_id).toString());
                        if (index == -1) {
                            res.json({success: false})
                        } else {
                            if (provider.vehicle_detail[index].is_selected == true) {
                                provider.service_type = null;
                                provider.admintypeid = null;
                                if (provider.vehicle_detail.length == 1) {
                                    provider.is_vehicle_document_uploaded = false;
                                }
                            }
                            provider.vehicle_detail.splice(index, 1);
                            Provider.findOneAndUpdate({_id: req.body.provider_id}, {vehicle_detail: provider.vehicle_detail}, {new: true}).then((providerupdate) => {
                                res.json({success: true, vehicle_detail: providerupdate.vehicle_detail[index]})
                            });
                        }
                    }
                }
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

//update_provider_setting
exports.update_provider_setting = function (req, res) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        provider.languages = req.body.languages;
                        provider.received_trip_from_gender = req.body.received_trip_from_gender;

                        provider.save().then(() => {
                            res.json({
                                success: true, languages: provider.languages,
                                received_trip_from_gender: provider.received_trip_from_gender
                            })
                        }, (err) => {
                            console.log(err);
                            res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                        });
                    }

                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_NOT_GET_YOUR_DETAIL});

                }
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
}      





exports.get_provider_setting_detail = function (req, res) {

    var terms_and_condition_url = req.protocol + '://' + req.get('host') + "/terms";
    var privacy_policy_url = req.protocol + '://' + req.get('host') + "/support";

    var setting_response = {};
    setting_response.terms_and_condition_url =  terms_and_condition_url
    setting_response.privacy_policy_url = privacy_policy_url
    setting_response.admin_phone = setting_detail.admin_phone;
    setting_response.contactUsEmail = setting_detail.contactUsEmail;
    setting_response.is_tip = setting_detail.is_tip;
    setting_response.is_toll = setting_detail.is_toll;
    setting_response.scheduled_request_pre_start_minute = setting_detail.scheduled_request_pre_start_minute;
    setting_response.providerEmailVerification = setting_detail.providerEmailVerification;
    setting_response.stripe_publishable_key = setting_detail.stripe_publishable_key;
    setting_response.providerSms = setting_detail.providerSms;
    setting_response.twilio_call_masking = setting_detail.twilio_call_masking;
    setting_response.is_provider_initiate_trip = setting_detail.is_provider_initiate_trip;
    setting_response.providerPath = setting_detail.providerPath;
    setting_response.image_base_url = setting_detail.image_base_url;
    setting_response.is_show_estimation_in_provider_app = setting_detail.is_show_estimation_in_provider_app;
    setting_response.is_show_estimation_in_user_app = setting_detail.is_show_estimation_in_user_app;
    
    if(req.body.device_type == 'android') {
        setting_response.android_provider_app_google_key = setting_detail.android_provider_app_google_key;
        setting_response.android_provider_app_version_code = setting_detail.android_provider_app_version_code;
        setting_response.android_provider_app_force_update = setting_detail.android_provider_app_force_update;
    } else {
        setting_response.ios_provider_app_google_key = setting_detail.ios_provider_app_google_key;
        setting_response.ios_provider_app_version_code = setting_detail.ios_provider_app_version_code;
        setting_response.ios_provider_app_force_update = setting_detail.ios_provider_app_force_update;     
    }

    var provider_id = req.body.provider_id;
    if(provider_id == ''){
        provider_id = null;
    }
    Provider.findOne({_id: provider_id}).then((provider_detail)=>{
        if(provider_detail && provider_detail.token !== req.body.token){
            res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN, setting_detail: setting_response});
        } else {
            var response = {};
            if(provider_detail){
                Country.findOne({countryname: provider_detail.country}).then((country) => {
                    response.first_name = provider_detail.first_name;
                    response.last_name = provider_detail.last_name;
                    response.email = provider_detail.email;
                    response.country_phone_code = provider_detail.country_phone_code;
                    response.is_document_uploaded = provider_detail.is_document_uploaded;
                    response.address = provider_detail.address;
                    response.is_approved = provider_detail.is_approved;
                    response._id = provider_detail._id;
                    response.social_ids = provider_detail.social_ids;
                    response.social_unique_id = provider_detail.social_unique_id;
                    response.phone = provider_detail.phone;
                    response.login_by = provider_detail.login_by;
                    response.is_documents_expired = provider_detail.is_documents_expired;
                    response.account_id = provider_detail.account_id;
                    response.bank_id = provider_detail.bank_id;
                    response.city = provider_detail.city;
                    response.country = provider_detail.country;
                    response.rate = provider_detail.rate;
                    response.rate_count = provider_detail.rate_count;
                    response.token = provider_detail.token;
                    response.is_vehicle_document_uploaded = provider_detail.is_vehicle_document_uploaded;
                    response.service_type = provider_detail.service_type;
                    response.admintypeid = provider_detail.admintypeid;
                    response.is_available = provider_detail.is_available;
                    response.is_active = provider_detail.is_active;
                    response.is_partner_approved_by_admin = provider_detail.is_partner_approved_by_admin;
                    response.picture = provider_detail.picture;
                    response.wallet_currency_code = provider_detail.wallet_currency_code;
                    response.is_referral = provider_detail.is_referral;
                    response.referral_code = provider_detail.referral_code;
                    response.country_detail = {"is_referral": country.is_provider_referral}

                    if(provider_detail.is_trip.length>0){
                        Trip.findOne({_id: provider_detail.is_trip[0]}).then((trip_detail)=>{
                            if(trip_detail){
                                var start_time = trip_detail.updated_at;
                                var end_time = new Date();
                                var res_sec = utils.getTimeDifferenceInSecond(end_time, start_time);
                                var provider_timeout = setting_detail.provider_timeout;
                                var time_left_to_responds_trip = provider_timeout - res_sec;
                                User.findOne({_id: trip_detail.user_id}, function(error, user_detail){
                                    var trip_details = {
                                        trip_id : provider_detail.is_trip[0],
                                        user_id : trip_detail.user_id,
                                        is_provider_accepted : trip_detail.is_provider_accepted,
                                        is_provider_status : trip_detail.is_provider_status,
                                        trip_type : trip_detail.trip_type,
                                        source_address : trip_detail.source_address,
                                        destination_address : trip_detail.destination_address,
                                        sourceLocation : trip_detail.sourceLocation,
                                        destinationLocation : trip_detail.destinationLocation,
                                        is_trip_end : trip_detail.is_trip_end,
                                        time_left_to_responds_trip : time_left_to_responds_trip,
                                        user: {
                                            first_name: user_detail.first_name,
                                            last_name: user_detail.last_name,
                                            phone: user_detail.phone,
                                            country_phone_code: user_detail.country_phone_code,
                                            rate: user_detail.rate,
                                            rate_count: user_detail.rate_count,
                                            picture: user_detail.picture
                                        }
                                    }
                                    res.json({success: true, setting_detail: setting_response, phone_number_min_length: country.phone_number_min_length,
                                                        phone_number_length: country.phone_number_length,
                                                        provider_detail: response, trip_detail: trip_details});   
                                });
                            } else {
                                res.json({success: true, setting_detail: setting_response,phone_number_min_length: country.phone_number_min_length,
                                                        phone_number_length: country.phone_number_length, provider_detail: response});   
                            }
                        });
                    } else {
                        res.json({success: true, setting_detail: setting_response,phone_number_min_length: country.phone_number_min_length,
                                                        phone_number_length: country.phone_number_length, provider_detail: response});   
                    }
                });
               
            } else {
                res.json({success: true,setting_detail: setting_response})
            }
        }
    })
};



exports.get_provider_privacy_policy = function (req, res) {
    res.send(setting_detail.provider_privacy_policy)
};

exports.get_provider_terms_and_condition = function (req, res) {
    res.send(setting_detail.provider_terms_and_condition)
};



exports.apply_provider_referral_code = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'},{name: 'referral_code', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}, function (err, provider) {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        var is_skip = req.body.is_skip;

                        if (is_skip == 0) {
                            var referral_code = req.body.referral_code;
                            Provider.findOne({referral_code: referral_code}).then((providerData) => {
                                if (!providerData) {
                                    res.json({success: false, error_code: error_message.ERROR_CODE_REFERRAL_CODE_INVALID});
                                } else if (providerData.country != provider.country) {
                                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_YOUR_FRIEND_COUNTRY_NOT_MATCH_WITH_YOU
                                    });
                                } else {
                                    
                                        if (provider.is_referral == 1) {
                                            res.json({
                                                success: false,
                                                error_code: error_message.ERROR_CODE_YOU_HAVE_ALREADY_APPLY_REFERRAL_CODE
                                            });
                                        } else {
                                            Country.findOne({countryphonecode: provider.country_phone_code}).then((country) => {

                                                var providerRefferalCount = providerData.total_referrals;

                                                if (providerRefferalCount < country.providerreferral) {

                                                    var total_wallet_amount = utils.addWalletHistory(constant_json.PROVIDER_UNIQUE_NUMBER, providerData.unique_id, providerData._id, null,
                                                        providerData.wallet_currency_code, providerData.wallet_currency_code,
                                                        1, country.bonus_to_providerreferral, providerData.wallet, constant_json.ADD_WALLET_AMOUNT, constant_json.ADDED_BY_REFERRAL, " provider used your referral code, provider id : " + provider.unique_id);

                                                    providerData.total_referrals = +providerData.total_referrals + 1;
                                                    providerData.wallet = total_wallet_amount;
                                                    providerData.save().then(() => {
                                                    });

                                                    provider.is_referral = 1;
                                                    provider.referred_by = providerData._id;

                                                    total_wallet_amount = utils.addWalletHistory(constant_json.PROVIDER_UNIQUE_NUMBER, provider.unique_id, provider._id, null,
                                                        provider.wallet_currency_code, provider.wallet_currency_code,
                                                        1, country.referral_bonus_to_provider, provider.wallet, constant_json.ADD_WALLET_AMOUNT, constant_json.ADDED_BY_REFERRAL, "Using refferal code : " + referral_code + " of provider id : " + providerData.unique_id);

                                                    provider.wallet = total_wallet_amount;
                                                    provider.save().then(() => {
                                                        res.json({
                                                            success: true,
                                                            message: success_messages.MESSAGE_CODE_REFERRAL_PROCESS_SUCCESSFULLY_COMPLETED
                                                        });
                                                    });

                                                } else {

                                                    res.json({
                                                        success: false,
                                                        error_code: error_message.ERROR_CODE_REFERRAL_CODE_EXPIRED
                                                    });
                                                }

                                            });
                                        }

                                   
                                }

                            });
                        } else {
                            provider.is_referral = 1;
                            provider.save().then(() => {
                                res.json({
                                    success: true,
                                    message: success_messages.MESSAGE_CODE_YOU_HAVE_SKIPPED_FOR_REFERRAL_PROCESS
                                });


                            });
                        }
                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});

                }
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};


exports.get_provider_referal_credit = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {

                        var condition = { $match: { user_id: {$eq: Schema(req.body.provider_id)} } }
                        var referral_condition = {$match: {wallet_comment_id: {$eq: Number(constant_json.ADDED_BY_REFERRAL) }}}
                        var group = {
                            $group:{
                                _id: null,
                                total_referral_credit: {$sum: '$added_wallet'}
                            }
                        }

                        Wallet_history.aggregate([condition, referral_condition, group]).then((wallet_history_count)=>{
                            if(wallet_history_count.length>0){
                                res.json({success: true, total_referral_credit: wallet_history_count[0].total_referral_credit})
                            } else {
                                res.json({success: true, total_referral_credit: 0});
                            }
                        })
                    }

                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});

                }
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};