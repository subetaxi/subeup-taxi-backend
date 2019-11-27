var utils = require('../controllers/utils');
var admin = require('mongoose').model('admin');
var randomstring = require("randomstring");
var Settings = require('mongoose').model('Settings');
var array = [];
var crypto = require('crypto');
var console = require('../controllers/console');

var URL_ARRAY = [
    {value: 'today_requests', label: 'Today Request'},
    {value: 'requests', label: 'Request'},
    {value: 'trip_map', label: 'Trip Map'},
    {value: 'trip_invoice', label: 'Trip Invoice'},
    {value: 'chat_history', label: 'Chat History'},
    {value: 'schedules', label: 'Schedule Request'},
    {value: 'reviews', label: 'Review'},
    {value: 'review_detail', label: 'Review Detail'},
    {value: 'cancelation_reasons', label: 'Cancellation Reason'},
    {value: 'mapview', label: 'Map View'},
    {value: 'provider_track', label: 'Track Provider'},
    {value: 'all_city', label: 'All City Map'},
    {value: 'online_providers', label: 'Online Providers'},
    {value: 'approved_providers', label: 'Approved Providers'},
    {value: 'pending_for_approvel', label: 'Declined Providers'},
    {value: 'profile_detail_edit', label: 'Provider Edit Profile'},
    {value: 'provider_vehicle_list', label: 'Provider Vehicle List'},
    {value: 'edit_vehicle_detail', label: 'Provider Edit Vehicle Detail'},
    {value: 'vehicle_document_list', label: 'Provider Vehicle Document List'},
    {value: 'provider_vehicle_documents_edit', label: 'Provider Vehicle Document Edit'},
    {value: 'provider_documents_edit', label: 'Provider Document Edit'},
    {value: 'provider_bank_detail', label: 'Provider Bank Detail'},
    {value: 'history_pr', label: 'Provider History'},
    {value: 'proivder_documents', label: 'Provider Document'},
    {value: 'users', label: 'Users'},
    {value: 'declined_users', label: 'Block Users'},
    {value: 'customer_detail_edit', label: 'User Edit Profile'},
    {value: 'history_u', label: 'User History'},
    {value: 'referral_history', label: 'Referral History'},
    {value: 'user_documents', label: 'User Document'},
    {value: 'corporate', label: 'Corporate'},
    {value: 'edit_corporate', label: 'Edit Corporate'},
    {value: 'dispatcher', label: 'Dispatcher'},
    {value: 'edit_dispatcher', label: 'Edit Dispatcher'},
    {value: 'admin_dispatcher_bank_detail', label: 'Dispatcher Bank Detail'},
    {value: 'hotel', label: 'Hotel'},
    {value: 'edit_hotel', label: 'Edit Hotel'},
    {value: 'partner', label: 'Partner'},
    {value: 'partner_detail', label: 'Partner Detail'},
    {value: 'partner_vehicle_list', label: 'Partner Vehicle List'},
    {value: 'partner_provider_list', label: 'Partner Provider List'},
    {value: 'admin_partner_bank_detail', label: 'Partner Bank Detail'},
    {value: 'service_types', label: 'Service Type'},
     {value: 'edit_service_form', label: 'Edit Type'},
    {value: 'add_service_form', label: 'Add type'},
    {value: 'country', label: 'Country'},
    {value: 'edit_country_form', label: 'Edit Country'},
    {value: 'add_country_form', label: 'Add Country'},
    {value: 'city', label: 'City'},
    {value: 'add_city_form', label: 'Add City'},
    {value: 'edit_city_form', label: 'Edit City'},
    {value: 'city_type', label: 'City Type'},
    {value: 'edit_city_type_form', label: 'Edit City Type'},
    {value: 'add_city_type_form', label: 'Add City Type'},
    {value: 'trip_earning', label: 'Trip Earning'},
    {value: 'statement_provider_earning', label: 'Statement Provider Earning'},
    {value: 'daily_earning', label: 'Daily Earning'},
    {value: 'statement_provider_daily_earning', label: 'Statement Provider Daily Earning'},
    {value: 'weekly_earning', label: 'Weekly Earning'},
    {value: 'statement_provider_weekly_earning', label: 'Statement Provider Weekly Earning'},
    {value: 'admin_partner_earning', label: 'Admin Partner Earning'},
    {value: 'wallet_history', label: 'Wallet History'},
    {value: 'referral_report', label: 'Referral Report'},
    {value: 'referral_history', label: 'Referral History'},
    {value: 'languages', label: 'Language'},
    {value: 'promotions', label: 'Promocode'},
    {value: 'add_promo_form', label: 'Add Promocode'},
    {value: 'promocodeedit', label: 'Edit Promocode'},
    {value: 'promo_used_info', label: 'Promocode Used List'},
    {value: 'documents', label: 'Document'},
    {value: 'edit_document_form', label: 'Edit Document'},
    {value: 'add_document_form', label: 'Add Document'},
    {value: 'email', label: 'Email'},
    {value: 'sms', label: 'Sms'},
    {value: 'admin_list', label: 'Admin List'},
    {value: 'add_admin', label: 'Add Admin'},
    {value: 'edit_admin', label: 'Edit Document'},
    {value: 'settings', label: 'Settings'},
    {value: 'installation_settings', label: 'Installation Setting'},
    {value: 'send_mass_notification', label: 'Sms Mass Notification'}
];

exports.support = function (req, res) {
        res.render('support' , {setting_data: setting_detail})
}

exports.login = function (req, res) {

    if (typeof req.session.userid != "undefined") {
        res.redirect('/today_requests');
    } else {

        utils.check_request_params_for_web(req.body, [], function (response) {
            if (response.success) {
                ///// for first time create default admin credantiale /////
                admin.find({}).then((admins) => { 
                    if (admins.length == 0) {
                        var hash = crypto.createHash('md5').update("developertest123abcxyz@").digest('hex');
                        var admin1 = new admin({
                            username: "eber",
                            email: "info@eber.com",
                            password: hash,
                        });
                        admin1.save();
                    }
                }, (err) => {
                    utils.error_response(err, res) 
                });

                // console.log(res.io)
                // res.io.emit('trip_detail_notify',{is_trip_updated: true});
                res.render("admin_login");
                delete message;
            } else {
                res.json(response);
            }
        });

    }
}
////////////////////////

///// check admin credentiale /////
exports.check_auth = function (req, res, next) {
    if (typeof req.session.userid != "undefined") {
        res.redirect('/today_requests');
    } else {
        utils.check_request_params_for_web(req.body, [], function (response) {
            if (response.success) {

                setting_detail.server_url = req.get('host');
                setting_detail.save();

                var is_google_map_lic_key_expired = setting_detail.is_google_map_lic_key_expired;
                var countryname = setting_detail.countryname;
               
                var u_name = req.body.Username
                if (is_google_map_lic_key_expired == 1) {

                    res.render("development_company");

                } else {

                    var hash = crypto.createHash('md5').update(req.body.Password).digest('hex');
                    var username = {};
                    username['username'] = u_name;
                    var email = {};
                    email['email'] = u_name;
                    var password = {};
                    password['password'] = hash;

                    admin.findOne({$and: [{$or: [username, email]}]}).then((admin) => {

                        if (!admin) {
                            message = admin_messages.error_message_email_or_username_not_registered;
                            res.redirect("/admin");
                        } else {

                            if (admin.password != hash) {
                                message = admin_messages.error_message_password_wrong;
                                res.redirect('/admin');
                            } else
                            {
                                req.session.userid = admin.id;
                                id = req.session.userid;
                                req.session.username = admin.username;
                                req.session.admin = admin

                                if (countryname == "") {
                                    res.redirect('/settings');
                                } else {
                                    message = admin_messages.success_message_login;
                                    res.redirect('/dashboard');
                                }
                            }
                        }
                    }, (err) => {
                        utils.error_response(err, res)
                    });
                }
            } else {
                res.json(response);
            }
        });

    }
};
///////////////////////////////////

///// admin list /////
exports.admin_list = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        utils.check_request_params_for_web(req.body, [], function (response) {
            if (response.success) {
                admin.count({}).then((admincount) => {
                    if (admincount == 0) {
                        res.render('admin_list', {'detail': ""});
                    } else {
                        var is_public_demo = setting_detail.is_public_demo;
                        admin.find({}).then((adminlist) => {
                            res.render('admin_list', {'detail': adminlist, is_public_demo: is_public_demo});
                            delete message;
                        });
                    }
                });
            } else {
                res.json(response);
            }
         });
    } else {
        res.redirect('/admin');
    }
};
//////////////////////

///// add admin form ///// 
exports.add = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        var url_array_list = URL_ARRAY
        res.render("add_admin", {url_array_list: url_array_list});
        delete message;
    } else {
        res.redirect('/admin');
    }
};
//////////////////////////

///// add admin /////
exports.add_admin_detail = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        utils.check_request_params_for_web(req.body, [], function (response) {
            if (response.success) {
                var password = req.body.password;
                ///// password encrypt /////
                var hash = crypto.createHash('md5').update(password).digest('hex');

                admin.findOne({'email': req.body.email}).then((admindata) => {
                    if (admindata) {
                        message = admin_messages.error_message_email_already_used;
                        res.redirect("/admin_list");
                    } else {
                        var admin1 = new admin({
                            username: (req.body.username).trim(),
                            email: req.body.email,
                            password: hash,
                            url_array: req.body.url_array,
                            type: Number(req.body.type)
                        });

                        admin1.save().then((admindata) => {
                            message = admin_messages.success_message_add_admin;
                            res.redirect('/admin_list');
                        }, (err) => {
                            utils.error_response(err, res)
                        });
                    }
                });
            } else {
                res.json(response);
            }
         });
    } else {
        res.redirect('/admin');
    }
};
/////////////////////

///// edit admin detail form /////
exports.edit = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        utils.check_request_params_for_web(req.body, [], function (response) {
            if (response.success) {
                admin.findById(req.body.id).then((admindata) => {
                    // Settings.findOne({}, function (err, setting_detail) {
                    var is_public_demo = setting_detail.is_public_demo;
                    var url_array_list = URL_ARRAY
                    res.render('add_admin', {'data': admindata, url_array_list: url_array_list, is_public_demo: is_public_demo});
                    delete message;
                    // });
                }, (err) => {
                    utils.error_response(err, res)
                });
            } else {
                res.json(response);
            }
         });
    } else {
        res.redirect('/admin');
    }
};
/////////////////////////////////

///// update admin detail /////
exports.update_admin = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        var data = req.body;
        utils.check_request_params_for_web(req.body, [], function (response) {
            if (response.success) {
                if (data.password != "") {
                    var password = req.body.password;
                    var hash = crypto.createHash('md5').update(password).digest('hex');
                    data.password = hash;
                } else {
                    delete data.password;
                }

                admin.findByIdAndUpdate(req.body.id, data).then((admindata) => {
                    message = admin_messages.success_message_update;
                    res.redirect("/admin_list");
                }, (err) => {
                    utils.error_response(err, res)
                });
            } else {
                res.json(response);
            }

        });
    } else {
        res.redirect('/admin');
    }
};
///////////////////////////////

///// delete admin /////
exports.delete = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        utils.check_request_params_for_web(req.body, [], function (response) {
            if (response.success) {
                admin.findByIdAndRemove(req.body.id).then((admindata) => {
                    message = admin_messages.success_message_delete;
                    res.redirect('/admin_list');
                }, (err) => {
                    utils.error_response(err, res)
                });
            } else {
                res.json(response);
            }

        });
    } else {
        res.redirect('/admin');
    }
};
////////////////////////

///// admin forget login password form /////
exports.forgot_psw = function (req, res, next) {
    res.render('forgot_psw');
    delete message;
};
/////////////////////////////////////

///// mail notification for forget login password /////
exports.forgot_psw_email = function (req, res) {
    utils.check_request_params_for_web(req.body, [], function (response) {
        if (response.success) {
                admin.findOne({email: req.body.email}).then((response) => {
                    if (response) {
                        var token = randomstring.generate(32);
                        var id = response.id;
                        var query = {};
                        query['_id'] = id;
                        var update = {};
                        update['token'] = token;
                        var link = req.protocol + '://' + req.get('host') + '/newpassword?id=' + id + '&&link=' + token;
                        utils.mail_notification(response.email, constant_json.APP_NAME, link, "");
                        admin.findOneAndUpdate(query, update).then((response) => {
                            message = admin_messages.success_message_for_password_change;
                            res.redirect("/admin");
                        }, (err) => {
                            utils.error_response(err, res)
                        });
                    } else {
                        message = admin_messages.error_message_email_not_registered;
                        res.redirect('/forgot_psw');
                    }
                }, (err) => {
                        utils.error_response(err, res)
                });
        } else {
            res.json(response);
        }
    });
};
///////////////////////////////////////////////////////

///// check auth with new login password ///// 
exports.edit_psw = function (req, res) {
    var id = req.query.id;
    var link = req.query.link;
    res.render('new_password', {'id': id, 'link': link});
    delete message;
};
//////////////////////////////////////////////

///// update new password /////
exports.update_psw = function (req, res) {
    var query = {};
    query['_id'] = req.body.id;
    query['token'] = req.body.token;
    req.body.token = "";
    req.body.password = crypto.createHash('md5').update(req.body.password).digest('hex');
    utils.check_request_params_for_web(req.body, [], function (response) {
        if (response.success) {
            admin.findOneAndUpdate(query, req.body).then((response) => {
                if (!response) {
                    message = admin_messages.error_message_token_expired;
                    res.redirect('/newpassword');
                } else {
                    message = admin_messages.success_message_password_update;
                    res.redirect('/admin');
                }
            }, (err) => {
                utils.error_response(err, res)
            });
        } else {
            res.json(response);
        }
    });
};
///////////////////////////////////

///// destroy login admin session /////
exports.sign_out = function (req, res) {
    
    req.session.destroy(function(){
        res.redirect('/admin');   
    });
};
////////////////////////////////////

///// landing page /////
exports.landing = function (req, res, next) {

    var Settings = require('mongoose').model('Settings');
    var moment = require('moment-timezone');
    var countryList = require('country-data').callingCountries;
    utils.check_request_params_for_web(req.body, [], function (response) {
            if (response.success) {
            Settings.count({}, function (err, set) {
                if (set == 0) {
                    res.render('landing_page', {detail: array, country: countryList.all});
                    delete message;
                } else {
                    res.render('landing_page', {detail: setting_detail, country: countryList.all});
                    delete message;
                }
            });
        } else {
            res.json(response);
        }
    });
};
////////////////////////////

///// error page /////
exports.errorPage = function (req, res, next) {
    res.render('errorPage');
};
//////////////////////////
var Payment_Transaction = require('mongoose').model('Payment_Transaction');

exports.session_data = function (req, res, next) {
    var type = req.body.type;
    if(type == "user")
    {
        res.json({session_data: req.session.user})
    }
    else if(type == "dispatcher")
    {
        res.json({session_data: req.session.dispatcher})
    }
    else if(type == "partner")
    {
        res.json({session_data: req.session.partner})
    }   
    else if(type == "hotel")
    {
        res.json({session_data: req.session.hotel})
    }
    else if(type == "provider")
    {
         res.json({session_data: req.session.provider})
    }  
    else if(type == "admin")
    {
        Payment_Transaction.findOne({}, function(error, payment_transaction_detail){
            if(payment_transaction_detail && payment_transaction_detail.is_stop_system){
                res.json({success: false})
            } else {
                res.json({success: true, session_data: req.session.admin, cookies: req.cookies.language})
            }
        })
    }   
}
