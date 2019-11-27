var utils = require('../controllers/utils');
var allemails = require('../controllers/emails');
var User = require('mongoose').model('User');
var Corporate = require('mongoose').model('Corporate');
var fs = require('fs');
var console = require('../controllers/console');
var Country = require('mongoose').model('Country');
var Settings = require('mongoose').model('Settings');
var crypto = require('crypto');
var moment = require("moment");
var mongoose = require('mongoose');
var Schema = mongoose.Types.ObjectId;
var Provider = require('mongoose').model('Provider');
var Trip = require('mongoose').model('Trip');
var Trip_Location = require('mongoose').model('trip_location');


exports.register = function (req, res) {
    if (typeof req.session.corporate == 'undefined') {
    	Country.find({isBusiness: constant_json.YES}).then((country) => { 
            var is_public_demo = setting_detail.is_public_demo;
            res.render("corporate_register", {country: country});
            delete message;
        });
    } else {
		res.redirect('/corporate_profile');
        delete message;
    }
};

exports.corporate_create = function (req, res) {
    if (typeof req.session.corporate == 'undefined') {

    	Corporate.findOne({email: ((req.body.email).trim()).toLowerCase()}).then((response) => { 

            if (response) {
                message = admin_messages.error_message_email_already_used;
                res.redirect('/corporate_register');
            } else {
                Corporate.findOne({phone: req.body.phone}).then((response) => { 
                    if (response) {
                        message = admin_messages.error_message_mobile_no_already_used;
                        res.redirect('/corporate_register');
                    } else {
                        var password = req.body.password;
                        var hash = crypto.createHash('md5').update(password).digest('hex');

                        var referral_code = utils.tokenGenerator(6);

                        var name = req.body.name;
                        name = name.charAt(0).toUpperCase() + name.slice(1);
                        var token = utils.tokenGenerator(32);

                        var code = req.body.country_phone_code;
                        var code_name = code.split(' ');
                        var country_code = code_name[0];
                        var country_name = "";

                        for (i = 1; i <= (code_name.length) - 1; i++) {

                            country_name = country_name + " " + code_name[i];
                        }

                        country_name = country_name.substr(1);

                        var corporate = new Corporate({
                            name: name,
                            email: ((req.body.email).trim()).toLowerCase(),
                            country_phone_code: country_code,
                            country_name: country_name,
                            phone: req.body.phone,
                            password: hash,
                            country_id: req.body.country_id,
                            wallet_currency_code: req.body.wallet_currency_code,
                            is_approved: 0,
                            wallet: 0,
                            token: token,
                            referral_code: referral_code
                        });
                        corporate.save().then(() => { 
                            var email_notification = setting_detail.email_notification;
                            if (email_notification == true) {
                                allemails.sendPartnerRegisterEmail(req, corporate, corporate.name);
                            }
                            message = admin_messages.success_message_registration;
                            res.redirect('/corporate_login');
                        }, (err) => {
                            console.log(err)
                            utils.error_response(err, res)
                        });
                        
                    }
                });
            }

        });

    } else {
    	res.redirect('/corporate_profile');
    }
};

exports.corporate_forgot_password = function (req, res) {
    if (typeof req.session.corporate == 'undefined') {
    	res.render('corporate_forgot_password');
        delete message;
    } else {
    	res.redirect('/corporate_profile');
    }
};

exports.corporate_forgot_password_email = function (req, res) {
    if (typeof req.session.corporate == 'undefined') {

    	Corporate.findOne({email: req.body.email}).then((response) => { 
            if (response) {
                var token = utils.tokenGenerator(32);
                var id = response.id;
                var link = req.protocol + '://' + req.get('host') + '/corporate_newpassword?id=' + id + '&&token=' + token;
                utils.mail_notification(response.email, config_json.reset_password, link, '');
                Corporate.findOneAndUpdate({_id: id}, {token: token}).then((response) => { 
                    message = admin_messages.success_message_send_link;
                    res.redirect("/corporate_login");
                });

            } else {
                message = admin_messages.error_message_email_not_registered;
                res.redirect('/corporate_forgot_password');
            }
        });
    } else {
    	res.redirect('/corporate_profile');
    }
};

exports.login = function (req, res) {
    if (typeof req.session.corporate == 'undefined') {
    	res.render('corporate_login');
        delete message;
    } else {
    	res.redirect('/corporate_profile');
        delete message;
    }
};

exports.corporate_login = function (req, res) {
    if (typeof req.session.corporate == 'undefined') {

    	var crypto = require('crypto');
        var password = req.body.password;
        var hash = crypto.createHash('md5').update(password).digest('hex');
        // for remove case sencitive 
        var email = req.body.email;
        Corporate.findOne({email: email}).then((corporate) => { 
            if (!corporate) {
                message = admin_messages.error_message_email_not_registered;
                res.redirect("/corporate_login");
            } else {
                if (corporate.password == hash) {
                    if (corporate.is_approved == 1) {
                    	req.session.corporate = corporate;
                    	var token = utils.tokenGenerator(32);
                        corporate.token = token;
                        corporate.save().then(() => { 
                                message = admin_messages.success_message_login;
                                res.redirect('/corporate_profile');
                        }, (err) => {
                            utils.error_response(err, res)
                        });
                    } else {
                        message = admin_messages.error_message_admin_not_approved
                        res.redirect("corporate_login");;
                    }
                } else {
                    message = admin_messages.error_message_password_wrong;
                    res.redirect('/corporate_login');
                }
            }
        });
    } else {
    	res.redirect('/corporate_profile');
    }
};

exports.edit_psw = function (req, res) {
    if (typeof req.session.corporate == 'undefined') {
    	var id = req.query.id;
        var token = req.query.token;
        res.render('corporate_new_password', {'id': id, 'token': token});
    } else {
    	res.redirect('/corporate_profile');

    }
};

exports.update_psw = function (req, res) {
    if (typeof req.session.corporate == 'undefined') {
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

        Corporate.findOneAndUpdate(query, {password: hash, token: token}).then((response) => { 
            if (!response) {
                res.redirect('corporate_forgot_password');
            } else {
                res.redirect('corporate_login');
            }
        });
    } else {
    	res.redirect('/corporate_profile');
    }
};



exports.corporate_header = function (req, res) {
    if (typeof req.session.corporate !== 'undefined') {
    	res.render("corporate_header");
    } else {
    	res.redirect('/corporate_login')
    }
};

exports.corporate_profile = function (req, res) {
    if (typeof req.session.corporate !== 'undefined') {
    	callingCountries = require('country-data').callingCountries;
        Corporate.findById(req.session.corporate._id).then((response) => { 
            Country.findOne({_id: response.country_id}).then((countrydata) => { 
                req.session.corporate = response;
                res.render("corporate_profile", {country: callingCountries.all, phone_number_min_length: countrydata.phone_number_min_length, phone_number_length: countrydata.phone_number_length, login1: response});
                delete message;
            });
        });
    } else {
    	res.redirect('/corporate_login')

    }
};

exports.corporate_edit_profile = function (req, res) {
    if (typeof req.session.corporate !== 'undefined') {

    	var id = req.body.id
        Corporate.findOne({phone: req.body.phone, _id: {$ne: id}}).then((user) => { 
            if (user)
            {
                message = admin_messages.error_message_mobile_no_already_used;
                res.redirect('/corporate_profile')
            } else
            {
                if(req.body.password != ''){
                    req.body.password = crypto.createHash('md5').update(req.body.password).digest('hex');
                } else {
                    delete req.body.password;
                }
            	Corporate.findByIdAndUpdate(id, req.body, {new : true}).then((user) => { 
                    req.session.corporate = user;
                    message = admin_messages.success_message_profile_update;
                    res.redirect('corporate_profile');
                });
            }
        });

    } else {
    	res.redirect('/corporate_login')

    }
};

exports.corporate_sign_out = function (req, res) {
    if (typeof req.session.corporate !== 'undefined') {
        req.session.destroy(function (err, data) {
            res.redirect('/corporate_login')
        });
    } else {
    	res.redirect('/corporate_login')

    }
};


exports.corporate_users = function (req, res, next) {
    if (typeof req.session.corporate != 'undefined') {
        var query = {};
        var query1 = {};
        var query2 = {};
        var query3 = {};
        var query4 = {};
        var query5 = {};
        var query6 = {};
        var options = {};
        var array = [];
        console.log(req.body)
        if (req.body.page_number == undefined) {
            user_type = req.path.split('/')[1];

            search_item = 'first_name';
            search_value = '';
            filter_start_date = '';
            filter_end_date = '';

            var start_date = '';
            var end_date = '';
        } else {
            user_type = req.body.user_type;

            var item = req.body.search_item;
            var value = req.body.search_value;

            search_item = item
            search_value = value;
            filter_start_date = req.body.start_date;
            filter_end_date = req.body.end_date;

            var start_date = req.body.start_date;
            var end_date = req.body.end_date;
        }

        if (start_date != '' || end_date != '') {
            if (start_date == '') {
                start_date = new Date(end_date);
                start_date = start_date - 1;
                end_date = new Date(end_date);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else if (end_date == '') {
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
                end_date = new Date(end_date);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            }
        }

        // if (user_type == 'users') {
            query['is_approved'] = 1;
            query['country_phone_code'] = req.session.corporate.country_phone_code;
        // } else if (user_type == 'declined_users') {
        //     query['is_approved'] = 0;
        // }

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
        User.count({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query]}, function (err, userscount) {


            if (userscount != 0) {
                if (req.body.page == undefined) {
                    page = 1;
                    next = parseInt(page) + 1;
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
                    var sort = {};
                    sort['unique_id'] = -1

                    //if (field == 'first_name') {
                    var options = {
                        sort: sort,
                        page: page,
                        limit: 10
                    };
                    // } else if (field == 'Id') {
                    //     var options = {
                    //         sort: {unique_id: order},
                    //         page: page,
                    //         limit: 10
                    //     };
                    // } else {
                    //     var options = {
                    //         sort: {email: order},
                    //         page: page,
                    //         limit: 10
                    //     };
                    // }

                }


                User.paginate({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query]}, options, function (err, users) {

                    Settings.findOne({}, function (err, settingData) {
                        var is_public_demo = settingData.is_public_demo;
                        var timezone_for_display_date = settingData.timezone_for_display_date;


                        if (users.docs.length <= 0) {
                            res.render('corporate_customers_list', {is_public_demo: is_public_demo, corporate_id: req.session.corporate._id, timezone_for_display_date: timezone_for_display_date, detail: [], pages: users.pages, currentpage: users.page, next: next, pre: pre});
                            delete message;
                        } else {
                            var j = 1;
                            users.docs.forEach(function (user_data) {

                                var id = user_data.referred_by;
                                query = {};
                                query['_id'] = id;
                                if (id != undefined) {
                                    User.findOne(query, function (err, user_val) {

                                        var user_name = "";
                                        if (user_val != null) {
                                            user_name = user_val.first_name + ' ' + user_val.last_name;
                                        }

                                        if (j == users.docs.length) {
                                            user_data.referred_by = user_name;
                                            res.render('corporate_customers_list', {moment: moment, corporate_id: req.session.corporate._id, is_public_demo: is_public_demo, timezone_for_display_date: timezone_for_display_date, detail: users.docs, pages: users.pages, currentpage: users.page, next: next, pre: pre});
                                            delete message;
                                        } else {
                                            user_data.referred_by = user_name;
                                            j = j + 1;
                                        }
                                    });
                                } else {
                                    if (j == users.docs.length) {
                                        user_data.referred_by = "";

                                        res.render('corporate_customers_list', {moment: moment, corporate_id: req.session.corporate._id, is_public_demo: is_public_demo, timezone_for_display_date: timezone_for_display_date, detail: users.docs, pages: users.pages, next: next, currentpage: users.page, pre: pre});
                                        delete message;
                                    } else {
                                        user_data.referred_by = "";
                                        j = j + 1;
                                    }
                                }
                            });
                            //});
                        }
                    });
                });
            } else {
                res.render('corporate_customers_list', {moment: moment, corporate_id: req.session.corporate._id, detail: array, currentpage: '', pages: '', next: '', pre: ''});
                delete message;
            }
        });
    } else {
        res.redirect('/corporate_login');
    }
};

exports.corporate_send_request = function (req, res, next) {
    if (typeof req.session.corporate != 'undefined') {

        User.findOne({_id: req.body.id}).then((user_detail)=>{
            if(user_detail){
                user_detail.corporate_ids.push({
                    corporate_id: Schema(req.session.corporate._id),
                    status: Number(constant_json.CORPORATE_REQUEST_WAITING)
                });
                user_detail.markModified('corporate_ids');
                Corporate.findOne({_id: req.session.corporate._id}).then((corporate_detail)=>{
                    utils.sendPushNotification(constant_json.USER_UNIQUE_NUMBER, user_detail.device_type, user_detail.device_token, push_messages.PUSH_CODE_FOR_NEW_CORPORATE_REQUEST, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS, {name: corporate_detail.name,
                            phone: corporate_detail.phone,
                            _id: corporate_detail._id,
                            country_phone_code: corporate_detail.country_phone_code,
                            status: user_detail.corporate_ids[0].status
                    });
                });      
                user_detail.save().then(()=>{
                    message = admin_messages.success_message_request_send_successfully;
                    res.redirect('/corporate_users');
                });
            } else {
                res.redirect('/corporate_users');
            }
        });

    } else {
        res.redirect('/corporate_login');
    }
};

exports.corporate_remove_user = function (req, res, next) {
    if (typeof req.session.corporate != 'undefined') {

        User.findOne({_id: req.body.id}).then((user_detail)=>{
            if(user_detail){
                var index = user_detail.corporate_ids.findIndex((x)=>x._id==req.body.corporate_id);
                user_detail.corporate_ids.splice(index, 1);
                user_detail.save().then(()=>{
                    message = admin_messages.success_message_user_removed_successfully;
                    res.redirect('/corporate_users');
                });
            } else {
                res.redirect('/corporate_users');
            }
        });

    } else {
        res.redirect('/corporate_login');
    }
};



exports.corporate_create_trip = function (req, res) {
    if (typeof req.session.corporate != 'undefined') {
        var server_date = new Date(Date.now());

        // User.find({country_phone_code: req.session.corporate.country_phone_code, is_approved: 1}).then((user_list) => { 

        var condition = {$match: {$and: [{'country_phone_code': req.session.corporate.country_phone_code}, {'is_approved': 1}]}}
        var unwind = {'$unwind': '$corporate_ids'}
        var corporate_condition = {$match: {$and: [{'corporate_ids.corporate_id': Schema(req.session.corporate._id)}, 
                {'corporate_ids.status': Number(constant_json.CORPORATE_REQUEST_ACCEPTED)} ]}}
        User.aggregate([condition, unwind, corporate_condition]).then((user_list)=>{
            Country.findOne({_id: req.session.corporate.country_id}).then((country_data) => { 

                var url = "https://maps.googleapis.com/maps/api/js?key=" + setting_detail.web_app_google_key + "&libraries=places"
                res.render("corporate_create_trip", {'moment': moment,
                    server_date: server_date, scheduled_request_pre_start_minute: setting_detail.scheduled_request_pre_start_minute,
                    country_code: country_data.countrycode,
                    phone_number_min_length: country_data.phone_number_min_length,
                    phone_number_length: country_data.phone_number_length,
                    user_list: user_list, corporates: req.session.corporate, map_key: url, country: country_data.countryname});
                delete message;
            });
        });

    } else {
        res.redirect('/corporate_login');
        delete message;
    }

};

exports.corporate_request = function (req, res) {

    if (typeof req.session.corporate == 'undefined') {

        res.redirect('/corporate_login');

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
        var condition = {$match: {'user_type_id': {$eq: Schema(req.session.corporate._id)}}};
      
        Trip.aggregate([condition, lookup, unwind, lookup1, search, filter, count]).then((array) => { 
            if (array.length == 0) {
                res.render('corporate_request_list', {detail: array, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment});
            } else {
                var pages = Math.ceil(array[0].total / number_of_rec);
                Trip.aggregate([condition, lookup, unwind, lookup1, search, filter, sort, skip, limit]).then((array) => { 

                    res.render('corporate_request_list', {detail: array, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment});
                }, (err) => {
                    utils.error_response(err, res)
                });
            }
        }, (err) => {
            utils.error_response(err, res)
        });
    }
};

exports.corporate_future_request = function (req, res) {

    if (typeof req.session.corporate == 'undefined') {

        res.redirect('/corporate_login');

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
        var corporate_type_condition = {$match: {'user_type_id': {$eq: Schema(req.session.corporate._id)}}};

        Country.findOne({_id: req.session.corporate.country_id}).then((country_data) => { 

            Trip.aggregate([corporate_type_condition, condition, condition1, condition2, condition3, condition4, lookup, unwind, search, filter, count]).then((array) => { 

                if (array.length == 0) {
                    res.render('corporate_future_request_list', {detail: array, timezone: country_data.countrytimezone, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment});
                } else {
                    var pages = Math.ceil(array[0].total / number_of_rec);
                    Trip.aggregate([corporate_type_condition, condition, condition1, condition2, condition3, condition4, lookup, unwind, search, filter, sort, skip, limit]).then((array) => { 

                        res.render('corporate_future_request_list', {detail: array, timezone: country_data.countrytimezone, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment});
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

exports.corporate_trip_map = function (req, res, next) {
    if (typeof req.session.corporate == 'undefined') {

        res.redirect('/corporate_login');
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
                    res.render('corporate_trip_map', {'data': trips, 'url': url, 'user_name': user_name, 'provider_name': provider_name, 'moment': moment});

                } else {
                    res.render('corporate_trip_map', {'data': trips, 'url': url, 'trip_path_data': locations, 'user_name': user_name, 'provider_name': provider_name, 'moment': moment});
                }
            });
        });
    }
};