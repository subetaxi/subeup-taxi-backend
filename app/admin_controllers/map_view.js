var myUtils = require('../controllers/utils');
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
var Type = require('mongoose').model('Type');
var Providers = require('mongoose').model('Provider');
var console = require('../controllers/console');

exports.map = function (req, res) {
    var query = {};
    query['providerLocation'] = {$ne: [0, 0]};

    if (typeof req.session.userid != 'undefined') {
        var types = [];
        Type.find({}).then((types) => {
                var url = "https://maps.googleapis.com/maps/api/js?key=" + setting_detail.web_app_google_key + "&libraries=places"
                   res.render('maps', {types:types, map_url: url});
                        
                   
            
        });
    } else {
        res.redirect('/admin');
    }
};

exports.provider_track = function (req, res) {

    var query = {};
    query['providerLocation'] = {$ne: [0, 0]};

    if (typeof req.session.userid != 'undefined') {
        var url = "https://maps.googleapis.com/maps/api/js?key=" + setting_detail.web_app_google_key + "&libraries=places"
        Country.find({}).then((country) => {
            res.render('provider_track', {map_url: url, country: country});
        });
    } else {
        res.redirect('/admin');
    }
};



exports.fetch_provider_list_of_refresh = function (req, res) {
    var query = {};
    query['providerLocation'] = {$ne: [0, 0]};
    if(req.body.type_id != 'all'){
        query['admintypeid'] = {$eq: req.body.type_id};
    }

    if (typeof req.session.userid != 'undefined') {
        // Providers.count(query).then((providers_count) => {
        //     if (providers_count != 0) {
                Providers.find(query).then((providers) => {
                    if (providers.length > 0) {
                        res.json(providers);
                    } else {
                        res.json('');
                    }
                });
        //     } else {
        //         res.json('');
        //     }
        // });
    } else {
        res.redirect('/admin');
    }
};

exports.provider_track_city = function (req, res) {
    var query = {};
    query['providerLocation'] = {$ne: [0, 0]};

    if (typeof req.session.userid != 'undefined') {

        Providers.count(query).then((providers_count) => {
            var url = "https://maps.googleapis.com/maps/api/js?key=" + setting_detail.web_app_google_key + "&libraries=places&callback=initialize";
            Country.find({}).then((country) => {
                if (providers_count != 0) {
                    Providers.find(query).then((providers) => {
                            res.render('provider_track', {detail: providers, map_url: url, country: country});
                    });
                } else {
                    res.render('provider_track', {detail: providers, map_url: url, country: country});
                }
            })
        });
    } else {
        res.redirect('/admin');
    }
};

exports.fetch_provider_list = function (req, res) {
    var cityid = req.body.cityid;
    var countyrid = req.body.countyrid;

    var query = {};
    query['providerLocation'] = {$ne: [0, 0]};
    query['cityid'] = cityid;
    query['is_active'] = 1;

    if (typeof req.session.userid != 'undefined') {
        Providers.count(query).then((providers_count) => {
            if (providers_count != 0) {
                Providers.find(query).then((providers) => {
                    res.json(providers);
                });
            } else {
                res.json('');
            }
        });
    } else {
        res.redirect('/admin');
    }
};


exports.fetch_provider_detail = function (req, res) {
    var providerid = req.body.providerid;
    var query = {};
    query['_id'] = providerid;

    if (typeof req.session.userid != 'undefined') {
        
        Providers.count(query).then((providers_count) => {
            if (providers_count != 0) {
                Providers.findById(providerid).then((providers) => {
                    res.json(providers);
                });
            } else {
                res.json(providers);
            }
        });
    } else {
        res.redirect('/admin');
    }
};




exports.get_all_provider_list = function (req, res) {
    Providers.find({admintypeid:req.body.type_id}).then((providers) => {
            res.json({success: true, providers: providers})
    });
};