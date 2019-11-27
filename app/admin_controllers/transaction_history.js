var utils = require('../controllers/utils');
var Reviews = require('mongoose').model('Reviews');
var User = require('mongoose').model('User');
var Provider = require('mongoose').model('Provider');
var Trip = require('mongoose').model('Trip');
var Settings = require('mongoose').model('Settings');
var Wallet_history = require('mongoose').model('Wallet_history');
var moment = require('moment');
var moment = require('moment-timezone');
var excelbuilder = require('msexcel-builder');
var fs = require("fs");
var Transfer_History = require('mongoose').model('transfer_history');
var console = require('../controllers/console');

exports.admin_transaction_history = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {

        var array = [];
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

        if (req.body.search_item == undefined)
        {
            search_item = '';
            search_value = '';
            sort_order = -1;
            sort_field = 'unique_id';
            filter_start_date = '';
            filter_end_date = '';

        } else
        {
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

        var end_date = req.body.end_date;
        var start_date = req.body.start_date;
        if (end_date == '' || end_date == undefined) {
            end_date = new Date();
        } else {
            end_date = new Date(end_date);
            end_date = end_date.setHours(23, 59, 59, 999);
            end_date = new Date(end_date);
        }

        if (start_date == '' || start_date == undefined) {
            start_date = new Date(end_date.getTime() - (6 * 24 * 60 * 60 * 1000));
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
        } else {
            start_date = new Date(start_date);
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
        }

        var number_of_rec = 10;
        var lookup1 = {
            $lookup:
                    {
                        from: "providers",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
        };
        
         var lookup2 = {
            $lookup:
                    {
                        from: "partners",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "partner_detail"
                    }
        };
        //var unwind = {$unwind: "$user_detail"};

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');


        var search = {"$match": {}};
        search["$match"][search_item] = {$regex: new RegExp(value, 'i')}


        var filter = {"$match": {}};
        filter["$match"]['created_at'] = {$gte: start_date, $lt: end_date};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;


        Transfer_History.aggregate([lookup1,lookup2
            //, search
            // ,
            //filter, count
        ]).then((array) => { 
            if (array.length == 0)
            {
                array = [];
                res.render('transaction_history', {detail: array, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment});
            }
            else {
                    var is_public_demo = setting_detail.is_public_demo;
                    var pages = Math.ceil(array[0].total / number_of_rec);
                    Transfer_History.aggregate([lookup1, lookup2, search, filter, sort, skip, limit]).then((array) => { 
                        res.render('transaction_history', {is_public_demo: is_public_demo, timezone_for_display_date: setting_detail.timezone_for_display_date, detail: array, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment});
                        delete message;
                    }, (err) => {
                        utils.error_response(err, res)
                    });
            }
        }, (err) => {
            utils.error_response(err, res)
        });


    } else {
        res.redirect('/admin');
    }
};


exports.generate_transaction_history_excel = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        var array = [];
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

        if (req.body.search_item == undefined)
        {
            search_item = 'wallet_description';
            search_value = '';
            sort_order = -1;
            sort_field = 'unique_id';
            filter_start_date = '';
            filter_end_date = '';

        } else
        {
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
                end_date = new Date(Date.now());
                var start_date = new Date(end_date.getTime() - (6 * 24 * 60 * 60 * 1000));
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
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
            end_date = new Date(Date.now());
            var start_date = new Date(end_date.getTime() - (6 * 24 * 60 * 60 * 1000));
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
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


        var lookup1 = {
            $lookup:
                    {
                        from: "providers",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
        };

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        var search = {"$match": {}};
        search["$match"][search_item] = {$regex: new RegExp(value, 'i')}

        var filter = {"$match": {}};
        filter["$match"]['created_at'] = {$gte: start_date, $lt: end_date};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;

        Wallet_history.aggregate([lookup, lookup1, search, sort]).then((array) => { 

            var date = new Date()
            var time = date.getTime()
            var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_wallet_history.xlsx');
            var sheet1 = workbook.createSheet('sheet1', 10, array.length + 1);

            sheet1.set(1, 1, config_json.title_id);
            sheet1.set(2, 1, config_json.title_type);
            sheet1.set(3, 1, config_json.title_date);
            sheet1.set(4, 1, config_json.title_email);
            sheet1.set(5, 1, config_json.title_currency);
            sheet1.set(6, 1, config_json.title_wallet_amount);
            sheet1.set(7, 1, config_json.title_add_cut);
            sheet1.set(8, 1, config_json.title_wallet);
            sheet1.set(9, 1, config_json.title_wallet_description);

            array.forEach(function (data, index) {
                sheet1.set(1, index + 2, data.unique_id);
                if (data.user_type == 10) {
                    sheet1.set(2, index + 2, config_json.title_user);
                } else if (data.user_type == 11) {
                    sheet1.set(2, index + 2, config_json.title_provider);
                }
                sheet1.set(3, index + 2, moment(data.created_at).format("DD MMM 'YY") + ' ' + moment(data.created_at).format("hh:mm a"));

                if (data.user_type == 10) {
                    sheet1.set(4, index + 2, data.user_detail[0].email);
                } else if (data.user_type == 11) {
                    sheet1.set(4, index + 2, data.provider_detail[0].email);
                }

                if (data.user_type == 10) {
                    sheet1.set(5, index + 2, data.user_detail[0].wallet_currency_code);
                } else if (data.user_type == 11) {
                    sheet1.set(5, index + 2, data.provider_detail[0].wallet_currency_code);
                }

                sheet1.set(6, index + 2, data.wallet_amount);
                sheet1.set(7, index + 2, data.added_wallet);
                sheet1.set(8, index + 2, data.total_wallet_amount);
                sheet1.set(9, index + 2, data.wallet_description);

                if (index == array.length - 1) {
                    workbook.save(function (err) {
                        if (err)
                        {
                            workbook.cancel();
                        } else {
                            var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_wallet_history.xlsx"
                            res.json(url);
                            setTimeout(function () {
                                fs.unlink('data/xlsheet/' + time + '_wallet_history.xlsx', function (err, file) {
                                });
                            }, 10000)
                        }
                    });
                }

            })
        }, (err) => {
            utils.error_response(err, res)
        });
    } else {
        res.redirect('/admin');
    }
};


