var User = require('mongoose').model('User');
var Provider = require('mongoose').model('Provider');
var Promo_Code = require('mongoose').model('Promo_Code');
var Citytype = require('mongoose').model('city_type');
var User_promo_use = require('mongoose').model('User_promo_use');
var Trip = require('mongoose').model('Trip');
var Country = require('mongoose').model('Country');
var nodemailer = require('nodemailer');
var City = require('mongoose').model('City');
var moment = require('moment');
var Settings = require('mongoose').model('Settings');
var Card = require('mongoose').model('Card');
var excelbuilder = require('msexcel-builder');
var fs = require("fs");
var utils = require('../controllers/utils');
//// For pending payment /////
exports.pending_payment = function (req, res, next) {
    var array = [];
    var i = 0;

    if (req.body.page == undefined)
    {
        page = 0;
        next = 1;
        pre = 0;
    } else
    {
        page = req.body.page;
        next = parseInt(req.body.page) + 1;
        pre = req.body.page - 1;
    }
    if (req.body.search_item == undefined) {
        search_item = 'user_detail.first_name';
        search_value = '';
        sort_order = 1;
        sort_field = 'user_detail.first_name';
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

    if (typeof req.session.userid != 'undefined') {
        var number_of_rec = 10;
        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');
        value = new RegExp(value, 'i');

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
        if (search_item == "user_detail.first_name")
        {
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
        } else
        {
            var search = {"$match": {}};
            search["$match"][search_item] = {$regex: value};
        }

        ////////////////////////////

        ///// For date filter /////
        var filter = {"$match": {}};
        filter["$match"]['provider_trip_end_time'] = {$gte: start_date, $lt: end_date};
        ///////////////////////////

        ///// For sort by field /////
        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);
        //////////////////////////////

        ///// For specific condition /////
        var is_pending = {$match: {'is_pending_payments': {$eq: 1}}};
        //////////////////////////////////

        ///// For Count number of result /////
        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};
        /////////////////////////////////////

        //// For skip number of result /////
        var skip = {};
        skip["$skip"] = page * 10;
        ///////////////////////////////////

        ///// For limitation on result /////
        var limit = {};
        limit["$limit"] = 10;
        ////////////////////////////////////


        Trip.aggregate([lookup, unwind, search, filter, is_pending, count], function (err, array) {
            if (!array || array.length == 0)
            {
                array = [];
                res.render('pending_payment', {detail: array, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment});
                delete message;
            } else {
                    var is_public_demo = setting_detail.is_public_demo;
                    var pages = Math.ceil(array[0].total / number_of_rec);

                    Trip.aggregate([lookup, unwind, search, filter, sort, is_pending, skip, limit], function (err, array) {
                        res.render('pending_payment', {is_public_demo: is_public_demo, timezone_for_display_date: settingData.timezone_for_display_date, detail: array, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment});
                        delete message;
                    });
            }

        });
    } else {
        res.redirect('/admin');
    }
};


exports.pending_payment_excel = function (req, res, next) {
    var array = [];
    var i = 0;


    page = req.body.page;
    next = parseInt(req.body.page) + 1;
    pre = req.body.page - 1;

    search_item = req.body.search_item;
    search_value = req.body.search_value;
    sort_order = req.body.sort_item[1];
    sort_field = req.body.sort_item[0];
    filter_start_date = req.body.start_date;
    filter_end_date = req.body.end_date;


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

    if (typeof req.session.userid != 'undefined') {
        var number_of_rec = 10;
        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');
        value = new RegExp(value, 'i');

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
        if (search_item == "user_detail.first_name")
        {
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
        } else
        {
            var search = {"$match": {}};
            search["$match"][search_item] = {$regex: value};
        }

        ////////////////////////////

        ///// For date filter /////
        var filter = {"$match": {}};
        filter["$match"]['provider_trip_end_time'] = {$gte: start_date, $lt: end_date};
        ///////////////////////////

        ///// For sort by field /////
        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);
        //////////////////////////////

        ///// For specific condition /////
        var is_pending = {$match: {'is_pending_payments': {$eq: 1}}};
        //////////////////////////////////

        ///// For Count number of result /////
        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};
        /////////////////////////////////////




        Trip.aggregate([lookup, unwind, search, filter, sort, is_pending], function (err, array) {
            Settings.findOne({}, function (err, settingData) {
                var date = new Date(Date.now())
                var time = date.getTime()
                var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_pending_payment.xlsx');

                var sheet1 = workbook.createSheet('sheet1', 8, array.length + 1);

                sheet1.set(1, 1, config_json.title_trip_id);
                sheet1.set(2, 1, config_json.title_date);
                sheet1.set(3, 1, config_json.title_user_name);
                sheet1.set(4, 1, config_json.title_email);
                sheet1.set(5, 1, config_json.title_number_of_cards);
                sheet1.set(6, 1, config_json.title_payment_error);
                sheet1.set(7, 1, config_json.title_payment_message);
                sheet1.set(8, 1, config_json.title_charged);

                array.forEach(function (data, index) {

                    sheet1.set(1, index + 2, data.unique_id);
                    sheet1.set(2, index + 2, moment(data.provider_trip_end_time).tz(settingData.timezone_for_display_date).format("DD MMM 'YY"));
                    sheet1.set(3, index + 2, data.user_detail.first_name + ' ' + data.user_detail.last_name);
                    sheet1.set(4, index + 2, data.user_detail.email);
                    sheet1.set(5, index + 2, data.number_of_card);
                    sheet1.set(6, index + 2, data.payment_error);
                    sheet1.set(7, index + 2, data.payment_error_message);
                    sheet1.set(8, index + 2, data.currency + (data.total).toFixed(2));

                    if (index == array.length - 1) {
                        workbook.save(function (err) {
                            if (err)
                            {
                                workbook.cancel();
                            } else {
                                var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_pending_payment.xlsx"
                                res.json(url);
                                setTimeout(function () {
                                    fs.unlink('data/xlsheet/' + time + '_pending_payment.xlsx', function (err, file) {
                                    });
                                }, 10000)
                            }
                        });
                    }

                });
            });

        });

    } else {
        res.redirect('/admin');
    }
};

//////////////////////////////
exports.is_paid = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        var id = req.body.id;

        query = {};
        query['_id'] = id;

        Trip.findByIdAndUpdate(query, {is_pending_payments: 0, is_paid: 1}, function (err, user) {
            if (err || user == undefined)
            {
                console.log(err + 'OR trip not found');
            } else
            {
                message = admin_messages.success_message_paid_pending;
                res.redirect('/pending_payment');
            }
        });

    } else {
        res.redirect('/admin');
    }
};