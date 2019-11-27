var utils = require('../controllers/utils');
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


exports.information = function (req, res, next) {
    var Information = require('mongoose').model('Information');
    if (typeof req.session.userid != "undefined") {
        Information.find({}, function (err, info) {
            if (err) {
                //console.log(err);
            } else {
                res.render('information', {info_data: info});
            }
        });
    } else {
        res.redirect('/admin');
    }
};


exports.add_info_form = function (req, res, next) {
    if (typeof req.session.userid != "undefined") {
        res.render('add_info_form');
    } else {
        res.redirect('/admin');
    }
};

exports.add_info_detail = function (req, res, next) {
    var Information = require('mongoose').model('Information');
    if (typeof req.session.userid != "undefined") {
        ////////////// FOR FILE UPLOAD /////////////////////////////////////////////////////////////////////
        var fs = require('fs');
        var bf = new Buffer(100000);
        var http = require('http');

        var filename = req.file.originalname;
        var file_name = filename.split('.');
        var file_name_only = file_name[0];
        var file_extention_only = file_name[1];
        var file_new_name = file_name_only + Date.now() + '.' + file_extention_only;

        var file_tmp_path = req.file.path;
        var file_new_path = './public/uploads/' + file_new_name;

        fs.readFile(file_tmp_path, bf, 0, function (err, data) {
            fs.writeFile(file_new_path, data, function (err) {
                if (err) {
                    //console.log(err);
                } else {
                    response = {
                        message: 'File uploaded successfully',
                        filename: req.file.originalname
                    };
                    //console.log('file uploaded successfully');
                }
            });
        });

        //////////////////////////////////////////////////////////////////////////////////////////////
        var file_upload_path = '/uploads/' + file_new_name;
        var file_upload_url = req.protocol + '://' + req.get('host') + file_upload_path;

        var add_info = new Information({
            title: req.body.title,
            file: file_upload_url,
            description: req.body.description
        });

        add_info.save(function (err) {
            if (err) {
                //console.log(err);
                res.end();
            } else {
                Information.find({}, function (err, info) {
                    if (err) {
                        //console.log(err);
                    } else {
                        res.render('information', {info_data: info});
                    }
                });
            }
        });
    } else {
        res.redirect('/admin');
    }
};

exports.edit_info_form = function (req, res, next) {

    var Information = require('mongoose').model('Information');

    if (typeof req.session.userid != 'undefined') {
        var id = req.query.id;
        query = {};
        query['_id'] = id


        Information.find(query, function (err, info) {
            if (err) {
                //console.log(err);
            } else {
                res.render('add_info_form', {info_data: info});
            }
        });
    } else {
        res.redirect('/admin');
    }

};


exports.update_info_detail = function (req, res, next) {
    var Information = require('mongoose').model('Information');
    var id = req.body.id;
    var file = req.file;
    var old_img_path = req.body.old_img_path;
    var old_file_name = old_img_path.split('/');
    if (typeof req.session.userid != "undefined") {
        if (typeof (file) != 'undefined') {
            ///// remove old file /////
            var fs = require('fs');
            var bf = new Buffer(100000);
            var http = require('http');

            var old_file_path = './public/uploads/' + old_file_name[4];

            fs.unlink(old_file_path, function (err, file) {
                if (err) {
                    //console.log(err);
                } else {
                    //console.log('successfully remove image');
                }
            });
            ///////////////////////////

            ///// for differentiate file name and extention for rename uploaded file /////
            var filename = req.file.originalname;
            var file_name = filename.split('.');
            var file_name_only = file_name[0];
            var file_extention_only = file_name[1];
            var file_new_name = file_name_only + Date.now() + '.' + file_extention_only;
            ///////////////////////////////////////////////



            ///// for file read and write it at destination folder /////
            var file_tmp_path = req.file.path;
            var file_new_path = './public/uploads/' + file_new_name;

            fs.readFile(file_tmp_path, bf, 0, function (err, data) {
                fs.writeFile(file_new_path, data, function (err) {
                    if (err) {
                        //console.log(err);
                    } else {
                        response = {
                            message: 'File uploaded successfully',
                            filename: req.file.originalname
                        };
                    }
                });
            });
            ////////////////////////////////////////////////////////////

            var file_upload_path = '/uploads/' + file_new_name;
            var file_upload_url = req.protocol + '://' + req.get('host') + file_upload_path;
            req.body.file = file_upload_url;
        }

        Information.findByIdAndUpdate(id, req.body, function (err, info) {
            if (err) {
                //console.log(err);
            } else {
                Information.find({}, function (err, info, next) {
                    if (err) {
                        //console.log(err);
                    } else {
                        res.render('information', {info_data: info, message: 'Add information page'});
                    }
                });
            }
        });
    } else {
        res.redirect('/admin');
    }
};

exports.info_search = function (req, res, next) {

    var Information = require('mongoose').model('Information');
    var item = req.body.search_item;
    var value = req.body.search_value;
    value = value.replace(/ +(?= )/g, '');


    query = {};
    query[item] = new RegExp(value, 'i');
    if (typeof req.session.userid != "undefined") {
        Information.find(query, function (err, info) {
            if (err) {
                //console.log(err);
            } else {
                res.render('information', {info_data: info});
            }
        });
    } else {
        res.redirect('/admin');
    }
};