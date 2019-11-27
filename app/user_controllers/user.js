var User = require('mongoose').model('User');
var crypto = require('crypto');
var utils = require('../controllers/utils');
var allemails = require('../controllers/emails');
var moment = require('moment');
var nodemailer = require('nodemailer');
var Setting = require('mongoose').model('Settings');
var Provider = require('mongoose').model('Provider');
var Trip = require('mongoose').model('Trip');
var Trip_Service = require('mongoose').model('trip_service');
var Trip_Location = require('mongoose').model('trip_location');
var Country = require('mongoose').model('Country');
var City = require('mongoose').model('City');
var User_Document = require('mongoose').model('User_Document');
var Document = require('mongoose').model('Document');
var Promo_Code = require('mongoose').model('Promo_Code');
var User_Document = require('mongoose').model('User_Document');
var User_promo_use = require('mongoose').model('User_promo_use');
var Utils = require('../controllers/utils')
require('../controllers/constant');
var moment = require('moment-timezone');
var excelbuilder = require('msexcel-builder');
var fs = require("fs");
var console = require('../controllers/console');

exports.user_register = function (req, res, next) {
    if (typeof req.session.user == 'undefined') {
        res.redirect('/');
    } else {
        res.redirect('/create_trip');
        delete message;

    }
}

exports.user_register_post = function (req, res, next) {

    if (typeof req.session.user == 'undefined') {
        var email = req.body.email;
        if (email != "" && email != undefined) {
            email = ((email).trim()).toLowerCase();
        } else {
            email = "";
        }
        req.session.type = "user";
        User.findOne({ email: email }).then((user) => {
        
            if (user && email != "") {
                if (user.user_type == constant_json.USER_TYPE_DISPATCHER) {
                    message = admin_messages.admin_messages_email_already_used;
                    res.redirect('/');
                } else if (user.login_by == 'manual') {
                    message = admin_messages.admin_messages_email_already_used;
                    res.redirect('/');
                } else {
                    message = admin_messages.admin_messages_email_already_used;
                    res.redirect('/');
                }
            } else {
              
                User.findOne({ phone: req.body.phone, country_phone_code: req.body.country_phone_code }).then((user) => {

                    if (user) {
                        message = admin_messages.admin_messages_mobile_no_already_used;
                        res.redirect('/');
                    } else {
                        if (req.body.is_referral == 0) {
                            req.body.referred_by = null;
                        }
                        //////// Generate refferal code ///////////

                        var code = req.body.country_phone_code;
                        var code_name = code.split(' ');
                        var country_code = code_name[0];
                        var country_name = "";

                        for (i = 1; i <= (code_name.length) - 1; i++) {

                            country_name = country_name + " " + code_name[i];
                        }

                        country_name = country_name.substr(1);
    
                        var cityid = req.body.city;
                        City.findById(cityid).then((city) => {
                            //  var city = city.cityname

                            var crypto = require('crypto');
                            var now = new Date(Date.now());
                            var date1 = moment(now);

                            var token = utils.tokenGenerator(32);
                            var referral_code = (utils.tokenGenerator(8)).toUpperCase();

                            var first_name = req.body.first_name;
                            first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
                            var last_name = req.body.last_name;
                            last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);

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
                                email = ((email).trim()).toLowerCase();
                            }

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
                                country_phone_code: country_code,
                                phone: req.body.phone,
                                device_token: req.body.device_token,
                                device_type: req.body.device_type,
                                bio: req.body.bio,
                                zipcode: req.body.zipcode,
                                login_by: req.body.login_by,
                                city: req.body.city,
                                token: token,
                                country: country_name,
                                referral_code: referral_code,
                                promo_count: 0,
                                is_referral: req.body.is_referral,
                                rate: 0,
                                rate_count: 0,
                                total_referrals: 0,
                                refferal_credit: req.body.refferal_credit,
                                wallet: 0,
                                social_unique_id: req.body.social_id,
                                wallet_currency_code: "",
                                is_use_wallet: 0,
                                user_type: Number(constant_json.USER_TYPE_NORMAL),
                                user_type_id: null,
                                is_approved: 1,
                                is_document_uploaded: 0,
                                picture: "",
                                referred_by: req.body.referred_by
                            });

                            /////////// FOR IMAGE ///////////
                            var pictureData = req.body.pictureData;
                            if (pictureData != "" && pictureData != undefined) {
                                var image_name = user._id + utils.tokenGenerator(4);
                                var url = utils.getImageFolderPath(req, 1) + image_name + '.jpg';
                                user.picture = url;
                                //utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 1);

                                pictureData = pictureData.split(',')
                                pictureData = pictureData[1]
                                req.body.pictureData = pictureData;
                                utils.saveImageAndGetURL(image_name, req, res, 1);

                            }
                            if (req.body.login_by == 'manual') {
                                var crypto = require('crypto');
                                var password = req.body.password;
                                var hash = crypto.createHash('md5').update(password).digest('hex');
                                user.password = hash;
                            }

                            Country.findOne({ countryname: user.country }, { "countryname": 1, "countryphonecode": 1, "phone_number_length": 1, "flag_url": 1, "currencycode": 1, "is_referral": 1 }).then((country) => {

                                if (country) {
                                    var currencycode = country.currencycode;
                                    user.wallet_currency_code = currencycode;
                                    user.save().then((admins) => {
                                    }, (err) => {
                                        console.log(err);
                                    });

                                } else {
                                    user.wallet_currency_code = setting_detail.adminCurrencyCode;
                                    user.save().then((admins) => {
                                    }, (err) => {
                                        console.log(err);
                                    });
                                }

                                if (country) {
                                    var country_id = country._id;
                                    Document.find({ countryid: country_id, type: 0 }).then((document) => {

                                        var is_document_uploaded = 0;

                                        var document_size = document.length;

                                        if (document_size !== 0) {

                                            var count = 0;
                                            for (var i = 0; i < document_size; i++) {

                                                if (document[i].option == 0) {
                                                    count++;
                                                } else {
                                                    break;
                                                }
                                            }

                                            if (count == document_size) {
                                                is_document_uploaded = 1;
                                            }


                                            document.forEach(function (entry) {
                                                var userdocument = new User_Document({
                                                    user_id: user._id,
                                                    document_id: entry._id,
                                                    name: entry.title,
                                                    option: entry.option,
                                                    document_picture: "",
                                                    unique_code: entry.unique_code,
                                                    expired_date: "",
                                                    is_unique_code: entry.is_unique_code,
                                                    is_expired_date: entry.is_expired_date,
                                                    is_uploaded: 0

                                                });
                                                userdocument.save().then(() => {
                                                }, (err) => {
                                                    console.log(err);
                                                });
                                            });

                                        } else {
                                            is_document_uploaded = 1;
                                        }

                                        user.is_document_uploaded = is_document_uploaded;
                                        user.save().then(() => {
                                            var email_notification = setting_detail.email_notification;

                                            if (email_notification == true) { 
                                                allemails.sendProviderRegisterEmail(req, user, user.first_name + " " + user.last_name);
                                            }
                                            req.session.user = user;
                                            res.redirect('/login');
                                        }, (err) => {
                                            utils.error_response(err, res)
                                        });
                                    });
                                }
                            });
                        });
                    }
                });
            }

        });
    }
}

exports.user_login = function (req, res, next) {
    var vehicle_accesibility = VEHICLE_ACCESIBILITY;
    if (typeof req.session.user == 'undefined') {
        res.redirect('/');
    } else {
        res.redirect('/create_trip', { vehicle_accesibility: vehicle_accesibility });

    }

}

exports.landing = function (req, res, next) {
    Country.find({}).then((country) => {

        page_type = 0;
        res.render('user_login', { country: country, setting_data: setting_detail, type: req.session.type, phone_number_length: 10, phone_number_min_length: 8 });
        delete message;

    });
}



exports.user_social_login_web = function (req, res, next) {

    User.findOne({ social_unique_id: req.body.social_unique_id }).then((user) => {

        if (user) {
            var token = utils.tokenGenerator(32);
            user.token = token;

            var device_token = "";
            var device_type = "";
            if (user.device_token != "" && user.device_token != req.body.device_token) {
                device_token = user.device_token;
                device_type = user.device_type;
            }


            user.device_type = req.body.device_type;
            user.login_by = req.body.login_by;
            user.save().then(() => {

                if (device_token != "") {
                    utils.sendPushNotification(constant_json.USER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_USER_LOGIN_IN_OTHER_DEVICE, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                }
                req.session.user = user;
                message = admin_messages.success_message_login;

                Trip.findOne({ user_id: user._id, is_trip_cancelled: 0, is_trip_completed: 0 }).then((trip) => {

                    if (trip) {
                        res.json({ success: true, url: 'history' });
                    } else {
                        res.json({ success: true, url: 'create_trip' });
                    }
                });

            }, (err) => {
                utils.error_response(err, res)
            });
        } else {
            message = admin_messages.admin_messages_email_not_registered;
            res.json({ success: false })
        }
    })
}

exports.user_login_post = function (req, res, next) {
   
    var vehicle_accesibility = VEHICLE_ACCESIBILITY;
    if (typeof req.session.user == 'undefined') {

        req.session.type = "user";
        var email = req.body.email;
        if (email != undefined) {
            email = ((req.body.email).trim()).toLowerCase();
        }
        ////// for remove case cencitive ///////
        //var email = new RegExp(req.body.email, 'i');

        // var query = {$or: [{'email': email}, {'phone': email}]};
        User.findOne({ phone: req.body.phone }).then((user) => {
            if (!user) {
                message = admin_messages.error_message_phone_not_registered;
                res.render('user-login-form');
            } else {
                var password = req.body.password;
                var hash = crypto.createHash('md5').update(password).digest('hex');
                if (user.password != hash) {
                    message = admin_messages.error_message_password_wrong;
                    res.render('user-login-form');
                } else if (user.is_approved != 1) {
                    message = admin_messages.not_approved_by_admin;
                    res.render('user-login-form');
                } else {
                    req.session.user = user;
                    ////////////  token generate /////
                    message = admin_messages.success_message_login;
                    Trip.findOne({ user_id: user._id, is_trip_cancelled: 0, is_trip_completed: 0 }).then((trip) => {

                        if (trip) {
                            res.redirect('/history');
                        } else {
                            res.redirect('/create_trip');
                        }
                    });
                }
            }
        });
    } else {
        res.redirect('/create_trip');
    }
};

exports.change_password = function (req, res, next) {
    var id = req.body.id;
    if (req.body.type == 1) {
        User.findById(id).then((user_detail) => {

            var password = req.body.old_password;
            var hash = crypto.createHash('md5').update(password).digest('hex');
            if (user_detail.password == hash) {
                var new_password = req.body.confirm_password;
                var hash = crypto.createHash('md5').update(new_password).digest('hex');
                user_detail.password = hash;
                user_detail.save().then((admins) => {
                }, (err) => {
                    console.log(err);
                });
                message = admin_messages.success_message_password_update;
                res.redirect('/profiles')
            } else {
                message = admin_messages.error_message_password_wrong;
                res.redirect('/profiles')
            }
        });
    } else if (req.body.type == 2) {
        Provider.findById(id).then((provider_detail) => {

            var password = req.body.old_password;
            var hash = crypto.createHash('md5').update(password).digest('hex');
            if (provider_detail.password == hash) {
                var new_password = req.body.confirm_password;
                var hash = crypto.createHash('md5').update(new_password).digest('hex');
                provider_detail.password = hash;
                provider_detail.save().then((admins) => {
                }, (err) => {
                    console.log(err);
                });
                message = admin_messages.success_message_password_update;
                res.redirect('/provider_profiles')
            } else {
                message = admin_messages.error_message_password_wrong;
                res.redirect('/provider_profiles')
            }
        });
    }
}

exports.forgot_password = function (req, res, next) {

    if (typeof req.session.user == 'undefined') {
        res.redirect('/');
    } else {
        res.redirect('/create_trip');
    }
}

// exports.forgot_psw_email = function (req, res, next) {
//     console.log(req.body);
//     if (typeof req.session.user == 'undefined') {
//         console.log("----111-----");
//         req.session.type = "user";
//          // var query = {$or: [{'email': email}, {'phone': email}]};
//         User.findOne({email: req.body.email}).then((response) => { 
//             if (response) {
//                 console.log("----111-----");
//                 function TokenGenerator(length) {
//                     if (typeof length == "undefined")
//                         length = 32
//                     var token = "";
//                     var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//                     for (var i = 0; i < length; i++)
//                         token += possible.charAt(Math.floor(Math.random() * possible.length));
//                     return token;
//                 }
//                 console.log("----111-----");
//                 var token = TokenGenerator(32);
//                 var id = response.id;
//                 var link = req.protocol + '://' + req.get('host') + '/user_newpassword?id=' + id + '&&token=' + token;


//                 var ejs = require('ejs');

//                 Utils.mail_notification(response.email, config_json.reset_password, link, '');


//                 User.findOneAndUpdate({_id: id}, {token: token}).then((response) => { 
//                     console.log("----111-----");
//                     message = admin_messages.success_message_send_link;
//                     res.redirect("/login");

//                 });

//             } else {
//                 console.log("----111-----");
//                 message = admin_messages.admin_messages_email_not_registered;
//                 res.redirect('/user_forgot_password');
//             }
//         });
//     } else {
//         res.redirect('/create_trip');
//     }
// }


exports.forgot_psw_email = function (req, res, next) {
    // console.log("-----Forgot password Email--------");
     var email = req.body.email;
     var query = {$or: [{'email': email}, {'phone': email}]};

    if (req.body.type == "user") {
        req.session.type = "user";
        User.findOne(query).then((user) => {
            if (user) {
                var new_password = utils.generatePassword(6);
                user.password = utils.encryptPassword(new_password);
                user.save().then(() => {
                });
                var phoneWithCode = user.country_phone_code + user.phone;
                utils.sendSmsForOTPVerificationAndForgotPassword(phoneWithCode, 3, new_password);
                allemails.userForgotPassword(req, user, new_password);

                admin_messages.success_message_password_update;
                res.redirect("/login");

            } else {
                message = admin_messages.admin_messages_email_not_registered;
                res.redirect('/forgot_password_user');
            }
        });
    } else {
        req.session.type = "provider";
        Provider.findOne(query).then((provider) => {
            if (provider) {
                var new_password = utils.generatePassword(6);
                provider.password = utils.encryptPassword(new_password);
                provider.save().then(() => {
                });
                var phoneWithCode = provider.country_phone_code + provider.phone;
                utils.sendSmsForOTPVerificationAndForgotPassword(phoneWithCode, 3, new_password);
                allemails.providerForgotPassword(req, provider, new_password);

                admin_messages.success_message_password_update;
                res.redirect("/login");
            } else {
                message = admin_messages.admin_messages_email_not_registered;
                res.redirect('/forgot_password_provider');
            }
        });
    }
}

exports.edit_psw = function (req, res) {

    if (typeof req.session.user == 'undefined') {
        var id = req.query.id;
        var token = req.query.token;
        res.render('user_new_password', { 'id': id, 'token': token });
        delete message;
    } else {
        res.redirect('/create_trip');
    }
};

exports.update_psw = function (req, res) {

    if (typeof req.session.user == 'undefined') {
        var query = {};
        query['_id'] = req.body.id;
        query['token'] = req.body.token;

        var password = req.body.password;
        var hash = crypto.createHash('md5').update(password).digest('hex');

        function TokenGenerator(length) {
            if (typeof length == "undefined")
                length = 32
            var token = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for (var i = 0; i < length; i++)
                token += possible.charAt(Math.floor(Math.random() * possible.length));
            return token;
        }
        var token = TokenGenerator(32);

        User.findOneAndUpdate(query, { password: hash, token: token }).then((response) => {

            if (!response) {
                message = admin_messages.admin_messages_token_expired;
                res.redirect('/user_forgot_password');
            } else {
                message = admin_messages.success_message_password_update;
                res.redirect('/login');
            }
        });
    } else {
        res.redirect('/create_trip');
    }
};


exports.user_trip_map = function (req, res, next) {

    if (typeof req.session.user == 'undefined') {

        res.redirect('/login');
    } else {
        var id = req.body.id;
        var user_name = req.body.u_name;
        var provider_name = req.body.pr_name;
        var query = {};
        query['tripID'] = id;

        Trip.findById(id).then((trips) => {

            Trip_Location.findOne(query).then((locations) => {

                var url = "https://maps.googleapis.com/maps/api/js?key=" + setting_detail.web_app_google_key + "&libraries=places&callback=initialize"

                if (!locations) {
                    res.render('user_trip_map', { 'data': trips, 'url': url, 'user_name': user_name, 'provider_name': provider_name, 'moment': moment });

                } else {
                    res.render('user_trip_map', { 'data': trips, 'url': url, 'trip_path_data': locations, 'user_name': user_name, 'provider_name': provider_name, 'moment': moment });
                }
            });

        });

    }
}

exports.user_profile = function (req, res) {
    if (typeof req.session.user != "undefined") {
        callingCountries = require('country-data').callingCountries;
        User.findById(req.session.user._id).then((response) => {

            Country.findOne({ countryname: response.country }).then((country_detail) => {

                var is_public_demo = setting_detail.is_public_demo;
                res.render("user_profile", { country: callingCountries.all, phone_number_min_length: country_detail.phone_number_min_length, phone_number_length: country_detail.phone_number_length, is_public_demo: is_public_demo, login1: response });
                delete message
            });
        });
    } else {
        res.redirect('/login');
    }
};

exports.user_profile_update = function (req, res) {

    if (typeof req.session.user != "undefined") {

        var id = req.body.id
        User.findOne({ phone: req.body.phone, country_phone_code: req.body.country_phone_code, _id: { $ne: id } }).then((user) => {
            if (user) {
                message = admin_messages.admin_messages_mobile_no_already_used;
                res.redirect('/profiles')
            } else {
                User.findById(id).then((user_detail) => {

                    var password = req.body.old_password;
                    var hash = crypto.createHash('md5').update(password).digest('hex');
                    if (user_detail.password == hash) {
                        var picture = req.body.pictureData;

                        if (picture != "") {

                            utils.deleteImageFromFolder(user_detail.picture, 1);
                            var image_name = user_detail._id + utils.tokenGenerator(4);
                            //var url = utils.getImageFolderPath(req, 1) + image_name + '.jpg';
                            //req.body.picture=url;
                            file_data_path = url;
                            //utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 1);
                            picture = picture.split(',')
                            picture = picture[1]
                            var url = utils.getImageFolderPath(req, 1) + image_name + '.jpg';

                            req.body.pictureData = picture;
                            req.body.picture = url;
                            utils.saveImageAndGetURL(image_name, req, res, 1);


                            User.findByIdAndUpdate(id, req.body, { new: true }).then((user) => {
                                message = admin_messages.success_message_profile_update;
                                req.session.user = user;
                                res.redirect('/profiles')
                            });
                        } else {
                            User.findByIdAndUpdate(id, req.body, { new: true }).then((user) => {
                                message = admin_messages.success_message_profile_update;
                                req.session.user = user;
                                res.redirect('/profiles')
                            });
                        }
                    } else {
                        message = admin_messages.error_message_password_wrong;
                        res.redirect('/profiles')
                    }

                })
            }
        })
    } else {

        res.redirect('/login');
    }
}

exports.check_promocode = function (req, res, next) {
    User.findOne({ _id: req.body.user_id }, function (err, user) {

        if (user) {
            var now = new Date(Date.now());
            Country.findOne({ countryname: req.body.country }).then((country_detail) => {

                if (!country_detail) {
                    res.json({ success: false, error_code: admin_messages.ERROR_CODE_INVALID_PROMO_CODE });
                } else {
                    var country_id = country_detail._id;
                    var promo_code = req.body.promocode;
                    promo_code = promo_code.toUpperCase();
                    Promo_Code.findOne({ promocode: promo_code, state: 1, countryid: country_id, start_date: { $lte: now }, code_expiry: { $gte: now } }).then((promocode) => {

                        if (promocode) {
                            if (promocode.user_used_promo < promocode.code_uses) {
                                User_promo_use.findOne({ user_id: req.body.user_id, promo_id: promocode._id }).then((used_promo_data) => {
                                    if (used_promo_data) {
                                        res.json({ success: false, error_code: error_message.ERROR_CODE_PROMOTIONAL_CODE_ALREADY_USED });
                                    } else {
                                        City.findOne({ cityname: req.body.city }).then((citydetail) => {

                                            if (!citydetail) {
                                                res.json({ success: false, error_code: error_message.ERROR_CODE_INVALID_PROMO_CODE });
                                            } else {

                                                var cityid = citydetail._id;
                                                var countryid = country_detail._id;
                                                var promo_apply_for_cash = citydetail.isPromoApplyForCash;
                                                var promo_apply_for_card = citydetail.isPromoApplyForCard;
                                                var is_promo_apply = 0;
                                                if (req.body.payment_mode == constant_json.PAYMENT_MODE_CASH && promo_apply_for_cash == constant_json.YES) {
                                                    is_promo_apply = 1;
                                                } else if (req.body.payment_mode == constant_json.PAYMENT_MODE_CARD && promo_apply_for_card == constant_json.YES) {
                                                    is_promo_apply = 1;
                                                }

                                                if (is_promo_apply) {

                                                    if (promocode.cityid.indexOf(cityid) !== -1 && promocode.countryid.equals(countryid)) {
                                                        res.json({ success: true, promocode: promocode });
                                                    } else {
                                                        res.json({ success: false, error_code: error_message.ERROR_CODE_PROMO_CODE_NOT_FOR_YOUR_AREA });
                                                    }
                                                } else {
                                                    res.json({ success: false, error_code: error_message.ERROR_CODE_PROMO_CODE_NOT_APPLY_ON_YOUR_PAYMENT_MODE });
                                                }
                                            }
                                        });
                                    }
                                });
                            } else {
                                res.json({ success: false, error_code: error_message.ERROR_CODE_PROMO_CODE_EXPIRED_OR_INVALID });
                            }
                        } else {

                            res.json({ success: false, error_code: error_message.ERROR_CODE_INVALID_PROMO_CODE });
                        }

                    });
                }
            });

        } else {
            res.json({ success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND });

        }
    });
};

exports.user_update_documentpanel = function (req, res, next) {
    if (typeof req.session.user != 'undefined') {
        var pictureData = req.files;
        var j = 0;
        User.findOne({ _id: req.session.user._id }).then((user_detail) => {
            if (user_detail) {

                if (pictureData.length > 0 && pictureData != "undefined") {
                    for (var i = 0; i < pictureData.length; i++) {
                        User_Document.findOne({ _id: req.files[i].fieldname, user_id: user_detail._id }).then((userdocument) => {
                            if (userdocument) {

                                utils.deleteImageFromFolder(userdocument.document_picture, 3);
                                var image_name = userdocument._id + utils.tokenGenerator(4);
                                var url = utils.getImageFolderPath(req, 3) + image_name + '.jpg';
                                userdocument.document_picture = url;
                                utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 3);


                                userdocument.is_uploaded = 1;
                                userdocument.unique_code = req.body.unique_code;
                                userdocument.expired_date = req.body.expired_date;
                                userdocument.is_document_expired = false;
                                userdocument.save().then(() => {
                                }, (err) => {
                                    console.log(err);
                                });
                                j++;
                                if (j == pictureData.length) {
                                    User_Document.find({ user_id: req.session.user._id, option: 1, is_uploaded: 0 }).then((document_list) => {

                                        if (document_list.length == 0) {
                                            user_detail.is_document_uploaded = 1;
                                            user_detail.save().then((admins) => {
                                            }, (err) => {
                                                console.log(err);
                                            });
                                            res.redirect('/user_document_panel');
                                        } else {
                                            user_detail.is_document_uploaded = 0;
                                            user_detail.save().then((admins) => {
                                            }, (err) => {
                                                console.log(err);
                                            });
                                            res.redirect('/user_document_panel');
                                        }
                                    });
                                }
                            } else {
                                res.redirect('/user_document_panel');
                            }
                        });
                    }
                } else {
                    res.redirect('/user_document_panel');
                }
            } else {
                res.redirect('/user_document_panel');
            }
        });
    } else {
        res.redirect('/login');
    }
}
exports.user_document_panel = function (req, res, next) {
    if (typeof req.session.user != 'undefined') {
        User_Document.find({ user_id: req.session.user._id }).then((userdocument) => {

            res.render('user_document_panel', { 'data': userdocument, 'moment': moment });

        });
    } else {
        res.redirect('/login');
    }
}

exports.change_password = function (req, res, next) {
    var id = req.body.id;
    if (req.body.type == 1) {
        User.findById(id).then((user_detail) => {

            var password = req.body.old_password;
            var hash = crypto.createHash('md5').update(password).digest('hex');
            if (user_detail.password == hash) {
                var new_password = req.body.confirm_password;
                var hash = crypto.createHash('md5').update(new_password).digest('hex');
                user_detail.password = hash;
                user_detail.save();
                message = admin_messages.success_message_password_update;
                res.redirect('/profiles')
            } else {
                message = admin_messages.error_message_password_wrong;
                res.redirect('/profiles')
            }
        });
    } else if (req.body.type == 2) {
        Provider.findById(id).then((provider_detail) => {

            var password = req.body.old_password;
            var hash = crypto.createHash('md5').update(password).digest('hex');
            if (provider_detail.password == hash) {
                var new_password = req.body.confirm_password;
                var hash = crypto.createHash('md5').update(new_password).digest('hex');
                provider_detail.password = hash;
                provider_detail.save();
                message = admin_messages.success_message_password_update;
                res.redirect('/provider_profiles')
            } else {
                message = admin_messages.error_message_password_wrong;
                res.redirect('/provider_profiles')
            }
        });
    }
}

exports.apply_referral_code = function (req, res, next) {

    User.findOne({ referral_code: req.body.referral_code }).then((userData) => {
        if (!userData) {

            res.json({ success: false, error_code: error_message.ERROR_CODE_REFERRAL_CODE_INVALID });
        } else if (userData.country != req.body.country) {

            res.json({ success: false, error_code: error_message.ERROR_CODE_YOUR_FRIEND_COUNTRY_NOT_MATCH_WITH_YOU });
        } else {

            var referral_code = req.body.referral_code;

            Country.findOne({ countryname: req.body.country }).then((country) => {

                var refered_user = country.bonus_to_userreferral;
                var userRefferalCount = userData.total_referrals;
                if (userRefferalCount < country.userreferral) {
                    userData.total_referrals = +userData.total_referrals + 1;
                    userData.refferal_credit = userData.refferal_credit + +country.bonus_to_userreferral;
                    userData.save().then((admins) => {
                    }, (err) => {
                        console.log(err);
                    });
                    // user.is_referral = 1;
                    // user.referred_by = userData._id;
                    // user.refferal_credit = user.refferal_credit + +country.referral_bonus_to_user;
                    // user.save(function (err) {

                    // if (err) {
                    //     res.json({success: false, error_code: process.env.ERROR_CODE_PROBLEM_IN_APPLY_REFERRAL});
                    // } else {
                    res.json({
                        success: true,
                        message: success_messages.MESSAGE_CODE_REFERRAL_PROCESS_SUCCESSFULLY_COMPLETED,
                        is_referral: 1,
                        referred_by: userData._id,
                        refferal_credit: country.referral_bonus_to_user
                    });
                    //}

                    //});
                } else {

                    res.json({ success: false, error_code: error_message.ERROR_CODE_YOU_HAVE_ALREADY_APPLY_REFERRAL_CODE });
                }

            });


        }

    });

};


exports.user_sign_out = function (req, res, next) {

    delete req.session.user;
    delete user;
    req.session.type = "user";
    res.redirect('/login');
};



exports.user_documents_edit = function (req, res) {

    if (typeof req.session.user != 'undefined') {

        User_Document.findById(req.body.id).then((provider_document) => {

            res.render('user_documents_edit', { detail: provider_document, moment: moment });
            delete message;

        });
    } else {
        res.redirect('/login');
    }
};

exports.user_documents_update = function (req, res) {

    if (typeof req.session.user != 'undefined') {
        User_Document.findById(req.body.id).then((provider_document) => {

            var id = provider_document.provider_id;

            provider_document.expired_date = req.body.expired_date;
            provider_document.unique_code = req.body.unique_code;

            message = admin_messages.success_update_document;
            if (req.files.length > 0) {
                var image_name = provider_document.provider_id + utils.tokenGenerator(4);
                var url = utils.getImageFolderPath(req, 3) + image_name + '.jpg';
                utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 3);

                provider_document.document_picture = url;
                provider_document.is_uploaded = 1;
                provider_document.save().then(() => {
                    res.redirect('/user_document_panel');
                    delete message;
                }, (err) => {
                    utils.error_response(err, res)
                });
            } else {
                provider_document.save().then(() => {
                    res.redirect('/user_document_panel');
                    delete message;
                }, (err) => {
                    utils.error_response(err, res)
                });

            }

        });
    } else {
        res.redirect('/login');
    }
};


exports.generate_user_history_export_excel = function (req, res, next) {
    if (typeof req.session.user != 'undefined') {
        var j = 1;
        var array = [];


        if (req.body.search_item == undefined) {
            var request = req.path.split('/')[1];
            search_item = 'unique_id';
            search_value = '';
            sort_order = -1;
            sort_field = 'unique_id';
            filter_start_date = '';
            filter_end_date = '';

        } else {
            var request = req.body.request;
            var item = req.body.search_item;
            var value = req.body.search_value;
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');
            value = new RegExp(value, 'i');

            var field = req.body.sort_item[0];
            var order = req.body.sort_item[1];

            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
            search_item = req.body.search_item
            search_value = req.body.search_value;
            filter_start_date = req.body.start_date;
            filter_end_date = req.body.end_date;

        }

        if (req.body.start_date == '' || req.body.end_date == '') {
            if (req.body.start_date == '' && req.body.end_date == '') {
                var date = new Date(Date.now());
                date = date.setHours(0, 0, 0, 0);
                start_date = new Date(0);
                end_date = new Date(Date.now());
            } else if (req.body.start_date == '') {
                start_date = new Date(0);
                var end_date = req.body.end_date;
                end_date = new Date(end_date);
                end_date = end_date.setHours(23, 59, 59, 999);
                end_date = new Date(end_date);
            } else {
                var start_date = req.body.start_date;
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(Date.now());
            }
        } else if (req.body.start_date == undefined || req.body.end_date == undefined) {
            start_date = new Date(0);
            end_date = new Date(Date.now());
        } else {
            var start_date = req.body.start_date;
            var end_date = req.body.end_date;
            start_date = new Date(start_date);
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
            end_date = new Date(end_date);
            end_date = end_date.setHours(23, 59, 59, 999);
            end_date = new Date(end_date);
        }

        var number_of_rec = 10;

        var lookup = {
            $lookup:
            {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user_detail"
            }
        };
        var unwind = { $unwind: "$user_detail" };

        var lookup1 = {
            $lookup:
            {
                from: "providers",
                localField: "confirmed_provider",
                foreignField: "_id",
                as: "provider_detail"
            }
        };

        var unwind1 = { $unwind: "$provider_detail" };

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        if (search_item == "unique_id") {

            var query1 = {};
            if (value != "") {
                value = Number(value)
                query1[search_item] = { $eq: value };
                var search = { "$match": query1 };
            } else {
                var search = { $match: {} };
            }

        } else if (search_item == "provider_detail.first_name") {
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[search_item] = { $regex: new RegExp(value, 'i') };
                query2['provider_detail.last_name'] = { $regex: new RegExp(value, 'i') };

                var search = { "$match": { $or: [query1, query2] } };
            } else {

                query1[search_item] = { $regex: new RegExp(value, 'i') };
                query2['provider_detail.last_name'] = { $regex: new RegExp(value, 'i') };
                query3[search_item] = { $regex: new RegExp(full_name[0], 'i') };
                query4['provider_detail.last_name'] = { $regex: new RegExp(full_name[0], 'i') };
                query5[search_item] = { $regex: new RegExp(full_name[1], 'i') };
                query6['provider_detail.last_name'] = { $regex: new RegExp(full_name[1], 'i') };

                var search = { "$match": { $or: [query1, query2, query3, query4, query5, query6] } };
            }
        } else {
            var search = { "$match": { search_item: { $regex: new RegExp(value, 'i') } } };
        }


        query1['created_at'] = { $gte: start_date, $lt: end_date };
        var filter = { "$match": query1 };

        var sort = { "$sort": {} };
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = { $group: { _id: null, total: { $sum: 1 }, data: { $push: '$data' } } };

        var mongoose = require('mongoose');
        var Schema = mongoose.Types.ObjectId;
        var condition = { $match: { 'user_id': { $eq: Schema(req.session.user._id) } } };
        Trip.aggregate([condition, lookup, unwind, lookup1, search, filter, sort]).then((array) => {

            var date = new Date()
            var time = date.getTime()
            var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_user_history.xlsx');

            var sheet1 = workbook.createSheet('sheet1', 10, array.length + 1);

            sheet1.set(1, 1, config_json.title_id);
            sheet1.set(2, 1, config_json.title_user_id);
            sheet1.set(3, 1, config_json.title_user);
            sheet1.set(4, 1, config_json.title_provider_id);
            sheet1.set(5, 1, config_json.title_provider);
            sheet1.set(6, 1, config_json.title_date);
            sheet1.set(7, 1, config_json.title_status);
            sheet1.set(8, 1, config_json.title_amount);
            sheet1.set(9, 1, config_json.title_payment);
            sheet1.set(10, 1, config_json.title_payment_status);

            array.forEach(function (data, index) {

                sheet1.set(1, index + 2, data.unique_id);
                sheet1.set(2, index + 2, data.user_detail.unique_id);
                sheet1.set(3, index + 2, data.user_detail.first_name + ' ' + data.user_detail.last_name);
                if (data.provider_detail.length > 0) {
                    sheet1.set(4, index + 2, data.provider_detail[0].unique_id);
                    sheet1.set(5, index + 2, data.provider_detail[0].first_name + ' ' + data.provider_detail[0].last_name);
                }
                sheet1.set(6, index + 2, moment(data.created_at).format("DD MMM 'YY") + ' ' + moment(data.created_at).format("hh:mm a"));



                if (data.is_trip_cancelled == 1) {
                    if (data.is_trip_cancelled_by_provider == 1) {
                        sheet1.set(7, index + 2, config_json.title_total_cancelled_by_provider);

                    } else if (data.is_trip_cancelled_by_user == 1) {
                        sheet1.set(7, index + 2, config_json.title_total_cancelled_by_user);
                    } else {
                        sheet1.set(7, index + 2, config_json.title_total_cancelled);

                    }
                } else {

                    if (data.is_provider_status == 2) {
                        sheet1.set(7, index + 2, config_json.title_trip_status_coming);

                    } else if (data.is_provider_status == 4) {
                        sheet1.set(7, index + 2, config_json.title_trip_status_arrived);

                    } else if (data.is_provider_status == 6) {
                        sheet1.set(7, index + 2, config_json.title_trip_status_started);

                    } else if (data.is_provider_status == 9) {
                        sheet1.set(7, index + 2, config_json.title_trip_status_completed);

                    } else if (data.is_provider_status == 1 || data.is_provider_status == 0) {
                        if (data.is_provider_accepted == 1) {
                            sheet1.set(7, index + 2, config_json.title_trip_status_accepted);
                        } else {
                            sheet1.set(7, index + 2, config_json.title_trip_status_waiting);

                        }
                    }
                }
                sheet1.set(8, index + 2, data.total);

                if (data.payment_mode == 1) {
                    sheet1.set(9, index + 2, config_json.title_pay_by_cash);
                } else {
                    sheet1.set(9, index + 2, config_json.title_pay_by_card);
                }

                if (data.is_pending_payments == 1) {

                    sheet1.set(10, index + 2, config_json.title_pending);
                } else {

                    if (data.is_paid == 1) {
                        sheet1.set(10, index + 2, config_json.title_paid);
                    } else {
                        sheet1.set(10, index + 2, config_json.title_not_paid);
                    }
                }



                if (index == array.length - 1) {
                    workbook.save(function (err) {
                        if (err) {
                            workbook.cancel();
                        } else {
                            var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_user_history.xlsx"
                            res.json(url);
                            setTimeout(function () {
                                fs.unlink('data/xlsheet/' + time + '_user_history.xlsx', function (err, file) {
                                });
                            }, 10000)
                        }
                    });
                }

            });
        }, (err) => {
            utils.error_response(err, res)

        });

    } else {
        res.redirect('/login');
    }
};


exports.generate_user_future_trip_export_excel = function (req, res, next) {

    if (typeof req.session.user == 'undefined') {

        res.redirect('/login');

    } else {
        var j = 1;
        var array = [];


        if (req.body.search_item == undefined) {
            var request = req.path.split('/')[1];
            search_item = 'unique_id';
            search_value = '';
            sort_order = -1;
            sort_field = 'unique_id';
            filter_start_date = '';
            filter_end_date = '';

        } else {
            var request = req.body.request;
            var item = req.body.search_item;
            var value = req.body.search_value;
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');
            value = new RegExp(value, 'i');

            var field = req.body.sort_item[0];
            var order = req.body.sort_item[1];

            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
            search_item = req.body.search_item
            search_value = req.body.search_value;
            filter_start_date = req.body.start_date;
            filter_end_date = req.body.end_date;

        }

        if (req.body.start_date == '' || req.body.end_date == '') {
            if (req.body.start_date == '' && req.body.end_date == '') {
                var date = new Date(Date.now());
                date = date.setHours(0, 0, 0, 0);
                start_date = new Date(0);
                end_date = new Date(Date.now());
            } else if (req.body.start_date == '') {
                start_date = new Date(0);
                var end_date = req.body.end_date;
                end_date = new Date(end_date);
                end_date = end_date.setHours(23, 59, 59, 999);
                end_date = new Date(end_date);
            } else {
                var start_date = req.body.start_date;
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(Date.now());
            }
        } else if (req.body.start_date == undefined || req.body.end_date == undefined) {
            start_date = new Date(0);
            end_date = new Date(Date.now());
        } else {
            var start_date = req.body.start_date;
            var end_date = req.body.end_date;
            start_date = new Date(start_date);
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
            end_date = new Date(end_date);
            end_date = end_date.setHours(23, 59, 59, 999);
            end_date = new Date(end_date);
        }

        var number_of_rec = 10;

        var lookup = {
            $lookup:
            {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user_detail"
            }
        };
        var unwind = { $unwind: "$user_detail" };



        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        if (search_item == "unique_id") {

            var query1 = {};
            if (value != "") {
                value = Number(value)
                query1[search_item] = { $eq: value };
                var search = { "$match": query1 };
            } else {
                var search = { $match: {} };
            }

        } else {
            var search = { "$match": { search_item: { $regex: new RegExp(value, 'i') } } };
        }


        query1['created_at'] = { $gte: start_date, $lt: end_date };
        var filter = { "$match": query1 };

        var sort = { "$sort": {} };
        sort["$sort"][sort_field] = parseInt(sort_order);


        var mongoose = require('mongoose');
        var Schema = mongoose.Types.ObjectId;
        var condition = { $match: { 'user_id': { $eq: Schema(req.session.user._id) } } };
        var condition1 = { $match: { 'is_schedule_trip_cancelled': { $eq: 0 } } };
        var condition2 = { $match: { 'is_trip_created': { $eq: 0 } } };

        ScheduledTrip.aggregate([condition, condition1, condition2, lookup, unwind, search, filter, sort]).then((array) => {

            var date = new Date();
            var time = date.getTime();
            var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_user_schedule_trip.xlsx');

            var sheet1 = workbook.createSheet('sheet1', 10, array.length + 1);

            sheet1.set(1, 1, "ID");
            sheet1.set(2, 1, "USER");
            sheet1.set(3, 1, "PICKUP ADDRESS");
            sheet1.set(4, 1, "DESTINATION ADDRESS");
            sheet1.set(5, 1, "TIME ZONE");
            sheet1.set(6, 1, "REQUEST CREATION TIME");
            sheet1.set(7, 1, "STATUS");
            sheet1.set(8, 1, "PAYMENT");

            array.forEach(function (data, index) {

                sheet1.set(1, index + 2, data.unique_id);
                sheet1.set(2, index + 2, data.user_detail.first_name + ' ' + data.user_detail.last_name);
                sheet1.set(3, index + 2, data.source_address);
                sheet1.set(4, index + 2, data.destination_address);
                sheet1.set(5, index + 2, data.timezone);
                sheet1.set(6, index + 2, moment(data.created_at).format("DD MMM 'YY") + ' ' + moment(data.created_at).format("hh:mm a"));



                if (data.is_trip_created == 1) {
                    sheet1.set(7, index + 2, "Created");
                } else {
                    sheet1.set(7, index + 2, "Pending");
                }

                if (data.payment_mode == 1) {
                    sheet1.set(8, index + 2, config_json.title_pay_by_cash);
                } else {
                    sheet1.set(8, index + 2, config_json.title_pay_by_card);
                }





                if (index == array.length - 1) {
                    workbook.save(function (err) {
                        if (err) {
                            workbook.cancel();
                        } else {
                            var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_user_schedule_trip.xlsx"
                            res.json(url);
                            setTimeout(function () {
                                fs.unlink('data/xlsheet/' + time + '_user_schedule_trip.xlsx', function (err, file) {
                                });
                            }, 10000)
                        }
                    });
                }

            })

        }, (err) => {
            utils.error_response(err, res)
        });
    }
}