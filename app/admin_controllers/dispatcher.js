var utils = require('../controllers/utils');
var allemails = require('../controllers/emails');
var Dispatcher = require('mongoose').model('Dispatcher');
var User = require('mongoose').model('User');
var City = require('mongoose').model('City');
var Citytype = require('mongoose').model('city_type');
var Provider = require('mongoose').model('Provider');
var Trip = require('mongoose').model('Trip');
var moment = require('moment');
var Trip_Location = require('mongoose').model('trip_location');
var nodemailer = require('nodemailer');
var Settings = require('mongoose').model('Settings');
var Country = require('mongoose').model('Country')
var crypto = require('crypto');
var console = require('../controllers/console');
var mongoose = require('mongoose');
var Schema = mongoose.Types.ObjectId;
var excelbuilder = require('msexcel-builder');
var fs = require("fs");
var console = require('../controllers/console');

exports.login = function (req, res) {
     // console.error('Cookies: ' + JSON.stringify(req.cookies));
    if (typeof req.session.dispatcher == 'undefined') {
        res.render('dispatcher_login');
    } else {
        res.redirect('/dispatcher_create_trip');
    }
};

exports.dispatcher_forgot_password = function (req, res) {
    if (typeof req.session.dispatcher == 'undefined') {
        res.render('dispatcher_forgot_password');
        delete message;
    } else {
        res.redirect('/dispatcher_create_trip');
    }
};

exports.dispatcher_forgot_psw_email = function (req, res) {
    if (typeof req.session.dispatcher == 'undefined') {
        Dispatcher.findOne({email: req.body.email}).then((response) => { 
            if (response) {
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
                var id = response.id;
                var link = req.protocol + '://' + req.get('host') + '/dispatcher_newpassword?id=' + id + '&&token=' + token;
                var ejs = require('ejs');
                utils.mail_notification(response.email, config_json.reset_password, link, '');

                Dispatcher.findOneAndUpdate({_id: id}, {token: token}).then((response) => { 
                    
                        message = admin_messages.success_message_send_link;
                        res.redirect("/dispatcher_login");
                    
                });

            } else {
                message = admin_messages.error_message_email_not_registered;
                res.redirect('/dispatcher_forgot_password');
            }
        });
    } else {
        res.redirect('/dispatcher_create_trip');
    }
};

exports.edit_psw = function (req, res) {

    if (typeof req.session.dispatcher == 'undefined') {
        var id = req.query.id;
        var token = req.query.token;
        res.render('dispatcher_new_password', {'id': id, 'token': token});
        delete message;
    } else {
        res.redirect('/dispatcher_create_trip');
    }
};

exports.update_psw = function (req, res) {

    if (typeof req.session.dispatcher == 'undefined') {
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

        Dispatcher.findOneAndUpdate(query, {password: hash, token: token}).then((response) => { 
            if (!response) {
                message = admin_messages.error_message_token_expired;
                res.redirect('dispatcher_forgot_password');
            } else {
                message = admin_messages.success_message_password_update;
                res.redirect('dispatcher_login');
            }
        });
    } else {
        res.redirect('/dispatcher_create_trip');
    }
};

exports.list = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        var query = {};
        sort = {};
        array = [];
        var query1 = {};
        var query2 = {};
        var query3 = {};
        var query4 = {};
        var query5 = {};
        var query6 = {};
        if (req.body.page == undefined) {
            sort['unique_id'] = -1;

            search_item = 'first_name';
            search_value = '';
            sort_order = -1;
            sort_field = 'unique_id';
            filter_start_date = '';
            filter_end_date = '';

            var start_date = '';
            var end_state = '';
        } else {

            var field = req.body.sort_item[0];
            var order = req.body.sort_item[1];
            var item = req.body.search_item;
            var value = req.body.search_value;

            sort[field] = order;

            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
            search_item = item
            search_value = value;
            filter_start_date = req.body.start_date;
            filter_end_date = req.body.end_date;

            var start_date = req.body.start_date;
            var end_state = req.body.end_date;
        }
        if (start_date != '' || end_state != '') {
            if (start_date == '') {
                start_date = new Date(end_state);
                start_date = start_date - 1;
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else if (end_state == '') {
                end_date = new Date(start_date);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                start_date = new Date(start_date);
                start_date = start_date - 1;
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else {
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            }
        }

        if (item == 'first_name') {
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[''] = '';
                query4[''] = '';
                query5[''] = '';
                query6[''] = '';
            } else {
                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[item] = new RegExp(full_name[0], 'i');
                query4['last_name'] = new RegExp(full_name[0], 'i');
                query5[item] = new RegExp(full_name[1], 'i');
                query6['last_name'] = new RegExp(full_name[1], 'i');
            }
        } else {

            if (item != undefined) {
                query[item] = new RegExp(value, 'i');
            }
        }
        Dispatcher.count({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query]}).then((dispatchercount) => { 

            if (dispatchercount != 0) {
                if (req.body.page == undefined) {
                    page = 1;
                    next = 2;
                    pre = page - 1;

                    var options = {
                        sort: {unique_id: -1},
                        page: page,
                        limit: 10
                    };
                } else {
                    page = req.body.page;
                    next = parseInt(req.body.page) + 1;
                    pre = req.body.page - 1;

                    if (field == 'first_name') {
                        var options = {
                            sort: {first_name: order},
                            page: page,
                            limit: 10
                        };
                    } else if (field == 'unique_id') {
                        var options = {
                            sort: {unique_id: order},
                            page: page,
                            limit: 10
                        };
                    } else {
                        var options = {
                            sort: {email: order},
                            page: page,
                            limit: 10
                        };
                    }

                }

                Dispatcher.paginate({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query]}, options).then((dispatcherlist) => { 

                    var j = 1;
                    if (dispatcherlist.docs.length <= 0) {
                        res.render('dispatcher_list', {
                            detail: [], currentpage: dispatcherlist.page, pages: dispatcherlist.pages,
                            next: next, pre: pre
                        });
                    } else {
                        dispatcherlist.docs.forEach(function (data) {

                            var id = data._id;
                            var query = {};
                            query['user_type_id'] = id;


                            Trip.count(query).then((triptotal) => { 

                                query['is_trip_end'] = 1

                                Trip.count(query).then((completedtriptotal) => { 

                                    if (j == dispatcherlist.docs.length) {
                                            var is_public_demo = setting_detail.is_public_demo;
                                            data.total_trip = triptotal;
                                            data.completed_trip = completedtriptotal;
                                            res.render('dispatcher_list', {is_public_demo: is_public_demo, detail: dispatcherlist.docs, currentpage: dispatcherlist.page, pages: dispatcherlist.pages, next: next, pre: pre});
                                            delete message;
                                    } else {
                                        data.total_trip = triptotal;
                                        data.completed_trip = completedtriptotal;
                                        j++;
                                    }
                                });

                            });

                        });
                    }

                });
            } else {
                res.render('dispatcher_list', {
                    detail: array, currentpage: '', pages: '',
                    next: '', pre: ''
                });
                delete message;
            }
        });
    } else {
        res.redirect('/admin');
    }
};

exports.add_dispatcher = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        var countryList = require('country-data').callingCountries;
        Country.find({isBusiness: constant_json.YES}).then((country) => { 
           
                res.render('add_dispatcher', {country: country, phone_number_length: 10, phone_number_min_length: 8});
                delete message;
            
        });
    } else {
        res.redirect('/admin');
    }
};

exports.edit_dispatcher = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        var id = req.body.id;
        Dispatcher.findById(id).then((dispatcherdata) => { 
            Country.findOne({"countryname": dispatcherdata.country}).then((country_detail) => { 
              
                    var is_public_demo = setting_detail.is_public_demo;

                    res.render('add_dispatcher', {data: dispatcherdata, id: id, phone_number_min_length: country_detail.phone_number_min_length, phone_number_length: country_detail.phone_number_length, is_public_demo: is_public_demo});
                    delete message;
                
            });
        });
    } else {
        res.redirect('/admin');
    }
};

exports.update_dispatcher_detail = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        var id = req.body.id;
        var data = req.body;

        if (data.password != "") {
            var password = req.body.password;
            var hash = crypto.createHash('md5').update(password).digest('hex');
            data.password = hash;
        } else {
            delete data.password;
        }

        Dispatcher.findByIdAndUpdate(id, data).then((dispatcherdata) => { 
            message = admin_messages.success_message_dispatcher_update;
            res.redirect("/dispatcher");
        });
    } else {
        res.redirect('/admin');
    }
};

exports.add_dispatcher_detail = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        Dispatcher.findOne({email: ((req.body.email).trim()).toLowerCase()}).then((response) => { 

            if (response) {
                message = admin_messages.error_message_email_already_used;
                res.redirect('/dispatcher');
            } else {
                Dispatcher.findOne({phone: req.body.phone}).then((response) => { 

                    if (response) {
                        message = admin_messages.error_message_mobile_no_already_used;
                        res.redirect('/dispatcher');
                    } else {

                        var code = req.body.countryname
                        var code_name = code.split(' ');
                        var country_code = code_name[0];
                        var country_name = "";

                        for (i = 1; i <= (code_name.length) - 1; i++) {
                            //country_name.push(code_name[i]);
                            country_name = country_name + " " + code_name[i];
                        }
                        country_name = country_name.substr(1);
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

                        var password = req.body.password;
                        var hash = crypto.createHash('md5').update(password).digest('hex');


                        var dispatchercount = 1;
                        Dispatcher.count({}).then((dispatcher_count) => { 

                            if (dispatcher_count) {
                                dispatchercount = dispatcher_count + 1;
                            }

                            var first_name = req.body.first_name;
                            first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);

                            var last_name = req.body.last_name;
                            last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);


                            var dispatcher = new Dispatcher({
                                unique_id: dispatchercount,
                                first_name: first_name,
                                last_name: last_name,
                                email: ((req.body.email).trim()).toLowerCase(),
                                country_phone_code: country_code,
                                phone: req.body.phone,
                                password: hash,
                                country: country_name,
                                token: token
                            })

                            dispatcher.save().then(() => { 
                                var email_notification = setting_detail.email_notification;
                                if (email_notification == true) {
                                    allemails.sendDispatcherRegisterEmail(req, dispatcher, dispatcher.first_name + " " + dispatcher.last_name);
                                }
                                message = admin_messages.success_message_dispatcher_add;
                                res.redirect('/dispatcher');
                            }, (err) => {
                                utils.error_response(err, res)
                            });
                        });
                    }
                });
            }
        });
    } else {
        res.redirect("/admin");
    }
}



exports.dispatcher_login = function (req, res, next) {

    if (typeof req.session.dispatcher == 'undefined') {
        var password = req.body.password;
        var hash = crypto.createHash('md5').update(password).digest('hex');

        ////// for remove case cencitive ///////
        var email = req.body.email
        ////////////////////////////////////////

        Dispatcher.findOne({email: email}).then((dispatcher) => { 

            if (!dispatcher) {
                message = admin_messages.error_message_email_not_registered;
                res.redirect('/dispatcher_login');
            } else {

                if (dispatcher.password != hash) {
                    message = admin_messages.error_message_password_wrong;
                    res.redirect('/dispatcher_login');
                } else {
                    req.session.dispatcher = dispatcher;

                    ////////////  token generate /////
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
                    //////////////// token end ///////// 
                    dispatcher.token = token;

                    dispatcher.device_token = req.body.device_token;
                    dispatcher.save().then(() => { 
                       
                            message = admin_messages.success_message_login;
                            res.redirect('/dispatcher_create_trip');
                        
                    });
                }
            }
        });
    } else {
        res.redirect('/dispatcher_create_trip');
    }
};

exports.dispatcher_header = function (req, res) {
    if (typeof req.session.dispatcher != 'undefined') {
        res.render('dispatcher_header')
    } else {
        res.redirect('/dispatcher_login');
    }
};

exports.dispatcher_sign_out = function (req, res) {
    req.session.destroy(function (err, data) {
        if (err) {
            console.error(err);
        } else {

            res.redirect('/dispatcher_login');
        }
    });
};


exports.dispatcher_create_trip = function (req, res) {
    if (typeof req.session.dispatcher != 'undefined') {
        var server_date = new Date(Date.now());

        User.find({country: req.session.dispatcher.country, is_approved: 1}).then((user_list) => { 

            Country.findOne({countryname: req.session.dispatcher.country}).then((country_data) => { 

                var url = "https://maps.googleapis.com/maps/api/js?key=" + setting_detail.web_app_google_key + "&libraries=places"
                res.render("dispatcher_create_trip", {'moment': moment,
                    server_date: server_date, scheduled_request_pre_start_minute: setting_detail.scheduled_request_pre_start_minute,
                    country_code: country_data.countrycode,
                    phone_number_min_length: country_data.phone_number_min_length,
                    phone_number_length: country_data.phone_number_length,
                    user_list: user_list, dispatchers: req.session.dispatcher, map_key: url, country: req.session.dispatcher.country});
                delete message;
            });
        });

    } else {
        res.redirect('/dispatcher_login');
        delete message;
    }

};

exports.checkuser = function (req, res) {
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
    var password = "123456";
    var encrypt_password = crypto.createHash('md5').update(password).digest('hex');
    if (req.body.user_id == "")
    {
        User.findOne({email: email}).then((user_email) => { 
            User.findOne({phone: req.body.phone}).then((user_phone) => { 
                if (!user_email && !user_phone) {
                    if (email == null)
                    {
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

                    Country.findOne({countryphonecode: req.body.country_phone_code}).then((country) => { 
                        var wallet_currency_code = "";
                        if (country) {
                            wallet_currency_code = country.currencycode;
                        }

                        var user = new User({
                            first_name: first_name,
                            user_type: constant_json.USER_TYPE_NORMAL,
                            user_type_id: null,
                            password: encrypt_password,
                            last_name: last_name,
                            email: email,
                            country_phone_code: req.body.country_phone_code,
                            phone: req.body.phone,
                            device_token: '',
                            device_type: '',
                            gender: gender,
                            bio: '',
                            address: '',
                            zipcode: '',
                            social_unique_id: '',
                            login_by: '',
                            device_timezone: '',
                            city: req.body.city,
                            token: token,
                            wallet_currency_code: wallet_currency_code,
                            country: req.body.country,
                            referral_code: referral_code,
                            promo_count: 0,
                            is_referral: 0,
                            rate: 0,
                            rate_count: 0,
                            totalReferrals: 0,
                            refferalCredit: 0,
                            wallet: 0,
                            is_approved: 1,
                            picture: "",
                            current_trip_id:null

                        })



                        /////////// FOR IMAGE /////////
                        var url = utils.getImageFolderPath(req, 1) + user._id + '.jpg';
                        user.picture = url;

                        var pictureData = req.body.pictureData;
                        if (pictureData != null) {
                            utils.saveImageAndGetURL(user._id, req, res, 1);
                        }
                        user.save().then(() => { 
                            var email_notification = setting_detail.email_notification;
                            if (email_notification == true) {
                                allemails.sendUserRegisterEmail(req, user);
                            }
                            res.json({success: true, user: user});
                        }, (err) => {
                            utils.error_response(err, res)
                        });
                    });


                } else {
                    if (user_email) {
                        if (user_email.current_trip_id)
                        {
                            res.json({success: false, user: user_email})
                        } else
                        {
                            res.json({success: true, user: user_email})
                        }
                    } else if (user_phone) {
                       if (user_phone.current_trip_id)
                        {
                            res.json({success: false, user: user_phone})
                        } else
                        {
                            res.json({success: true, user: user_phone})
                        }
                    }
                }

            });
        });

    } else
    {
        User.findOne({_id: req.body.user_id}, function (err, userdata) {
            console.log(userdata.current_trip_id)
            if (userdata.current_trip_id)
            {
                res.json({success: false, user: userdata})
            } else
            {
                res.json({success: true, user: userdata})
            }
        })
    }

};

exports.checkuser_old = function (req, res) {
    var query1 = {};
    var query2 = {};
    var query3 = {};
    query1['email'] = req.body.email;
    query2['phone'] = req.body.phone;
    query3['is_approved'] = 1;

    if (req.body.user_id == "")
    {
        User.findOne({$and: [{$or: [query1, query2]}, query3]}, function (err, userdata) {

            if (userdata == null) {
                
                    var now = new Date(Date.now());
                    var date1 = moment(now);
                    var dateFinal = date1.format(constant_json.DATE_FORMATE_DDMM);


                    var referral_code = (utils.tokenGenerator(8)).toUpperCase();

                    var token = utils.tokenGenerator(32);

                    var password = "123456";
                    var encrypt_password = crypto.createHash('md5').update(password).digest('hex');


                    var first_name = req.body.first_name;
                    first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);

                    var last_name = req.body.last_name;
                    last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);

                    var email = req.body.email;
                    if (email == undefined || email == null || email == "") {
                        email = null;
                    } else {
                        email = ((req.body.email).trim()).toLowerCase();
                    }
                    if (email == null)
                    {
                        email = "";
                    }
                    var gender = req.body.gender;
                    if (gender != undefined) {
                        gender = ((gender).trim()).toLowerCase();
                    } else
                    {
                        gender = "";
                    }
                    Country.findOne({countryphonecode: req.body.country_phone_code}, function (err, country) {
                        var wallet_currency_code = "";
                        if (country) {
                            wallet_currency_code = country.currencycode;
                        }

                        var user = new User({
                            first_name: first_name,
                            user_type: constant_json.USER_TYPE_NORMAL,
                            user_type_id: null,
                            password: encrypt_password,
                            last_name: last_name,
                            email: email,
                            country_phone_code: req.body.country_phone_code,
                            phone: req.body.phone,
                            device_token: '',
                            device_type: '',
                            gender: gender,
                            bio: '',
                            address: '',
                            zipcode: '',
                            social_unique_id: '',
                            login_by: '',
                            device_timezone: '',
                            city: req.body.city,
                            token: token,
                            wallet_currency_code: wallet_currency_code,
                            country: req.body.country,
                            referral_code: referral_code,
                            promo_count: 0,
                            is_referral: 0,
                            rate: 0,
                            rate_count: 0,
                            totalReferrals: 0,
                            refferalCredit: 0,
                            wallet: 0,
                            is_approved: 1,
                            picture: ""

                        })



                        /////////// FOR IMAGE /////////
                        var url = utils.getImageFolderPath(req, 1) + user._id + '.jpg';
                        user.picture = url;

                        var pictureData = req.body.pictureData;
                        if (pictureData != null) {
                            utils.saveImageAndGetURL(user._id, req, res, 1);
                        }
                        user.save().then(() => { 
                            
                            var email_notification = setting_detail.email_notification;
                            if (email_notification == true) {
                                allemails.sendUserRegisterEmail(req, user);
                            }
                            res.json({success: true, user: user});
                        }, (err) => {
                            utils.error_response(err, res)
                        });
                    });

            } else {

                Trip.findOne({user_id: userdata._id, is_trip_cancelled: 0, is_trip_completed: 0}, function (err, trip) {

                    if (trip)
                    {
                        res.json({success: false, user: userdata})
                    } else
                    {
                        res.json({success: true, user: userdata})
                    }
                });
            }
        });
    } else
    {
        User.findOne({_id: req.body.user_id}, function (err, userdata) {

            Trip.findOne({user_id: userdata._id, is_trip_cancelled: 0, is_trip_completed: 0}, function (err, trip) {

                if (trip)
                {
                    res.json({success: false, user: userdata})
                } else
                {
                    res.json({success: true, user: userdata})
                }
            });
        })
    }
};

exports.calculate_estimate = function (req, res) {

    var lat1 = req.body.lat
    var lat2 = req.body.dlng
    var lon1 = req.body.lng;
    var lon2 = req.body.dlng;
    var R = 6371; // km (change this constant to get miles)
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

};



exports.dispatcher_trip_map = function (req, res, next) {
    if (typeof req.session.dispatcher == 'undefined') {

        res.redirect('/dispatcher_login');
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
                    res.render('dispatcher_trip_map', {'data': trips, 'url': url, 'user_name': user_name, 'provider_name': provider_name, 'moment': moment});

                } else {
                    res.render('dispatcher_trip_map', {'data': trips, 'url': url, 'trip_path_data': locations, 'user_name': user_name, 'provider_name': provider_name, 'moment': moment});
                }
            });
        });
    }
};

exports.getsurge_time = function (req, res) {

    var moment = require('moment-timezone');
    var input = req.body.server_time;
    var fmt = "YYYY-MM-DD HH:mm:ss ZZ";  // must match the input
    var zone = req.body.zone;
    var m = moment.tz(input, fmt, zone);
    m.utc();
    var s = m.format(fmt);

    res.json(s);
};

exports.dispatcher_future_request = function (req, res) {

    if (typeof req.session.dispatcher == 'undefined') {

        res.redirect('/dispatcher_login');

    } else {
        var j = 1;
        var array = [];
        if (req.body.page == undefined) {
            page = 0;
            next = 1;
            pre = 0;
        } else {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;
        }

        if (req.body.search_item == undefined) {
            var request = req.path.split('/')[1];
            search_item = 'user_detail.first_name';
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
        var unwind = {$unwind: "$user_detail"};

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        if (search_item == "user_detail.first_name") {
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};

                var search = {"$match": {$or: [query1, query2]}};
            } else {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};
                query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
                query4['user_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
                query6['user_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

                var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
            }
        } else {
            var search = {"$match": {search_item: {$regex: new RegExp(value, 'i')}}};
        }

        query1['created_at'] = {$gte: start_date, $lt: end_date};
        var filter = {"$match": query1};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;
        var mongoose = require('mongoose');
        var Schema = mongoose.Types.ObjectId;

        var condition = {$match: {'is_schedule_trip': {$eq: true}}};
        var condition1 = {$match: {'is_trip_cancelled': {$eq: 0}}};
        var condition2 = {$match: {'is_trip_completed': {$eq: 0}}};
        var condition3 = {$match: {'is_trip_end': {$eq: 0}}};
        var condition4 = {$match: {'provider_id': {$eq: null}}};
        var condition5 = {$match: {'current_provider': {$eq: null}}};
        var dispatcher_type_condition = {$match: {'user_type_id': {$eq: Schema(req.session.dispatcher._id)}}};

        Country.findOne({countryname: req.session.dispatcher.country}).then((country_data) => { 

            Trip.aggregate([dispatcher_type_condition, condition, condition1, condition2, condition3, condition4, lookup, unwind, search, filter, count]).then((array) => { 

                if (array.length == 0) {
                    res.render('dispatcher_future_request_list', {detail: array, timezone: country_data.countrytimezone, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment});
                } else {
                    var pages = Math.ceil(array[0].total / number_of_rec);
                    Trip.aggregate([dispatcher_type_condition, condition, condition1, condition2, condition3, condition4, lookup, unwind, search, filter, sort, skip, limit]).then((array) => { 

                        res.render('dispatcher_future_request_list', {detail: array, timezone: country_data.countrytimezone, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment});
                    }, (err) => {
                    utils.error_response(err, res)
                    });
                }
            }, (err) => {
                utils.error_response(err, res)
            });
        })
    }
}

exports.dispatcher_future_request_old = function (req, res) {

    if (typeof req.session.dispatcher == 'undefined') {

        res.redirect('/dispatcher_login');

    } else {
        var j = 1;
        var array = [];
        if (req.body.page == undefined) {
            page = 0;
            next = 1;
            pre = 0;
        } else {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;
        }

        if (req.body.search_item == undefined) {
            var request = req.path.split('/')[1];
            search_item = 'user_detail.first_name';
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
        var unwind = {$unwind: "$user_detail"};

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        if (search_item == "user_detail.first_name") {
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};

                var search = {"$match": {$or: [query1, query2]}};
            } else {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};
                query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
                query4['user_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
                query6['user_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

                var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
            }
        } else {
            var search = {"$match": {search_item: {$regex: new RegExp(value, 'i')}}};
        }

        query1['created_at'] = {$gte: start_date, $lt: end_date};
        var filter = {"$match": query1};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;
        var mongoose = require('mongoose');
        var Schema = mongoose.Types.ObjectId;
        var condition = {$match: {'user_type_id': {$eq: Schema(req.session.dispatcher._id)}}};
        var condition1 = {$match: {'is_schedule_trip_cancelled': {$eq: 0}}};
        var condition2 = {$match: {'is_trip_created': {$eq: 0}}};

        Country.findOne({countryname: req.session.dispatcher.country}, function (err, country_data) {

            ScheduledTrip.aggregate([condition, condition1, condition2, lookup, unwind, search, filter, count], function (err, array) {

                if (array.length == 0) {
                    res.render('dispatcher_future_request_list', {detail: array, timezone: country_data.countrytimezone, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment});
                } else {
                    var pages = Math.ceil(array[0].total / number_of_rec);
                    ScheduledTrip.aggregate([condition, condition1, condition2, lookup, unwind, search, filter, sort, skip, limit], function (err, array) {

                        res.render('dispatcher_future_request_list', {detail: array, timezone: country_data.countrytimezone, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment});

                    });
                }
            }, (err) => {
            utils.error_response(err, res)
            });
        })
    }
}

exports.dispatcher_request = function (req, res) {

    if (typeof req.session.dispatcher == 'undefined') {

        res.redirect('/dispatcher_login');

    } else {
        var j = 1;
        var array = [];
        if (req.body.page == undefined) {
            page = 0;
            next = 1;
            pre = 0;
        } else {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;
        }

        if (req.body.search_item == undefined) {
            var request = req.path.split('/')[1];
            search_item = 'user_detail.first_name';
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
        var unwind = {$unwind: "$user_detail"};

        var lookup1 = {
            $lookup:
                    {
                        from: "providers",
                        localField: "confirmed_provider",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
        };

        var unwind1 = {$unwind: "$provider_detail"};

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        if (search_item == "user_detail.first_name") {
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};

                var search = {"$match": {$or: [query1, query2]}};
            } else {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};
                query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
                query4['user_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
                query6['user_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

                var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
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

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['provider_detail.last_name'] = {$regex: new RegExp(value, 'i')};

                var search = {"$match": {$or: [query1, query2]}};
            } else {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['provider_detail.last_name'] = {$regex: new RegExp(value, 'i')};
                query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
                query4['provider_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
                query6['provider_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

                var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
            }
        } else {
            var search = {"$match": {search_item: {$regex: new RegExp(value, 'i')}}};
        }

        query1['created_at'] = {$gte: start_date, $lt: end_date};
        var filter = {"$match": query1};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;
        var mongoose = require('mongoose');
        var Schema = mongoose.Types.ObjectId;
        var condition = {$match: {'user_type_id': {$eq: Schema(req.session.dispatcher._id)}}};
      
        Trip.aggregate([condition, lookup, unwind, lookup1, search, filter, count]).then((array) => { 
            if (array.length == 0) {
                res.render('dispatcher_request_list', {detail: array, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment});
            } else {
                var pages = Math.ceil(array[0].total / number_of_rec);
                Trip.aggregate([condition, lookup, unwind, lookup1, search, filter, sort, skip, limit]).then((array) => { 

                    res.render('dispatcher_request_list', {detail: array, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment});
                }, (err) => {
                    utils.error_response(err, res)
                });
            }
        }, (err) => {
            utils.error_response(err, res)
        });
    }
};

exports.mail_notification = function (to, sub, text, html) {

    try {
            email = setting_detail.email;
            password = setting_detail.password;
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: email, // Your email id
                    pass: password // Your password
                }
            });

            var mailOptions = {// sender address
                from: from,
                to: to, // list of receivers
                subject: sub, // Subject line
                text: text, //, /// plaintext body
                html: html

            }

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.error(error);
                } else {

                };
            });

    } catch (error) {
        console.error(error);
    }

};

exports.user_detail = function (req, res, next) {
    var query = {};
    query['_id'] = req.body.id;
    User.findById(query).then((user_detail) => { 
        var is_public_demo = setting_detail.is_public_demo;
        res.render('user_detail', {user_detail: user_detail, type: req.body.type, is_public_demo: is_public_demo});
    
    });
};

exports.provider_detail = function (req, res, next) {
    var query = {};
    query['_id'] = req.body.id;

    Provider.findById(query).then((provider_detail) => { 
        var is_public_demo = setting_detail.is_public_demo;
        res.render('provider_detail', {provider_detail: provider_detail, type: req.body.type, is_public_demo: is_public_demo});

    });
};

exports.get_server_time = function (req, res) {
    var server_date = new Date();
    res.json({server_date: server_date})
};


exports.dispatcher_new_request = function (req, res, next) {

        var provider_timeout = setting_detail.provider_timeout;
        var end_time = new Date(Date.now());
        var accepted_request_list = [];
        var started_request_list = [];
        var arrived_request_list = [];
        var lookup = {
            $lookup:
                    {
                        from: "providers",
                        localField: "confirmed_provider",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
        };
        var unwind = {$unwind: {
                path: "$provider_detail",
                preserveNullAndEmptyArrays: true
            }
        };

        var lookup1 = {
            $lookup:
                    {
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user_detail"
                    }
        };
        var unwind1 = {$unwind: {
                path: "$user_detail",
                preserveNullAndEmptyArrays: true
            }
        };

        var condition = {$match: {$and: [{user_type_id: Schema(req.body.dispatcher_id)}, {is_trip_completed: {$eq: 0}}, {is_trip_cancelled: {$eq: 0}}, {is_provider_accepted: {$eq: 1}}, {is_provider_status: {$lt: 4}}]}}
        Trip.aggregate([condition, lookup, unwind, lookup1, unwind1]).then((accepted_request) => { 
            
                accepted_request_list = accepted_request;
        }, (err) => {
            console.log(err);
        });
        var condition = {$match: {$and: [{user_type_id: Schema(req.body.dispatcher_id)}, {is_trip_completed: {$eq: 0}}, {is_trip_cancelled: {$eq: 0}}, {is_provider_accepted: {$eq: 1}}, {is_provider_status: {$eq: 4}}]}}
        Trip.aggregate([condition, lookup, unwind, lookup1, unwind1]).then((arrived_request) => { 
            
                arrived_request_list = arrived_request;
        }, (err) => {
            console.log(err);
        });
        var condition = {$match: {$and: [{user_type_id: Schema(req.body.dispatcher_id)}, {is_provider_accepted: {$eq: 1}}, {is_provider_status: {$eq: 6}}]}}
        Trip.aggregate([condition, lookup, unwind, lookup1, unwind1]).then((started_request) => { 
            
                started_request_list = started_request;
        }, (err) => {
            console.log(err);
        });
        var condition = {$match: {$and: [{user_type_id: Schema(req.body.dispatcher_id)}, {is_trip_completed: {$eq: 0}}, {is_trip_cancelled: {$eq: 0}}, {$or: [{is_provider_accepted: {$eq: 2}}, {is_provider_accepted: {$eq: 3}}]}]}}

        var lookup = {
            $lookup:
                    {
                        from: "providers",
                        localField: "current_provider",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
        };
        var unwind = {$unwind: {
                path: "$provider_detail",
                preserveNullAndEmptyArrays: true
            }
        };
        Trip.aggregate([condition, lookup, unwind, lookup1, unwind1]).then((request_list) => { 
            
                var array = [];
                request_list.forEach(function (trip) {
                    var start_time = trip.updated_at;
                    var res_sec = utils.getTimeDifferenceInSecond(end_time, start_time);
    
                    var time_left_to_responds_trip = provider_timeout - res_sec;
                    array.push({
                        _id: trip._id,
                        time_left_to_responds_trip: time_left_to_responds_trip,
                        unique_id: trip.unique_id,
                        invoice_number: trip.invoice_number,
                        is_provider_accepted: trip.is_provider_accepted,
                        provider_detail: trip.provider_detail,
                        user_detail: trip.user_detail,
                        user_id: trip.user_id,
                        timezone: trip.timezone,
                        source_address: trip.source_address,
                        destination_address: trip.destination_address,
                        sourceLocation: trip.sourceLocation,
                        destinationLocation: trip.destinationLocation,
                        service_type_id: trip.service_type_id,
                        created_at: trip.created_at
                    })
                });
                setTimeout(function () {
                    res.json({success: true, moment: moment, request_list: array, arrived_request_list: arrived_request_list, accepted_request_list: accepted_request_list, started_request_list: started_request_list})
                }, 100)
        }, (err) => {
            utils.error_response(err, res)
        })
};


exports.get_all_provider = function (req, res, next) {
   
        var default_Search_radious = Number(req.body.default_Search_radious);
        var distance = default_Search_radious / constant_json.DEGREE_TO_KM;
        var provider_query = {$match: {'is_vehicle_document_uploaded': true}};
        var provider_query2 = {$geoNear: {
                near: [Number(req.body.latitude), Number(req.body.longitude)],
                distanceField: "distance",
                uniqueDocs: true,
                maxDistance: distance
            }}


        provider_admin_type_query = {
            $and: [
                {
                    "provider_type": Number(constant_json.PROVIDER_TYPE_NORMAL)
                }, {
                    "is_approved": 1
                }
            ]
        };
        provider_partner_type_query = {
            $and: [{
                    "provider_type": Number(constant_json.PROVIDER_TYPE_PARTNER)
                }, {
                    "is_approved": 1
                }, {
                    "is_partner_approved_by_admin": 1
                }
            ]
        };
        var provider_query1 = {$match: {$or: [provider_admin_type_query, provider_partner_type_query]}};
        var city_type_lookup = {
            $lookup:
                    {
                        from: "city_types",
                        localField: "service_type",
                        foreignField: "_id",
                        as: "city_type_detail"
                    }
        };
        var city_type_unwind = {$unwind: "$city_type_detail"};
        var type_lookup = {
            $lookup:
                    {
                        from: "types",
                        localField: "city_type_detail.typeid",
                        foreignField: "_id",
                        as: "type_detail"
                    }
        };
        var type_unwind = {$unwind: "$type_detail"};
        var trip_lookup = {
            $lookup:
                    {
                        from: "trips",
                        localField: "is_trip",
                        foreignField: "_id",
                        as: "trip_detail"
                    }
        };
        var trip_unwind = {$unwind: {
                path: "$trip_detail",
                preserveNullAndEmptyArrays: true
            }
        };
        var country_condition = {$match: {'country': req.body.country}}

        var current_location_service_type_id_query = {$match: {}};
        if (req.body.current_location_service_type_id != '') {
            current_location_service_type_id_query = {$match: {service_type: Schema(req.body.current_location_service_type_id)}}
        }

        Provider.aggregate([provider_query2, current_location_service_type_id_query, country_condition, provider_query, provider_query1, city_type_lookup, city_type_unwind, type_lookup, type_unwind, trip_lookup, trip_unwind]).then((providers) => { 
            if (providers.length == 0) {
                res.json({
                    success: false,
                    error_code: error_message.ERROR_CODE_NO_PROVIDER_FOUND_SELECTED_SERVICE_TYPE_AROUND_YOU
                });
            } else {
                res.json({
                    success: true,
                    message: success_messages.MESSAGE_CODE_YOU_GET_NEARBY_DRIVER_LIST, providers: providers
                });
            }
        }, (err) => {
            utils.error_response(err, res)
        });

}

exports.get_trip_info = function (req, res, next) {

    var condition = {$match: {'_id': Schema(req.body.trip_id)}}
    var lookup1 = {
        $lookup:
                {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user_detail"
                }
    };
    var unwind1 = {$unwind: {
            path: "$user_detail",
            preserveNullAndEmptyArrays: true
        }
    };
    var lookup = {
        $lookup:
                {
                    from: "providers",
                    localField: "current_provider",
                    foreignField: "_id",
                    as: "provider_detail"
                }
    };
    var unwind = {$unwind: {
            path: "$provider_detail",
            preserveNullAndEmptyArrays: true
        }
    };

    Trip.aggregate([condition, lookup, unwind, lookup1, unwind1]).then((trip_data) => { 
        if (trip_data.length > 0) {
            res.json({success: true, request_data: trip_data[0]});
        } else {
            res.json({success: false});
        }
    }, (err) => {
            utils.error_response(err, res)
    })
}


// genetare_dispatcher_excel
exports.genetare_dispatcher_excel = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        var query = {};
        sort = {};
        array = [];
        var query1 = {};
        var query2 = {};
        var query3 = {};
        var query4 = {};
        var query5 = {};
        var query6 = {};
        if (req.body.page == undefined) {
            sort['unique_id'] = -1;

            search_item = 'first_name';
            search_value = '';
            sort_order = -1;
            sort_field = 'unique_id';
            filter_start_date = '';
            filter_end_date = '';

            var start_date = '';
            var end_state = '';
        } else {

            var field = req.body.sort_item[0];
            var order = req.body.sort_item[1];
            var item = req.body.search_item;
            var value = req.body.search_value;

            sort[field] = order;

            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
            search_item = item
            search_value = value;
            filter_start_date = req.body.start_date;
            filter_end_date = req.body.end_date;

            var start_date = req.body.start_date;
            var end_state = req.body.end_date;
        }
        if (start_date != '' || end_state != '') {
            if (start_date == '') {
                start_date = new Date(end_state);
                start_date = start_date - 1;
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else if (end_state == '') {
                end_date = new Date(start_date);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                start_date = new Date(start_date);
                start_date = start_date - 1;
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else {
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            }
        }

        if (item == 'first_name') {
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[''] = '';
                query4[''] = '';
                query5[''] = '';
                query6[''] = '';
            } else {
                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[item] = new RegExp(full_name[0], 'i');
                query4['last_name'] = new RegExp(full_name[0], 'i');
                query5[item] = new RegExp(full_name[1], 'i');
                query6['last_name'] = new RegExp(full_name[1], 'i');
            }
        } else {

            if (item != undefined) {
                query[item] = new RegExp(value, 'i');
            }
        }
        Dispatcher.find({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query]}).then((array) => { 

                var is_public_demo = setting_detail.is_public_demo;
                var timezone_for_display_date = setting_detail.timezone_for_display_date;

                var j = 1;
                array.forEach(function (data) {
                    var id = data._id;
                    var query = {};
                    query['user_type_id'] = id;
                    Trip.count(query).then((triptotal) => { 
                        query['is_trip_completed'] = 1;
                        Trip.count(query).then((completedtriptotal) => { 
                            if (j == array.length) {
                                data.total_trip = triptotal;
                                data.completed_trip = completedtriptotal;
                                generate_excel(req, res, array, timezone_for_display_date)
                            } else {
                                data.total_trip = triptotal;
                                data.completed_trip = completedtriptotal;
                                j++;
                            }
                        });
                    });
                });

        })
    } else {
        res.redirect('/admin');
    }
};


function generate_excel(req, res, array, timezone) {


    var date = new Date()
    var time = date.getTime()
    var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_dispatcher.xlsx');

    var sheet1 = workbook.createSheet('sheet1', 9, array.length + 1);

    sheet1.set(1, 1, config_json.title_id);
    sheet1.set(2, 1, config_json.title_name);
    sheet1.set(3, 1, config_json.title_email);
    sheet1.set(4, 1, config_json.title_phone);
    sheet1.set(5, 1, config_json.title_total_request);
    sheet1.set(6, 1, config_json.title_completed_request);
    sheet1.set(7, 1, config_json.title_country);
    sheet1.set(8, 1, config_json.title_registered_date);

    array.forEach(function (data, index) {
        sheet1.set(1, index + 2, data.unique_id);
        sheet1.set(2, index + 2, data.first_name + ' ' + data.last_name);
        sheet1.set(3, index + 2, data.email);
        sheet1.set(4, index + 2, data.country_phone_code + data.phone);
        sheet1.set(5, index + 2, data.total_trip);
        sheet1.set(6, index + 2, data.completed_trip);
        sheet1.set(7, index + 2, data.country);
        sheet1.set(8, index + 2, moment(data.created_at).tz(timezone).format("DD MMM 'YY") + ' ' + moment(data.created_at).tz(timezone).format("hh:mm a"));

        if (index == array.length - 1) {
            workbook.save(function (err) {
                if (err)
                {
                    workbook.cancel();
                } else {
                    var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_dispatcher.xlsx"
                   
                    res.json(url);
                    setTimeout(function () {
                        fs.unlink('data/xlsheet/' + time + '_dispatcher.xlsx', function (err, file) {
                        });
                    }, 10000)
                }
            });
        }

    })
}
;

exports.add_dispatcher = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        var countryList = require('country-data').callingCountries;
        Country.find({isBusiness: constant_json.YES}).then((country) => { 
            
                res.render('add_dispatcher', {country: country, phone_number_length: 10, phone_number_min_length: 8});
                delete message;
            
        });
    } else {
        res.redirect('/admin');
    }
};

// generate_dispatcher_request_export_excel
exports.generate_dispatcher_request_export_excel = function (req, res) {

    if (typeof req.session.dispatcher == 'undefined') {

        res.redirect('/dispatcher_login');

    } else {
        var j = 1;
        var array = [];
        if (req.body.page == undefined) {
            page = 0;
            next = 1;
            pre = 0;
        } else {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;
        }

        if (req.body.search_item == undefined) {
            var request = req.path.split('/')[1];
            search_item = 'user_detail.first_name';
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
        var unwind = {$unwind: "$user_detail"};

        var lookup1 = {
            $lookup:
                    {
                        from: "providers",
                        localField: "confirmed_provider",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
        };

        var unwind1 = {$unwind: "$provider_detail"};

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        if (search_item == "user_detail.first_name") {
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};

                var search = {"$match": {$or: [query1, query2]}};
            } else {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};
                query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
                query4['user_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
                query6['user_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

                var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
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

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['provider_detail.last_name'] = {$regex: new RegExp(value, 'i')};

                var search = {"$match": {$or: [query1, query2]}};
            } else {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['provider_detail.last_name'] = {$regex: new RegExp(value, 'i')};
                query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
                query4['provider_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
                query6['provider_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

                var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
            }
        } else {
            var search = {"$match": {search_item: {$regex: new RegExp(value, 'i')}}};
        }

        query1['created_at'] = {$gte: start_date, $lt: end_date};
        var filter = {"$match": query1};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);


        var mongoose = require('mongoose');
        var Schema = mongoose.Types.ObjectId;
        var condition = {$match: {'user_type_id': {$eq: Schema(req.session.dispatcher._id)}}};

        Trip.aggregate([condition, lookup, unwind, lookup1, search, filter, sort]).then((array) => { 

            var date = new Date()
            var time = date.getTime()
            var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_dispatcher_request.xlsx');

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
                        if (err)
                        {
                            workbook.cancel();
                        } else {
                            var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_dispatcher_request.xlsx"
                            res.json(url);
                            setTimeout(function () {
                                fs.unlink('data/xlsheet/' + time + '_dispatcher_request.xlsx', function (err, file) {
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
};

// generate_dispatcher_future_request_export_excel
exports.generate_dispatcher_future_request_export_excel = function (req, res) {
    if (typeof req.session.dispatcher == 'undefined') {
        res.redirect('/dispatcher_login');
    } else {
        var j = 1;
        var array = [];
        if (req.body.page == undefined) {
            page = 0;
            next = 1;
            pre = 0;
        } else {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;
        }

        if (req.body.search_item == undefined) {
            var request = req.path.split('/')[1];
            search_item = 'user_detail.first_name';
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
        var unwind = {$unwind: "$user_detail"};

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        if (search_item == "user_detail.first_name") {
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};

                var search = {"$match": {$or: [query1, query2]}};
            } else {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};
                query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
                query4['user_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
                query6['user_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

                var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
            }
        } else {
            var search = {"$match": {search_item: {$regex: new RegExp(value, 'i')}}};
        }

        query1['created_at'] = {$gte: start_date, $lt: end_date};
        var filter = {"$match": query1};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;
        var mongoose = require('mongoose');
        var Schema = mongoose.Types.ObjectId;
        // var condition = {$match: {'user_type_id': {$eq: Schema(req.session.dispatcher._id)}}};
        // var condition1 = {$match: {'is_schedule_trip_cancelled': {$eq: 0}}};
        // var condition2 = {$match: {'is_trip_created': {$eq: 0}}};

        var condition = {$match: {'is_schedule_trip': {$eq: true}}};
        var condition1 = {$match: {'is_trip_cancelled': {$eq: 0}}};
        var condition2 = {$match: {'is_trip_completed': {$eq: 0}}};
        var condition3 = {$match: {'is_trip_end': {$eq: 0}}};
        var condition4 = {$match: {'provider_id': {$eq: null}}};
        var condition5 = {$match: {'current_provider': {$eq: null}}};
        var dispatcher_type_condition = {$match: {'user_type_id': {$eq: Schema(req.session.dispatcher._id)}}};
        Trip.aggregate([dispatcher_type_condition, condition, condition1, condition2, condition3, condition4, lookup, unwind, search, filter, sort]).then((array) => { 
          
            var date = new Date();
            var time = date.getTime();
            var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_dispatcher_future_request.xlsx');

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
                        if (err)
                        {
                            workbook.cancel();
                        } else {
                            var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_dispatcher_future_request.xlsx"
                            res.json(url);
                            setTimeout(function () {
                                fs.unlink('data/xlsheet/' + time + '_dispatcher_future_request.xlsx', function (err, file) {
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