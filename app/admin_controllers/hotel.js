var utils = require('../controllers/utils');
var allemails = require('../controllers/emails');
var myHotel = require('../admin_controllers/hotel');
var Hotel = require('mongoose').model('Hotel');
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
var excelbuilder = require('msexcel-builder');
var fs = require("fs");
var console = require('../controllers/console');

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

            search_item = 'hotel_name';
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



        if (item != undefined) {
            query[item] = new RegExp(value, 'i');
        }

        Hotel.count({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query]}).then((hotelcount) => {

            if (hotelcount != 0) {
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

                    if (field == 'hotel_name') {
                        var options = {
                            sort: {hotel_name: order},
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

                Hotel.paginate({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query]}, options).then((hotellist) => {

                    var j = 1;
                    if (hotellist.docs.length <= 0) {
                        res.render('hotel_list', {detail: [], currentpage: hotellist.page, pages: hotellist.pages, next: next, pre: pre});
                        delete message;
                    } else {
                        hotellist.docs.forEach(function (data) {

                            var id = data._id;
                            var query = {};
                            query['user_type_id'] = id;
                            Trip.count(query).then((triptotal) => {

                                query['is_trip_completed'] = 1

                                Trip.count(query).then((completedtriptotal) => { 

                                    if (j == hotellist.docs.length) {
                                       
                                            var is_public_demo = setting_detail.is_public_demo;
                                            data.total_trip = triptotal;
                                            data.completed_trip = completedtriptotal;
                                            res.render('hotel_list', {is_public_demo: is_public_demo, detail: hotellist.docs, currentpage: hotellist.page, pages: hotellist.pages, next: next, pre: pre});
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
                res.render('hotel_list', {
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


exports.genetare_hotel_excel = function (req, res) {
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

            search_item = 'hotel_name';
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

        if (item != undefined) {
            query[item] = new RegExp(value, 'i');
        }
        Hotel.find({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query]}).then((array) => { 

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
    var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_hotel.xlsx');

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
                    var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_hotel.xlsx"
              
                    res.json(url);
                    setTimeout(function () {
                        fs.unlink('data/xlsheet/' + time + '_hotel.xlsx', function (err, file) {
                        });
                    }, 10000)
                }
            });
        }

    })
}
;



exports.add_hotel = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        var countryList = require('country-data').callingCountries;

        Country.find({isBusiness: constant_json.YES}).then((country) => { 
            res.render('add_hotel', {country: country, phone_number_length: 10, phone_number_min_length: 8});
            delete message;
        });
    } else {
        res.redirect('/admin');
    }

};

exports.edit_hotel = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        var id = req.body.id;
        Hotel.findById(id).then((hoteldata) => { 
            Country.findOne({"countryname": hoteldata.country}).then((country_detail) => { 
                    var is_public_demo = setting_detail.is_public_demo;
                    res.render('add_hotel', {data: hoteldata, id: id, phone_number_min_length: country_detail.phone_number_min_length, phone_number_length: country_detail.phone_number_length, is_public_demo: is_public_demo});
                    delete message;
            });
        });
    } else {
        res.redirect('/admin');
    }
};

exports.update_hotel_detail = function (req, res, next) {
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

        Hotel.findByIdAndUpdate(id, data).then((hoteldata) => {
            message = admin_messages.success_message_hotel_update;
            res.redirect("/hotel");
        });
    } else {
        res.redirect('/admin');
    }

};


exports.add_hotel_detail = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        Hotel.findOne({email: ((req.body.email).trim()).toLowerCase()}).then((response) => {

            if (response) {
                alert_message_type = "alert-danger";
                message = admin_messages.error_message_email_already_used;
                res.redirect('/hotel');
            } else {
                Hotel.findOne({phone: req.body.phone}).then((response) => {

                    
                    if (response) {
                        alert_message_type = "alert-danger";
                        message = admin_messages.error_message_mobile_no_already_used;
                        res.redirect('/hotel');
                    } else {

                        var code = req.body.countryname
                        var code_name = code.split(' ');
                        var country_code = code_name[0];
                        var country_name = "";

                        for (i = 2; i <= (code_name.length) - 1; i++) {
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
                        var hotelcount = 1;
                        Hotel.count({}).then((hotel_count) => {

                            if (hotel_count) {
                                hotelcount = hotel_count + 1;
                            }
                            var hotel_name = req.body.hotel_name;
                            hotel_name = hotel_name.charAt(0).toUpperCase() + hotel_name.slice(1);

                            var hotel = new Hotel({
                                unique_id: hotelcount,
                                hotel_name: hotel_name,
                                email: ((req.body.email).trim()).toLowerCase(),
                                country_phone_code: country_code,
                                phone: (req.body.phone).trim(),
                                password: hash,
                                city: req.body.city,
                                country: country_name,
                                countryid: code_name[1],
                                address: req.body.address,
                                latitude: req.body.latitude,
                                longitude: req.body.longitude,
                                token: token
                            })

                            hotel.save().then(() => {
                                var email_notification = setting_detail.email_notification;
                                if (email_notification == true) {
                                    allemails.sendAddHotelEmail(req, hotel, hotel.hotel_name);
                                }
                                alert_message_type = "alert-success";
                                message = admin_messages.success_message_hotel_add;
                                res.redirect('/hotel');
                            }, (err) => {
                                console.log(err);
                            });
                        })
                    }
                });
            }
        });
    } else {
        res.redirect("/admin");
    }
};

exports.hotel_forgot_password = function (req, res) {
    if (typeof req.session.hotel == 'undefined') {
        res.render('hotel_forgot_password');
        delete message;
    } else {
        res.redirect('/hotel_create_trip');
    }
};

exports.hotel_forgot_psw_email = function (req, res) {

    if (typeof req.session.hotel == 'undefined') {
        Hotel.findOne({email: req.body.email}).then((response) => {
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
                var link = req.protocol + '://' + req.get('host') + '/hotel_newpassword?id=' + id + '&&token=' + token;


                var ejs = require('ejs');
                myHotel.mail_notification(response.email, config_json.reset_password, link, '');


                Hotel.findOneAndUpdate({_id: id}, {token: token}).then((response) => {
                        message = admin_messages.success_message_send_link;
                        res.redirect("/hotel_login");
                });

            } else {
                message = admin_messages.error_message_email_not_registered;
                res.redirect('/hotel_forgot_password');
            }
        });
    } else {
        res.redirect('/hotel_create_trip');
    }
};

exports.edit_psw = function (req, res) {

    if (typeof req.session.hotel == 'undefined') {
        var id = req.query.id;
        var token = req.query.token;
        res.render('hotel_new_password', {'id': id, 'token': token});
        delete message;
    } else {
        res.redirect('/hotel_create_trip');
    }
};

exports.update_psw = function (req, res) {

    if (typeof req.session.hotel == 'undefined') {
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

        Hotel.findOneAndUpdate(query, {password: hash, token: token}).then((response) => {
            
                message = admin_messages.success_message_password_update;
                res.redirect('hotel_login');
            
        });
    } else {
        res.redirect('/hotel_create_trip');
    }
};

exports.login = function (req, res) {

    if (typeof req.session.hotel == 'undefined') {
        res.render('hotel_login');
    } else {
        res.redirect('/hotel_create_trip');
    }
};

exports.hotel_login = function (req, res, next) {

    if (typeof req.session.hotel == 'undefined') {
        var password = req.body.password;
        var hash = crypto.createHash('md5').update(password).digest('hex');

        ////// for remove case sencitive ///////
        var email = req.body.email;
        Hotel.findOne({email: email}).then((hotel) => {

            if (!hotel) {
                message = admin_messages.error_message_email_not_registered;
                res.redirect('/hotel_login');
            } else {

                if (hotel.password != hash) {
                    message = admin_messages.error_message_password_wrong;
                    res.redirect('/hotel_login');
                } else {
                    req.session.hotel = hotel;


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
                    hotel.token = token;

                    hotel.device_token = req.body.device_token;
                    hotel.save().then(() => {
                            message = admin_messages.success_message_login;
                            res.redirect('/hotel_create_trip');
                    }, (err) => {
                        console.log(err);
                    });
                }
            }
        });
    } else {
        res.redirect('/hotel_create_trip');
    }
};

exports.hotel_header = function (req, res) {
    if (typeof req.session.hotel != 'undefined') {
        res.render('hotel_header')
    } else {
        res.redirect('/hotel_login');
    }
};

exports.hotel_profile = function (req, res) {

    if (typeof req.session.hotel != "undefined") {

        Hotel.findById(req.session.hotel._id).then((response) => {

            Country.findById(response.countryid).then((country_data) => {
                var lookup = require('country-data').lookup;
                var lookup = lookup.countries({name: country_data.countryname})[0];
                var is_public_demo = setting_detail.is_public_demo;
                req.session.hotel = response;

                res.render("hotel_profile", {is_public_demo: is_public_demo, detail: response, country_code: lookup.alpha3});
                delete message;
            });
        });
    } else {
        res.redirect('/hotel_login');
    }
};

exports.hotel_update_profile = function (req, res) {
    if (typeof req.session.hotel != "undefined") {
        Hotel.findById(req.body.id).then((hotel_detail) => {
            var password = req.body.password;
            var hash = crypto.createHash('md5').update(password).digest('hex');
            delete req.body.password;
            if (hotel_detail.password == hash)
            {
                Hotel.findByIdAndUpdate(req.body.id, req.body).then((resp) => {
                    
                        partners = resp;
                        message = admin_messages.success_message_profile_update;
                        res.redirect('hotel_profile');
                    
                });
            } else
            {
                message = admin_messages.error_message_password_wrong;
                res.redirect('hotel_profile');
            }
        });
    } else {
        res.redirect('/hotel_login');
    }
};

exports.hotel_sign_out = function (req, res) {
    req.session.destroy(function (err, data) {
        if (err) {
            console.log(err);
        } else {

            res.redirect('/hotel_login');
        }
    });
};

exports.hotel_create_trip = function (req, res) {

    if (typeof req.session.hotel != 'undefined') {
        var server_date = new Date(Date.now());
        Country.findOne({countryname: req.session.hotel.country}).then((country_data) => {

            res.render("hotel_create_trip", {'moment': moment, server_date: server_date, scheduled_request_pre_start_minute: setting_detail.scheduled_request_pre_start_minute, country_code: country_data.countrycode, map_key: setting_detail.web_app_google_key, hotels: req.session.hotel, country: req.session.hotel.country});
            delete message;
        });

    } else {
        res.redirect('/hotel_login');
        delete message;
    }
};


exports.hotel_future_request = function (req, res) {

    if (typeof req.session.hotel == 'undefined') {

        res.redirect('/hotel_login');

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

        var filter = {"$match": {}};
        filter["$match"]['created_at'] = {$gte: start_date, $lt: end_date};

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
        var hotel_type_condition = {$match: {'user_type_id': {$eq: Schema(req.session.hotel._id)}}};

        Trip.aggregate([filter, condition, condition1, condition2, condition3, condition4, condition5, hotel_type_condition, lookup, unwind, search, count]).then((array) => {

            if (array.length == 0) {
                res.render('hotel_future_request_list', {detail: array, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment});
            } else {
                var pages = Math.ceil(array[0].total / number_of_rec);
                Trip.aggregate([filter, condition, condition1, condition2, condition3, condition4, condition5, hotel_type_condition, lookup, unwind, search, sort, skip, limit]).then((array) => {

                    res.render('hotel_future_request_list', {detail: array, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment});

                });
            }
        });
    }
}

exports.hotel_request = function (req, res) {

    if (typeof req.session.hotel == 'undefined') {

        res.redirect('/hotel_login');

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
                        localField: "provider_id",
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

        var filter = {"$match": {}};
        filter["$match"]['created_at'] = {$gte: start_date, $lt: end_date};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;
        var mongoose = require('mongoose');
        var Schema = mongoose.Types.ObjectId;


        var condition = {$match: {'user_type_id': {$eq: Schema(req.session.hotel._id)}}};

        Trip.aggregate([filter, condition, lookup, unwind, lookup1, search, count]).then((array) => {

            if (array.length == 0) {
                res.render('hotel_request_list', {detail: array, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment});
            } else {
                var pages = Math.ceil(array[0].total / number_of_rec);
                Trip.aggregate([filter, condition, lookup, unwind, lookup1, search, sort, skip, limit]).then((array) => {

                    res.render('hotel_request_list', {detail: array, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment});

                });
            }
        });
    }
};

exports.hotel_trip_map = function (req, res, next) {

    if (typeof req.session.hotel == 'undefined') {

        res.redirect('/hotel_login');
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
                    res.render('hotel_trip_map', {'data': trips, 'url': url, 'user_name': user_name, 'provider_name': provider_name, 'moment': moment});
                } else {
                    res.render('hotel_trip_map', {'data': trips, 'url': url, 'trip_path_data': locations, 'user_name': user_name, 'provider_name': provider_name, 'moment': moment});
                }
            });
            
        });
    }
};

exports.mail_notification = function (to, sub, text, html) {

    var email = setting_detail.email;
    var password = setting_detail.password;
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: email, // Your email id
            pass: password // Your password
        }
    });

    var mailOptions = {// sender address
        //from: from ,
        to: to, // list of receivers
        subject: sub, // Subject line
        text: text, //, /// plaintext body
        html: html

    }

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.error(error);
        } else {

        }
        ;
    });
};



exports.genetare_hotel_request_excel = function (req, res) {

    if (typeof req.session.hotel == 'undefined') {

        res.redirect('/hotel_login');

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
                        localField: "provider_id",
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

        var filter = {"$match": {}};
        filter["$match"]['created_at'] = {$gte: start_date, $lt: end_date};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var mongoose = require('mongoose');
        var Schema = mongoose.Types.ObjectId;
        var condition = {$match: {'user_type_id': {$eq: Schema(req.session.hotel._id)}}};

        Trip.aggregate([filter, condition, lookup, unwind, lookup1, search, sort]).then((array) => { 

            var date = new Date()
            var time = date.getTime()
            var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_hotel_request.xlsx');
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
            sheet1.set(10, 1,config_json.title_payment_status);

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
                            var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_hotel_request.xlsx"
                            res.json(url);
                            setTimeout(function () {
                                fs.unlink('data/xlsheet/' + time + '_hotel_request.xlsx', function (err, file) {
                                });
                            }, 10000)
                        }
                    });
                }

            })

        });
    }
};


exports.genetare_hotel_future_request_excel = function (req, res) {

    if (typeof req.session.hotel == 'undefined') {

        res.redirect('/hotel_login');

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

        var filter = {"$match": {}};
        filter["$match"]['created_at'] = {$gte: start_date, $lt: end_date};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);


        var mongoose = require('mongoose');
        var Schema = mongoose.Types.ObjectId;

        var condition = {$match: {'is_schedule_trip': {$eq: true}}};
        var condition1 = {$match: {'is_trip_cancelled': {$eq: 0}}};
        var condition2 = {$match: {'is_trip_completed': {$eq: 0}}};
        var condition3 = {$match: {'is_trip_end': {$eq: 0}}};
        var condition4 = {$match: {'provider_id': {$eq: null}}};
        var condition5 = {$match: {'current_provider': {$eq: null}}};
        var hotel_type_condition = {$match: {'user_type_id': {$eq: Schema(req.session.hotel._id)}}};

        Trip.aggregate([filter, condition, condition1, condition2, condition3, condition4, condition5, hotel_type_condition, lookup, unwind, search, sort]).then((array) => {

            var date = new Date();
            var time = date.getTime();
            var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_hotel_schedule_trip.xlsx');

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
                            var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_hotel_schedule_trip.xlsx"
                            res.json(url);
                            setTimeout(function () {
                                fs.unlink('data/xlsheet/' + time + '_hotel_schedule_trip.xlsx', function (err, file) {
                                });
                            }, 10000)
                        }
                    });
                }

            })


        });

    }
}