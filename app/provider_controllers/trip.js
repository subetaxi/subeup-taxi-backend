var User = require('mongoose').model('User');
var crypto = require('crypto');
var utils = require('../controllers/utils');
var allemails = require('../controllers/emails');
var moment = require('moment');
var nodemailer = require('nodemailer');
var Setting = require('mongoose').model('Settings');
var Provider = require('mongoose').model('Provider');
var Trip = require('mongoose').model('Trip');
var Trip_Service = require('mongoose').model('trip_service');
var Wallet_history = require('mongoose').model('Wallet_history');
var console = require('../controllers/console');
var excelbuilder = require('msexcel-builder');
var fs = require("fs");
var console = require('../controllers/console');

exports.provider_request = function (req, res, next) {

    if (typeof req.session.provider == 'undefined') {
        res.redirect('/provider_login');
    } else {
        if(req.session.provider.is_document_uploaded == 1){
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
                search_item = 'unique_id';
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

            if (search_item == "unique_id") {
                
                var query1 = {};
                if(value != "")
                {
                    value = Number(value)
                    query1[search_item] = {$eq: value};
                    var search = {"$match": query1};
                }
                else
                {
                   var search = {$match: {}};
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
        var filter = {"$match":query1};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;
        var prov = req.session.provider;
        var mongoose = require('mongoose');
        var Schema = mongoose.Types.ObjectId;
        var condition = {$match: {'confirmed_provider': {$eq: Schema(prov._id) }}};
        
        Trip.aggregate([ condition, lookup, unwind, lookup1,search, filter]).then((array) => { 
            
         if (array.length == 0) {
            res.render('provider_request_list', {detail: array, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment});
        } else {
            var pages = Math.ceil(array[0].total / number_of_rec);
            Trip.aggregate([ condition,lookup, unwind, lookup1,search, filter, sort, skip, limit]).then((array) => { 

                res.render('provider_request_list', {detail: array, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment});
            }, (err) => {
                utils.error_response(err, res)
            });
        }
    }, (err) => {
        utils.error_response(err, res)
    });
    }else{
        res.redirect('/provider_document_panel');
    }
}
}

//provider_wallet_history
exports.provider_wallet_history = function (req, res, next) {
    if (typeof req.session.provider != 'undefined') {
        
        Wallet_history.find({user_id: req.session.provider._id}).then((wallet_history) => { 
            Provider.findOne({_id: req.session.provider._id}).then((provider_detail) => { 
                res.render('provider_wallet_history', {'data': wallet_history, provider_detail: provider_detail, timezone_for_display_date: setting_detail.timezone_for_display_date, 'moment': moment});

            });
        });

    } else {
        res.redirect('/provider_profiles');
    }
};



exports.provider_history_export_excel = function (req, res, next) {
 
    if (typeof req.session.provider == 'undefined') {
        res.redirect('/provider_login');
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
            search_item = 'unique_id';
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

        if (search_item == "unique_id") {
            
            var query1 = {};
            if(value != "")
            {
                value = Number(value)
                query1[search_item] = {$eq: value};
                var search = {"$match": query1};
            }
            else
            {
               var search = {$match: {}};
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
    var filter = {"$match":query1};

    var sort = {"$sort": {}};
    sort["$sort"][sort_field] = parseInt(sort_order);

    
    var prov = req.session.provider;
    var mongoose = require('mongoose');
    var Schema = mongoose.Types.ObjectId;
    var condition = {$match: {'confirmed_provider': {$eq: Schema(prov._id) }}};
    
    Trip.aggregate([condition,lookup, unwind, lookup1, search, filter, sort]).then((array) => { 

        var date = new Date()
        var time = date.getTime()
        var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_provider_history.xlsx');

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
                        var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_provider_history.xlsx"
                        res.json(url);
                        setTimeout(function () {
                            fs.unlink('data/xlsheet/' + time + '_provider_history.xlsx', function (err, file) {
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