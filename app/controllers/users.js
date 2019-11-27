var utils = require('./utils');
var allemails = require('./emails');
var moment = require('moment');
var express = require('express');
var app = express();
var fs = require("fs");
var User = require('mongoose').model('User');
var Provider = require('mongoose').model('Provider');
var Promo_Code = require('mongoose').model('Promo_Code');
var Citytype = require('mongoose').model('city_type');
var User_promo_use = require('mongoose').model('User_promo_use');
var Trip = require('mongoose').model('Trip');
var Country = require('mongoose').model('Country');
var City = require('mongoose').model('City');
var Settings = require('mongoose').model('Settings');
var Card = require('mongoose').model('Card');
var User_Document = require('mongoose').model('User_Document');
var Document = require('mongoose').model('Document');
var CityZone = require('mongoose').model('CityZone');
var ZoneValue = require('mongoose').model('ZoneValue');
var Airport = require('mongoose').model('Airport');
var AirportCity = require('mongoose').model('Airport_to_City');
var CitytoCity = require('mongoose').model('City_to_City');
var Partner = require('mongoose').model('Partner');
var console = require('./console');
var utils = require('./utils');
var geolib = require('geolib');
var Corporate = require('mongoose').model('Corporate');
var Wallet_history = require('mongoose').model('Wallet_history');
var mongoose = require('mongoose');
var Schema = mongoose.Types.ObjectId;

exports.update_password = function (req, res) {

    utils.check_request_params(req.body, [{name: 'country_phone_code', type: 'string'},{name: 'phone', type: 'string'},
        {name: 'password', type: 'string'}], function (response) {
        if (response.success) {
            var phone = req.body.phone;
            var country_phone_code = req.body.country_phone_code;
            var password = req.body.password;
            User.findOne({phone: phone, country_phone_code: country_phone_code}).then((user) => {
                if (user) {
                    user.password = utils.encryptPassword(password);
                    user.save().then(() => {
                        res.json({success: true, message: success_messages.MESSAGE_CODE_PASSWORD_RESET_SUCCESSFULLY});
                    });
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_NOT_A_REGISTERED_USER});
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

exports.get_otp = function (req, res) {

    utils.check_request_params(req.body, [{name: 'country_phone_code', type: 'string'},{name: 'phone', type: 'string'}], function (response) {
        if (response.success) {
            var phone = req.body.phone;
            var country_phone_code = req.body.country_phone_code;
            var phoneWithCode = country_phone_code + phone;
            var otpForSMS = utils.generateOtp(6);
            User.findOne({phone: phone}).then((user) => {
                if (user) {
                    var userSms = setting_detail.userSms;
                    if (userSms == true) {
                        utils.sendSmsForOTPVerificationAndForgotPassword(phoneWithCode, 1, otpForSMS);
                    }
                    res.json({success: true, otpForSMS: otpForSMS});
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_NOT_A_REGISTERED_USER});
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


exports.check_user_registered = function (req, res) {

    utils.check_request_params(req.body, [{name: 'country_phone_code', type: 'string'},{name: 'phone', type: 'string'}], function (response) {
        if (response.success) {
            var phone = req.body.phone;
            var country_phone_code = req.body.country_phone_code;
            var phoneWithCode = country_phone_code + phone;
            // generate otp //
            var otpForSMS = utils.generateOtp(6);
            //var otpForSMS = "111111";
            User.findOne({phone: phone, country_phone_code: country_phone_code}).then((user) => {
                if (user) {
                    res.json({success: true, message: success_messages.MESSAGE_CODE_USER_EXIST});
                } else {
                    var userSms = setting_detail.userSms;
                    if (userSms == true) {
                        res.json({success: true, otpForSMS: otpForSMS, userSms: userSms});
                        utils.sendSmsForOTPVerificationAndForgotPassword(phoneWithCode, 1, otpForSMS);
                    } else {
                        res.json({success: true, userSms: userSms});
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

// forgotpassword
exports.forgotpassword = function (req, res) {

    utils.check_request_params(req.body, [{name: 'email', type: 'string'},], function (response) {
        if (response.success) {
            var type = req.body.type; //1 = user  0 = Provider 
            if (type == 1) {
                User.findOne({email: req.body.email}).then((user) => {
                    if (!user) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_NOT_REGISTERED_OR_INVALID_EMAIL_ID});
                    } else {
                        var new_password = utils.generatePassword(6);
                        user.password = utils.encryptPassword(new_password);
                        user.save().then(() => {
                        });
                        var phoneWithCode = user.country_phone_code + user.phone;
                        utils.sendSmsForOTPVerificationAndForgotPassword(phoneWithCode, 3, new_password);
                        allemails.userForgotPassword(req, user, new_password);
                        res.json({success: true, message: success_messages.MESSAGE_CODE_RESET_PASSWORD_SUCCESSFULLY});
                    }
                });
            } else {
                Provider.findOne({email: req.body.email}).then((provider) => {
                    if (!provider) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_NOT_REGISTERED_OR_INVALID_EMAIL_ID});
                    } else {
                        var new_password = utils.generatePassword(6);
                        provider.password = utils.encryptPassword(new_password);
                        provider.save().then(() => {
                        });
                        var phoneWithCode = provider.country_phone_code + provider.phone;
                        utils.sendSmsForOTPVerificationAndForgotPassword(phoneWithCode, 3, new_password);
                        allemails.providerForgotPassword(req, provider, new_password);
                        res.json({success: true, message: success_messages.MESSAGE_CODE_RESET_PASSWORD_SUCCESSFULLY});
                    }
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

// OTP verification
exports.verification = function (req, res) {
    console.log("-verification----")
    console.log(req.body)
    utils.check_request_params(req.body, [{name: 'phone', type: 'string'},{name: 'country_phone_code', type: 'string'}], function (response) {
        if (response.success) {
            var type = req.body.type;
            var email = req.body.email;
            var phone = req.body.phone;
            var phoneWithCode = req.body.country_phone_code + phone;
            // generate otp //
            var otpForSMS = utils.generateOtp(6);
            var otpForEmail = utils.generateOtp(6);
            if (type == 1) {
                User.findOne({email: req.body.email}).then((user) => {

                    if (user) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_EMAIL_ID_ALREADY_REGISTERED});
                    } else {

                        User.findOne({phone: req.body.phone}).then((user) => {
                            if (user) {
                                res.json({success: false, error_code: error_message.ERROR_CODE_PHONE_NUMBER_ALREADY_USED});
                            } else {

                                var userEmailVerification = setting_detail.userEmailVerification;
                                var userSms = setting_detail.userSms;
                                if (userSms == true) {
                                    utils.sendSmsForOTPVerificationAndForgotPassword(phoneWithCode, 1, otpForSMS);
                                }

                                if (userEmailVerification == true) {
                                    allemails.emailForOTPVerification(req, email, otpForEmail, 2);
                                }

                                res.json({success: true, otpForSMS: otpForSMS, otpForEmail: otpForEmail});

                            }

                        });
                    }

                });
            } else {
                Provider.findOne({email: req.body.email}).then((provider) => {
                    if (provider) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_EMAIL_ID_ALREADY_REGISTERED});
                    } else {

                        Provider.findOne({phone: req.body.phone}).then((provider) => {
                            if (provider) {
                                res.json({success: false, error_code: error_message.ERROR_CODE_PHONE_NUMBER_ALREADY_USED});
                            } else {

                                var providerEmailVerification = setting_detail.providerEmailVerification;
                                var providerSms = setting_detail.providerSms;
                                ///////////// GENERATE OTP ///////////
                                if (providerSms == true) {
                                    utils.sendSmsForOTPVerificationAndForgotPassword(phoneWithCode, 2, otpForSMS);
                                }
                                if (providerEmailVerification == true) {
                                    allemails.emailForOTPVerification(req, email, otpForEmail, 2);
                                }
                                res.json({success: true, otpForSMS: otpForSMS, otpForEmail: otpForEmail});

                            }

                        });
                    }

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


// user_register_new //
exports.user_register = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'first_name', type: 'string'},{name: 'last_name', type: 'string'},{name: 'email', type: 'string'},
        {name: 'country', type: 'string'},{name: 'phone', type: 'string'},{name: 'country_phone_code', type: 'string'}], function (response) {
        if (response.success) {
            var social_id = req.body.social_unique_id;
            var social_id_array = [];
            if (social_id == undefined || social_id == null || social_id == "") {
                social_id = null;
            } else {
                social_id_array.push(social_id);
            }

            var gender = req.body.gender;
            if (gender != undefined) {
                gender = ((gender).trim()).toLowerCase();
            }

            var first_name = req.body.first_name;
            var last_name = req.body.last_name;
            var email = req.body.email;

            if (email == undefined || email == null || email == "") {
                email = null;
            } else {
                email = ((req.body.email).trim()).toLowerCase();
            }
            var referral_code = (utils.tokenGenerator(8)).toUpperCase();
            var token = utils.tokenGenerator(32);
            User.findOne({email: email}).then((user_email) => {
                User.findOne({phone: req.body.phone, country_phone_code: req.body.country_phone_code}).then((user_phone) => {
                    if (!user_email && !user_phone) {
                        if (email == null) {
                            email = "";
                        }

                        if (first_name.length > 0) {
                            first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
                        } else {
                            first_name = "";
                        }

                        if (last_name.length > 0) {
                            last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);
                        } else {
                            last_name = "";
                        }

                        var user = new User({
                            first_name: first_name,
                            last_name: last_name,
                            email: email,
                            country_phone_code: req.body.country_phone_code,
                            phone: req.body.phone,
                            gender: gender,
                            device_token: req.body.device_token,
                            device_type: req.body.device_type,
                            address: req.body.address,
                            social_ids: social_id_array,
                            social_unique_id: req.body.social_unique_id,
                            login_by: req.body.login_by,
                            device_timezone: req.body.device_timezone,
                            city: req.body.city,
                            token: token,
                            country: req.body.country,
                            referral_code: referral_code,
                            user_type: Number(constant_json.USER_TYPE_NORMAL),
                            app_version: req.body.app_version
                        });

                        // FOR PASSWORD
                        if (social_id == null) {
                            user.password = utils.encryptPassword(req.body.password);
                        }

                        // FOR PROFILE IMAGE 
                        if (req.files != undefined && req.files.length > 0) {
                            var image_name = user._id + utils.tokenGenerator(4);
                            var url = utils.getImageFolderPath(req, 1) + image_name + '.jpg';
                            user.picture = url;
                            utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 1);

                        }


                        var country_phone_code = user.country_phone_code;
                        console.log(country_phone_code)
                        Country.findOne({countryphonecode: country_phone_code}).then((country) => {
                            if (country) {
                                user.wallet_currency_code = country.currencycode;
                                user.save().then(() => {
                                    var email_notification = setting_detail.email_notification;
                                    if (email_notification == true) {
                                        allemails.sendUserRegisterEmail(req, user, user.first_name + " " + user.last_name);
                                    }
                                    // FOR ADD DOCUEMNTS
                                    utils.insert_documets_for_new_users(user, Number(constant_json.USER_TYPE_NORMAL), country._id, function(document_response){
                                        console.log(document_response)
                                        var response = {};
                                        response.first_name = user.first_name;
                                        response.last_name = user.last_name;
                                        response.email = user.email;
                                        response.country_phone_code = user.country_phone_code;
                                        response.is_document_uploaded = user.is_document_uploaded;
                                        response.address = user.address;
                                        response.is_approved = user.is_approved;
                                        response.user_id = user._id;
                                        response.social_ids = user.social_ids;
                                        response.social_unique_id = user.social_unique_id;
                                        response.login_by = user.login_by;
                                        response.city = user.city;
                                        response.country = user.country;
                                        response.referral_code = user.referral_code;
                                        response.rate = user.rate;
                                        response.rate_count = user.rate_count;
                                        response.is_referral = user.is_referral;
                                        response.token = user.token;
                                        response.phone = user.phone;
                                        response.wallet_currency_code = user.wallet_currency_code;

                                        response.country_detail = {"is_referral": country.is_referral}
                                        res.json({
                                            success: true,
                                            message: success_messages.MESSAGE_CODE_USER_REGISTERED_SUCCESSFULLY,
                                            user_detail: response
                                        });
                                    });
                                });

                            } else {


                                var lookup = require('country-data').lookup;
                                countries_data = lookup.countries({countryCallingCodes: country_phone_code});

                                if (countries_data.length == 1) {
                                    user.wallet_currency_code = countries_data[0].currencies[0];
                                } else {
                                    countries_data = lookup.countries({countryCallingCodes: country_phone_code, name: country});
                                    if (countries_data.length == 1) {
                                        user.wallet_currency_code = countries_data[0].currencies[0];

                                    } else {
                                        user.wallet_currency_code = "";
                                    }

                                }
                                user.is_document_uploaded = 1;
                                user.save().then(() => {
                                    var email_notification = setting_detail.email_notification;
                                    if (email_notification == true) {
                                        allemails.sendUserRegisterEmail(req, user, user.first_name + " " + user.last_name);
                                    }

                                    var response = {};
                                        response.first_name = user.first_name;
                                        response.last_name = user.last_name;
                                        response.email = user.email;
                                        response.country_phone_code = user.country_phone_code;
                                        response.is_document_uploaded = user.is_document_uploaded;
                                        response.address = user.address;
                                        response.is_approved = user.is_approved;
                                        response.user_id = user._id;
                                        response.social_ids = user.social_ids;
                                        response.social_unique_id = user.social_unique_id;
                                        response.login_by = user.login_by;
                                        response.city = user.city;
                                        response.country = user.country;
                                        response.referral_code = user.referral_code;
                                        response.rate = user.rate;
                                        response.rate_count = user.rate_count;
                                        response.is_referral = user.is_referral;
                                        response.token = user.token;
                                        response.country_detail = {"is_referral": false}
                                        response.phone = user.phone;
                                        response.picture = user.picture;
                                        response.wallet_currency_code = user.wallet_currency_code;
                                        res.json({
                                            success: true,
                                            message: success_messages.MESSAGE_CODE_USER_REGISTERED_SUCCESSFULLY,
                                            user_detail: response
                                        });

                                    // FOR ADD DOCUEMNTS
                                    res.json({
                                        success: true,
                                        message: success_messages.MESSAGE_CODE_USER_REGISTERED_SUCCESSFULLY,
                                        user_detail: response
                                    });
                                });
                            }
                        });
                    } else {

                        if (social_id == null) {
                            if (user_phone) {
                                res.json({success: false, error_code: error_message.ERROR_CODE_PHONE_NUMBER_ALREADY_USED});
                            } else {
                                res.json({success: false, error_code: error_message.ERROR_CODE_EMAIL_ID_ALREADY_REGISTERED});
                            }
                        } else {

                            if (user_email && user_email.phone == req.body.phone) {
                                user_email.social_ids.push(social_id);
                                user_email.save().then(() => {
                                });
                                var response = {};
                                response.first_name = user_email.first_name;
                                response.last_name = user_email.last_name;
                                response.email = user_email.email;
                                response.country_phone_code = user_email.country_phone_code;
                                response.is_document_uploaded = user_email.is_document_uploaded;
                                response.address = user_email.address;
                                response.is_approved = user_email.is_approved;
                                response.user_id = user_email._id;
                                response.social_ids = user_email.social_ids;
                                response.social_unique_id = user_email.social_unique_id;
                                response.login_by = user_email.login_by;
                                response.city = user_email.city;
                                response.country = user_email.country;
                                response.referral_code = user_email.referral_code;
                                response.rate = user_email.rate;
                                response.rate_count = user_email.rate_count;
                                response.is_referral = user_email.is_referral;
                                response.token = user_email.token;
                                response.country_detail = {"is_referral": false}
                                response.phone = user_email.phone;
                                response.picture = user_email.picture;
                                response.wallet_currency_code = user_email.wallet_currency_code;
                                res.json({
                                    success: true,
                                    message: success_messages.MESSAGE_CODE_USER_REGISTERED_SUCCESSFULLY,
                                    user_detail: response
                                });
                            } else if (user_phone && (user_phone.email == email || user_phone.email == "")) {
                                user_phone.social_ids.push(social_id);
                                user_phone.email = email;
                                user_phone.save().then(() => {
                                });
                                var response = {};
                                response.first_name = user_phone.first_name;
                                response.last_name = user_phone.last_name;
                                response.email = user_phone.email;
                                response.country_phone_code = user_phone.country_phone_code;
                                response.is_document_uploaded = user_phone.is_document_uploaded;
                                response.address = user_phone.address;
                                response.is_approved = user_phone.is_approved;
                                response.user_id = user_phone._id;
                                response.social_ids = user_phone.social_ids;
                                response.social_unique_id = user_phone.social_unique_id;
                                response.login_by = user_phone.login_by;
                                response.city = user_phone.city;
                                response.country = user_phone.country;
                                response.referral_code = user_phone.referral_code;
                                response.rate = user_phone.rate;
                                response.rate_count = user_phone.rate_count;
                                response.is_referral = user_phone.is_referral;
                                response.token = user_phone.token;
                                response.country_detail = {"is_referral": false}
                                response.phone = user_phone.phone;
                                response.wallet_currency_code = user_phone.wallet_currency_code;
                                res.json({
                                    success: true,
                                    message: success_messages.MESSAGE_CODE_USER_REGISTERED_SUCCESSFULLY,
                                    user_detail: response
                                });
                            } else {
                                res.json({
                                    success: false,
                                    error_code: error_message.ERROR_CODE_EMAIL_ID_ALREADY_REGISTERED_WITH_SOCIAL
                                });
                            }
                        }
                    }
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


exports.user_login = function (req, res) {

    utils.check_request_params(req.body, [{name: 'email', type: 'string'},{name: 'password', type: 'string'}], function (response) {
        if (response.success) {
            var email = req.body.email;
            if (email != undefined) {
                email = ((req.body.email).trim()).toLowerCase();
            }

            var social_id = req.body.social_unique_id;

            var encrypted_password = req.body.password;
            if (social_id == undefined || social_id == null || social_id == "") {
                social_id = "";
            }
            if (encrypted_password == undefined || encrypted_password == null || encrypted_password == "") {
                encrypted_password = "";
            } else {
                encrypted_password = utils.encryptPassword(encrypted_password);
            }

            var query = {$or: [{'email': email}, {'phone': email, 'country_phone_code': req.body.country_phone_code}, {social_ids: {$all: [social_id]}}]};
            
            User.findOne(query).then((user_detail) => {
                if (social_id == undefined || social_id == null || social_id == "") {
                    social_id = null;
                }
                if ((social_id == null && email == "")) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_NOT_A_REGISTERED_USER});
                } else if (user_detail) {

                    if (social_id == null && encrypted_password != "" && encrypted_password != user_detail.password) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_PASSWORD});
                    } else if (social_id != null && user_detail.social_ids.indexOf(social_id) < 0) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_YOU_ARE_NOT_REGISTERED_WITH_THIS_SOCIAL});
                    } else {
                        if (user_detail.device_token != "" && user_detail.device_token != req.body.device_token) {
                            utils.sendPushNotification(constant_json.USER_UNIQUE_NUMBER, user_detail.device_type, user_detail.device_token, push_messages.PUSH_CODE_FOR_USER_LOGIN_IN_OTHER_DEVICE, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                        }
                        user_detail.device_token = req.body.device_token;
                        user_detail.device_type = req.body.device_type;
                        user_detail.login_by = req.body.login_by;
                        user_detail.app_version = req.body.app_version;
                        user_detail.user_type = Number(constant_json.USER_TYPE_NORMAL);
                        user_detail.token = utils.tokenGenerator(32);
                        
                        user_detail.save(function(error){



                            var response = {};
                            response.first_name = user_detail.first_name;
                            response.last_name = user_detail.last_name;
                            response.email = user_detail.email;
                            response.country_phone_code = user_detail.country_phone_code;
                            response.is_document_uploaded = user_detail.is_document_uploaded;
                            response.address = user_detail.address;
                            response.is_approved = user_detail.is_approved;
                            response.user_id = user_detail._id;
                            response.social_ids = user_detail.social_ids;
                            response.social_unique_id = user_detail.social_unique_id;
                            response.login_by = user_detail.login_by;
                            response.city = user_detail.city;
                            response.country = user_detail.country;
                            response.referral_code = user_detail.referral_code;
                            response.rate = user_detail.rate;
                            response.rate_count = user_detail.rate_count;
                            response.is_referral = user_detail.is_referral;
                            response.token = user_detail.token;
                            response.phone = user_detail.phone;
                            response.picture = user_detail.picture;
                            response.wallet_currency_code = user_detail.wallet_currency_code;

                            var corporate_id = null;
                            if(user_detail.corporate_ids && user_detail.corporate_ids.length>0){
                                corporate_id = user_detail.corporate_ids[0].corporate_id;
                            }

                            Corporate.findOne({_id: corporate_id}).then((corporate_detail)=>{

                                if(corporate_detail){
                                    response.corporate_detail = {
                                        name: corporate_detail.name,
                                        phone: corporate_detail.phone,
                                        country_phone_code: corporate_detail.country_phone_code,
                                        status: user_detail.corporate_ids[0].status,
                                        _id: corporate_detail._id
                                    }
                                }

                                Country.findOne({countryphonecode: user_detail.country_phone_code}).then((country) => {
                                    if (country) {
                                        response.country_detail = {"is_referral": country.is_referral}
                                    } else {
                                        response.country_detail = {"is_referral": false}
                                    }
                                    
                                    if(user_detail.current_trip_id){
                                        Trip.findOne({_id: user_detail.current_trip_id}).then((trip_detail)=>{
                                            response.trip_id = user_detail.current_trip_id;
                                            response.provider_id = trip_detail.current_provider;
                                            response.is_provider_accepted = trip_detail.is_provider_accepted;
                                            response.is_provider_status = trip_detail.is_provider_status;
                                            response.is_trip_end = trip_detail.is_trip_end;
                                            response.is_trip_completed = trip_detail.is_trip_completed;
                                            res.json({success: true, user_detail: response});   
                                        });
                                    } else {
                                        res.json({success: true, user_detail: response});   
                                    }
                                });
                            });
                        });
                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_NOT_A_REGISTERED_USER});
                }
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

exports.user_login_new = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'email', type: 'string'},{name: 'password', type: 'string'}], function (response) {
        if (response.success) {
            var social_id = req.body.social_unique_id;
            var email = ((req.body.email).trim()).toLowerCase();
            var query = [];

            var user_query = {};
            if (social_id != undefined || social_id != null || social_id != "") {
                var user_social_query = {social_ids: {$all: [social_id]}};
                query.push(user_social_query);

            } else {
                //var email = new RegExp(req.body.email, 'i');
                var password = req.body.password;
                password = utils.encryptPassword(password);
                var user_email_query = {$and: [{"email": email}, {'password': password}]};
                var user_phone_query = {$and: [{'phone': email}, {'password': password}]};
                query.push(user_email_query);
                query.push(user_phone_query);
            }

            var query = {$or: [{'email': email}, {'phone': email}, {social_ids: {$all: [social_id]}}]};

            user_query["$or"] = query;
            User.findOne(query).then((user) => {
                if (user) {
                    Country.findOne({countryphonecode: user.country_phone_code}, {"is_referral": 1}).then((country) => {

                        var token = utils.tokenGenerator(32);
                        var device_token = "";
                        var device_type = "";
                        user.token = token;
                        if (user.device_token != "" && user.device_token != req.body.device_token) {
                            device_token = user.device_token;
                            device_type = user.device_type;
                        }

                        user.device_token = req.body.device_token;
                        user.device_type = req.body.device_type;
                        user.login_by = req.body.login_by;
                        user.app_version = req.body.app_version;
                        user.user_type = Number(constant_json.USER_TYPE_NORMAL);

                        var country_detail = {"is_referral": false};
                        if (country) {
                            country_detail = {"is_referral": country.is_referral};
                        }

                        user.save().then(() => {

                            if (device_token != "") {
                                utils.sendPushNotification(constant_json.USER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_USER_LOGIN_IN_OTHER_DEVICE, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                            }

                            res.json({
                                success: true,
                                message: success_messages.MESSAGE_CODE_LOGIN_SUCCESSFULLY,
                                user_id: user._id,
                                first_name: user.first_name,
                                last_name: user.last_name,
                                country_phone_code: user.country_phone_code,
                                phone: user.phone,
                                wallet: user.wallet,
                                    wallet_currency_code: user.wallet_currency_code,
                                email: user.email,
                                picture: user.picture,
                                bio: user.bio,
                                address: user.address,
                                city: user.city,
                                country: user.country,
                                zipcode: user.zipcode,
                                login_by: user.login_by,
                                gender: user.gender,
                                social_unique_id: user.social_unique_id,
                                social_ids: user.social_ids,
                                device_token: user.device_token,
                                device_type: user.device_type,
                                device_timezone: user.device_timezone,
                                referral_code: user.referral_code,
                                token: user.token,
                                is_approved: user.is_approved,
                                app_version: user.app_version,
                                is_referral: user.is_referral,
                                is_document_uploaded: user.is_document_uploaded,
                                country_detail: country_detail
                            });

                        });
                    });

                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_NOT_A_REGISTERED_USER});
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


////////// GET  USER DETAIL ///////
exports.get_user_detail = function (req, res, next) {
    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}, function (err, user) {
                if (err && !user) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_NOT_GET_YOUR_DETAIL});
                } else {
                    Country.findOne({countryphonecode: user.country_phone_code}, {"is_referral": 1}).then((country) => {
                        var country_detail = {"is_referral": false};
                        if (country) {
                            country_detail = {"is_referral": country.is_referral};
                        }
                        
                        res.json({success: true, message: success_messages.MESSAGE_CODE_GET_YOUR_DETAIL,

                                user_id: user._id,
                                first_name: user.first_name,
                                last_name: user.last_name,
                                country_phone_code: user.country_phone_code,
                                phone: user.phone,
                                email: user.email,
                                wallet: user.wallet,
                                wallet_currency_code: user.wallet_currency_code,
                                picture: user.picture,
                                bio: user.bio,
                                address: user.address,
                                city: user.city,
                                country: user.country,
                                zipcode: user.zipcode,
                                login_by: user.login_by,
                                gender: user.gender,
                                social_unique_id: user.social_unique_id,
                                social_ids: user.social_ids,
                                device_token: user.device_token,
                                device_type: user.device_type,
                                device_timezone: user.device_timezone,
                                referral_code: user.referral_code,
                                token: user.token,
                                is_approved: user.is_approved,
                                app_version: user.app_version,
                                is_referral: user.is_referral,
                                is_document_uploaded: user.is_document_uploaded,
                                country_detail: country_detail,
                                rate: user.rate,
                                rate_count: user.rate_count
                        });
                    });

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


exports.user_update = function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'},{name: 'phone', type: 'string'},
        {name: 'first_name', type: 'string'},{name: 'last_name', type: 'string'},{name: 'country_phone_code', type: 'string'}], function (response) {
        if (response.success) {
            var user_id = req.body.user_id;
            var old_password = req.body.old_password;
            var social_id = req.body.social_unique_id;
            if (social_id == undefined || social_id == null || social_id == "") {
                social_id = null;
            }
            if (old_password == undefined || old_password == null || old_password == "") {
                old_password = "";
            } else {
                old_password = utils.encryptPassword(old_password);
            }
            User.findOne({_id: user_id}).then((user) => {
                if (user) {
                    if (req.body.token !== null && user.token !== req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else if (social_id == null && old_password != "" && old_password != user.password) {
                        res.json({
                            success: false,
                            error_code: error_message.ERROR_CODE_YOUR_PASSWORD_IS_NOT_MATCH_WITH_OLD_PASSWORD
                        });

                    } else if (social_id != null && user.social_ids.indexOf(social_id) < 0) {
                        res.json({success: false, error_code: 111});
                    } else {
                        Country.findOne({_id: user.country_id}).then((country) => {
                            var new_email = req.body.email;
                            var new_phone = req.body.phone;

                            if (req.body.new_password != "") {
                                var new_password = utils.encryptPassword(req.body.new_password);
                                req.body.password = new_password;
                            }
                            if(!new_email){
                                new_email = null;
                            }

                            req.body.social_ids = user.social_ids;

                            User.findOne({_id: {'$ne': user_id}, email: new_email}).then((user_details) => {


                                if (user_details) {

                                    res.json({success: false, error_code: error_message.ERROR_CODE_EMAIL_ID_ALREADY_REGISTERED});

                                } else {
                                    User.findOne({_id: {'$ne': user_id}, country_phone_code: req.body.country_phone_code,  phone: new_phone}).then((user_phone_details) => {

                                        if (user_phone_details) {
                                            res.json({
                                                success: false,
                                                error_code: error_message.ERROR_CODE_PHONE_NUMBER_ALREADY_USED
                                            });
                                        } else {
                                            var social_id_array = [];
                                            if (social_id != null) {
                                                social_id_array.push(social_id);
                                            }
                                            var user_update_query = {$or: [{'password': old_password}, {social_ids: {$all: social_id_array}}]};
                                            user_update_query = {$and: [{'_id': user_id}, user_update_query]};


                                            User.findOneAndUpdate(user_update_query, req.body, {new: true}).then((user) => {
                                                if (user) {
                                                    if (req.files != undefined && req.files.length > 0) {
                                                        utils.deleteImageFromFolder(user.picture, 1);
                                                        var image_name = user._id + utils.tokenGenerator(4);
                                                        var url = utils.getImageFolderPath(req, 1) + image_name + '.jpg';
                                                        user.picture = url;
                                                        utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 1);
                                                    }

                                                    var first_name = (req.body.first_name).trim();
                                                    if (first_name != "" && first_name != undefined && first_name != null) {
                                                        first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
                                                    } else {
                                                        first_name = "";
                                                    }
                                                    var last_name = (req.body.last_name).trim();
                                                    if (last_name != "" && last_name != undefined && last_name != null) {
                                                        last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);
                                                    } else {
                                                        last_name = "";
                                                    }
                                                    user.first_name = first_name;
                                                    user.last_name = last_name;
                                                    user.email = req.body.email;
                                                    user.country_phone_code = req.body.country_phone_code;
                                                    user.phone = req.body.phone;
                                                    user.bio = req.body.bio;
                                                    user.gender = req.body.gender;
                                                    user.address = req.body.address;
                                                    user.zipcode = req.body.zipcode;
                                                    user.city = req.body.city;
                                                    user.save().then(() => {
                                                    });

                                                    var response = {};
                                                    response.first_name = user.first_name;
                                                    response.last_name = user.last_name;
                                                    response.email = user.email;
                                                    response.country_phone_code = user.country_phone_code;
                                                    response.is_document_uploaded = user.is_document_uploaded;
                                                    response.address = user.address;
                                                    response.is_approved = user.is_approved;
                                                    response.user_id = user._id;
                                                    response.social_ids = user.social_ids;
                                                    response.social_unique_id = user.social_unique_id;
                                                    response.login_by = user.login_by;
                                                    response.city = user.city;
                                                    response.country = user.country;
                                                    response.referral_code = user.referral_code;
                                                    response.rate = user.rate;
                                                    response.rate_count = user.rate_count;
                                                    response.is_referral = user.is_referral;
                                                    response.token = user.token;
                                                    response.country_detail = {"is_referral": false}
                                                    response.phone = user.phone;
                                                    response.picture = user.picture;

                                                    res.json({
                                                        success: true,
                                                        message: success_messages.MESSAGE_CODE_YOUR_PROFILE_UPDATED_SUCCESSFULLY,
                                                        user_detail: response
                                                    });

                                                } else {
                                                    res.json({
                                                        success: false,
                                                        error_code: USER_ERROR_CODE.UPDATE_FAILED
                                                    });

                                                }

                                            });
                                        }
                                    });
                                }

                            });

                        });
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


//// UPDATE USER  PROFILE USING POST SERVICE ////
exports.user_update_old = function (req, res) {
    User.findOne({_id: req.body.user_id}, function (error, user) {
        if (user) {
            if (req.body.token != null && user.token != req.body.token) {
                res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
            } else {
                if (user.login_by !== "manual") {
                    if (req.files != undefined && req.files.length > 0) {
                        utils.deleteImageFromFolder(user.picture, 1);
                        var image_name = user._id + utils.tokenGenerator(4);
                        var url = utils.getImageFolderPath(req, 1) + image_name + '.jpg';
                        user.picture = url;
                        utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 1);

                    }

                    var first_name = req.body.first_name;
                    first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
                    var last_name = req.body.last_name;
                    last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);
                    user.first_name = first_name;
                    user.last_name = last_name;
                    user.email = req.body.email;
                    user.country_phone_code = req.body.country_phone_code;
                    user.phone = req.body.phone;
                    user.bio = req.body.bio;
                    user.gender = req.body.gender;
                    user.address = req.body.address;
                    user.zipcode = req.body.zipcode;
                    user.city = req.body.city;
                    user.save(function (err) {
                        if (err) {
                            res.json({
                                success: false,
                                error_code: error_message.ERROR_CODE_PROBLEM_IN_UPDATE_USER_PROFILE
                            });
                        } else {
                            res.json({
                                success: true,
                                message: success_messages.MESSAGE_CODE_YOUR_PROFILE_UPDATED_SUCCESSFULLY,
                                user_id: user._id,
                                first_name: user.first_name,
                                last_name: user.last_name,
                                country_phone_code: user.country_phone_code,
                                phone: user.phone,
                                picture: user.picture,
                                bio: user.bio,
                                email: user.email,
                                gender: user.gender,
                                address: user.address,
                                zipcode: user.zipcode,
                                city: user.city
                            });
                        }

                    });
                } else {
                    var crypto = require('crypto');
                    var old_password = req.body.old_password;
                    var hash_old = crypto.createHash('md5').update(old_password).digest('hex');
                    var crypto = require('crypto');
                    var new_password = req.body.new_password;


                    if (user.password == hash_old) {

                        if (new_password != '') {
                            var hash_new = crypto.createHash('md5').update(new_password).digest('hex');
                            user.password = hash_new;
                        }
                        var picture = req.body.pictureData;
                        if (req.files != undefined && req.files.length > 0) {
                            utils.deleteImageFromFolder(user.picture, 1);
                            var image_name = user._id + utils.tokenGenerator(4);
                            var url = utils.getImageFolderPath(req, 1) + image_name + '.jpg';
                            user.picture = url;
                            utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 1);

                        }

                        var first_name = req.body.first_name;
                        first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
                        var last_name = req.body.last_name;
                        last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);

                        user.first_name = first_name;
                        user.last_name = last_name;
                        user.country_phone_code = req.body.country_phone_code;
                        user.phone = req.body.phone;
                        user.bio = req.body.bio;
                        user.gender = req.body.gender;
                        user.email = req.body.email;
                        user.address = req.body.address;
                        user.zipcode = req.body.zipcode;
                        user.city = req.body.city;
                        user.save().then(() => {

                            res.json({
                                success: true,
                                message: success_messages.MESSAGE_CODE_YOUR_PROFILE_UPDATED_SUCCESSFULLY,
                                user_id: user._id,
                                first_name: user.first_name,
                                last_name: user.last_name,
                                country_phone_code: user.country_phone_code,
                                phone: user.phone,
                                picture: user.picture,
                                email: user.email,
                                bio: user.bio,
                                gender: user.gender,
                                address: user.address,
                                zipcode: user.zipcode,
                                city: user.city
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
            res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});

        }
    });
};

//// LOGOUT USER  SERVICE /////
exports.logout = function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}, function (err, user) {
                if (user) {
                    if (req.body.token != null && user.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {

                        user.device_token = "";
                        user.save().then(() => {
                            res.json({
                                success: true,
                                message: success_messages.MESSAGE_CODE_LOGOUT_SUCCESSFULLY
                            });

                        });
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

///////////////////////////////// UPDATE DEVICE TOKEN //////////////////////
exports.update_device_token = function (req, res) {
    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}).then((user) => {
                if (user) {
                    if (user.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {

                        user.device_token = req.body.device_token;
                        user.save().then(() => {
                            res.json({
                                success: true,
                                message: success_messages.MESSAGE_CODE_YOUR_DEVICE_TOKEN_UPDATE_SUCCESSFULLY
                            });
                        });
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


//////////////APPLY REFERAL CODE-//
exports.apply_referral_code = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'},{name: 'referral_code', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}, function (err, user) {
                if (user) {
                    if (req.body.token != null && user.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        var referral_code = req.body.referral_code;
                        User.findOne({referral_code: referral_code}).then((userData) => {
                            if (!userData) {
                                res.json({success: false, error_code: error_message.ERROR_CODE_REFERRAL_CODE_INVALID});
                            } else if (userData.country != user.country) {
                                res.json({
                                    success: false,
                                    error_code: error_message.ERROR_CODE_YOUR_FRIEND_COUNTRY_NOT_MATCH_WITH_YOU
                                });
                            } else {
                                var is_skip = req.body.is_skip;

                                if (is_skip == 0) {
                                    if (user.is_referral == 1) {
                                        res.json({
                                            success: false,
                                            error_code: error_message.ERROR_CODE_YOU_HAVE_ALREADY_APPLY_REFERRAL_CODE
                                        });
                                    } else {
                                        Country.findOne({countryname: user.country}).then((country) => {

                                            var userRefferalCount = userData.total_referrals;

                                            if (userRefferalCount < country.userreferral) {

                                                var total_wallet_amount = utils.addWalletHistory(constant_json.USER_UNIQUE_NUMBER, userData.unique_id, userData._id, null,
                                                    userData.wallet_currency_code, userData.wallet_currency_code,
                                                    1, country.bonus_to_userreferral, userData.wallet, constant_json.ADD_WALLET_AMOUNT, constant_json.ADDED_BY_REFERRAL, " User used your referral code, User id : " + user.unique_id);

                                                userData.total_referrals = +userData.total_referrals + 1;
                                                userData.wallet = total_wallet_amount;
                                                userData.save().then(() => {
                                                });

                                                user.is_referral = 1;
                                                user.referred_by = userData._id;

                                                total_wallet_amount = utils.addWalletHistory(constant_json.USER_UNIQUE_NUMBER, user.unique_id, user._id, null,
                                                    user.wallet_currency_code, user.wallet_currency_code,
                                                    1, country.referral_bonus_to_user, user.wallet, constant_json.ADD_WALLET_AMOUNT, constant_json.ADDED_BY_REFERRAL, "Using refferal code : " + referral_code + " of User id : " + userData.unique_id);

                                                user.wallet = total_wallet_amount;
                                                user.save().then(() => {
                                                    res.json({
                                                        success: true,
                                                        message: success_messages.MESSAGE_CODE_REFERRAL_PROCESS_SUCCESSFULLY_COMPLETED,
                                                        user_id: user._id,
                                                        is_referral: user.is_referral,
                                                        first_name: user.first_name,
                                                        last_name: user.last_name,
                                                        country_phone_code: user.country_phone_code,
                                                        phone: user.phone,
                                                        email: user.email,
                                                        picture: user.picture,
                                                        bio: user.bio,
                                                        address: user.address,
                                                        city: user.city,
                                                        country: user.country,
                                                        zipcode: user.zipcode,
                                                        login_by: user.login_by,
                                                        social_unique_id: user.social_unique_id,
                                                        device_token: user.device_token,
                                                        device_type: user.device_type,
                                                        referral_code: user.referral_code,
                                                        device_timezone: user.device_timezone
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

                                } else {
                                    user.is_referral = 1;
                                    user.save().then(() => {
                                        res.json({
                                            success: true,
                                            message: success_messages.MESSAGE_CODE_YOU_HAVE_SKIPPED_FOR_REFERRAL_PROCESS,
                                            user_id: user._id,
                                            is_referral: user.is_referral,
                                            first_name: user.first_name,
                                            last_name: user.last_name,
                                            country_phone_code: user.country_phone_code,
                                            phone: user.phone,
                                            email: user.email,
                                            picture: user.picture,
                                            bio: user.bio,
                                            address: user.address,
                                            city: user.city,
                                            country: user.country,
                                            zipcode: user.zipcode,
                                            login_by: user.login_by,
                                            social_unique_id: user.social_unique_id,
                                            device_token: user.device_token,
                                            device_type: user.device_type,
                                            referral_code: user.referral_code,
                                            device_timezone: user.device_timezone
                                        });


                                    });
                                }
                            }

                        });
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
///////////////FARE CALCULATOR FOR ESTIMATE FARE///////

exports.getfareestimate = function (req, res) {

    utils.check_request_params(req.body, [{name: 'service_type_id', type: 'string'}], function (response) {
        if (response.success) {
            Citytype.findOne({_id: req.body.service_type_id}).then((citytype) => {
                var geo = false;
                var geo2 = false
                var zone1, zone2, k = 0;
                if (!citytype) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_NO_SERVICE_TYPE_FOUND});
                } else {
                    var city_id = citytype.cityid;
                    City.findOne({_id: city_id}).then((city) => {

                        if (!city) {
                            res.json({success: false, error_code: error_message.ERROR_CODE_NO_SERVICE_TYPE_FOUND});
                        } else {

                            var unit_set = city.unit;

                            var time = req.body.time;
                            var timeMinutes;
                            timeMinutes = time * 0.0166667;

                            var distance = req.body.distance;
                            var distanceKmMile = distance;
                            if (unit_set == 1) {
                                distanceKmMile = distance * 0.001;
                            } else {
                                distanceKmMile = distance * 0.000621371;
                            }
                            if (city.zone_business == 1) {
                                
                                CityZone.find({cityid: city_id}).then((cityzone) => {
                                    if (citytype.is_zone == 1 && cityzone !== null && cityzone.length > 0) {

                                        var zone_count = cityzone.length;
                                        cityzone.forEach(function (cityzoneDetail) {

                                            geo = geolib.isPointInside(
                                                {latitude: req.body.pickup_latitude, longitude: req.body.pickup_longitude},
                                                cityzoneDetail.kmlzone
                                            );
                                            geo2 = geolib.isPointInside(
                                                {
                                                    latitude: req.body.destination_latitude,
                                                    longitude: req.body.destination_longitude
                                                },
                                                cityzoneDetail.kmlzone
                                            );
                                            if (geo) {
                                                zone1 = cityzoneDetail.id;

                                            }
                                            if (geo2) {
                                                zone2 = cityzoneDetail.id;

                                            }
                                            k++;
                                            if (k == zone_count) {

                                                ZoneValue.findOne({service_type_id: req.body.service_type_id,
                                                    $or: [{from: zone1, to: zone2}, {
                                                        from: zone2,
                                                        to: zone1
                                                    }]
                                                }).then((zonevalue) => {

                                                    if (zonevalue) {
                                                        var estimated_fare = (zonevalue.amount).toFixed(2);

                                                        var trip_type = constant_json.TRIP_TYPE_ZONE;

                                                        res.json({
                                                            success: true,
                                                            message: success_messages.MESSAGE_CODE_YOU_GET_FARE_ESTIMATE,
                                                            trip_type: trip_type,
                                                            time: timeMinutes,
                                                            distance: (distanceKmMile).toFixed(2),
                                                            estimated_fare: Number(estimated_fare)
                                                        });

                                                    } else {
                                                        airport(city_id, citytype, req.body, timeMinutes, distanceKmMile, res);
                                                    }
                                                })

                                            }

                                        });

                                    } else {
                                        airport(city_id, citytype, req.body, timeMinutes, distanceKmMile, res);
                                    }

                                });
                            } else {
                                airport(city_id, citytype, req.body, timeMinutes, distanceKmMile, res);
                            }
                        }
                    });
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


function airport(cityid, citytype, body, timeMinutes, distanceKmMile, res) {


    var dest_airport, pickup_airport, airport;
    Airport.find({city_id: cityid}).then((airport_data) => {
        if (airport_data != null && airport_data.length > 0) {
            var k = 0;
            City.findOne({'_id': cityid, airport_business: 1}).then((city) => {
                if (city) {

                    var pickup_airport;
                    var dest_airport;
                    var airport_id;
                    airport_data.forEach(function (airportDetail, airport_index) {

                        // if (airport == undefined) {
                            // pickup_airport = utils.getDistanceFromTwoLocation([body.pickup_latitude, body.pickup_longitude], airportDetail.airportLatLong);
                            // dest_airport = utils.getDistanceFromTwoLocation([body.destination_latitude, body.destination_longitude], airportDetail.airportLatLong);

                            pickup_airport = geolib.isPointInside(
                                {
                                    latitude: body.pickup_latitude,
                                    longitude: body.pickup_longitude
                                },
                                airportDetail.kmlzone
                            );

                            dest_airport = geolib.isPointInside(
                                {
                                    latitude:  body.destination_latitude,
                                    longitude:  body.destination_longitude
                                },
                                airportDetail.kmlzone
                            );

                            if (pickup_airport) {
                                city_distance = utils.getDistanceFromTwoLocation([body.pickup_latitude, body.pickup_longitude], city.cityLatLong);
                                
                                if(city.is_use_city_boundary){
                                    var inside_city = geolib.isPointInside(
                                        {
                                            latitude:  body.pickup_latitude,
                                            longitude:  body.pickup_longitude
                                        },
                                        city.city_locations
                                    );
                                    if(inside_city){
                                        airport_id = airportDetail._id;
                                    }
                                } else {
                                    if (city_distance < city.cityRadius) {
                                        airport_id = airportDetail._id;
                                    }
                                }
                            } 
                            if (dest_airport) {
                                city_distance = utils.getDistanceFromTwoLocation([body.destination_latitude, body.destination_longitude], city.cityLatLong);
                                if(city.is_use_city_boundary){
                                    var inside_city = geolib.isPointInside(
                                        {
                                            latitude:  body.destination_latitude,
                                            longitude:  body.destination_longitude
                                        },
                                        city.city_locations
                                    );
                                    if(inside_city){
                                        airport_id = airportDetail._id;
                                    }
                                } else {
                                    if (city_distance < city.cityRadius) {
                                        airport_id = airportDetail._id;
                                    }
                                }
                            }
                        });

                        if(airport_id){
                                AirportCity.findOne({
                                    airport_id: airport_id,
                                    service_type_id: citytype._id
                                }).then((airportcity) => {

                                    if (airportcity && airportcity.price > 0) {
                                        var estimated_fare = (airportcity.price).toFixed(2);
                                        var trip_type = constant_json.TRIP_TYPE_AIRPORT;
                                        res.json({
                                            success: true,
                                            trip_type: trip_type,
                                            message: success_messages.MESSAGE_CODE_YOU_GET_FARE_ESTIMATE,
                                            time: timeMinutes,
                                            distance: (distanceKmMile).toFixed(2),
                                            estimated_fare: Number(estimated_fare)
                                        });

                                    } else {
                                        cityCheck(cityid, citytype, body, timeMinutes, distanceKmMile, res)
                                    }
                                    
                                })
                           
                        
                        } else {
                            cityCheck(cityid, citytype, body, timeMinutes, distanceKmMile, res);
                        }
                        
                    
                } else {
                    cityCheck(cityid, citytype, body, timeMinutes, distanceKmMile, res)
                }
            })
        } else {
            cityCheck(cityid, citytype, body, timeMinutes, distanceKmMile, res)
        }

    });
}

function cityCheck(cityid, citytype, body, timeMinutes, distanceKmMile, res) {
    var flag = 0;
    var k = 0;
    City.findOne({'_id': cityid, city_business: 1}).then((city) => {
        if (city) {
            CitytoCity.find({city_id: cityid, service_type_id: citytype._id, destination_city_id: {$in: city.destination_city}}).then((citytocity) => {

                if (citytocity !== null && citytocity.length > 0) {

                    citytocity.forEach(function (citytocity_detail, citytocity_index) {

                        City.findById(citytocity_detail.destination_city_id).then((city_detail) => {
                            if (flag == 0) {

                                var city_radius = city_detail.cityRadius;
                                var destination_city_radius = utils.getDistanceFromTwoLocation([body.destination_latitude, body.destination_longitude], city_detail.cityLatLong);

                                var inside_city;
                                if(city_detail.city_locations && city_detail.city_locations.length>2){
                                    inside_city = geolib.isPointInside(
                                        {
                                            latitude:  body.destination_latitude,
                                            longitude:  body.destination_longitude
                                        },
                                        city_detail.city_locations
                                    );
                                }
                                
                                if (citytocity_detail.price > 0 && ((!city_detail.is_use_city_boundary && city_radius > destination_city_radius) || (city_detail.is_use_city_boundary && inside_city))) {
                                    var estimated_fare = (citytocity_detail.price).toFixed(2);
                                    var trip_type = constant_json.TRIP_TYPE_CITY;
                                    flag = 1;
                                    res.json({
                                        success: true,
                                        trip_type: trip_type,
                                        message: success_messages.MESSAGE_CODE_YOU_GET_FARE_ESTIMATE,
                                        time: timeMinutes,
                                        distance: (distanceKmMile).toFixed(2),
                                        estimated_fare: Number(estimated_fare)
                                    })

                                } else if (citytocity.length - 1 == k) {
                                    other(cityid, citytype, body, timeMinutes, distanceKmMile, res)
                                } else {
                                    k++;
                                }
                            }
                        });
                    });
                } else {
                    other(cityid, citytype, body, timeMinutes, distanceKmMile, res)
                }
            });
        } else {
            other(cityid, citytype, body, timeMinutes, distanceKmMile, res)
        }
    });
}

function other(cityid, citytype, body, timeMinutes, distanceKmMile, res) {
    City.findOne({_id: cityid}).then((city) => {

        var base_distance = citytype.base_price_distance;
        var base_price = citytype.base_price;
        var price_per_unit_distance1 = citytype.price_per_unit_distance;
        var price_for_total_time1 = citytype.price_for_total_time;
        var tax = citytype.tax;
        var min_fare = citytype.min_fare;
        var surge_multiplier = citytype.surge_multiplier;
        if(body.surge_multiplier){
            surge_multiplier = Number(body.surge_multiplier);
        }
        
        var user_tax = citytype.user_tax;
        var user_miscellaneous_fee = citytype.user_miscellaneous_fee;

        if (distanceKmMile <= base_distance) {
            price_per_unit_distance = 0;
        } else {
            price_per_unit_distance = (price_per_unit_distance1 * (distanceKmMile - base_distance)).toFixed(2);
        }


        price_for_total_time = Math.round(price_for_total_time1 * timeMinutes);
        var total = 0;
        total = +base_price + +price_per_unit_distance + +price_for_total_time;
        // tax cal
        total = total + total * 0.01 * tax;
        try {
            if (Number(body.is_surge_hours) == 1) {
                total = total * surge_multiplier;
            }
        } catch (error) {

        }
        var is_min_fare_used = 0;
        var user_tax_fee = Number((user_tax * 0.01 * total).toFixed(2));

        total = total + user_tax_fee + user_miscellaneous_fee;
        if (total < min_fare) {
            total = min_fare;
            is_min_fare_used = 1;
        }
        var estimated_fare = Number(total.toFixed(2));
        var trip_type = constant_json.TRIP_TYPE_NORMAL;
        
            res.json({
                success: true,
                trip_type: trip_type,
                user_tax_fee: user_tax_fee,
                user_miscellaneous_fee: user_miscellaneous_fee,
                message: success_messages.MESSAGE_CODE_YOU_GET_FARE_ESTIMATE,
                time: timeMinutes,
                distance: (distanceKmMile).toFixed(2),
                is_min_fare_used: is_min_fare_used,
                base_price: base_price,
                price_per_unit_distance: price_per_unit_distance,
                price_per_unit_time: price_for_total_time,
                estimated_fare: estimated_fare
            });
        

    });
}


////APPLY PROMO CODE///

exports.remove_promo_code = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'},{name: 'trip_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}).then((user) => {

                if (user) {
                    if (req.body.token != null && user.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        User_promo_use.findOneAndRemove({user_id: req.body.user_id, trip_id: req.body.trip_id}, function(error, used_promo_data){
                            Trip.findOne({_id: req.body.trip_id}, function(error, trip){
                                
                                Promo_Code.findOne({_id: trip.promo_id}, function(error, promocode_data){
                                    trip.promo_id = null;
                                    trip.save();
                                    if(promocode_data){
                                        promocode_data.user_used_promo--;
                                        promocode_data.save();
                                    }
                                    res.json({success: true, message: success_messages.MESSAGE_CODE_PROMOCODE_REMOVE_SUCCESSFULLY});
                                })
                            })
                        })
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

exports.apply_promo_code = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'},{name: 'promocode', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}).then((user) => {

                if (user) {
                    if (req.body.token != null && user.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        var now = new Date();
                        if(req.body.trip_id){
                            Trip.findOne({_id: req.body.trip_id}).then((trip) => {
                                if (trip) {
                                    var country_id = trip.country_id;
                                    Promo_Code.findOne({
                                        promocode: req.body.promocode,
                                        state: 1,
                                        countryid: country_id,
                                        start_date: {$lte: now},
                                        code_expiry: {$gte: now}
                                    }).then((promocode) => {

                                        if (promocode) {

                                            if (promocode.user_used_promo < promocode.code_uses) {
                                                User_promo_use.findOne({
                                                    user_id: req.body.user_id,
                                                    promo_id: promocode._id
                                                }).then((used_promo_data) => {
                                                    if (used_promo_data) {
                                                        res.json({
                                                            success: false,
                                                            error_code: error_message.ERROR_CODE_PROMOTIONAL_CODE_ALREADY_USED
                                                        });
                                                    } else {

                                                        

                                                                Citytype.findOne({_id: trip.service_type_id}).then((citytypedetail) => {
                                                                    if (citytypedetail) {
                                                                        var cityid = citytypedetail.cityid;
                                                                        var countryid = citytypedetail.countryid;
                                                                        City.findOne({_id: cityid}).then((citydetail) => {

                                                                            var promo_apply_for_cash = citydetail.isPromoApplyForCash;
                                                                            var promo_apply_for_card = citydetail.isPromoApplyForCard;
                                                                            var is_promo_apply = 0;
                                                                            if (trip.payment_mode == constant_json.PAYMENT_MODE_CASH && promo_apply_for_cash == constant_json.YES) {
                                                                                is_promo_apply = 1;
                                                                            } else if (trip.payment_mode == constant_json.PAYMENT_MODE_CARD && promo_apply_for_card == constant_json.YES) {
                                                                                is_promo_apply = 1;
                                                                            }


                                                                            if (is_promo_apply) {
                                                                                var mongoose = require('mongoose');

                                                                                if (promocode.cityid.indexOf(cityid) !== -1 && promocode.countryid.equals(countryid)) {
                                                                                    trip.promo_id = promocode._id;
                                                                                    trip.promo_code = promocode.promocode;
                                                                                    trip.save();
                                                                                    promocode.user_used_promo = promocode.user_used_promo + 1;
                                                                                    promocode.save();
                                                                                    var userpromouse = new User_promo_use({
                                                                                        promo_id: promocode._id,
                                                                                        promocode: promocode.promocode,
                                                                                        user_id: req.body.user_id,
                                                                                        promo_type: promocode.code_type,
                                                                                        promo_value: promocode.code_value,
                                                                                        trip_id: trip._id,
                                                                                        user_used_amount: 0

                                                                                    });
                                                                                    userpromouse.save().then(() => {
                                                                                        res.json({
                                                                                            success: true, promo_id: promocode._id,
                                                                                            message: success_messages.MESSAGE_CODE_PROMOTIONAL_CODE_APPLIED_SUCCESSFULLY
                                                                                        });
                                                                                    });
                                                                                } else {

                                                                                    res.json({
                                                                                        success: false,
                                                                                        error_code: error_message.ERROR_CODE_PROMO_CODE_NOT_FOR_YOUR_AREA
                                                                                    });
                                                                                }
                                                                            } else {
                                                                                res.json({
                                                                                    success: false,
                                                                                    error_code: error_message.ERROR_CODE_PROMO_CODE_NOT_APPLY_ON_YOUR_PAYMENT_MODE
                                                                                });
                                                                            }

                                                                        });
                                                                    } else {
                                                                        res.json({
                                                                            success: false,
                                                                            error_code: error_message.ERROR_CODE_INVALID_PROMO_CODE
                                                                        });
                                                                    }
                                                                });
                                                            
                                                    }
                                                });
                                            } else {
                                                res.json({
                                                    success: false,
                                                    error_code: error_message.ERROR_CODE_PROMO_CODE_EXPIRED_OR_INVALID
                                                });
                                            }
                                        } else {
                                            res.json({
                                                success: false,
                                                error_code: error_message.ERROR_CODE_PROMO_CODE_EXPIRED_OR_INVALID
                                            });
                                        }

                                    });
                                } else {
                                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_INVALID_PROMO_CODE
                                    });
                                }
                            });
                        } else {
                            var country_id = req.body.country_id;
                            Promo_Code.findOne({
                                promocode: req.body.promocode,
                                state: 1,
                                countryid: country_id,
                                start_date: {$lte: now},
                                code_expiry: {$gte: now}
                            }).then((promocode) => {

                                if (promocode) {

                                    if (promocode.user_used_promo < promocode.code_uses) {
                                        User_promo_use.findOne({
                                            user_id: req.body.user_id,
                                            promo_id: promocode._id
                                        }).then((used_promo_data) => {
                                            if (used_promo_data) {
                                                res.json({
                                                    success: false,
                                                    error_code: error_message.ERROR_CODE_PROMOTIONAL_CODE_ALREADY_USED
                                                });
                                            } else {

                                                City.findOne({_id: req.body.city_id}).then((citydetail) => {

                                                    var promo_apply_for_cash = citydetail.isPromoApplyForCash;
                                                    var promo_apply_for_card = citydetail.isPromoApplyForCard;
                                                    var is_promo_apply = 0;
                                                    if (req.body.payment_mode == constant_json.PAYMENT_MODE_CASH && promo_apply_for_cash == constant_json.YES) {
                                                        is_promo_apply = 1;
                                                    } else if (req.body.payment_mode == constant_json.PAYMENT_MODE_CARD && promo_apply_for_card == constant_json.YES) {
                                                        is_promo_apply = 1;
                                                    }

                                                    if (is_promo_apply) {
                                                        var mongoose = require('mongoose');

                                                        if (promocode.cityid.indexOf(req.body.city_id) !== -1 && promocode.countryid.equals(country_id)) {
                                                            res.json({
                                                                success: true,
                                                                promo_id: promocode._id,
                                                                promocode_name: promocode.name,
                                                                promo_apply_for_cash: promo_apply_for_cash,
                                                                promo_apply_for_card: promo_apply_for_card,
                                                                message: success_messages.MESSAGE_CODE_PROMOTIONAL_CODE_APPLIED_SUCCESSFULLY
                                                            });
                                                        } else {

                                                            res.json({
                                                                success: false,
                                                                error_code: error_message.ERROR_CODE_PROMO_CODE_NOT_FOR_YOUR_AREA
                                                            });
                                                        }
                                                    } else {
                                                        res.json({
                                                            success: false,
                                                            error_code: error_message.ERROR_CODE_PROMO_CODE_NOT_APPLY_ON_YOUR_PAYMENT_MODE
                                                        });
                                                    }

                                                });
                                                           
                                            }
                                        });
                                    } else {
                                        res.json({
                                            success: false,
                                            error_code: error_message.ERROR_CODE_PROMO_CODE_EXPIRED_OR_INVALID
                                        });
                                    }
                                } else {
                                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_PROMO_CODE_EXPIRED_OR_INVALID
                                    });
                                }

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
//////////////// USER REFERAL CREDIT////////

exports.get_user_referal_credit = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}).then((user) => {
                if (user) {
                    if (req.body.token != null && user.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {

                        var condition = { $match: { user_id: {$eq: Schema(req.body.user_id)} } }
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
//////// ADD WALLET AMOUNT ///

exports.add_wallet_amount = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'},{name: 'card_id', type: 'string'},
        {name: 'wallet', type: 'number'}], function (response) {
        if (response.success) {
            var type = Number(req.body.type);
            switch (type) {
                case Number(constant_json.USER_UNIQUE_NUMBER): // 10
                    type = Number(constant_json.USER_UNIQUE_NUMBER);
                    Table = User;
                    break;
                case Number(constant_json.PROVIDER_UNIQUE_NUMBER): // 11
                    type = Number(constant_json.PROVIDER_UNIQUE_NUMBER);
                    Table = Provider;
                    break;
                default:
                    type = Number(constant_json.USER_UNIQUE_NUMBER); // 10
                    Table = User;
                    break;
            }
            Table.findOne({_id: req.body.user_id}).then((detail) => {

                if (detail.token != req.body.token) {

                    res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                } else {

                    var payment_id = Number(constant_json.PAYMENT_BY_STRIPE);
                    try {
                        payment_id = req.body.payment_id;
                    } catch (error) {
                        console.error(err);
                    }

                    switch (payment_id) {
                        case Number(constant_json.PAYMENT_BY_STRIPE):
                            break;
                        case Number(constant_json.PAYMENT_BY_PAYPAL):
                            break;
                    }

                    var stripe_secret_key = setting_detail.stripe_secret_key;

                    var stripe = require("stripe")(stripe_secret_key);
                    var wallet = utils.precisionRoundTwo(Number(req.body.wallet));
                    if(req.body.card_id == ''){
                        req.body.card_id = null;
                    }
                    Card.findOne({
                        _id: req.body.card_id,
                        user_id: req.body.user_id
                    }).then((card) => {
                        if (!card) {
                            var payment_token = req.body.payment_token;
                            var customer = stripe.customers.create({
                                description: detail.email,
                                source: payment_token // obtained with Stripe.js

                            }, function (err, customer) {
                                if (err) {
                                    console.error(err);
                                }
                                if (customer) {
                                    var customer_id = customer.id;
                                    var charge = stripe.charges.create({
                                        amount: wallet * 100, // amount in cents, again
                                        currency: detail.wallet_currency_code,
                                        customer: customer_id
                                    }, function (err, charge) {
                                        console.log(err)
                                        if (charge) {
                                            var total_wallet_amount = utils.addWalletHistory(type, detail.unique_id, detail._id, detail.country_id, detail.wallet_currency_code, detail.wallet_currency_code,
                                                1, wallet, detail.wallet, constant_json.ADD_WALLET_AMOUNT, constant_json.ADDED_BY_CARD, "Card : ")

                                            detail.wallet = total_wallet_amount;
                                            detail.save().then(() => {
                                                res.json({
                                                    success: true,
                                                    message: success_messages.MESSAGE_CODE_WALLET_AMOUNT_ADDED_SUCCESSFULLY,
                                                    wallet: detail.wallet,
                                                    wallet_currency_code: detail.wallet_currency_code

                                                });


                                            });
                                        } else {

                                            res.json({
                                                success: false,
                                                error_code: error_message.ERROR_CODE_PROBLEM_IN_ADD_WALLET
                                            });
                                        }

                                    });
                                } else {
                                    res.json({success: false, error_code: error_message.ERROR_CODE_PROBLEM_IN_ADD_WALLET});
                                }
                            });
                        } else {
                            var customer_id = card.customer_id;
                            var charge = stripe.charges.create({
                                amount: wallet * 100, // amount in cents, again
                                currency: detail.wallet_currency_code,
                                customer: customer_id
                            }, function (err, charge) {
                                if (charge) {
                                    var total_wallet_amount = utils.addWalletHistory(type, detail.unique_id, detail._id, detail.country_id, detail.wallet_currency_code, detail.wallet_currency_code,
                                        1, wallet, detail.wallet, constant_json.ADD_WALLET_AMOUNT, constant_json.ADDED_BY_CARD, "Card : " + card.last_four)

                                    detail.wallet = total_wallet_amount;

                                    detail.save().then((user) => {
                                        res.json({
                                            success: true,
                                            message: success_messages.MESSAGE_CODE_WALLET_AMOUNT_ADDED_SUCCESSFULLY,
                                            wallet: detail.wallet,
                                            wallet_currency_code: detail.wallet_currency_code

                                        });


                                    });
                                } else {
                                    res.json({success: false, error_code: error_message.ERROR_CODE_PROBLEM_IN_ADD_WALLET});
                                }
                            });
                        }
                    });

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

exports.change_user_wallet_status = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}, function (err, user) {

                if (user.token != req.body.token) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                } else {
                    var status = req.body.is_use_wallet;
                    user.is_use_wallet = status;
                    user.save().then((user) => {
                        res.json({
                            success: true,
                            message: success_messages.MESSAGE_CODE_CHANGE_WALLET_STATUS_SUCCESSFULLY,
                            is_use_wallet: user.is_use_wallet
                        });
                    });
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

exports.set_home_address = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            if (req.body.home_address !== undefined) {
                req.body.home_location = [req.body.home_latitude, req.body.home_longitude]
            }

            if (req.body.work_address !== undefined) {
                req.body.work_location = [req.body.work_latitude, req.body.work_longitude]
            }

            User.findOne({_id: req.body.user_id}).then((user) => {

                if (!user) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});
                } else {
                    if (user.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        User.findByIdAndUpdate(req.body.user_id, req.body).then((user_data) => {
                            res.json({success: true, message: success_messages.MESSAGE_CODE_SET_ADDRESS_SUCCESSFULLY});

                        })
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

exports.get_home_address = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}, {
                token: 1,
                home_address: 1,
                work_address: 1,
                home_location: 1,
                work_location: 1
            }).then((user) => {
                if (!user) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});
                } else {
                    if (user.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {

                        res.json({success: true, user_address: user});
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

exports.get_user_privacy_policy = function (req, res) {
    res.send(setting_detail.user_privacy_policy)
};

exports.get_user_terms_and_condition = function (req, res) {
    res.send(setting_detail.user_terms_and_condition)
};

exports.get_user_setting_detail = function (req, res) {

    var terms_and_condition_url = req.protocol + '://' + req.get('host') + "/terms";
    var privacy_policy_url = req.protocol + '://' + req.get('host') + "/support";

    var setting_response = {};
    setting_response.terms_and_condition_url =  terms_and_condition_url
    setting_response.privacy_policy_url = privacy_policy_url
    if(req.body.device_type == 'android') {
        setting_response.admin_phone = setting_detail.admin_phone;
        setting_response.contactUsEmail = setting_detail.contactUsEmail;
        setting_response.android_user_app_google_key = setting_detail.android_user_app_google_key;
        setting_response.android_user_app_version_code = setting_detail.android_user_app_version_code;
        setting_response.android_user_app_force_update = setting_detail.android_user_app_force_update;
        setting_response.is_tip = setting_detail.is_tip;
        setting_response.scheduled_request_pre_start_minute = setting_detail.scheduled_request_pre_start_minute;
        setting_response.stripe_publishable_key = setting_detail.stripe_publishable_key;
        setting_response.userPath = setting_detail.userPath;
        setting_response.userSms = setting_detail.userSms;
        setting_response.userEmailVerification = setting_detail.userEmailVerification;
        setting_response.twilio_call_masking = setting_detail.twilio_call_masking;
        setting_response.is_show_estimation_in_provider_app = setting_detail.is_show_estimation_in_provider_app;
        setting_response.is_show_estimation_in_user_app = setting_detail.is_show_estimation_in_user_app;

    } else {
        setting_response.admin_phone = setting_detail.admin_phone;
        setting_response.contactUsEmail = setting_detail.contactUsEmail;
        setting_response.ios_user_app_google_key = setting_detail.ios_user_app_google_key;
        setting_response.ios_user_app_version_code = setting_detail.ios_user_app_version_code;
        setting_response.ios_user_app_force_update = setting_detail.ios_user_app_force_update;
        setting_response.is_tip = setting_detail.is_tip;
        setting_response.scheduled_request_pre_start_minute = setting_detail.scheduled_request_pre_start_minute;
        setting_response.stripe_publishable_key = setting_detail.stripe_publishable_key;
        setting_response.userPath = setting_detail.userPath;
        setting_response.userSms = setting_detail.userSms;
        setting_response.twilio_call_masking = setting_detail.twilio_call_masking;
        setting_response.is_show_estimation_in_provider_app = setting_detail.is_show_estimation_in_provider_app;
        setting_response.is_show_estimation_in_user_app = setting_detail.is_show_estimation_in_user_app;
        
    }
    setting_response.image_base_url = setting_detail.image_base_url;


    var user_id = req.body.user_id;
    if(user_id == ''){
        user_id = null;
    }
    User.findOne({_id: user_id}).then((user_detail)=>{
        if(user_detail && user_detail.token !== req.body.token){
            res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN, setting_detail: setting_response});
        } else {
            var response = {};
            if(user_detail){
                response.first_name = user_detail.first_name;
                response.last_name = user_detail.last_name;
                response.email = user_detail.email;
                response.country_phone_code = user_detail.country_phone_code;
                response.is_document_uploaded = user_detail.is_document_uploaded;
                response.address = user_detail.address;
                response.is_approved = user_detail.is_approved;
                response.user_id = user_detail._id;
                response.social_ids = user_detail.social_ids;
                response.social_unique_id = user_detail.social_unique_id;
                response.phone = user_detail.phone;
                response.login_by = user_detail.login_by;
                response.city = user_detail.city;
                response.country = user_detail.country;
                response.referral_code = user_detail.referral_code;
                response.rate = user_detail.rate;
                response.rate_count = user_detail.rate_count;
                response.is_referral = user_detail.is_referral;
                response.token = user_detail.token;
                response.picture = user_detail.picture;
                response.wallet_currency_code = user_detail.wallet_currency_code;

                var corporate_id = null;
                if(user_detail.corporate_ids && user_detail.corporate_ids.length>0){
                    corporate_id = user_detail.corporate_ids[0].corporate_id;
                }

                Corporate.findOne({_id: corporate_id}).then((corporate_detail)=>{

                    if(corporate_detail){
                        response.corporate_detail = {
                            name: corporate_detail.name,
                            phone: corporate_detail.phone,
                            country_phone_code: corporate_detail.country_phone_code,
                            status: user_detail.corporate_ids[0].status,
                            _id: corporate_detail._id
                        }
                    }

                    Country.findOne({countryphonecode: user_detail.country_phone_code}).then((country) => {
                        if (country) {
                            response.country_detail = {"is_referral": country.is_referral}
                        } else {
                            response.country_detail = {"is_referral": false}
                        }
                        if(user_detail.current_trip_id){
                            Trip.findOne({_id: user_detail.current_trip_id}).then((trip_detail)=>{
                                response.trip_id = user_detail.current_trip_id;
                                response.provider_id = trip_detail.current_provider;
                                response.is_provider_accepted = trip_detail.is_provider_accepted;
                                response.is_provider_status = trip_detail.is_provider_status;
                                response.is_trip_end = trip_detail.is_trip_end;
                                response.is_trip_completed = trip_detail.is_trip_completed;
                                res.json({success: true, setting_detail: setting_response, user_detail: response});   
                            });
                        } else {
                            res.json({success: true, setting_detail: setting_response, user_detail: response});   
                        }
                    });
                });
            } else {
                res.json({success: true, setting_detail: setting_response})
            }
        }
    })
}


exports.user_accept_reject_corporate_request = function (req, res, next) {
    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}).then((user) => {
                if (!user) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});
                } else {
                    if (user.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        if(req.body.is_accepted){
                            var index = user.corporate_ids.findIndex((x)=>x.corporate_id==req.body.corporate_id);
                            user.user_type_id = req.body.corporate_id;
                            if(index != -1){
                                user.corporate_ids[index].status = Number(constant_json.CORPORATE_REQUEST_ACCEPTED);
                            }
                            user.markModified('corporate_ids');
                            user.save().then(()=>{
                                res.json({success: true, message: success_messages.MESSAGE_CODE_CORPORATE_REQUEST_ACCEPT_SUCCESSFULLY});
                            })
                        } else {
                            var index = user.corporate_ids.findIndex((x)=>x.corporate_id==req.body.corporate_id);
                            if(index != -1){
                                user.corporate_ids.splice(index, 1);
                            }
                            user.markModified('corporate_ids');
                            user.save().then(()=>{
                                res.json({success: true, message: success_messages.MESSAGE_CODE_CORPORATE_REQUEST_REJECT_SUCCESSFULLY});
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

exports.user_reject_corporate_request = function (req, res, next) {
    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}).then((user) => {
                if (!user) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});
                } else {
                    if (user.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        var index = user.corporate_ids.findIndex((x)=>x._id==req.body.corporate_id);
                        user.corporate_ids.splice(index, 1);
                        user.markModified('corporate_ids');
                        user.save().then(()=>{
                            res.json({success: true, message: success_messages.MESSAGE_CODE_CORPORATE_REQUEST_REJECT_SUCCESSFULLY});
                        })
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


exports.add_favourite_driver = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}).then((user) => {
                if (user) {
                    
                    user.favourite_providers.push(req.body.provider_id);
                    user.save(()=>{
                        res.json({success: true, message: success_messages.MESSAGE_CODE_ADD_FAVOURITE_DRIVER_SUCCESSFULLY});
                    }, (error)=>{

                    });
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});
                }
            });
        }
    });
}

exports.get_favourite_driver = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}).then((user) => {
                if (user) {

                    var condition = {$match: {_id: {$in: user.favourite_providers}}}
                    var project = {
                        $project: {
                            first_name: 1,
                            last_name: 1,
                            picture: 1
                        }
                    }
                    Provider.aggregate([condition, project], function(error, provider_list){
                        if(error){
                            res.json({success: true, provider_list: []});
                        } else {
                            res.json({success: true, provider_list: provider_list});
                        }
                    })

                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});
                }
            });
        }
    });
}

exports.remove_favourite_driver = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}).then((user) => {
                if (user) {

                    var index = user.favourite_providers.findIndex((x)=> (x).toString() == req.body.provider_id);
                    if(index !== -1){
                        user.favourite_providers.splice(index, 1);
                    }
                    user.save(()=>{
                        res.json({success: true, message: success_messages.MESSAGE_CODE_REMOVE_FAVOURITE_DRIVER_SUCCESSFULLY});
                    }, (error)=>{

                    });

                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});
                }
            });
        }
    });
}

exports.get_all_driver_list = function (req, res, next) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}).then((user) => {
                if (user) {
                    
                    var approved_condition = {$match: {is_approved: {$eq: 1}}}
                    var country_condition = {$match: {country_phone_code: {$eq: user.country_phone_code}}}
                    var fav_condition = {$match: {_id: {$nin: user.favourite_providers}}}
                    var search = {$match: {$or: [{email: req.body.search_value}, {phone: req.body.search_value}]}}
                    var project = {
                        $project: {
                            first_name: 1,
                            last_name: 1,
                            picture: 1
                        }
                    }

                    Provider.aggregate([approved_condition, fav_condition, country_condition, search, project]).then((provider_list)=>{
                        res.json({success: true, provider_list: provider_list});
                    });

                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});
                }
            });
        }
    });
}