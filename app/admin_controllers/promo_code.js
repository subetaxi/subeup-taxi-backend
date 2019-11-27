var Promo_Code = require('mongoose').model('Promo_Code');
var User_promo_use = require('mongoose').model('User_promo_use');
var User = require('mongoose').model('User'); // include user model ////
var Trip = require('mongoose').model('Trip');
var Country = require('mongoose').model('Country');
var City = require('mongoose').model('City');
var moment = require('moment');
var Settings = require('mongoose').model('Settings');
var Type = require('mongoose').model('Type');
var mongoose = require('mongoose');
var Schema = mongoose.Types.ObjectId;
var excelbuilder = require('msexcel-builder');
var fs = require("fs");
var utils = require('../controllers/utils');
var console = require('../controllers/console');

exports.promotions = function (req, res) {

    if (typeof req.session.userid != 'undefined') {

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
            search_item = 'promocode';
            search_value = '';
            sort_order = -1;
            sort_field = 'city_detail.cityname';
            filter_start_date = '';
            filter_end_date = '';

        } else {
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
        var filter = {"$match": {}};

        if (req.body.start_date == '' || req.body.end_date == '') {
            if (req.body.start_date == '' && req.body.end_date == '') {

                start_date = new Date(0);
                filter["$match"]['code_expiry'] = {$gte: start_date};
            } else if (req.body.start_date == '') {
                start_date = new Date(0);
                var end_date = req.body.end_date;
                end_date = new Date(end_date);
                end_date = end_date.setHours(23, 59, 59, 999);
                end_date = new Date(end_date);
                filter["$match"]['code_expiry'] = {$gte: start_date, $lt: end_date};
            } else {
                var start_date = req.body.start_date;
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(Date.now());
                filter["$match"]['code_expiry'] = {$gte: start_date, $lt: end_date};
            }
        } else if (req.body.start_date == undefined || req.body.end_date == undefined) {
            start_date = new Date(0);
            filter["$match"]['code_expiry'] = {$gte: start_date};
        } else {
            var start_date = req.body.start_date;
            var end_date = req.body.end_date;
            start_date = new Date(start_date);
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
            end_date = new Date(end_date);
            end_date = end_date.setHours(23, 59, 59, 999);
            end_date = new Date(end_date);
            filter["$match"]['code_expiry'] = {$gte: start_date, $lt: end_date};
        }

        var number_of_rec = 10;

        var lookup_country_detail = {
            $lookup:
                    {
                        from: "countries",
                        localField: "countryid",
                        foreignField: "_id",
                        as: "country_detail"
                    }
        };
        var unwind_country_detail = {$unwind: "$country_detail"};


        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        var search = {"$match": {}};
        search["$match"][search_item] = {$regex: new RegExp(value, 'i')};



        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;

        Promo_Code.aggregate([lookup_country_detail, unwind_country_detail, search, filter, count]).then((array) => { 
            if (!array || array.length == 0) {
                array = [];
                res.render('promocode', {detail: array, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment});
                delete message;
            } else {
                var pages = Math.ceil(array[0].total / number_of_rec);
                Promo_Code.aggregate([lookup_country_detail, unwind_country_detail, search, filter, sort, skip, limit]).then((array) => { 
                    res.render('promocode', {detail: array, timezone_for_display_date: setting_detail.timezone_for_display_date, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment});
                    delete message;
                });
            }
        });

    } else {
        res.redirect('/admin');
    }
};

exports.generate_promo_code_excel = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
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
            search_item = 'promocode';
            search_value = '';
            sort_order = -1;
            sort_field = 'city_detail.cityname';
            filter_start_date = '';
            filter_end_date = '';

        } else {
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
        var filter = {"$match": {}};

        if (req.body.start_date == '' || req.body.end_date == '') {
            if (req.body.start_date == '' && req.body.end_date == '') {

                start_date = new Date(0);
                filter["$match"]['code_expiry'] = {$gte: start_date};
            } else if (req.body.start_date == '') {
                start_date = new Date(0);
                var end_date = req.body.end_date;
                end_date = new Date(end_date);
                end_date = end_date.setHours(23, 59, 59, 999);
                end_date = new Date(end_date);
                filter["$match"]['code_expiry'] = {$gte: start_date, $lt: end_date};
            } else {
                var start_date = req.body.start_date;
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(Date.now());
                filter["$match"]['code_expiry'] = {$gte: start_date, $lt: end_date};
            }
        } else if (req.body.start_date == undefined || req.body.end_date == undefined) {
            start_date = new Date(0);
            filter["$match"]['code_expiry'] = {$gte: start_date};
        } else {
            var start_date = req.body.start_date;
            var end_date = req.body.end_date;
            start_date = new Date(start_date);
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
            end_date = new Date(end_date);
            end_date = end_date.setHours(23, 59, 59, 999);
            end_date = new Date(end_date);
            filter["$match"]['code_expiry'] = {$gte: start_date, $lt: end_date};
        }

        var number_of_rec = 10;

        var lookup_country_detail = {
            $lookup:
                    {
                        from: "countries",
                        localField: "countryid",
                        foreignField: "_id",
                        as: "country_detail"
                    }
        };
        var unwind_country_detail = {$unwind: "$country_detail"};


        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        var search = {"$match": {}};
        search["$match"][search_item] = {$regex: new RegExp(value, 'i')};



        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;

        Promo_Code.aggregate([lookup_country_detail, unwind_country_detail, search, filter, sort]).then((array) => { 

            var date = new Date()
            var time = date.getTime()
            var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_promo_code.xlsx');

            var sheet1 = workbook.createSheet('sheet1', 8, array.length + 1);
            sheet1.set(1, 1, config_json.title_promo);
            sheet1.set(2, 1, config_json.title_country);
            sheet1.set(3, 1, config_json.title_type);
            sheet1.set(4, 1, config_json.title_value);
            sheet1.set(5, 1, config_json.title_uses);
            sheet1.set(6, 1, config_json.title_user_promo_used);
            sheet1.set(7, 1, config_json.title_state);
            
            array.forEach(function (data, index) {
                sheet1.set(1, index + 2, data.promocode);
                sheet1.set(2, index + 2, data.country_detail.countryname);
                
                if (data.code_type == 2) {
                    sheet1.set(3, index + 2, config_json.title_absolute);
                } else {
                    sheet1.set(3, index + 2, config_json.title_percentage);
                }
                sheet1.set(4, index + 2, data.code_value);
                sheet1.set(5, index + 2, data.code_uses);
                sheet1.set(6, index + 2, data.user_used_promo);
                if (data.state == 1) {
                    sheet1.set(7, index + 2, config_json.title_active);
                } else {
                    sheet1.set(7, index + 2, config_json.title_inactive);
                }
                if (index == array.length - 1) {
                    workbook.save(function (err) {
                        if (err)
                        {
                            workbook.cancel();
                        } else {
                            var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_promo_code.xlsx"
                            res.json(url);
                            setTimeout(function () {
                                fs.unlink('data/xlsheet/' + time + '_promo_code.xlsx', function (err, file) {
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


exports.edit = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        var id = req.body.id;
        query = {};
        query['_id'] = id;

        Promo_Code.findOne(query).then((promo_detail) => {

            Country.findOne({_id: promo_detail.countryid}).then((country_detail) => {

                City.find({_id: {$in: promo_detail.cityid}, countryid: country_detail._id}).then((selected_city_detail) => {

                    City.find({_id: {$nin: promo_detail.cityid}, countryid: country_detail._id}).then((city_detail) => {

                        var countryname = country_detail.countryname;
                        var promo_code = {
                            promocode: promo_detail.promocode,
                            id: promo_detail._id,
                            code_type: promo_detail.code_type,
                            code_uses: promo_detail.code_uses,
                            code_value: promo_detail.code_value,
                            user_used_promo: promo_detail.user_used_promo,
                            state: promo_detail.state,
                            countryname: countryname,
                            selected_city_detail: selected_city_detail,
                            city_detail: city_detail,
                            start_date: promo_detail.start_date,
                            code_expiry: promo_detail.code_expiry,
                        }

                        res.render('promocode_detail_edit', {data: promo_code, moment: moment, timezone_for_display_date: setting_detail.timezone_for_display_date});
                    });
                });
            });

        });
    } else {
        res.redirect('/admin');
    }
};

exports.update = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        var id = req.body.id;
        query = {};
        query['_id'] = id;
        Promo_Code.findByIdAndUpdate(query, req.body).then((promo_detail) => { 
            res.redirect('/promotions');      
        });
    } else {
        res.redirect('/admin');
    }
};

exports.promo_used_info = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {

        var lookup_country_detail = {
            $lookup:
            {
                from: "countries",
                localField: "countryid",
                foreignField: "_id",
                as: "country_detail"
            }
        };
        var unwind_country_detail = {$unwind: "$country_detail"};
        var condition = {$match: {'_id': {$eq: Schema(req.body.id)}}};

        Promo_Code.aggregate([condition, lookup_country_detail, unwind_country_detail]).then((promo_detail) => { 

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
                            from: "trips",
                            localField: "trip_id",
                            foreignField: "_id",
                            as: "trip_detail"
                        }
            };
            var unwind1 = {$unwind: "$trip_detail"};

            var mongoose = require('mongoose');
            var Schema = mongoose.Types.ObjectId;
            var condition = {$match: {'promo_id': {$eq: Schema(req.body.id)}}};

            User_promo_use.aggregate([condition, lookup, unwind, lookup1, unwind1]).then((user_used_promo_array) => {
                if (user_used_promo_array.length > 0)
                {
                    Trip.aggregate([condition, {$group: {_id: null, total: {$sum: '$promo_payment'}}}]).then((total_promo_payment) => {
                        if (total_promo_payment.length > 0)
                        {
                            res.render("user_used_promo", {promo_detail: promo_detail[0], total_promo_payment: total_promo_payment[0].promo_payment, user_used_promo_array: user_used_promo_array, moment: moment})
                        } else
                        {
                            res.render("user_used_promo", {promo_detail: promo_detail[0], total_promo_payment: 0, user_used_promo_array: user_used_promo_array, moment: moment})
                        }
                    })

                } else
                {
                    res.render("user_used_promo", {promo_detail: promo_detail[0], total_promo_payment: 0, user_used_promo_array: [], moment: moment})
                }
            });
        });
    } else {
        res.redirect('/admin');
    }
};


exports.act = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        var id = req.body.id;

        var state = req.body.state;
        if (state == 1) {
            var change = 0;
        } else {
            var change = 1;
        }
        query = {};
        query['_id'] = id;
        Promo_Code.findByIdAndUpdate(query, {state: change}).then((promo_detail) => { 
            res.redirect('/promotions');      
        });
    } else {
        res.redirect('/admin');
    }
};


exports.add_promo_form = function (req, res, next) {
    if (typeof req.session.userid != "undefined") {
        Country.find({}).then((country) => { 
            City.find({}).then((city) => { 
                res.render('promocode_detail_edit', {promo_country: country, promo_city: city});     
            });
        });
    } else {
        res.redirect('/admin');
    }
};

exports.add_promocode = function (req, res, next) {

    if (typeof req.session.userid != "undefined") {

        var mongoose = require('mongoose');

        var countryid = req.body.countryid.replace(/'/g, "");
        countryid = mongoose.Types.ObjectId(countryid);
        var promocode = (req.body.promocode).toUpperCase();

        var add_promo_detail = new Promo_Code({
            promocode: promocode,
            code_value: req.body.code_value,
            code_type: req.body.code_type,
            code_uses: req.body.code_uses,
            user_used_promo: 0,
            countryid: countryid,
            cityid: req.body.cityid,
            state: 1,
            start_date: req.body.start_date,
            code_expiry: req.body.code_expiry
        });

        add_promo_detail.save().then((admins) => { 
            res.json("success");
        }, (err) => {
            console.log(err);
            res.json("success");
        });
    } else {
        res.redirect('/admin');
    }
};

exports.check_valid_promocode = function (req, res, next) {

    if (typeof req.session.userid != "undefined") {

        var mongoose = require('mongoose');
        var countryid = req.body.countryid.replace(/'/g, "");
        countryid = mongoose.Types.ObjectId(countryid);
        var promocode = (req.body.promocode).toUpperCase();

        Promo_Code.find({promocode: promocode, countryid: countryid}).then((promocode) => { 
            var size = promocode.length;
            if (size > 0) {
                res.json({success: false, message: admin_messages.error_message_promo_code_already_added_for_same_country});
            } else
            {
                res.json({success: true});
            }
        });

    } else {
        res.redirect('/admin');
    }
};
