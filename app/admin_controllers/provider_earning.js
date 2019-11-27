var Provider = require('mongoose').model('Provider');
var Trip = require('mongoose').model('Trip');
var User = require('mongoose').model('User');
var moment = require('moment');
var City = require('mongoose').model('City');
var Type = require('mongoose').model('Type');
var Citytype = require('mongoose').model('city_type');
var Settings = require('mongoose').model('Settings');
var Trip = require('mongoose').model('Trip');
var User = require('mongoose').model('User');
var Citytype = require('mongoose').model('city_type');
var Type = require('mongoose').model('Type');
var excelbuilder = require('msexcel-builder');
var fs = require("fs");
var utils = require('../controllers/utils');
var mongoose = require('mongoose');
var Schema = mongoose.Types.ObjectId;
var console = require('../controllers/console');

exports.provider_earning = function (req, res, next) {
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
        search_item = 'provider_detail.first_name';
        search_value = '';
        sort_order = 1;
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

        var date = new Date(Date.now());
        date = date.setHours(0, 0, 0, 0);
        start_date = new Date(date);
        end_date = new Date(Date.now());

        filter_start_date = moment(start_date).format("YYYY-MM-DD");
        filter_end_date = moment(end_date).format("YYYY-MM-DD");

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
            from: "providers",
            localField: "confirmed_provider",
            foreignField: "_id",
            as: "provider_detail"
        }
    };
    var unwind = {$unwind: "$provider_detail"};

    value = search_value;
    value = value.replace(/^\s+|\s+$/g, '');
    value = value.replace(/ +(?= )/g, '');
    if (search_item == "provider_detail.first_name")
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
    } else
    {
        var search = {"$match": {}};
        search["$match"][search_item] = {$regex: value};
    }
    ///// For date filter /////
    var filter = {"$match": {}};
    filter["$match"]['provider_trip_end_time'] = {$gte: start_date, $lt: end_date};

    ///// For sort by field /////
    var sort = {"$sort": {}};
    sort["$sort"][sort_field] = parseInt(sort_order);

    ///// For Count number of result /////
    var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};
    /////////////////////////////////////

    //// For skip number of result /////
    var skip = {};
    skip["$skip"] = page * 10

    ///// For limitation on result /////
    var limit = {};
    limit["$limit"] = 10

    ////////////////////////////////////

    if (typeof req.session.provider != 'undefined') {
        
        var timezone_for_display_date = setting_detail.timezone_for_display_date;
        var condition = {$match: {'confirmed_provider': {$eq: Schema(req.session.provider._id)}}};
        var trip_condition = {$match: {'is_trip_completed': {$eq: 1}}};

        var trip_group_condition = {
            $group: {
                _id: null,
                total_trip: {$sum: 1},
                completed_trip: {$sum: {$cond: [{$eq: ["$is_trip_completed", 1]}, 1, 0]}},
                total: {$sum: '$total'},
                provider_have_cash: {$sum: '$provider_have_cash'},
                provider_service_fees: {$sum: '$provider_service_fees'},

                pay_to_provider: {$sum: {'$cond': [{$and: [{'$eq': ['$is_provider_earning_set_in_wallet', false]}, {'$eq': ['$is_transfered', false]}]}, '$pay_to_provider', 0]}},

            }
        }
        Trip.aggregate([filter, condition, trip_condition]).then((array) => { 
            if (array.length == 0) {
                array = [];
                res.render('provider_panel_earning', {detail: array, timezone_for_display_date: timezone_for_display_date,
                    'current_page': 1, type: req.body.type, 'pages': 0, 'next': 1, 'pre': 0, moment: moment});

            } else {
                var pages = Math.ceil(array[0].total / number_of_rec);

                Trip.aggregate([filter, condition, trip_condition]).then((array) => { 

                    if (array.length == 0) {
                        array = [];
                        res.render('provider_panel_earning', {detail: array, timezone_for_display_date: timezone_for_display_date,
                            'current_page': 1, type: req.body.type, 'pages': 0, 'next': 1, 'pre': 0, moment: moment});

                    } else {
                        var trip_group_condition_total = {
                            $group: {
                                _id: null,
                                total_trip: {$sum: 1},
                                completed_trip: {$sum: {$cond: [{$eq: ["$is_trip_completed", 1]}, 1, 0]}},

                                total: {$sum: '$total'},
                                promo_payment: {$sum: '$promo_payment'},
                                card_payment: {$sum: '$card_payment'},
                                cash_payment: {$sum: '$cash_payment'},
                                wallet_payment: {$sum: '$wallet_payment'},
                                admin_earning: {$sum: {$subtract: ['$total', '$provider_service_fees']}},
                                admin_earning_in_currency: {$sum: {$subtract: ['$total_in_admin_currency', '$provider_service_fees_in_admin_currency']}},
                                provider_earning: {$sum: '$provider_service_fees_in_admin_currency'},
                                provider_have_cash: {$sum: '$provider_have_cash'},
                                pay_to_provider: {$sum: '$pay_to_provider'}
                            }
                        }

                        Trip.aggregate([filter, condition, trip_condition]).then((trip_total) => { 
                            if (trip_total.length == 0) {
                                array = [];
                                res.render('provider_panel_earning', {detail: array, timezone_for_display_date: timezone_for_display_date,
                                    'current_page': 1, type: req.body.type, 'pages': 0, 'next': 1, 'pre': 0, moment: moment});
                            } else {
                                res.render('provider_panel_earning', {detail: array, timezone_for_display_date: timezone_for_display_date,
                                    'current_page': page, trip_total: trip_total, type: req.body.type, 'pages': pages, 'next': next, 'pre': pre, moment: moment});
                            }
                        }, (err) => {
                            utils.error_response(err)
                        });
                    }
                }, (err) => {
                    console.log(err);

                });
            }
        }, (err) => {
            console.log(err);
        });

    } else
    {
        res.redirect('/provider_login');
    }

};

exports.provider_earning_export_excel = function (req, res, next) {
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
        search_item = 'provider_detail.first_name';
        search_value = '';
        sort_order = 1;
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

        var date = new Date(Date.now());
        date = date.setHours(0, 0, 0, 0);
        start_date = new Date(date);
        end_date = new Date(Date.now());

        filter_start_date = moment(start_date).format("YYYY-MM-DD");
        filter_end_date = moment(end_date).format("YYYY-MM-DD");

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
                    from: "providers",
                    localField: "confirmed_provider",
                    foreignField: "_id",
                    as: "provider_detail"
                }
    };

    var unwind = {$unwind: "$provider_detail"};
    ///// For search string /////


    value = search_value;
    value = value.replace(/^\s+|\s+$/g, '');
    value = value.replace(/ +(?= )/g, '');
    if (search_item == "provider_detail.first_name")
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
    } else
    {
        var search = {"$match": {}};
        search["$match"][search_item] = {$regex: value};
    }
    ///// For date filter /////
    var filter = {"$match": {}};
    filter["$match"]['provider_trip_end_time'] = {$gte: start_date, $lt: end_date};


    ///// For sort by field /////
    var sort = {"$sort": {}};
    sort["$sort"][sort_field] = parseInt(sort_order);

    var timezone_for_display_date = setting_detail.timezone_for_display_date;
    var mongoose = require('mongoose');
    var Schema = mongoose.Types.ObjectId;
    
    var condition = {$match: {'confirmed_provider': {$eq: Schema(req.session.provider._id)}}};
    var trip_condition = {$match: {'is_trip_completed': {$eq: 1}}};


    var trip_group_condition = {
        $group: {
            _id: null,
            total_trip: {$sum: 1},
            completed_trip: {$sum: {$cond: [{$eq: ["$is_trip_completed", 1]}, 1, 0]}},
            total: {$sum: '$total'},
            provider_have_cash: {$sum: '$provider_have_cash'},
            provider_service_fees: {$sum: '$provider_service_fees'},

            pay_to_provider: {$sum: {'$cond': [{$and: [{'$eq': ['$is_provider_earning_set_in_wallet', false]}, {'$eq': ['$is_transfered', false]}]}, '$pay_to_provider', 0]}},

        }
    }
    Trip.aggregate([condition, trip_condition, filter]).then((array) => { 
        if (array.length == 0) {
            array = [];
            res.render('provider_panel_earning', {detail: array, timezone_for_display_date: timezone_for_display_date,
                'current_page': 1, type: req.body.type, 'pages': 0, 'next': 1, 'pre': 0, moment: moment});

        } else {
            var pages = Math.ceil(array[0].total / number_of_rec);
            Trip.aggregate([condition, trip_condition, filter]).then((array) => { 

                if (array.length == 0) {
                    array = [];
                    res.render('provider_panel_earning', {detail: array, timezone_for_display_date: timezone_for_display_date,
                        'current_page': 1, type: req.body.type, 'pages': 0, 'next': 1, 'pre': 0, moment: moment});

                } else {
                    var trip_group_condition_total = {
                        $group: {
                            _id: null,
                            total_trip: {$sum: 1},
                            completed_trip: {$sum: {$cond: [{$eq: ["$is_trip_completed", 1]}, 1, 0]}},

                            total: {$sum: '$total'},
                            promo_payment: {$sum: '$promo_payment'},
                            card_payment: {$sum: '$card_payment'},
                            cash_payment: {$sum: '$cash_payment'},
                            wallet_payment: {$sum: '$wallet_payment'},
                            admin_earning: {$sum: {$subtract: ['$total', '$provider_service_fees']}},
                            admin_earning_in_currency: {$sum: {$subtract: ['$total_in_admin_currency', '$provider_service_fees_in_admin_currency']}},
                            provider_earning: {$sum: '$provider_service_fees_in_admin_currency'},
                            provider_have_cash: {$sum: '$provider_have_cash'},
                            pay_to_provider: {$sum: '$pay_to_provider'}
                        }
                    }

                    Trip.aggregate([condition,filter,trip_group_condition_total]).then((trip_total) => { 

                        var date = new Date()
                        var time = date.getTime()
                        var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_provider_earning.xlsx');

                        var sheet1 = workbook.createSheet('sheet1', 7, array.length + 1);

                        sheet1.set(1, 1, config_json.title_trip_id);
                        sheet1.set(2, 1, config_json.title_trip_end_date);


                        sheet1.set(3, 1, config_json.title_total);
                        sheet1.set(4, 1, config_json.title_cash);
                        sheet1.set(5, 1, config_json.title_provider_profit);
                        sheet1.set(6, 1, config_json.title_pay_to_provider);


                        array.forEach(function (data, index) {

                            sheet1.set(1, index + 2, data.unique_id);
                            sheet1.set(2, index + 2, moment(data.provider_trip_end_time).format("DD MMM 'YY") + ' ' + moment(data.created_at).format("hh:mm a"));
                            sheet1.set(3, index + 2, data.total);
                            sheet1.set(4, index + 2, data.provider_have_cash);
                            sheet1.set(5, index + 2, data.provider_service_fees);
                            sheet1.set(6, index + 2, data.pay_to_provider);
                            if (index == array.length - 1) {
                                workbook.save(function (err) {
                                    if (err)
                                    {
                                        workbook.cancel();
                                    } else {
                                        var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_provider_earning.xlsx"
                                        res.json(url);
                                        setTimeout(function () {
                                            fs.unlink('data/xlsheet/' + time + '_provider_earning.xlsx', function (err, file) {
                                            });
                                        }, 10000)
                                    }
                                });
                            }
                        })
                    });
                }
            });
        }
    });

};

// exports.trip_earning_excel = function (req, res, next) {

//     var array = [];
//     var i = 0;

//     page = req.body.page;
//     next = parseInt(req.body.page) + 1;
//     pre = req.body.page - 1;

//     search_item = req.body.search_item;
//     search_value = req.body.search_value;
//     sort_order = req.body.sort_item[1];
//     sort_field = req.body.sort_item[0];
//     filter_start_date = req.body.start_date;
//     filter_end_date = req.body.end_date;


//     if (req.body.start_date == '' || req.body.end_date == '') {

//         if (req.body.start_date == '' && req.body.end_date == '') {
//             var date = new Date(Date.now());
//             date = date.setHours(0, 0, 0, 0);
//             start_date = new Date(0);
//             end_date = new Date(Date.now());
//         } else if (req.body.start_date == '') {
//             start_date = new Date(0);
//             var end_date = req.body.end_date;
//             end_date = new Date(end_date);
//             end_date = end_date.setHours(23, 59, 59, 999);
//             end_date = new Date(end_date);
//         } else {
//             var start_date = req.body.start_date;
//             start_date = new Date(start_date);
//             start_date = start_date.setHours(0, 0, 0, 0);
//             start_date = new Date(start_date);
//             end_date = new Date(Date.now());
//         }
//     } else if (req.body.start_date == undefined || req.body.end_date == undefined) {

//         var date = new Date(Date.now());
//         date = date.setHours(0, 0, 0, 0);
//         start_date = new Date(date);
//         end_date = new Date(Date.now());

//         filter_start_date = moment(start_date).format("YYYY-MM-DD");
//         filter_end_date = moment(end_date).format("YYYY-MM-DD");

//     } else {

//         var start_date = req.body.start_date;
//         var end_date = req.body.end_date;
//         start_date = new Date(start_date);
//         start_date = start_date.setHours(0, 0, 0, 0);
//         start_date = new Date(start_date);
//         end_date = new Date(end_date);
//         end_date = end_date.setHours(23, 59, 59, 999);
//         end_date = new Date(end_date);
//     }

//     // if (typeof req.session.userid != 'undefined') {

//     var number_of_rec = 10;

//     var lookup = {
//         $lookup:
//                 {
//                     from: "providers",
//                     localField: "confirmed_provider",
//                     foreignField: "_id",
//                     as: "provider_detail"
//                 }
//     };

//     var unwind = {$unwind: "$provider_detail"};
//     ///// For search string /////


//     value = search_value;
//     value = value.replace(/^\s+|\s+$/g, '');
//     value = value.replace(/ +(?= )/g, '');
//     if (search_item == "provider_detail.first_name")
//     {
//         var query1 = {};
//         var query2 = {};
//         var query3 = {};
//         var query4 = {};
//         var query5 = {};
//         var query6 = {};

//         var full_name = value.split(' ');
//         if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

//             query1[search_item] = {$regex: new RegExp(value, 'i')};
//             query2['provider_detail.last_name'] = {$regex: new RegExp(value, 'i')};

//             var search = {"$match": {$or: [query1, query2]}};
//         } else {

//             query1[search_item] = {$regex: new RegExp(value, 'i')};
//             query2['provider_detail.last_name'] = {$regex: new RegExp(value, 'i')};
//             query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
//             query4['provider_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
//             query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
//             query6['provider_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

//             var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
//         }
//     } else
//     {
//         var search = {"$match": {}};
//         search["$match"][search_item] = {$regex: value};
//     }

//     ///// For date filter /////
//     var filter = {"$match": {}};
//     filter["$match"]['provider_trip_end_time'] = {$gte: start_date, $lt: end_date};


//     ///// For sort by field /////
//     var sort = {"$sort": {}};
//     sort["$sort"][sort_field] = parseInt(sort_order);
//     sort["$sort"]['provider_trip_end_time'] = parseInt(-1);


//     ///// For specific condition /////
//     var fees = {$match: {'provider_service_fees': {$gt: 0}}};
//     //////////////////////////////////

//     ///// For Count number of result /////
//     var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};
//     /////////////////////////////////////

//     //// For skip number of result /////
//     var skip = {};
//     skip["$skip"] = page * number_of_rec

//     ///// For limitation on result /////
//     var limit = {};
//     limit["$limit"] = number_of_rec
//     //var limit = { $limit: 10 };
//     ////////////////////////////////////

//     if (req.body.type == "admin" || req.body.type == "" || req.body.type == undefined)
//     {

//         Trip.aggregate([lookup, unwind, search, filter, sort, fees, skip, limit], function (err, array) {

//             var date = new Date(Date.now())
//             var time = date.getTime()
//             var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_trip_earning.xlsx');

//             var sheet1 = workbook.createSheet('sheet1', 6, array.length + 1);

//             sheet1.set(1, 1, admin_message.title_trip_id);
//             sheet1.set(2, 1, admin_message.title_trip_end_date);
//             sheet1.set(3, 1, admin_message.title_provider_id);
//             sheet1.set(4, 1, admin_message.title_name);
//             sheet1.set(5, 1, admin_message.title_email);
//             sheet1.set(6, 1, admin_message.title_total_provider_earning);

//             array.forEach(function (data, index) {

//                 sheet1.set(1, index + 2, data.unique_id);
//                 sheet1.set(2, index + 2, moment(data.provider_trip_end_time).format("DD MMM 'YY"));
//                 sheet1.set(3, index + 2, data.provider_detail.unique_id);
//                 sheet1.set(4, index + 2, data.provider_detail.first_name + ' ' + data.provider_detail.last_name);
//                 sheet1.set(5, index + 2, data.provider_detail.email);
//                 sheet1.set(6, index + 2, data.currency + (data.provider_service_fees).toFixed(2));

//                 if (index == array.length - 1) {
//                     workbook.save(function (err) {
//                         if (err)
//                         {
//                             workbook.cancel();
//                         } else {
//                             var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_trip_earning.xlsx"
//                             res.json(url);
//                             setTimeout(function () {
//                                 fs.unlink('data/xlsheet/' + time + '_trip_earning.xlsx', function (err, file) {
//                                 });
//                             }, 10000)
//                         }
//                     });
//                 }

//             });

//         });


//     } else if (req.body.type == "provider")
//     {

//         var mongoose = require('mongoose');
//         var Schema = mongoose.Types.ObjectId;
//         var condition = {$match: {'confirmed_provider': {$eq: Schema(req.session.provider._id)}}};


//         Trip.aggregate([condition, lookup, unwind, search, filter, sort, fees, skip, limit], function (err, array) {

//             var date = new Date(Date.now())
//             var time = date.getTime()
//             var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_trip_earning.xlsx');

//             var sheet1 = workbook.createSheet('sheet1', 6, array.length + 1);

//             sheet1.set(1, 1, admin_message.title_trip_id);
//             sheet1.set(2, 1, admin_message.title_trip_end_date);
//             sheet1.set(3, 1, admin_message.title_provider_id);
//             sheet1.set(4, 1, admin_message.title_name);
//             sheet1.set(5, 1, admin_message.title_email);
//             sheet1.set(6, 1, admin_message.title_total_provider_earning);

//             array.forEach(function (data, index) {

//                 sheet1.set(1, index + 2, data.unique_id);
//                 sheet1.set(2, index + 2, moment(data.provider_trip_end_time).format("DD MMM 'YY"));
//                 sheet1.set(3, index + 2, data.provider_detail.unique_id);
//                 sheet1.set(4, index + 2, data.provider_detail.first_name + ' ' + data.provider_detail.last_name);
//                 sheet1.set(5, index + 2, data.provider_detail.email);
//                 sheet1.set(6, index + 2, data.currency + (data.provider_service_fees).toFixed(2));

//                 if (index == array.length - 1) {
//                     workbook.save(function (err) {
//                         if (err)
//                         {
//                             workbook.cancel();
//                         } else {
//                             var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_trip_earning.xlsx"
//                             res.json(url);
//                             setTimeout(function () {
//                                 fs.unlink('data/xlsheet/' + time + '_trip_earning.xlsx', function (err, file) {
//                                 });
//                             }, 10000)
//                         }
//                     });
//                 }

//             });

//         });

//     }


//     // } else {
//     //     res.redirect('/admin');
//     // }
// }

exports.statement_provider_earning = function (req, res, next) {
    
        var timezone_for_display_date = setting_detail.timezone_for_display_date;
        if (req.body.type == "provider")
        {
            if (typeof req.session.provider != 'undefined') {


                var array = [];
                var page = req.path.split('/');
                var query = {};
                query['_id'] = req.body.id;

                Trip.findOne(query, function (err, trip) {
                    if (err) {
                        console.log(err);
                    } else {
                        var user_id = trip.user_id;
                        var service_type_id = trip.service_type_id;

                        var query_for_service_type = {};
                        query_for_service_type['_id'] = service_type_id;


                        Citytype.findOne(query_for_service_type, function (err, service) {
                            if (err) {
                                console.log(err);
                            } else {
                                var type_id = service.typeid;
                                var query_for_type = {};
                                query_for_type['_id'] = type_id;
                                var min_fare = service.min_fare;

                                Type.findOne(query_for_type, function (err, type) {
                                    if (err || type == undefined)
                                    {
                                        console.log(err + 'Type not found');
                                    } else
                                    {
                                        var query_for_user = {};
                                        query_for_user['_id'] = user_id;

                                            var timezone_for_display_date = setting_detail.timezone_for_display_date;
                                            User.findOne(query_for_user, function (err, user) {
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    Provider.findOne({_id: trip.current_provider}, function (err, provider_detail) {


                                                        res.render('statement_provider_earning', {detail: trip, min_fare: min_fare, timezone_for_display_date: timezone_for_display_date, type: req.body.type, provider_detail: provider_detail, user_detail: user, type_detail: type, service_detail: service, moment: moment});
                                                    });
                                                }
                                            });

                                    }
                                });
                            }
                        });

                    }
                });
            } else {
                res.redirect('/provider_login');
            }
        } else if (req.body.type == "user")
        {
            if (typeof req.session.user != 'undefined') {


                var array = [];
                var page = req.path.split('/');
                var query = {};
                query['_id'] = req.body.id;


                Trip.findOne(query, function (err, trip) {
                    if (err) {
                        console.log(err);
                    } else {
                        var user_id = trip.user_id;
                        var service_type_id = trip.service_type_id;

                        var query_for_service_type = {};
                        query_for_service_type['_id'] = service_type_id;


                        Citytype.findOne(query_for_service_type, function (err, service) {
                            if (err) {
                                console.log(err);
                            } else {
                                var type_id = service.typeid;
                                var query_for_type = {};
                                var min_fare = service.min_fare;
                                query_for_type['_id'] = type_id;

                                Type.findOne(query_for_type, function (err, type) {
                                    if (err || type == undefined)
                                    {
                                        console.log(err + 'Type not found');
                                    } else
                                    {
                                        var query_for_user = {};
                                        query_for_user['_id'] = user_id;


                                        User.findOne(query_for_user, function (err, user) {
                                            if (err) {
                                                console.log(err);
                                            } else {

                                                Provider.findById(trip.current_provider, function (err, provider_detail) {

                                                    res.render('statement_provider_earning', {detail: trip, min_fare: min_fare, type: req.body.type, timezone_for_display_date: timezone_for_display_date, provider_detail: provider_detail, user_detail: user, type_detail: type, service_detail: service, moment: moment});
                                                });
                                            }
                                        });

                                    }
                                });
                            }
                        });

                    }
                });

            } else {
                res.redirect('/login');
            }
        } else if (req.body.type == "dispatcher")
        {
            if (typeof req.session.dispatcher != 'undefined') {


                var array = [];
                var page = req.path.split('/');
                var query = {};
                query['_id'] = req.body.id;

                Trip.findOne(query, function (err, trip) {
                    if (err) {
                        console.log(err);
                    } else {
                        var user_id = trip.user_id;
                        var service_type_id = trip.service_type_id;

                        var query_for_service_type = {};
                        query_for_service_type['_id'] = service_type_id;


                        Citytype.findOne(query_for_service_type, function (err, service) {
                            if (err) {
                                console.log(err);
                            } else {
                                var type_id = service.typeid;
                                var query_for_type = {};
                                query_for_type['_id'] = type_id;
                                var min_fare = service.min_fare;

                                Type.findOne(query_for_type, function (err, type) {
                                    if (err || type == undefined)
                                    {
                                        console.log(err + 'Type not found');
                                    } else
                                    {
                                        var query_for_user = {};
                                        query_for_user['_id'] = user_id;


                                        User.findOne(query_for_user, function (err, user) {
                                            if (err) {
                                                console.log(err);
                                            } else {

                                                Provider.findById(trip.current_provider, function (err, provider_detail) {

                                                    res.render('statement_provider_earning', {detail: trip, min_fare: min_fare, type: req.body.type, timezone_for_display_date: timezone_for_display_date, provider_detail: provider_detail, user_detail: user, type_detail: type, service_detail: service, moment: moment});
                                                });
                                            }
                                        });

                                    }
                                });
                            }
                        });

                    }
                });
            } else {
                res.redirect('/dispatcher_login');
            }
        } else if (req.body.type == "partner")
        {
            if (typeof req.session.partner != 'undefined') {


                var array = [];
                var page = req.path.split('/');
                var query = {};
                query['_id'] = req.body.id;

                Trip.findOne(query, function (err, trip) {
                    if (err) {
                        console.log(err);
                    } else {
                        var user_id = trip.user_id;
                        var service_type_id = trip.service_type_id;

                        var query_for_service_type = {};
                        query_for_service_type['_id'] = service_type_id;


                        Citytype.findOne(query_for_service_type, function (err, service) {
                            if (err) {
                                console.log(err);
                            } else {
                                var type_id = service.typeid;
                                var query_for_type = {};
                                query_for_type['_id'] = type_id;
                                var min_fare = service.min_fare;

                                Type.findOne(query_for_type, function (err, type) {
                                    if (err || type == undefined)
                                    {
                                        console.log(err + 'Type not found');
                                    } else
                                    {
                                        var query_for_user = {};
                                        query_for_user['_id'] = user_id;


                                        User.findOne(query_for_user, function (err, user) {
                                            if (err) {
                                                console.log(err);
                                            } else {

                                                Provider.findById(trip.current_provider, function (err, provider_detail) {

                                                    res.render('statement_provider_earning', {detail: trip, min_fare: min_fare, type: req.body.type, timezone_for_display_date: timezone_for_display_date, provider_detail: provider_detail, user_detail: user, type_detail: type, service_detail: service, moment: moment});
                                                });
                                            }
                                        });

                                    }
                                });
                            }
                        });

                    }
                });
            } else {
                res.redirect('/partner_login');
            }
        } else if (req.body.type == "hotel")
        {
            if (typeof req.session.hotel != 'undefined') {


                var array = [];
                var page = req.path.split('/');
                var query = {};
                query['_id'] = req.body.id;

                Trip.findOne(query, function (err, trip) {
                    if (err) {
                        console.log(err);
                    } else {
                        var user_id = trip.user_id;
                        var service_type_id = trip.service_type_id;

                        var query_for_service_type = {};
                        query_for_service_type['_id'] = service_type_id;


                        Citytype.findOne(query_for_service_type, function (err, service) {
                            if (err) {
                                console.log(err);
                            } else {
                                var type_id = service.typeid;
                                var query_for_type = {};
                                query_for_type['_id'] = type_id;
                                var min_fare = service.min_fare;

                                Type.findOne(query_for_type, function (err, type) {
                                    if (err || type == undefined)
                                    {
                                        console.log(err + 'Type not found');
                                    } else
                                    {
                                        var query_for_user = {};
                                        query_for_user['_id'] = user_id;


                                        User.findOne(query_for_user, function (err, user) {
                                            if (err) {
                                                console.log(err);
                                            } else {

                                                Provider.findById(trip.current_provider, function (err, provider_detail) {

                                                    res.render('statement_provider_earning', {detail: trip, min_fare: min_fare, timezone_for_display_date: timezone_for_display_date, type: req.body.type, provider_detail: provider_detail, user_detail: user, type_detail: type, service_detail: service, moment: moment});
                                                });
                                            }
                                        });

                                    }
                                });
                            }
                        });

                    }
                });
            } else {
                res.redirect('/hotel_login');
            }
        } else if (req.body.type == "corporate")
        {
            if (typeof req.session.corporate != 'undefined') {


                var array = [];
                var page = req.path.split('/');
                var query = {};
                query['_id'] = req.body.id;

                Trip.findOne(query, function (err, trip) {
                    if (err) {
                        console.log(err);
                    } else {
                        var user_id = trip.user_id;
                        var service_type_id = trip.service_type_id;

                        var query_for_service_type = {};
                        query_for_service_type['_id'] = service_type_id;


                        Citytype.findOne(query_for_service_type, function (err, service) {
                            if (err) {
                                console.log(err);
                            } else {
                                var type_id = service.typeid;
                                var query_for_type = {};
                                query_for_type['_id'] = type_id;
                                var min_fare = service.min_fare;

                                Type.findOne(query_for_type, function (err, type) {
                                    if (err || type == undefined)
                                    {
                                        console.log(err + 'Type not found');
                                    } else
                                    {
                                        var query_for_user = {};
                                        query_for_user['_id'] = user_id;


                                        User.findOne(query_for_user, function (err, user) {
                                            if (err) {
                                                console.log(err);
                                            } else {

                                                Provider.findById(trip.current_provider, function (err, provider_detail) {

                                                    res.render('statement_provider_earning', {detail: trip, min_fare: min_fare, type: req.body.type, timezone_for_display_date: timezone_for_display_date, provider_detail: provider_detail, user_detail: user, type_detail: type, service_detail: service, moment: moment});
                                                });
                                            }
                                        });

                                    }
                                });
                            }
                        });

                    }
                });
            } else {
                res.redirect('/corporate_login');
            }
        } else
        {
            if (typeof req.session.userid != 'undefined') {

                var array = [];
                var page = req.path.split('/');
                var query = {};
                query['_id'] = req.body.id;

                Trip.findOne(query, function (err, trip) {
                    if (err) {
                        console.log(err);
                    } else {
                        var user_id = trip.user_id;
                        var service_type_id = trip.service_type_id;

                        var query_for_service_type = {};
                        query_for_service_type['_id'] = service_type_id;


                        Citytype.findOne(query_for_service_type, function (err, service) {
                            if (err) {
                                console.log(err);
                            } else {

                                var min_fare = service.min_fare;
                                var type_id = service.typeid;
                                var query_for_type = {};
                                query_for_type['_id'] = type_id;

                                Type.findOne(query_for_type, function (err, type) {
                                    if (err || type == undefined)
                                    {
                                        console.log(err + 'Type not found');
                                    } else
                                    {

                                        var query_for_user = {};
                                        query_for_user['_id'] = user_id;

                                        User.findOne(query_for_user, function (err, user) {
                                            if (err) {
                                                console.log(err);
                                            } else {

                                                Provider.findById(trip.current_provider, function (err, provider_detail) {

                                                    res.render('statement_provider_earning', {detail: trip, min_fare: min_fare, timezone_for_display_date: timezone_for_display_date, type: req.body.type, provider_detail: provider_detail, user_detail: user, type_detail: type, service_detail: service, moment: moment});
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            } else {
                res.redirect('/admin');
            }
        }
};
