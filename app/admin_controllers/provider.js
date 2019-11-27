var utils = require('../controllers/utils');
require('../controllers/constant');
var allemails = require('../controllers/emails');
var Providers = require('mongoose').model('Provider');
var Provider = require('mongoose').model('Provider');
var Trip = require('mongoose').model('Trip');
var User = require('mongoose').model('User');
var TripLocation = require('mongoose').model('trip_location');
var Document = require('mongoose').model('Document');
var Provider_Document = require('mongoose').model('Provider_Document');
var Country = require('mongoose').model('Country');
var moment = require('moment');
var City = require('mongoose').model('City');
var Type = require('mongoose').model('Type');
var Settings = require('mongoose').model('Settings');
var console = require('../controllers/console');
var Citytype = require('mongoose').model('city_type');
var mongoose = require('mongoose');
var Schema = mongoose.Types.ObjectId;
var City_type = require('mongoose').model('city_type');
var Provider_Vehicle_Document = require('mongoose').model('Provider_Vehicle_Document');
var myProviders = require('./provider');
express = require('express');
var app = express();
var excelbuilder = require('msexcel-builder');
var fs = require("fs");
var console = require('../controllers/console');


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
                from: "providers",
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

        Provider.aggregate([lookup, unwind, group], function(error, provider_list){
            if(error){
                console.log(error)
                res.render('provider_referral_report', { provider_list: [] });
            } else {
               
                var new_provider_list = provider_list.filter(function(user){
                    return user.referred_user_count > 0
                })
                setTimeout(function(){
                    res.render('provider_referral_report', { provider_list: new_provider_list, provider_id: req.body.provider_id, moment: moment, timezone_for_display_date: setting_detail.timezone_for_display_date });
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

        var condition = {$match: {referred_by: Schema(req.body.provider_id)}};
        var query1 = {};
        query1['created_at'] = {$gte: start_date, $lt: end_date};
        var filter = {"$match": query1};
        console.log(condition)
        Provider.aggregate([condition, filter], function(error, provider_list){
            if(error){
                res.render('provider_referral_history', { provider_list: [] });
            } else {
                res.render('provider_referral_history', { provider_list: provider_list, provider_id: req.body.provider_id, moment: moment, timezone_for_display_date: setting_detail.timezone_for_display_date });
            }
        });

    } else {
        res.redirect('/admin');
    }
};

exports.list = function (req, res, next) {
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
        console.log(req.body)
        if (req.body.provider_page_type == undefined) {
            provider_page_type = req.path.split('/')[1];
            sort['_id'] = -1;

            search_item = 'first_name';
            search_value = '';
            sort_order = -1;
            sort_field = 'Id';
            filter_start_date = '';
            filter_end_date = '';

            var start_date = '';
            var end_state = '';
        } else {
            provider_page_type = req.body.provider_page_type;

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

        if (provider_page_type == 'online_providers') {
            query['is_active'] = 1;
            query['is_approved'] = 1;
        } else if (provider_page_type == 'approved_providers') {
            query['is_approved'] = 1;
        } else if (provider_page_type == 'pending_for_approvel') {
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
        } else if (item == 'unique_id')
        {
            if (value !== "")
            {
                value = Number(value);
                query[item] = value
            }
        } else {

            if (item != undefined) {
                query[item] = new RegExp(value, 'i');
            }
        }
        Providers.count({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query]}).then((provider_count) => { 

            if (provider_count != 0) {
                var provider_count = provider_count / 10;
                provider_count = Math.ceil(provider_count);


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

                Providers.paginate({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query]}, options).then((providers) => { 


                    if (providers.docs.length <= 0) {
                        res.render('pending_for_approval_provider_list', {moment: moment,
                            detail: [], currentpage: providers.page, provider_page_type: provider_page_type, pages: providers.pages,
                            next: next, pre: pre
                        });
                    } else {
                        
                        var is_public_demo = setting_detail.is_public_demo;
                        var timezone_for_display_date = setting_detail.timezone_for_display_date;

                        if (provider_page_type == "pending_for_approvel") {
                            res.render('pending_for_approval_provider_list', {
                                is_public_demo: is_public_demo, timezone_for_display_date: timezone_for_display_date, moment: moment,
                                detail: providers.docs, currentpage: providers.page, provider_page_type: provider_page_type, pages: providers.pages,
                                next: next, pre: pre
                            });
                            delete message;
                        } else {
                            var j = 1;
                            providers.docs.forEach(function (data) {

                                if (data.service_type == null) {
                                    if (j == providers.docs.length) {
                                        data.service_type = null;
                                        res.render('providers_list', {
                                            is_public_demo: is_public_demo, moment: moment, timezone_for_display_date: timezone_for_display_date,
                                            detail: providers.docs, provider_page_type: provider_page_type, currentpage: providers.page, pages: providers.pages,
                                            next: next, pre: pre
                                        });
                                        delete message;
                                    } else {
                                        data.service_type = null;
                                        j++;
                                    }
                                } else {
                                    Citytype.findOne({_id: data.service_type}).then((city_type_data) => { 

                                        Type.findOne({_id: city_type_data.typeid}).then((type_data) => { 

                                            if (j == providers.docs.length) {
                                                data.service_type_name = type_data.typename;
                                                res.render('providers_list', {
                                                    is_public_demo: is_public_demo, moment: moment, timezone_for_display_date: timezone_for_display_date,
                                                    detail: providers.docs, provider_page_type: provider_page_type, currentpage: providers.page, pages: providers.pages,
                                                    next: next, pre: pre
                                                });
                                                delete message;
                                            } else {
                                                data.service_type_name = type_data.typename;
                                                j++;
                                            }
                                        });
                                    });
                                }


                            });
                        }
                    }

                });

            } else {
                var is_public_demo = setting_detail.is_public_demo;
                var timezone_for_display_date = setting_detail.timezone_for_display_date;
                if (provider_page_type == "pending_for_approvel") {

                    res.render('pending_for_approval_provider_list', {
                        is_public_demo: is_public_demo, moment: moment, timezone_for_display_date: timezone_for_display_date,
                        detail: array, provider_page_type: provider_page_type, currentpage: '', pages: '',
                        next: '', pre: ''
                    });
                    delete message;
                } else {

                    res.render('providers_list', {
                        is_public_demo: is_public_demo, moment: moment, timezone_for_display_date: timezone_for_display_date,
                        detail: array, provider_page_type: provider_page_type, currentpage: '', pages: '',
                        next: '', pre: ''
                    });
                    delete message;
                }
            }
        });
    } else {
        res.redirect('/admin');
    }
}

exports.generate_provider_excel = function (req, res, next) {

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

        provider_page_type = req.body.provider_page_type;

        var field = req.body.sort_item[0];
        var order = req.body.sort_item[1];
        var item = req.body.search_item;
        var value = req.body.search_value;

        sort_order = req.body.sort_item[1];
        sort_field = req.body.sort_item[0];
        search_item = item
        search_value = value;
        filter_start_date = req.body.start_date;
        filter_end_date = req.body.end_date;

        var start_date = req.body.start_date;
        var end_state = req.body.end_date;

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

        if (provider_page_type == 'online_providers') {
            query['is_active'] = 1;
            query['is_approved'] = 1;
        } else if (provider_page_type == 'approved_providers') {
            query['is_approved'] = 1;
        } else if (provider_page_type == 'pending_for_approvel') {
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
        } else if (item == 'unique_id')
        {
            if (value !== "")
            {
                value = Number(value);
                query[item] = value

            }
        } else {

            if (item != undefined) {
                query[item] = new RegExp(value, 'i');
            }
        }

        var sort = {};
        sort[field] = order;

        var options = {
            sort: sort
        };
        Providers.find({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query]}).then((providers) => { 

            var is_public_demo = setting_detail.is_public_demo;
            var timezone_for_display_date = setting_detail.timezone_for_display_date;

            var j = 1;
            providers.forEach(function (data) {

                if (data.service_type == null) {
                    if (j == providers.length) {
                        data.service_type = null;
                        generate_excel(req, res, providers, timezone_for_display_date)
                    } else {
                        data.service_type = null;
                        j++;
                    }
                } else {
                    Citytype.findOne({_id: data.service_type}).then((city_type_data) => { 

                        Type.findOne({_id: city_type_data.typeid}).then((type_data) => { 
                            
                            if (j == providers.length) {
                                data.service_type_name = type_data.typename;

                                generate_excel(req, res, providers, timezone_for_display_date)
                            } else {
                                data.service_type_name = type_data.typename;
                                j++;
                            }
                        });
                    });
                }

            });

        })


    } else {
        res.redirect('/admin');
    }
}

function generate_excel(req, res, array, timezone) {

    var date = new Date()
    var time = date.getTime()
    var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_provider.xlsx');

    var sheet1 = workbook.createSheet('sheet1', 13, array.length + 1);
    sheet1.set(1, 1, config_json.title_id);
    sheet1.set(2, 1, config_json.title_name);
    sheet1.set(3, 1, config_json.title_email);
    sheet1.set(4, 1, config_json.title_phone);
    sheet1.set(5, 1, config_json.title_total_request);
    sheet1.set(6, 1, config_json.title_completed_request);
    sheet1.set(7, 1, config_json.title_cancelled_request);
    sheet1.set(8, 1, config_json.title_accepted_request);
    sheet1.set(9, 1, config_json.title_city);
    sheet1.set(10, 1, config_json.title_car);
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
        sheet1.set(8, index + 2, data.accepted_request);
        sheet1.set(9, index + 2, data.city);
        sheet1.set(10, index + 2, data.service_type_name);
        sheet1.set(11, index + 2, data.device_type + '-' + data.app_version);
        sheet1.set(12, index + 2, moment(data.created_at).tz(timezone).format("DD MMM 'YY") + ' ' + moment(data.created_at).tz(timezone).format("hh:mm a"));

        if (index == array.length - 1) {
            workbook.save(function (err) {
                if (err)
                {
                    workbook.cancel();
                } else {
                    var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_provider.xlsx"
                    res.json(url);
                    setTimeout(function () {
                        fs.unlink('data/xlsheet/' + time + '_provider.xlsx', function (err, file) {
                        });
                    }, 10000)
                }
            });
        }

    })
};


exports.edit = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        var id = req.body.id;
        var provider_page_type = req.body.provider_page_type;
        Providers.findById(id).then((providers) => { 
            
            var is_public_demo = setting_detail.is_public_demo;
            var timezone_for_display_date = setting_detail.timezone_for_display_date;

            var lookup = {
                $lookup:
                        {
                            from: "types",
                            localField: "typeid",
                            foreignField: "_id",
                            as: "type_detail"
                        }
            };
            var unwind = {$unwind: "$type_detail"};
            Country.findOne({"countryname": providers.country}).then((country_detail) => { 
                City.find({"countryname": providers.country, isBusiness: constant_json.YES}).then((city_list) => { 

                    var mongoose = require('mongoose');
                    var Schema = mongoose.Types.ObjectId;
                    var cityid_condition = {$match: {'cityid': {$eq: Schema(providers.cityid)}}};

                    Citytype.aggregate([cityid_condition, lookup, unwind]).then((type_available) => { 

                        res.render('provider_detail_edit', {city_list: city_list, timezone_for_display_date: timezone_for_display_date, phone_number_min_length: country_detail.phone_number_min_length, phone_number_length: country_detail.phone_number_length, is_public_demo: is_public_demo, data: providers, provider_page_type: provider_page_type, service_type: type_available, 'moment': moment});
                        delete message;
                    }, (err) => {
                        utils.error_response(err, res)
                    });

                });
            });
        });
    } else {
        res.redirect('/admin');
    }
}

// start CHANGED BY BHARTI 29 march //
exports.update = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {

        var id = req.body.id;
        var gender = req.body.gender;
        if (gender != undefined) {
            req.body.gender = ((gender).trim()).toLowerCase();
        }
        var files_details = req.files;

        if(req.body.password){
            var crypto = require('crypto');
            var hash = crypto.createHash('md5').update(req.body.password).digest('hex');
            req.body.password = hash;
        } else {
            delete req.body.password;
        }

        City.findOne({cityname: req.body.city}).then((city) => { 
            if (city)
            {
                req.body.cityid = city._id;
            }

            Provider.findOne({email: req.body.email, _id: {$ne: id}}, function(error, provider_detail){
                if(!provider_detail){
                    Provider.findOne({phone: req.body.phone, country_phone_code: req.body.country_phone_code, _id: {$ne: id}}, function(error, provider_detail){
                        if(!provider_detail){
                            if (files_details == '' || files_details == 'undefined') {
                                Providers.findByIdAndUpdate(id, req.body).then((provider) => { 
                                    message = admin_messages.success_message_provider_update;
                                    res.redirect(req.body.provider_page_type);
                                });
                            } else {
                                Providers.findById(id).then((provider) => { 
                                    utils.deleteImageFromFolder(provider.picture, 2);
                                    var image_name = provider._id + utils.tokenGenerator(4);
                                    var url = utils.getImageFolderPath(req, 2) + image_name + '.jpg';
                                    utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 2);

                                    req.body.picture = url;
                                    Providers.findByIdAndUpdate(id, req.body).then((provider) => { 
                                        message = admin_messages.success_message_provider_update;
                                        res.redirect(req.body.provider_page_type);                        
                                    });
                                });
                            }
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
            
        });

    } else {
        res.redirect('/admin');
    }
};
// end CHANGED BY BHARTI 29 march //

exports.profile_is_approved = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        var id = req.body.id;
        var is_approved = req.body.is_approved;
        var is_document_uploaded = req.body.is_document_uploaded;
        var provider_list = {};
        provider_list['is_approved'] = 0;
        var service_type = req.body.service_type;
        Citytype.findOne({_id: req.body.service_type}).then((citytype) => { 
           
                var admintypeid = citytype.typeid;
                var provider_page_type = req.body.provider_page_type;
                
                if (is_approved == 0) {
                    var change = 1;
                } else {
                    var change = 0;
                }
                if (change == 1) { // Approved
                    if (is_document_uploaded == 1) {

                        Providers.findByIdAndUpdate(id, {is_approved: change}, {new : true}).then((providers) => { 

                            if (req.body.vehicle_id !== '') {
                                var index = providers.vehicle_detail.findIndex(x => (x._id).toString() == (req.body.vehicle_id).toString());
                                providers.vehicle_detail[index].service_type = citytype._id;
                                providers.vehicle_detail[index].admin_type_id = admintypeid;
                                providers.vehicle_detail[index].is_selected = true;
                                providers.is_vehicle_document_uploaded = providers.vehicle_detail[index].is_document_uploaded;
                                Providers.findByIdAndUpdate(id, {vehicle_detail: providers.vehicle_detail, is_vehicle_document_uploaded: providers.vehicle_detail[index].is_document_uploaded, service_type: service_type, admintypeid: admintypeid}, function (err, providers) {

                                });
                            }
                            var device_token = providers.device_token;
                            var device_type = providers.device_type;
                            if (providers.provider_type != 0) {

                                if (providers.is_partner_approved_by_admin == 1) {
                                    var email_notification = setting_detail.email_notification;
                                    if (email_notification == true) {
                                        allemails.sendProviderApprovedEmail(req, providers);
                                    }
                                    utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_PROVIDER_APPROVED, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                }
                            } else {
                                var email_notification = setting_detail.email_notification;
                                if (email_notification == true) {
                                    allemails.sendProviderApprovedEmail(req, providers);
                                }
                                utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_PROVIDER_APPROVED, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                            }
                            
                            if (is_approved == 0) {
                                message = admin_messages.success_message_provider_approved;
                                res.redirect(provider_page_type);
                            } else {
                                message = admin_messages.success_message_provider_declined;
                                res.redirect(provider_page_type);
                            }
                        });
                    } else {
                        message = admin_messages.error_message_document_not_uploaded;
                        res.redirect(provider_page_type);
                    }

                } else { // Decline
                    Providers.findById(id).then((providers) => { 

                        if (providers.is_trip.length == 0)
                        {
                            providers.is_approved = change;
                            providers.save().then(() => { 
                            }, (err) => {
                                console.log(err);
                            });
                            utils.remove_from_zone_queue(providers);
                            var device_token = providers.device_token;
                            var device_type = providers.device_type;
                            if (providers.provider_type != 0) {
                                if (providers.is_partner_approved_by_admin != 0) {

                                    providers.is_active = constant_json.NO;
                                    providers.save().then(() => { 
                                    }, (err) => {
                                        console.log(err);
                                    });
                                    allemails.sendProviderDeclineEmail(req, providers);
                                    utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_PROVIDER_DECLINED, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                }
                            } else {
                                providers.is_active = constant_json.NO;
                                providers.save().then(() => { 
                                }, (err) => {
                                    console.log(err);
                                });
                                allemails.sendProviderDeclineEmail(req, providers);
                                utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_PROVIDER_DECLINED, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);

                            }
                            message = admin_messages.success_message_provider_declined;
                            res.redirect(provider_page_type);
                        } else
                        {
                            message = admin_messages.error_message_provider_in_trip;
                            res.redirect(provider_page_type);
                        }
                    });
                }
        });
    } else {
        res.redirect('/admin');
    }
}

exports.available_type = function (req, res, next) {
    var city_id = req.body.city;
    var lookup = {
        $lookup:
                {
                    from: "types",
                    localField: "typeid",
                    foreignField: "_id",
                    as: "type_detail"
                }
    };
    var mongoose = require('mongoose');
    var Schema = mongoose.Types.ObjectId;
    var unwind = {$unwind: "$type_detail"};
    var cityid_condition = {$match: {'cityid': {$eq: Schema(req.body.city)}}};
    var buiesness_condotion = {$match: {'is_business': {$eq: 1}}};

    City_type.aggregate([cityid_condition, buiesness_condotion, lookup, unwind]).then((type_available) => { 
        res.json(type_available);
    }, (err) => {
            utils.error_response(err, res)
    });
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
            search_item = 'user_detail.first_name';
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
        } else {
            var search = {"$match": {search_item: {$regex: new RegExp(value, 'i')}}};
        }

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
        var condition = {"$match": {'provider_id': {$eq: Schema(id)}}};
        var trip_condition = {"$match": {$or: [{is_trip_completed: 1}, {is_trip_cancelled: 1}, {is_trip_cancelled_by_provider: 1}]}};

        Trip.aggregate([condition, trip_condition, lookup, unwind, lookup1, unwind1, search, filter, count]).then((array) => { 
            if (array.length == 0) {
                res.render('providers_history', {detail: array, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment, id: id});
            } else {
                var pages = Math.ceil(array[0].total / number_of_rec);
                Trip.aggregate([condition, trip_condition, lookup, unwind, lookup1, unwind1, search, filter, sort, skip, limit]).then((array) => { 

                    res.render('providers_history', {detail: array, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment, id: id});
                }, (err) => {
                    utils.error_response(err, res)
                });
            }
        }, (err) => {
            utils.error_response(err, res)
        });
    } else {
        res.redirect("/admin");
    }

};

exports.documents = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        var id = req.body.id;
        var array = [];
        var i = 0;
        var j = 0;
        query = {};
        query['provider_id'] = id;

        Provider_Document.find(query).then((array) => { 
                res.render('provider_documents', {detail: array, moment: moment, id: id});
        });
    } else {
        res.redirect('/admin');
    }
};

exports.provider_documents_edit = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        Provider_Document.findById(req.body.id).then((provider_document) => { 
            
                res.render('admin_provider_documents_edit', {detail: provider_document, moment: moment});

        });
    } else {
        res.redirect('/admin');
    }
};

exports.provider_documents_update = function (req, res, next) {
    // exports.provider_documents_edit(req, res, next)
    if (typeof req.session.userid != 'undefined') {
        Provider_Document.findById(req.body.id).then((provider_document) => { 
            Provider.findOne({_id: req.body.provider_id}).then((provider_detail) => {
                var id = provider_document.provider_id;
                provider_document.expired_date = req.body.expired_date;
                provider_document.unique_code = req.body.unique_code;
                if (req.files.length > 0)
                {
                    var image_name = provider_document.provider_id + utils.tokenGenerator(4);
                    var url = utils.getImageFolderPath(req, 3) + image_name + '.jpg';
                    utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 3);
                    provider_document.document_picture = url;
                    provider_document.is_uploaded = 1;
                    provider_document.save(function (err) {
                        req.url = '/proivder_documents';
                        req.body = {id: provider_document.provider_id}

                        Provider_Document.find({
                            provider_id: req.body.provider_id,
                            option: 1,
                            is_uploaded: 0
                        }).then((document_list) => {

                            Provider_Document.find({
                                provider_id: req.body.provider_id,
                                option: 1,
                                is_document_expired: true
                            }).then((expired_document_list) => {

                                if (expired_document_list.length == 0) {
                                    provider_detail.is_documents_expired = false;
                                } else {
                                    provider_detail.is_documents_expired = true;
                                }
                                if (document_list.length == 0) {
                                    provider_detail.is_document_uploaded = 1;
                                } else {
                                    provider_detail.is_document_uploaded = 0;
                                }
                                provider_detail.save().then(() => {
                                    exports.documents(req, res, next)
                                });
                            });
                        });
                    });
                } else {
                    provider_document.save().then(() => {
                        req.url = '/proivder_documents';
                        req.body = {id: provider_document.provider_id}
                        exports.documents(req, res, next)
                    }, (err) => {
                        console.log(err);
                    });
                }
            });
        });
    } else {
        res.redirect('/admin');
    }
};


exports.provider_documents_delete = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        Provider_Document.findById(req.body.id).then((provider_document) => { 

            if (provider_document)
            {
                provider_document.is_uploaded = 0;
                provider_document.document_picture = "";
                provider_document.is_document_expired = false;
                provider_document.expired_date = "";
                provider_document.unique_code = "";
                provider_document.save();

                var id = provider_document.provider_id;
                if (provider_document.option == 1)
                {
                    Provider.findById(provider_document.provider_id).then((provider_data) => { 

                        provider_data.is_document_uploaded = 0;
                        provider_data.save();
                        var device_type = provider_data.device_type;
                        var device_token = provider_data.device_token;

                        utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_DOCUMENT_UPLOAD, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                        message = admin_messages.success_message_provider_document_delete;
                        req.body = {id: provider_document.provider_id}
                        exports.documents(req, res, next)
                    })
                } else
                {
                    message = admin_messages.success_message_provider_document_delete;
                    req.body = {id: provider_document.provider_id}
                    exports.documents(req, res, next)
                }
            } else
            {
                message = admin_messages.success_message_provider_document_delete;
                exports.documents(req, res, next)
            }
        })
    } else {
        res.redirect('/admin');
    }
};

exports.documents_search = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        var id = req.body.id;
        var item = req.body.search_item;
        var value = req.body.search_value;

        value = value.replace(/^\s+|\s+$/g, '');//Trim space within string
        value = value.replace(/ +(?= )/g, '');//trim starting & ending space
        query = {};
        query[item] = new RegExp(value, 'i');
        query['provider_id'] = id;

        Provider_Document.find(query).then((array) => { 
                res.render('provider_documents', {detail: array, id: id});
        });
    } else {
        res.redirect('/admin');
    }
};

exports.documents_sort = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        var id = req.body.id;
        var field = req.body.sort_item[0];
        var order = req.body.sort_item[1];
        sort = {};
        sort[field] = order;


        var array = [];
        var i = 0;
        var j = 0;
        query = {};
        query['provider_id'] = id;

        Provider_Document.find(query).then((array) => { 
            
                res.render('provider_documents', {detail: array, id: id});
            
        }).sort(sort);
    } else {
        res.redirect('/admin');
    }
};

exports.provider_vehicle_list = function (req, res) {
    if (typeof req.session.userid != 'undefined') {

        console.log(req.body)
        var condition = {$match: {"_id": Schema(req.body.provider_id)}};
        var vunwind = {$unwind: "$vehicle_detail"}

        var lookup = {
            $lookup:
                    {
                        from: "types",
                        localField: "vehicle_detail.admin_type_id",
                        foreignField: "_id",
                        as: "type_detail"
                    }
        };
        var unwind = {$unwind: {
                path: "$type_detail",
                preserveNullAndEmptyArrays: true
            }
        };
        var group = {$group: {
                _id: null,
                "vehicle_detail": {$push: {
                        is_selected: "$vehicle_detail.is_selected",
                        passing_year: "$vehicle_detail.passing_year",
                        color: "$vehicle_detail.color",
                        model: "$vehicle_detail.model",
                        plate_no: "$vehicle_detail.plate_no",
                        name: "$vehicle_detail.name",
                        accessibility: "$vehicle_detail.accessibility",
                        _id: "$vehicle_detail._id",
                        provider_id: "$_id",
                        type_image_url: '$type_detail.type_image_url',
                        typename: '$type_detail.typename'
                    }}
            }
        }
        Provider.aggregate([condition, vunwind, lookup, unwind, group]).then((provider) => { 
            if (provider.length == 0) {
                res.render('provider_vehicle_list', {provider_id: req.body.provider_id, vehicle_list: [], type: req.body.type})
            } else {
                res.render('provider_vehicle_list', {provider_id: req.body.provider_id, vehicle_list: provider[0].vehicle_detail, type: req.body.type})

            }
        }, (err) => {
            utils.error_response(err, res)
        })
    } else {
        res.redirect('/admin');
    }
};

exports.add_provider_vehicle = function (req, res) {
    if (typeof req.session.userid != 'undefined' || typeof req.session.partner != 'undefined') {
        var vehicle_accesibility = VEHICLE_ACCESIBILITY;
        Provider.findOne({_id: req.body.provider_id}, function (err, provider) {
            var lookup = {
                $lookup:
                        {
                            from: "types",
                            localField: "typeid",
                            foreignField: "_id",
                            as: "type_detail"
                        }
            };
            var unwind = {$unwind: "$type_detail"};

            var cityid_condition = {$match: {'cityid': {$eq: Schema(provider.cityid)}}};

            Citytype.aggregate([cityid_condition, lookup, unwind], function (err, type_available) {

                res.render('edit_vehicle_detail', {type_available: type_available, vehicle_accesibility: vehicle_accesibility, type: req.body.type, provider_id: req.body.provider_id})
            });
        });
    } else {
        res.redirect('/admin');
    }
};

exports.add_provider_vehicle_data = function (req, res) {
    if (typeof req.session.userid != 'undefined' || typeof req.session.partner != 'undefined') {
         Provider.findOne({_id: req.body.provider_id}, function (err, provider) {
            Citytype.findOne({_id: req.body.service_type}, function (err, citytype) {
                var is_selected = false;
                if(provider.vehicle_detail.length==0){
                    is_selected = true;
                }
                if(provider.vehicle_detail.length == 0){
                    provider.service_type = null;
                    provider.admintypeid = null;
                }
                var mongoose = require('mongoose');
                var ObjectId = mongoose.Types.ObjectId;
                var x = new ObjectId();
                var vehicel_json = {
                    _id: x,
                    name: req.body.name,
                    plate_no: req.body.plate_no,
                    model: req.body.model,
                    color: req.body.color,
                    passing_year: req.body.passing_year,
                    service_type: citytype._id,
                    admin_type_id: citytype.typeid,
                    is_selected: is_selected,
                    is_document_uploaded: false,
                    is_selected: false,
                    is_document_expired: false
                }
                

                var files = req.files;
                Country.findOne({countryname: provider.country}, function (err, country) {

                    Document.find({countryid: country._id, type: 2}, function (err, document) {

                        var is_document_uploaded = false;
                        var document_size = document.length;

                        if (document_size !== 0) {

                            var count = 0;
                            for (var i = 0; i < document_size; i++) {

                                if (document[i].option == 0) {
                                    count++;
                                } else {
                                    break;
                                }
                                if (count == document_size) {
                                    is_document_uploaded = true;
                                }
                            }

                            document.forEach(function (entry , index) {
                                var providervehicledocument = new Provider_Vehicle_Document({

                                    vehicle_id:x,
                                    provider_id: provider._id,
                                    document_id: entry._id,
                                    name: entry.title,
                                    option: entry.option,
                                    document_picture: "",
                                    unique_code: entry.unique_code,
                                    is_show_expiry_date: entry.is_show_expiry_date,
                                    expired_date: "",
                                    is_unique_code: entry.is_unique_code,
                                    is_expired_date: entry.is_expired_date,
                                    is_expired_time: entry.is_expired_time,
                                    is_document_expired: false,
                                    is_uploaded: 0

                                });
                                providervehicledocument.save(function (err) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        if(index == document.length-1){
                                            message = process.env.success_add_vehicle_detail;
                                            myProviders.provider_vehicle_list(req, res);
                                        }
                                    }
                                    
                                });
                            });
                            vehicel_json.is_document_uploaded = is_document_uploaded;
                            provider.vehicle_detail.push(vehicel_json);
                            provider.save();
                        } else {
                            vehicel_json.is_document_uploaded = true;
                            provider.vehicle_detail.push(vehicel_json);
                            provider.save();
                            myProviders.provider_vehicle_list(req, res);
                        }
                    }); 
                });
            });
        });
    } else {
        res.redirect('/admin');
    }
};

exports.delete_vehicle_detail = function (req, res) {
    Provider.findOne({_id: req.body.provider_id}, function (err, provider) {
        var index = provider.vehicle_detail.findIndex(x => (x._id).toString() == req.body.vehicle_id);
        if(index != -1){
            if (provider.vehicle_detail[index].is_selected == true) {
                provider.service_type = null;
                provider.admintypeid = null;
                if (provider.vehicle_detail.length == 1) {
                    provider.is_vehicle_document_uploaded = false;
                }
            }
            provider.vehicle_detail.splice(index, 1);
        }
        provider.markModified('vehicle_detail');
        provider.save(function(error){
            myProviders.provider_vehicle_list(req, res);
        });
    });
}

exports.edit_vehicle_detail = function (req, res) {
    var vehicle_accesibility = VEHICLE_ACCESIBILITY;

    if (typeof req.session.userid != 'undefined') {

        Provider.findOne({_id: req.body.provider_id}).then((provider) => { 
            var index = provider.vehicle_detail.findIndex(x => (x._id).toString() == req.body.vehicle_id);
            Provider_Vehicle_Document.find({provider_id: req.body.provider_id, vehicle_id: req.body.vehicle_id}).then((provider_vehicle_document) => { 

                var lookup = {
                    $lookup:
                            {
                                from: "types",
                                localField: "typeid",
                                foreignField: "_id",
                                as: "type_detail"
                            }
                };
                var unwind = {$unwind: "$type_detail"};
                var cityid_condition = {$match: {'cityid': {$eq: Schema(provider.cityid)}}};

                Citytype.aggregate([cityid_condition, lookup, unwind]).then((type_available) => { 

                    res.render('edit_vehicle_detail', {provider_id: req.body.provider_id, type: 'admin', type_available: type_available, vehicle_accesibility: vehicle_accesibility, provider_vehicle_document: provider_vehicle_document, vehicle_detail: provider.vehicle_detail[index]})
                }, (err) => {
                    utils.error_response(err, res)
                });

            })
        })

    } else {
        res.redirect('/admin');
    }
};

exports.update_vehicle_detail = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {

        Provider.findOne({_id: req.body.provider_id}).then((provider) => { 

            var index = provider.vehicle_detail.findIndex(x => (x._id).toString() == req.body.vehicle_id);

            Citytype.findOne({_id: req.body.service_type}).then((citytype) => { 

                provider.vehicle_detail[index].service_type = citytype._id;
                provider.vehicle_detail[index].admin_type_id = citytype.typeid;
                provider.vehicle_detail[index].name = req.body.name;
                provider.vehicle_detail[index].plate_no = req.body.plate_no;
                provider.vehicle_detail[index].model = req.body.model;
                provider.vehicle_detail[index].color = req.body.color;
                provider.vehicle_detail[index].accessibility = req.body.accessibility;

                provider.vehicle_detail[index].passing_year = req.body.passing_year;

                if(provider.vehicle_detail[index].is_selected == true){
                    provider.service_type=citytype._id;
                    provider.admintypeid=citytype.typeid;
                }
                provider.markModified('vehicle_detail');
                provider.save().then(() => { 
                    myProviders.provider_vehicle_list(req, res);
                });
            });
        });
    } else {
        res.redirect('/admin');
    }
};


exports.vehicle_document_list = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        Provider_Vehicle_Document.find({provider_id: req.body.provider_id, vehicle_id: req.body.vehicle_id}).then((provider_vehicle_document) => { 

            res.render('vehicle_document_list', {provider_id: req.body.provider_id, vehicle_id: req.body.vehicle_id, moment: moment, detail: provider_vehicle_document})

        });
    } else {
        res.redirect('/admin');
    }
};


exports.provider_vehicle_documents_edit = function (req, res) {

    if (typeof req.session.userid != 'undefined') {

        Provider_Vehicle_Document.findById(req.body.id).then((provider_document) => { 
                res.render('admin_provider_vehicle_documents_edit', {detail: provider_document, moment: moment});
        });
    } else {
        res.redirect('/admin');
    }
};

exports.provider_vehicle_documents_update = function (req, res) {

    if (typeof req.session.userid != 'undefined') {
        Provider_Vehicle_Document.findById(req.body.id).then((provider_document) => { 
            
                var id = provider_document.provider_id;
                provider_document.expired_date = req.body.expired_date;
                provider_document.unique_code = req.body.unique_code;

                if (req.files.length > 0)
                {
                    var image_name = provider_document.provider_id + utils.tokenGenerator(4);
                    var url = utils.getImageFolderPath(req, 3) + image_name + '.jpg';
                    utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 3);
                    provider_document.document_picture = url;
                    provider_document.is_uploaded = 1;
                }
                provider_document.save().then(() => { 
                    req.body = {provider_id: provider_document.provider_id, vehicle_id: provider_document.vehicle_id}
                    myProviders.vehicle_document_list(req, res);
                    Provider_Vehicle_Document.find({
                        vehicle_id: provider_document.vehicle_id,
                        option: 1,
                        provider_id: provider_document.provider_id,
                        is_uploaded: 0
                    }).then((providervehicledocumentuploaded) => {
                        Provider.findOne({_id: provider_document.provider_id}).then((provider) => {
                            var index = provider.vehicle_detail.findIndex((x) => (x._id).toString() == (provider_document.vehicle_id)).toString();

                            if (providervehicledocumentuploaded.length == 0) {
                                provider.vehicle_detail[index].is_document_uploaded = true;
                            } else {
                                provider.vehicle_detail[index].is_document_uploaded = false;
                            }
                            provider.markModified('vehicle_detail');
                            if(provider.vehicle_detail[index].is_selected){
                                if (providervehicledocumentuploaded.length == 0) {
                                    provider.is_vehicle_document_uploaded = true;
                                } else {
                                    provider.is_vehicle_document_uploaded = false;
                                }
                            }
                            provider.save();
                        });
                    });
                });
        });
    } else {
        res.redirect('/admin');
    }
};

// admin_add_provider_wallet
exports.admin_add_provider_wallet = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {

        Provider.findById(req.body.provider_id).then((provider_data) => { 
            if (provider_data)
            {
                var wallet = utils.precisionRoundTwo(Number(req.body.wallet));
                var status = constant_json.DEDUCT_WALLET_AMOUNT
                if(wallet > 0){
                    status = constant_json.ADD_WALLET_AMOUNT
                }
                
                var total_wallet_amount = utils.addWalletHistory(constant_json.PROVIDER_UNIQUE_NUMBER, provider_data.unique_id, provider_data._id, provider_data.country_id, provider_data.wallet_currency_code, provider_data.wallet_currency_code,
                        1, Math.abs(wallet), provider_data.wallet, status, constant_json.ADDED_BY_ADMIN, "By Admin")

                provider_data.wallet = total_wallet_amount;
                //provider_data.wallet = provider_data.wallet + Number(req.body.wallet);
                provider_data.save().then(() => { 
                    res.json({success: true, wallet: provider_data.wallet, message: admin_messages.success_message_add_wallet});
                });
            } else
            {
                res.json({success: false, error_code: admin_messages.errpr_message_add_wallet_failed});
            }
        })
    } else
    {
        res.json({success: false, error_code: admin_messages.errpr_message_add_wallet_failed});
    }
}

// generate_provider_history_excel
exports.generate_provider_history_excel = function (req, res, next) {

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
            search_item = 'user_detail.first_name';
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
        } else {

            var search = {"$match": {search_item: {$regex: new RegExp(value, 'i')}}};
        }

        query1['provider_trip_end_time'] = {$gte: start_date, $lt: end_date};
        var filter = {"$match": query1};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        Trip.aggregate([lookup, unwind, lookup1, search, filter, sort]).then((array) => { 

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
            });
        }, (err) => {
            utils.error_response(err, res)
        });
    } else {
        res.redirect('/admin');
    }

};