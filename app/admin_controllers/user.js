var User = require('mongoose').model('User');
var Trip = require('mongoose').model('Trip');
var Provider = require('mongoose').model('Provider');
var moment = require("moment");
var utils = require('../controllers/utils');
var myTrips = require('../controllers/trip');
var allemails = require('../controllers/emails');
var Settings = require('mongoose').model('Settings');
var User_Document = require('mongoose').model('User_Document');
var Country = require('mongoose').model('Country');
var City = require('mongoose').model('City');
var moment = require('moment-timezone');
var excelbuilder = require('msexcel-builder');
var fs = require("fs");
var console = require('../controllers/console');
var mongoose = require('mongoose');
var Schema = mongoose.Types.ObjectId;

    exports.referral_report = function (req, res, next) {
        if (typeof req.session.userid != 'undefined') {
            var start_date = req.body.start_date;
            var end_date = req.body.end_date;
            filter_start_date = '';
            filter_end_date = '';

            if (end_date == '' || end_date == undefined) {
                end_date = new Date();
            } else {
                filter_end_date = end_date;
                end_date = new Date(end_date);
                end_date = end_date.setHours(23, 59, 59, 999);
                end_date = new Date(end_date);
            }
            if (start_date == '' || start_date == undefined) {
                start_date = new Date(0);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
            } else {
                filter_start_date = start_date;
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
            }

            var query1 = {};
            query1['referred_user_detail.created_at'] = {$gte: start_date, $lt: end_date};
            var filter = {"$match": query1};

            var lookup = {
                $lookup:
                {
                    from: "users",
                    localField: "referred_by",
                    foreignField: "_id",
                    as: "referred_user_detail"
                }
            };

            var unwind = {$unwind: "$referred_user_detail"}

            var group = {
                $group: {
                    _id: '$referred_user_detail._id',
                    referred_user_count: {$sum: {$cond: [{$and: [{$gte: ["$referred_user_detail.created_at",start_date]}, {$lt: ["$referred_user_detail.created_at", end_date]}]}, 1, 0]}},
                    unique_id: {$first: '$referred_user_detail.unique_id'},
                    first_name: {$first: '$referred_user_detail.first_name'},
                    last_name: {$first: '$referred_user_detail.last_name'},
                    email: {$first: '$referred_user_detail.email'},
                    phone: {$first: '$referred_user_detail.phone'}
                }
            }

            User.aggregate([lookup, unwind, group], function(error, user_list){
                if(error){
                    console.log(error)
                    res.render('referral_report', { user_list: [] });
                } else {
                   
                    var new_user_list = user_list.filter(function(user){
                        return user.referred_user_count > 0
                    })
                    setTimeout(function(){
                        res.render('referral_report', { user_list: new_user_list, user_id: req.body.user_id, moment: moment, timezone_for_display_date: setting_detail.timezone_for_display_date });
                    },100)
                }
            });
        } else {
            res.redirect('/admin');
        }
    };

    exports.referral_history = function (req, res, next) {
        if (typeof req.session.userid != 'undefined') {

            var start_date = req.body.start_date;
            var end_date = req.body.end_date;
            

            if (end_date == '' || end_date == undefined) {
                end_date = new Date();
            } else {
                filter_end_date = end_date;
                end_date = new Date(end_date);
                end_date = end_date.setHours(23, 59, 59, 999);
                end_date = new Date(end_date);
            }
            if (start_date == '' || start_date == undefined) {
                start_date = new Date(0);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
            } else {
                filter_start_date = start_date;
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
            }

            var condition = {$match: {referred_by: Schema(req.body.user_id)}};
            var query1 = {};
            query1['created_at'] = {$gte: start_date, $lt: end_date};
            var filter = {"$match": query1};

            User.aggregate([condition, filter], function(error, user_list){
                if(error){
                    res.render('referral_history', { user_list: [] });
                } else {
                    res.render('referral_history', { user_list: user_list, user_id: req.body.user_id, moment: moment, timezone_for_display_date: setting_detail.timezone_for_display_date });
                }
            });

        } else {
            res.redirect('/admin');
        }
    };

exports.list = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        var query = {};
        var query1 = {};
        var query2 = {};
        var query3 = {};
        var query4 = {};
        var query5 = {};
        var query6 = {};
        var options = {};
        var array = [];

        if (req.body.user_type == undefined) {
            user_type = req.path.split('/')[1];

            search_item = 'first_name';
            search_value = '';
            sort_order = -1;
            sort_field = 'Id';
            filter_start_date = '';
            filter_end_date = '';

            var start_date = '';
            var end_date = '';
        } else {
            user_type = req.body.user_type;

            var item = req.body.search_item;
            var value = req.body.search_value;
            var field = req.body.sort_item[0];
            var order = req.body.sort_item[1];



            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
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

        if (user_type == 'users') {
            query['is_approved'] = 1;
        } else if (user_type == 'declined_users') {
            query['is_approved'] = 0;
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
                    sort[field] = order

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
                            res.render('customers_list', {is_public_demo: is_public_demo, timezone_for_display_date: timezone_for_display_date, detail: [], pages: users.pages, currentpage: users.page, next: next, pre: pre});
                            delete message;
                        } else {
                            var j = 1;
                            users.docs.forEach(function (user_data) {

                                // Trip.aggregate([{ $match: { 'user_id': { $eq: user_data._id } } } ,
                                // {
                                //     $group: {
                                //         _id: null,
                                //         total : {$sum : 1},
                                //         completed: { $sum: {$cond: [{$eq: ["$is_trip_completed", 1] }, 1, 0]} },
                                //         cancelled: { $sum: {$cond: [{$eq: ["$is_trip_cancelled_by_user", 1] }, 1, 0]} }
                                //     },
                                // }], function (err, total) {
                                //     if(total.length > 0)
                                //     {
                                //         user_data.total_request = total[0].total;
                                //         user_data.completed_request = total[0].completed;
                                //         user_data.cancelled_request = total[0].cancelled;
                                //     }
                                //     else
                                //     {
                                //         user_data.total_request = 0
                                //         user_data.completed_request = 0;
                                //         user_data.cancelled_request = 0;
                                //     }



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
                                            if (field == "total_request")
                                            {
                                                users.docs.sort(sortCountry);
                                            }

                                            function sortCountry(a, b) {
                                                if (a.total_request < b.total_request)
                                                    return -1;
                                                if (a.total_request > b.total_request)
                                                    return 1;
                                                return 0;
                                            }
                                            user_data.referred_by = user_name;
                                            res.render('customers_list', {moment: moment, is_public_demo: is_public_demo, timezone_for_display_date: timezone_for_display_date, detail: users.docs, pages: users.pages, currentpage: users.page, next: next, pre: pre});
                                            delete message;
                                        } else {
                                            user_data.referred_by = user_name;
                                            j = j + 1;
                                        }
                                    });
                                } else {
                                    if (j == users.docs.length) {
                                        user_data.referred_by = "";

                                        if (field == "total_request")
                                        {
                                            users.docs.sort(sortCountry);
                                        }

                                        function sortCountry(a, b) {
                                            if (a.total_request < b.total_request)
                                                return -1;
                                            if (a.total_request > b.total_request)
                                                return 1;
                                            return 0;
                                        }


                                        res.render('customers_list', {moment: moment, is_public_demo: is_public_demo, timezone_for_display_date: timezone_for_display_date, detail: users.docs, pages: users.pages, next: next, currentpage: users.page, pre: pre});
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
                res.render('customers_list', {moment: moment, detail: array, currentpage: '', pages: '', next: '', pre: ''});
                delete message;
            }
        });
    } else {
        res.redirect('/admin');
    }
};

exports.generate_user_excel = function (req, res, next) {


    if (typeof req.session.userid != 'undefined') {
        var query = {};
        var query1 = {};
        var query2 = {};
        var query3 = {};
        var query4 = {};
        var query5 = {};
        var query6 = {};
        var options = {};
        var array = [];


        var user_type = req.body.user_type;

        var item = req.body.search_item;
        var value = req.body.search_value;
        var field = req.body.sort_item[0];
        var order = req.body.sort_item[1];



        sort_order = req.body.sort_item[1];
        sort_field = req.body.sort_item[0];
        search_item = item
        search_value = value;
        filter_start_date = req.body.start_date;
        filter_end_date = req.body.end_date;

        var start_date = req.body.start_date;
        var end_date = req.body.end_date;


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

        if (user_type == 'users') {
            query['is_approved'] = 1;
        } else if (user_type == 'declined_users') {
            query['is_approved'] = 0;
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

        var sort = {};
        sort[field] = order
        User.find({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query]}, function (err, users) {

            Settings.findOne({}, function (err, settingData) {
                var is_public_demo = settingData.is_public_demo;
                var timezone_for_display_date = settingData.timezone_for_display_date;


                var j = 1;
                users.forEach(function (user_data) {
                    var id = user_data.referred_by;
                    query = {};
                    query['_id'] = id;
                    if (id != undefined) {
                        User.findOne(query, function (err, user_val) {

                            var user_name = "";
                            if (user_val != null) {
                                user_name = user_val.first_name + ' ' + user_val.last_name;
                            }

                            if (j == users.length) {
                                if (field == "total_request")
                                {
                                    users.sort(sortCountry);
                                }

                                function sortCountry(a, b) {
                                    if (a.total_request < b.total_request)
                                        return -1;
                                    if (a.total_request > b.total_request)
                                        return 1;
                                    return 0;
                                }
                                user_data.referred_by = user_name;
                                generate_excel(req, res, users, timezone_for_display_date)

                            } else {
                                user_data.referred_by = user_name;
                                j = j + 1;
                            }
                        });
                    } else {
                        if (j == users.length) {
                            user_data.referred_by = "";

                            if (field == "total_request")
                            {
                                users.sort(sortCountry);
                            }

                            function sortCountry(a, b) {
                                if (a.total_request < b.total_request)
                                    return -1;
                                if (a.total_request > b.total_request)
                                    return 1;
                                return 0;
                            }

                            generate_excel(req, res, users, timezone_for_display_date)


                        } else {
                            user_data.referred_by = "";
                            j = j + 1;
                        }
                    }
                });
            });
        })

    } else {
        res.redirect('/admin');
    }
};

function generate_excel(req, res, array, timezone) {


    var date = new Date(Date.now())
    var time = date.getTime()
    var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_user.xlsx');

    var sheet1 = workbook.createSheet('sheet1', 13, array.length + 1);

    sheet1.set(1, 1, config_json.title_id);
    sheet1.set(2, 1, config_json.title_name);
    sheet1.set(3, 1, config_json.title_email);
    sheet1.set(4, 1, config_json.title_phone);
    sheet1.set(5, 1, config_json.title_total_request);
    sheet1.set(6, 1, config_json.title_completed_request);
    sheet1.set(7, 1, config_json.title_cancelled_request);
    sheet1.set(8, 1, config_json.title_city);
    sheet1.set(9, 1, config_json.title_referral_code);
    sheet1.set(10, 1, config_json.title_wallet);
    sheet1.set(11, 1, config_json.title_app_version);
    sheet1.set(12, 1, config_json.title_registered_date);

    array.forEach(function (data, index) {
        sheet1.set(1, index + 2, data.unique_id);
        sheet1.set(2, index + 2, data.first_name + ' ' + data.last_name);
        sheet1.set(3, index + 2, data.email);
        sheet1.set(4, index + 2, data.country_phone_code + data.phone);
        sheet1.set(5, index + 2, data.total_request);
        sheet1.set(6, index + 2, data.completed_request);
        sheet1.set(7, index + 2, data.cancelled_request);
        sheet1.set(8, index + 2, data.city);
        sheet1.set(9, index + 2, data.referral_code);
        sheet1.set(10, index + 2, data.wallet);
        sheet1.set(11, index + 2, data.device_type + '-' + data.app_version);
        sheet1.set(12, index + 2, moment(data.created_at).tz(timezone).format("DD MMM 'YY") + ' ' + moment(data.created_at).tz(timezone).format("hh:mm a"));

        if (index == array.length - 1) {
            workbook.save(function (err) {
                if (err)
                {
                    workbook.cancel();
                } else {
                    var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_user.xlsx"
                    console.log(url);
                    res.json(url);

                    setTimeout(function () {
                        fs.unlink('data/xlsheet/' + time + '_user.xlsx', function (err, file) {
                        });
                    }, 10000)
                }
            });
        }

    })
}

exports.edit = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        var id = req.body.id;
        query = {};
        query['_id'] = id;

        User.find(query, function (err, users) {
            if (err) {
                console.log(err);
            } else {
                Country.findOne({"countryname": users[0].country}, function (err, country_detail) {

                    City.find({"countryname": users[0].country, isBusiness: config_json.YES}, function (error, city_list) {

                        var phone_number_length = 12;
                        var phone_number_min_length = 8;
                        if(country_detail){
                            phone_number_length = country_detail.phone_number_length;
                            phone_number_min_length = country_detail.phone_number_min_length;
                        }
                        Settings.findOne({}, function (err, settingData) {
                            var is_public_demo = settingData.is_public_demo;
                            res.render('customer_detail_edit', {city_list: city_list, is_public_demo: is_public_demo, phone_number_min_length: phone_number_min_length, phone_number_length: phone_number_length, detail: users});
                            delete message;
                        });
                    });
                });
            }
        });
    } else {
        res.redirect('/admin');
    }
};

exports.update = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        var id = req.body.id;
        var gender = req.body.gender;
        if (gender != undefined) {
            req.body.gender = ((gender).trim()).toLowerCase();
        }
        if(req.body.password){
            var crypto = require('crypto');
            var hash = crypto.createHash('md5').update(req.body.password).digest('hex');
            req.body.password = hash;
        }
        console.log(req.body)
        User.findOne({email: req.body.email, _id: {$ne: id}}, function(error, user_detail){
            if(!user_detail){
                User.findOne({phone: req.body.phone, country_phone_code: req.body.country_phone_code, _id: {$ne: id}}, function(error, user_detail){
                    if(!user_detail){
                        
                        User.findById(id).then((user) => { 
                            var files_details = req.files;
                            console.log(files_details)
                            if(files_details.length>0){
                                utils.deleteImageFromFolder(user.picture, 2);
                                var image_name = user._id + utils.tokenGenerator(4);
                                var url = utils.getImageFolderPath(req, 2) + image_name + '.jpg';
                                utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 2);
                                req.body.picture = url;
                            }

                            User.findByIdAndUpdate(id, req.body, function (err, users) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    message = admin_messages.success_message_user_update;
                                    res.redirect('/users');
                                }
                            });
                        });

                    } else {
                        message = admin_messages.error_message_mobile_no_already_used;
                        exports.edit(req, res, next)        
                    }
                });
            } else {
                message = admin_messages.error_message_email_already_used;
                exports.edit(req, res, next);        
            }
        })
    } else {
        res.redirect('/admin');
    }
};


exports.history = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        var array = [];
        var i = 0;
        var id = req.body.id;
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
            search_item = 'provider_detail.first_name';
            search_value = '';
            sort_order = -1;
            sort_field = 'unique_id';
            filter_start_date = '';
            filter_end_date = '';
        } else {
            search_item = req.body.search_item;
            search_value = req.body.search_value;
            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
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
                        localField: "current_provider",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
        };

        //var unwind1 = {$unwind: "$provider_detail"};

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        if (search_item == "provider_detail.first_name") {
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

        //query1['provider_trip_start_time'] = {$gte: start_date, $lt: end_date};
        //query2['provider_trip_end_time'] = {$gte: start_date, $lt: end_date};
        //var filter = {"$match": {$or: [query1, query2]}};

        query1['provider_trip_end_time'] = {$gte: start_date, $lt: end_date};
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
        var condition = {"$match": {'user_id': {$eq: Schema(id)}}};
        var trip_condition = {"$match": {$or: [{is_trip_completed: 1}, {is_trip_cancelled: 1}, {is_trip_cancelled_by_user: 1}]}};



        Trip.aggregate([condition, trip_condition, lookup, unwind, lookup1, search, filter, count], function (err, array) {
            if (array.length == 0) {
                res.render('customers_history', {detail: array, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment, id: id});
            } else {
                var pages = Math.ceil(array[0].total / number_of_rec);
                Trip.aggregate([condition, trip_condition, lookup, unwind, lookup1, search, filter, sort, skip, limit], function (err, array) {

                    res.render('customers_history', {detail: array, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment, id: id});
                });
            }
        });
    } else {
        res.redirect('/admin');
    }
};

exports.profile_is_approved = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        var id = req.body.id;
        var is_approved = req.body.is_approved;

        if (is_approved == 0) {
            var change = 1;
        } else {
            var change = 0;
        }
        var trip_running = 0;
        query = {};
        query['_id'] = id;



        /////////// PUSH NOTIFICATION///


        if (change == 1) {
            User.findByIdAndUpdate(query, {is_approved: change}, function (err, customers) {
                var device_token = customers.device_token;
                var device_type = customers.device_type;

                Settings.findOne({}, function (err, settingData) {
                    var email_notification = settingData.email_notification;
                    if (email_notification == true) {
                        console.log("mail sent Approved user ");
                        allemails.sendUserApprovedEmail(req, customers);
                    }
                });

                utils.sendPushNotification(constant_json.USER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_USER_APPROVED, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                message = admin_messages.success_message_user_approved;
                res.redirect(req.body.user_type);
            });
        } else {
            console.log("mail sent decline user ");

            Trip.findOne({user_id: req.body.id, is_trip_completed: 0, is_trip_cancelled: 0}, function (err, trip_data) {

                if (trip_data)
                {
                    if (trip_data.is_provider_status > 4)
                    {
                        trip_running = 1;
                        message = admin_messages.error_trip_running;
                        res.redirect(req.body.user_type);
                    } else
                    {
                        User.findByIdAndUpdate(query, {is_approved: change}, function (err, customers) {
                            var device_token = customers.device_token;
                            var device_type = customers.device_type;
                            allemails.sendUserDeclineEmail(req, customers);
                            utils.sendPushNotification(constant_json.USER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_USER_DECLINED, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);

                            delete req.body.user_type;
                            req.body.user_id = String(customers._id);
                            req.body.token = customers.token;
                            req.body.trip_id = String(trip_data._id);
                            req.body.cancel_reason = "Declined By Admin";
                            req.body.type = "Admin"
                            // myTrips.trip_cancelbyuser(req, res)
                        });

                        message = admin_messages.success_message_user_declined;
                        res.redirect(req.body.user_type);
                    }
                } else
                {
                    User.findByIdAndUpdate(query, {is_approved: change}, function (err, customers) {
                        var device_token = customers.device_token;
                        var device_type = customers.device_type;
                        allemails.sendUserDeclineEmail(req, customers);
                        utils.sendPushNotification(constant_json.USER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_USER_DECLINED, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                    });

                    message = admin_messages.success_message_user_declined;
                    res.redirect(req.body.user_type);
                }

            })

        }

    } else {
        res.redirect('/admin');
    }
};

exports.add_wallet_amount = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        User.findById(req.body.user_id, function (err, user_data) {
            if (user_data)
            {
                var wallet = utils.precisionRoundTwo(Number(req.body.wallet));
                var status = constant_json.DEDUCT_WALLET_AMOUNT
                if(wallet > 0){
                    status = constant_json.ADD_WALLET_AMOUNT
                }

                var total_wallet_amount = utils.addWalletHistory(constant_json.USER_UNIQUE_NUMBER, user_data.unique_id, user_data._id, user_data.country_id, user_data.wallet_currency_code, user_data.wallet_currency_code,
                        1, Math.abs(wallet), user_data.wallet, status, constant_json.ADDED_BY_ADMIN, "By Admin")

                user_data.wallet = total_wallet_amount;
                user_data.save();
                res.json({success: true, wallet: user_data.wallet, message: admin_messages.success_message_add_wallet});
            } else
            {
                res.json({success: false, error_code: admin_messages.errpr_message_add_wallet_failed});
            }
        })
    } else
    {
        res.json({success: false, error_code: admin_messages.errpr_message_add_wallet_failed});
    }
};

exports.user_documents = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        var id = req.body.id;
        var array = [];
        var i = 0;
        var j = 0;
        query = {};
        query['user_id'] = id;

        User_Document.find(query, function (err, array) {
            if (err) {
                console.log(err);
            } else {
                res.render('user_documents', {detail: array, moment: moment, id: id});
            }
        });
    } else {
        res.redirect('/admin');
    }
};






// generate_user_history_excel
exports.generate_user_history_excel = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
         var array = [];
        var i = 0;
        var id = req.body.id;
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
            search_item = 'provider_detail.first_name';
            search_value = '';
            sort_order = -1;
            sort_field = 'unique_id';
            filter_start_date = '';
            filter_end_date = '';
        } else {
            search_item = req.body.search_item;
            search_value = req.body.search_value;
            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
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
                        localField: "current_provider",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
        };

        //var unwind1 = {$unwind: "$provider_detail"};

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        if (search_item == "provider_detail.first_name") {
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

        //query1['provider_trip_start_time'] = {$gte: start_date, $lt: end_date};
        //query2['provider_trip_end_time'] = {$gte: start_date, $lt: end_date};
        //var filter = {"$match": {$or: [query1, query2]}};

        query1['provider_trip_end_time'] = {$gte: start_date, $lt: end_date};
        var filter = {"$match": query1};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        

        var mongoose = require('mongoose');
        var Schema = mongoose.Types.ObjectId;
        var condition = {"$match": {'user_id': {$eq: Schema(id)}}};
        var trip_condition = {"$match": {$or: [{is_trip_completed: 1}, {is_trip_cancelled: 1}, {is_trip_cancelled_by_user: 1}]}};




        Trip.aggregate([condition, trip_condition,lookup, unwind, lookup1, search, filter, sort], function (err, array) {

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
                        if (err)
                        {
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

            })

        });

    } else {
        res.redirect('/admin');
    }

};