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
var Trip_Location = require('mongoose').model('trip_location');
var Citytype = require('mongoose').model('city_type');
var Settings = require('mongoose').model('Settings');
var Type = require('mongoose').model('Type');
var console = require('../controllers/console');

exports.user_create_trip = function (req, res, next) {
    if (typeof req.session.user != 'undefined') {
        
        var server_date = new Date(Date.now());
        res.render("user_create_trip", {'moment': moment, server_date: server_date, user_data: req.session.user, scheduled_request_pre_start_minute: setting_detail.scheduled_request_pre_start_minute, map_key: setting_detail.web_app_google_key});
        delete message;
    } else {
        res.redirect('/login');
        delete message;
    }
}

exports.check_old_trip = function (req, res, next) {

    User.findById(req.body.user_id).then((user_detail) => { 
        Trip.findOne({user_id: req.body.user_id, is_trip_cancelled: 0, is_trip_completed: 0}).then((trip) => { 
            if (trip)
            {
                res.json({success: true, token: user_detail.token})
            } else
            {
                res.json({success: false, token: user_detail.token})
            }
        });
    });
}

exports.get_nearby_provider = function (req, res, next) {

    var default_Search_radious = setting_detail.default_Search_radious;
    var distance = default_Search_radious / constant_json.DEGREE_TO_KM;
    
    var query = Provider.find({
        'providerLocation': {
            $near: [
            req.body.latitude,
            req.body.longitude
            ],
            $maxDistance: distance

        }, "is_active": 1, "is_available": 1,
        $or: [
        {
            $and: [
            {"provider_type": Number(constant_json.PROVIDER_TYPE_NORMAL)},
            {"is_approved": 1}]
        },
        {
            $and: [
            {"provider_type": Number(constant_json.PROVIDER_TYPE_PARTNER)},
            {"is_approved": 1},
            {"is_partner_approved_by_admin": 1}
            ]
        }
        ],
        is_trip: [],
        service_type: req.body.service_type_id
    }).exec().then((providers) => { 
        if (providers.length == 0) {
            res.json({
                success: false,
                error_code: error_message.ERROR_CODE_NO_PROVIDER_FOUND_SELECTED_SERVICE_TYPE_AROUND_YOU
            });
        } else {
            res.json({
                success: true,
                message: success_messages.MESSAGE_CODE_YOU_GET_NEARBY_DRIVER_LIST, providers: providers
            });
        }
    });

}

exports.user_trip_map = function (req, res, next) {
    if (typeof req.session.user == 'undefined') {

        res.redirect('/login');
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
                    res.render('user_trip_map', {'data': trips, 'url': url, 'user_name': user_name, 'provider_name': provider_name, 'moment': moment});

                } else {
                    res.render('user_trip_map', {'data': trips, 'url': url, 'trip_path_data': locations, 'user_name': user_name, 'provider_name': provider_name, 'moment': moment});
                }
                
            });
            
        });

    }
}

exports.user_request = function (req, res, next) {

    if (typeof req.session.user == 'undefined') {

        res.redirect('/login');

    } else {
        var j = 1;
        var array = [];


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
            if (value != "")
            {
                value = Number(value)
                query1[search_item] = {$eq: value};
                var search = {"$match": query1};
            } else
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
        var filter = {"$match": query1};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

        var mongoose = require('mongoose');
        var Schema = mongoose.Types.ObjectId;
        var condition = {$match: {'user_id': {$eq: Schema(req.session.user._id)}}};
        Trip.aggregate([condition, lookup, unwind, lookup1, search, filter, count]).then((array) => { 

            if (array.length == 0) {
                res.render('user_request_list', {detail: array, moment: moment});
                delete message;
            } else {
                Trip.aggregate([condition, lookup, unwind, lookup1, search, filter, sort]).then((array) => { 

                    res.render('user_request_list', {detail: array, moment: moment});
                    delete message;
                }, (err) => {
                    utils.error_response(err, res)
                });
            }
        }, (err) => {
            utils.error_response(err, res)
        });
    }
}

exports.user_future_request = function (req, res, next) {

    if (typeof req.session.user == 'undefined') {

        res.redirect('/login');

    } else {
        var j = 1;
        var array = [];


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



        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        if (search_item == "unique_id") {

            var query1 = {};
            if (value != "")
            {
                value = Number(value)
                query1[search_item] = {$eq: value};
                var search = {"$match": query1};
            } else
            {
                var search = {$match: {}};
            }

        } else {
            var search = {"$match": {search_item: {$regex: new RegExp(value, 'i')}}};
        }


        query1['created_at'] = {$gte: start_date, $lt: end_date};
        var filter = {"$match": query1};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

        var mongoose = require('mongoose');
        var Schema = mongoose.Types.ObjectId;
       // var condition = {$match: {'user_id': {$eq: Schema(req.session.user._id)}}};
       // var condition1 = {$match: {'is_schedule_trip_cancelled': {$eq: 0}}};
       // var condition2 = {$match: {'is_trip_created': {$eq: 0}}};
       
       
       var condition = {$match: {'is_schedule_trip': {$eq: true}}};
       var condition1 = {$match: {'is_trip_cancelled': {$eq: 0}}};
       var condition2 = {$match: {'is_trip_completed': {$eq: 0}}};
       var condition3 = {$match: {'is_trip_end': {$eq: 0}}};
       var condition4 = {$match: {'provider_id': {$eq: null}}};
       var condition5 = {$match: {'current_provider': {$eq: null}}};
       var user_condition = {$match: {'user_id': {$eq: Schema(req.session.user._id)}}};


       Trip.aggregate([condition, condition1, condition2,condition3,condition4,condition5,user_condition, lookup, unwind, search, filter, count]).then((array) => { 

        if (array.length == 0) {
            res.render('user_future_request', {detail: array, moment: moment});
            delete message;
        } else {
            Trip.aggregate([condition, condition1, condition2,condition3,condition4,condition5,user_condition, lookup, unwind, search, filter, sort]).then((array) => { 

                res.render('user_future_request', {detail: array, moment: moment});
                delete message;
            }, (err) => {
                utils.error_response(err, res)
            });
        }
    }, (err) => {
        utils.error_response(err, res)
    });
   }
}

exports.user_trip_invoice = function (req, res, next) {

    if (req.body.type == "user")
    {
        if (typeof req.session.user != 'undefined') {


            var array = [];
            var page = req.path.split('/');
            var query = {};
            query['_id'] = req.body.id;


            Trip.findOne(query).then((trip) => { 
                var user_id = trip.user_id;
                var service_type_id = trip.service_type_id;

                var query_for_service_type = {};
                query_for_service_type['_id'] = service_type_id;


                Citytype.findOne(query_for_service_type).then((service) => { 
                    var type_id = service.typeid;
                    var query_for_type = {};
                    var min_fare = service.min_fare;
                    query_for_type['_id'] = type_id;

                    Type.findOne(query_for_type).then((type) => { 
                        var query_for_user = {};
                        query_for_user['_id'] = user_id;


                        User.findOne(query_for_user).then((user) => { 

                            Provider.findById(trip.confirmed_provider).then((provider_detail) => { 

                                res.render('user_trip_invoice', {detail: trip, type: req.body.type, min_fare: min_fare, type: req.body.type, provider_detail: provider_detail, user_detail: user, type_detail: type, service_detail: service, moment: moment});
                            });
                            
                        });

                        
                    });
                    
                });

                
            });

        } else {
            res.redirect('/login');
        }
    } else
    {
        if (typeof req.session.provider != 'undefined') {


            var array = [];
            var page = req.path.split('/');
            var query = {};
            query['_id'] = req.body.id;


            Trip.findOne(query).then((trip) => { 
                var user_id = trip.user_id;
                var service_type_id = trip.service_type_id;

                var query_for_service_type = {};
                query_for_service_type['_id'] = service_type_id;


                Citytype.findOne(query_for_service_type).then((service) => { 
                    var type_id = service.typeid;
                    var query_for_type = {};
                    var min_fare = service.min_fare;
                    query_for_type['_id'] = type_id;

                    Type.findOne(query_for_type).then((type)=>{
                        var query_for_user = {}
                        query_for_user['_id'] = user_id;


                        User.findOne(query_for_user).then((user) => { 

                            Provider.findById(trip.confirmed_provider).then((provider_detail) => { 

                                res.render('user_trip_invoice', {detail: trip, type: req.body.type, min_fare: min_fare, type: req.body.type, provider_detail: provider_detail, user_detail: user, type_detail: type, service_detail: service, moment: moment});
                            });
                            
                        });

                        
                    });
                    
                });

                
            });

        } else {
            res.redirect('/provider_login');
        }
    }
};
