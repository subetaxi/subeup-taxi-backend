var utils = require('../controllers/utils');
var Provider = require('mongoose').model('Provider');
var Trip = require('mongoose').model('Trip');
var User = require('mongoose').model('User');
var moment = require('moment');
var City = require('mongoose').model('City');
var Type = require('mongoose').model('Type');
var Citytype = require('mongoose').model('city_type');
var Country = require('mongoose').model('Country');
var Settings = require('mongoose').model('Settings');
var Trip = require('mongoose').model('Trip');
var User = require('mongoose').model('User');
var Citytype = require('mongoose').model('city_type');
var Type = require('mongoose').model('Type');
var excelbuilder = require('msexcel-builder');
var fs = require("fs");
var console = require('../controllers/console');


exports.trip_earning = function (req, res, next) {
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
        filter_start_date = '';
        filter_end_date = '';
        selected_country = null;
        selected_city = null

    } else {
        search_item = req.body.search_item;
        search_value = req.body.search_value;
        selected_country = req.body.selected_country;
        selected_city = req.body.selected_city;
        filter_start_date = req.body.start_date;
        filter_end_date = req.body.end_date;
    }

    if (req.body.start_date == '' || req.body.start_date == undefined) {
        var date = new Date(Date.now());
        start_date = date.setHours(0, 0, 0, 0);
        start_date = new Date(start_date);
        end_date = date.setHours(23, 59, 59, 999);
        end_date = new Date(end_date);

    } else {
        var start_date = req.body.start_date;
        start_date = new Date(start_date);
        start_date = start_date.setHours(0, 0, 0, 0);
        start_date = new Date(start_date);

        var end_date = req.body.end_date;
        end_date = new Date(end_date);
        end_date = end_date.setHours(23, 59, 59, 999);
        end_date = new Date(end_date);
    }

    var number_of_rec = 10;
    var lookup = {
        $lookup:
        {
            from: "providers",
            localField: "current_provider",
            foreignField: "_id",
            as: "provider_detail"
        }
    };

    
    var country_filter = {"$match": {}};
    var city_filter = {"$match": {}};
    var city_list = [];
    var timezone = "";
    var mongoose = require("mongoose");
    if (selected_country != 'all') {
        country_filter["$match"]['country_id'] = {$eq: mongoose.Types.ObjectId(selected_country)};

        City.find({countryid: mongoose.Types.ObjectId(selected_country)}, function (error, city) {
            city_list = city;
        })
        if (selected_city != 'all') {
            city_filter["$match"]['city_id'] = {$eq: mongoose.Types.ObjectId(selected_city)};
        }
    }

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

    var trip_filter = {"$match": {}};
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

    var sort = {"$sort": {}};
    sort["$sort"]['provider_trip_end_time'] = parseInt(-1);

    //var trip_condition = {$match: {'is_trip_completed': 1}};

    var provider_weekly_analytic_data = {};

    Country.find({}).then((country_list) => { 
        var is_public_demo = setting_detail.is_public_demo;
        var timezone_for_display_date = setting_detail.timezone_for_display_date;
        if (typeof req.session.userid != 'undefined') {

            if (selected_country == null)
            {
                if (country_list.length > 0) {
                    selected_country = country_list[0]._id;
                }
            }
            Country.findOne({_id: mongoose.Types.ObjectId(selected_country)}).then((country) => { 
                if (country)
                {
                    timezone = country.country_all_timezone[0];
                }
                if(selected_city == 'all'){
                    selected_city = null
                }
                City.findOne({_id: selected_city}).then((city) => { 
                    if (city)
                    {
                        timezone = city.timezone;
                    }

                    if (timezone != "") {
                        var today_start_date_time = utils.get_date_in_city_timezone(start_date, timezone);
                        var today_end_date_time = utils.get_date_in_city_timezone(end_date, timezone);
                        trip_filter["$match"]['provider_trip_end_time'] = {$gte: today_start_date_time, $lt: today_end_date_time};
                    }

                    var trip_group_condition = {
                        $group: {
                            _id: '$provider_id',
                            total_trip: {$sum: 1},
                            completed_trip: {$sum: {$cond: [{$eq: ["$is_trip_completed", 1]}, 1, 0]}},
                            total: {$sum: '$total'},
                            provider_have_cash: {$sum: '$provider_have_cash'},
                            provider_service_fees: {$sum: '$provider_service_fees'},
                            pay_to_provider: {$sum: '$pay_to_provider'}
                        }
                    }
                    Trip.aggregate([trip_filter, country_filter, city_filter, lookup, search, count]).then((array) => { 

                        if (array.length == 0) {
                            array = [];
                            res.render('trip_earning', {detail: array, 'current_page': 1, provider_weekly_analytic: provider_weekly_analytic_data, country_list: country_list, city_list: city_list, type: req.body.type, 'pages': 0, 'next': 1, 'pre': 0, moment: moment});

                        } else
                        {
                            var pages = Math.ceil(array[0].total / number_of_rec);
                            Trip.aggregate([trip_filter, country_filter, city_filter, lookup, search, sort, skip, limit]).then((array) => { 

                                if (array.length == 0) {
                                    array = [];
                                    res.render('trip_earning', {detail: array, 'current_page': 1, provider_weekly_analytic: provider_weekly_analytic_data, country_list: country_list, city_list: city_list, type: req.body.type, 'pages': 0, 'next': 1, 'pre': 0, moment: moment});

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

                                    Trip.aggregate([trip_filter, country_filter, city_filter, trip_group_condition_total]).then((trip_total) => { 

                                        if (trip_total.length == 0) {
                                            array = [];
                                            res.render('trip_earning', {detail: array, 'current_page': 1, provider_weekly_analytic: provider_weekly_analytic_data, country_list: country_list, city_list: city_list, type: req.body.type, 'pages': 0, 'next': 1, 'pre': 0, moment: moment});
                                        } else {
                                            res.render('trip_earning', {detail: array, timezone_for_display_date: timezone_for_display_date, 'current_page': page, provider_weekly_analytic: provider_weekly_analytic_data, trip_total: trip_total, country_list: country_list, city_list: city_list, type: req.body.type, 'pages': pages, 'next': next, 'pre': pre, moment: moment});

                                        }
                                    }, (err) => {
                                        utils.error_response(err, res)
                                    });
                                }
                            }, (err) => {
                                utils.error_response(err, res)
                            });
                        }
                    }, (err) => {
                        utils.error_response(err, res)
                    });
                });
});
} else
{
    res.redirect('/admin');
}

});

}

exports.generate_trip_earning_excel = function (req, res, next) {
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
        filter_start_date = '';
        filter_end_date = '';
        selected_country = null;
        selected_city = 'all'

    } else {
        search_item = req.body.search_item;
        search_value = req.body.search_value;
        selected_country = req.body.selected_country;
        selected_city = req.body.selected_city;
        filter_start_date = req.body.start_date;
        filter_end_date = req.body.end_date;
    }

    if (req.body.start_date == '' || req.body.start_date == undefined) {
        var date = new Date(Date.now());
        start_date = date.setHours(0, 0, 0, 0);
        start_date = new Date(start_date);
        end_date = date.setHours(23, 59, 59, 999);
        end_date = new Date(end_date);

    } else {
        var start_date = req.body.start_date;
        start_date = new Date(start_date);
        start_date = start_date.setHours(0, 0, 0, 0);
        start_date = new Date(start_date);

        var end_date = req.body.end_date;
        end_date = new Date(end_date);
        end_date = end_date.setHours(23, 59, 59, 999);
        end_date = new Date(end_date);
    }

    var number_of_rec = 10;
    var lookup = {
        $lookup:
        {
            from: "providers",
            localField: "current_provider",
            foreignField: "_id",
            as: "provider_detail"
        }
    };

    var unwind = {$unwind: "$provider_detail"};
    var country_filter = {"$match": {}};
    var city_filter = {"$match": {}};
    var city_list = [];
    var timezone = "";
    var mongoose = require("mongoose");
    if (selected_country != 'all') {
        country_filter["$match"]['country_id'] = {$eq: mongoose.Types.ObjectId(selected_country)};

        City.find({countryid: mongoose.Types.ObjectId(selected_country)}, function (error, city) {
            city_list = city;
        })
        if (selected_city != 'all') {
            city_filter["$match"]['city_id'] = {$eq: mongoose.Types.ObjectId(selected_city)};
        }
    }

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

    ////////////////////////////
    var trip_filter = {"$match": {}};

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

    var sort = {"$sort": {}};
    sort["$sort"]['provider_trip_end_time'] = parseInt(-1);

    var provider_weekly_analytic_data = {};

    Country.find({}).then((country_list) => { 

        if (typeof req.session.userid != 'undefined') {

            if (selected_country == null)
            {
                selected_country = country_list[0]._id;
            }
            Country.findOne({_id: mongoose.Types.ObjectId(selected_country)}).then((country) => { 
                if (country)
                {
                    timezone = country.country_all_timezone[0];
                }

                if(selected_city == 'all'){
                    selected_city = null
                }
                City.findOne({_id: selected_city}).then((city) => { 
                    if (city)
                    {
                        timezone = city.timezone;
                    }
                    var today_start_date_time = utils.get_date_in_city_timezone(start_date, timezone);
                    var today_end_date_time = utils.get_date_in_city_timezone(end_date, timezone);

                    trip_filter["$match"]['provider_trip_end_time'] = {$gte: today_start_date_time, $lt: today_end_date_time};
                    var trip_group_condition = {
                        $group: {
                            _id: '$provider_id',
                            total_trip: {$sum: 1},
                            completed_trip: {$sum: {$cond: [{$eq: ["$is_trip_completed", 1]}, 1, 0]}},

                            total: {$sum: '$total'},
                            provider_have_cash: {$sum: '$provider_have_cash'},
                            provider_service_fees: {$sum: '$provider_service_fees'},
                            pay_to_provider: {$sum: '$pay_to_provider'}

                        }

                    }
                    Trip.aggregate([trip_filter, country_filter, city_filter, lookup, search, sort]).then((array) => { 

                        if (array.length == 0) {
                            array = [];
                            res.render('trip_earning', {detail: array, 'current_page': 1, provider_weekly_analytic: provider_weekly_analytic_data, country_list: country_list, city_list: city_list, type: req.body.type, 'pages': 0, 'next': 1, 'pre': 0, moment: moment});

                        } else
                        {
                            var pages = Math.ceil(array[0].total / number_of_rec);
                            Trip.aggregate([trip_filter, country_filter, city_filter, lookup, search, sort]).then((array) => { 

                                if (array.length == 0) {
                                    array = [];
                                    res.render('trip_earning', {detail: array, 'current_page': 1, provider_weekly_analytic: provider_weekly_analytic_data, country_list: country_list, city_list: city_list, type: req.body.type, 'pages': 0, 'next': 1, 'pre': 0, moment: moment});

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

                                    Trip.aggregate([trip_filter, country_filter, city_filter, trip_group_condition_total]).then((trip_total) => { 

                                        var date = new Date()
                                        var time = date.getTime()
                                        var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_trip_earning.xlsx');

                                        var sheet1 = workbook.createSheet('sheet1', 10, array.length + 1);

                                        sheet1.set(1, 1, config_json.title_trip_id);
                                        sheet1.set(2, 1, config_json.title_trip_end_date);
                                        sheet1.set(3, 1, config_json.title_provider_id);
                                        sheet1.set(4, 1, config_json.title_name);
                                        sheet1.set(5, 1, config_json.email_title_phone);
                                        sheet1.set(6, 1, config_json.title_total);
                                        sheet1.set(7, 1, config_json.title_cash);
                                        sheet1.set(8, 1, config_json.title_provider_profit);
                                        sheet1.set(9, 1, config_json.title_pay_to_provider);


                                        array.forEach(function (data, index) {

                                            sheet1.set(1, index + 2, data.unique_id);
                                            sheet1.set(2, index + 2, moment(data.provider_trip_end_time).format("DD MMM 'YY") + ' ' + moment(data.created_at).format("hh:mm a"));

                                            if (data.provider_detail.length > 0) {
                                                sheet1.set(3, index + 2, data.provider_detail[0].unique_id);
                                                sheet1.set(4, index + 2, data.provider_detail[0].first_name + ' ' + data.provider_detail[0].last_name);
                                                sheet1.set(5, index + 2, data.provider_detail[0].country_phone_code + data.provider_detail[0].phone);
                                            }

                                            sheet1.set(6, index + 2, data.total);
                                            sheet1.set(7, index + 2, data.provider_have_cash);
                                            sheet1.set(8, index + 2, data.provider_service_fees);
                                            sheet1.set(9, index + 2, data.pay_to_provider);



                                            if (index == array.length - 1) {
                                                workbook.save(function (err) {
                                                    if (err)
                                                    {
                                                        workbook.cancel();
                                                    } else {
                                                        var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_trip_earning.xlsx"
                                                        res.json(url);
                                                        setTimeout(function () {
                                                            fs.unlink('data/xlsheet/' + time + '_trip_earning.xlsx', function (err, file) {
                                                            });
                                                        }, 10000)
                                                    }
                                                });
                                            }
                                        });
                                    }, (err) => {
                                        utils.error_response(err, res)
                                    });
                                }
                            }, (err) => {
                                utils.error_response(err, res)
                            });
}
}, (err) => {
    utils.error_response(err, res)
});
});
});
} else
{
    res.redirect('/admin');
}
});

}