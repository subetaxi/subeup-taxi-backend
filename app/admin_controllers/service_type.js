var myUtils = require('../controllers/utils');
var admins = require('mongoose').model('admin');
var multer = require('multer');
var bodyparser = require('body-parser');
var cookieparser = require('cookie-parser');
var nodemailer = require('nodemailer');
var twilio = require('twilio');
var randomstring = require("randomstring");
var Settings = require('mongoose').model('Settings');
var Country = require('mongoose').model('Country');
var City = require('mongoose').model('City');
var moment = require('moment');
var array = [];
var Card = require('mongoose').model('Card');
var Type = require('mongoose').model('Type');
var City_type = require('mongoose').model('city_type');

exports.service_types = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
       
        Type.count({}).then((type_count) => { 
            if (type_count == 0) {
                res.render('service_type', {service_data: array});
            } else {
                Type.find({}).then((service) => { 
                        var TRIP_TYPES = [
                            {id:  constant_json.TRIP_TYPE_VISITOR, name:config_json.TRIP_TYPE_VISITOR_STRING},
                            {id: constant_json.TRIP_TYPE_NORMAL, name:config_json.TRIP_TYPE_NORMAL_STRING}
                        ] 
                        
                        var service_data = [];
                        var types = TRIP_TYPES;
                        var size = types.length;
                        var id;
                        service.forEach(function (service_detail) {

                            id = service_detail.service_type;
                            for (var i = 0; i < size; i++) {
                                if (types[i].id == id) {

                                    var temp = {
                                        name: types[i].name, _id: service_detail._id,
                                        typename: service_detail.typename,
                                        is_business: service_detail.is_business,
                                        type_image_url: service_detail.type_image_url,
                                        description: service_detail.description,
                                        is_default_selected: service_detail.is_default_selected
                                    };
                                    service_data.push(temp);
                                    break;
                                }
                            }


                        });

                        res.render('service_type', {service_data: service_data});
                        delete message;
                    
                });
            }
        });
    } else {
        res.redirect('/admin');
    }
}

exports.add_service_form = function (req, res) {
    if (typeof req.session.userid != "undefined") {
        // console.log("-------123--------");
        var TRIP_TYPES = [
                            {id:  constant_json.TRIP_TYPE_VISITOR, name:config_json.TRIP_TYPE_VISITOR_STRING},
                            {id: constant_json.TRIP_TYPE_NORMAL, name:config_json.TRIP_TYPE_NORMAL_STRING}
                        ]
        res.render('add_type_form', {type_array:  TRIP_TYPES});
    } else {
        res.redirect('/admin');
    }
}

exports.edit_service_form = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        var id = req.body.id;
        Type.find({'_id': id}).then((service) => { 
            var TRIP_TYPES = [
                            {id:  constant_json.TRIP_TYPE_VISITOR, name:config_json.TRIP_TYPE_VISITOR_STRING},
                            {id: constant_json.TRIP_TYPE_NORMAL, name:config_json.TRIP_TYPE_NORMAL_STRING}
                        ]
                res.render('add_type_form', {service_data: service, type_array: TRIP_TYPES});
            
        });
    } else {
        res.redirect('/admin');
    }
};

exports.add_service_detail = function (req, res, next) {

    var fs = require('fs');
    var bf = new Buffer(100000);
    var http = require('http');
    var add_type = new Type({
        typename: (req.body.typename).trim(),
        description: req.body.description,
        service_type: req.body.service_type,
        is_business: req.body.is_business,
        priority: req.body.priority,
        type_image_url: '',
        map_pin_image_url: ''
    });

    if (typeof req.session.userid != "undefined") {
        if (req.files != null || req.files != 'undefined') {
            var image_name = add_type._id + myUtils.tokenGenerator(4);
            var url = myUtils.getImageFolderPath(req, 4) + image_name + '.png';
            add_type.type_image_url = url;
            myUtils.saveImageFromBrowser(req.files[0].path, image_name + '.png', 4);

            image_name = add_type._id + myUtils.tokenGenerator(5);
            url = myUtils.getImageFolderPath(req, 5) + image_name + '.png';
            add_type.map_pin_image_url = url;
            myUtils.saveImageFromBrowser(req.files[1].path, image_name + '.png', 5);

        }
        add_type.save().then(() => { 
                res.redirect('/service_types');
        }, (err) => {
            console.log(err)
        });
    } else {
        res.redirect('/admin');
    }
};

exports.update_service_detail = function (req, res) {

    var fs = require('fs');
    var bf = new Buffer(100000);
    var http = require('http');
    var id = req.body.id;
    var file = req.file;
    if (typeof req.body.is_default_selected == 'undefined') {
        req.body.is_default_selected = 'false';
    } else {
        Type.update({_id: {$ne: id}}, {is_default_selected: false}, {multi: true}, function(error, type_list){

        });
    }

    if (typeof req.session.userid != "undefined") {

        req.body.typename = (req.body.typename).trim();
        Type.findByIdAndUpdate(id, req.body).then((type_detail) => { 

            var file_list_size = 0;
            var files_details = req.files;

            if (files_details != null || files_details != 'undefined') {
                file_list_size = files_details.length;

                var file_data;
                var file_id;
                var file_name = "";

                for (i = 0; i < file_list_size; i++) {

                    file_data = files_details[i];
                    file_id = file_data.fieldname;
                    file_name = '';

                    if (file_id == 'file2') {
                        myUtils.deleteImageFromFolder(type_detail.type_image_url, 4);
                        var image_name = type_detail._id + myUtils.tokenGenerator(4);
                        var url = myUtils.getImageFolderPath(req, 4) + image_name + '.png';
                        type_detail.type_image_url = url;
                        myUtils.saveImageFromBrowser(req.files[i].path, image_name + '.png', 4);
                        type_detail.save().then(() => { 
                        }, (err) => {
                            console.log(err)
                        });

                    } else if (file_id == 'file3') {
                        myUtils.deleteImageFromFolder(type_detail.map_pin_image_url, 5);
                        image_name = type_detail._id + myUtils.tokenGenerator(5);
                        url = myUtils.getImageFolderPath(req, 5) + image_name + '.png';
                        type_detail.map_pin_image_url = url;
                        myUtils.saveImageFromBrowser(req.files[i].path, image_name + '.png', 5);
                        type_detail.save().then(() => { 
                        }, (err) => {
                            console.log(err)
                        });
                    }
                }
            }
            res.redirect('/service_types');
        });
    } else {
        res.redirect('/admin');
    }
};

exports.service_type_sort = function (req, res, next) {
    var field = req.body.sort_item[0];
    var order = req.body.sort_item[1];
    sort = {};
    sort[field] = order;
    if (typeof req.session.userid != "undefined") {
        Type.find({}, function (err, service, next) {
            if (err) {
                //console.log(err);
            } else {
                res.render('service_type', {service_data: service});
            }
        }).sort(sort);
    } else {
        res.redirect('/admin');
    }
};

exports.service_type_search = function (req, res, next) {
    var item = req.body.search_item;
    var value = req.body.search_value;
    value = value.replace(/^\s+|\s+$/g, '');
    value = value.replace(/ +(?= )/g, '');

    query = {};
    query[item] = new RegExp(value, 'i');
    if (typeof req.session.userid != "undefined") {
        Type.find(query, function (err, service) {
            if (err) {
                //console.log(err);
            } else {
                res.render('service_type', {service_data: service});
            }
        });
    } else {
        res.redirect('admin');
    }
};

exports.check_type_available = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        var typename = (req.body.typename).trim();
        var query = {};
        query['typename'] = typename;
        Type.count(query).then((type_list) => { 
            if (type_list != 0) {
                res.json(1);
            } else {
                res.json(0);
            }
        });
    } else {
        res.redirect('/admin');
    }
};

exports.fetch_servicetype_list = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
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

        var mongoose = require('mongoose');

        var condition = {$match: {'cityid': {$eq: mongoose.Types.ObjectId(req.body.cityid)}}};

        City_type.aggregate([condition, lookup, unwind]).then((city_type) => { 
            var total_city_type = city_type.length;
            Type.find({}).then((type_list) => { 
                    res.json({'type_list': type_list, 'city_type': city_type});
            });
        });
    } else {
        res.redirect('/admin');
    }
};

exports.check_type_priority_available = function (req, res, next) {
    if (typeof req.session.userid == 'undefined') {
        Type.find({}, {"priority": 1}).then((types) => { 
            res.json(types);
        })
    } else {
        res.redirect('/admin');
    }
};