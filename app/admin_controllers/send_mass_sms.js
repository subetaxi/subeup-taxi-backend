var User = require('mongoose').model('User');
var Trip = require('mongoose').model('Trip');
var Provider = require('mongoose').model('Provider');
var Country = require('mongoose').model('Country');
var myUtils = require('../controllers/utils');
var console = require('../controllers/console');
var City = require('mongoose').model('City');
var Type = require('mongoose').model('Type');
var Providers = require('mongoose').model('Provider');

var utils = require('../controllers/utils');
exports.sms_notification = function (req, res) {

    if (typeof req.session.userid != 'undefined') {
        Country.find({}).then((country) => { 
            
                User.find({}).then((user_detail) => { 
                    res.render('send_mass_sms', {country: country, user_detail: user_detail});
                    delete message;
                });
        })
    } else {
        res.redirect('/admin');
    }


};

exports.fetch_user_list = function (req, res) {
    var country = req.body.country;
    var query = {};
    if (country != 'all') {
        query['country'] = country;
    }


    if (typeof req.session.userid != 'undefined') {
        User.find(query).then((user_detail) => { 
            
                res.json({user_detail: user_detail});
            
        });

    } else {
        res.redirect('/admin');
    }
};


exports.send_mass_sms = function (req, res) {
  
    var country = req.body.country;
    if (req.body.type == 'user') {
        if (country != "all") {
            User.find({country: country}).then((users) => { 
                users.forEach(function (user_detail) {
                    //myUtils.sendSMS(user_detail.country_phone_code+user_detail.phone, req.body.message);

                });
                res.redirect('/send_mass_sms');
            });
        } else
        {
            User.find({}).then((users) => { 
                users.forEach(function (user_detail) {
                    //myUtils.sendSMS(user_detail.country_phone_code+user_detail.phone, req.body.message);

                });
                res.redirect('/send_mass_sms');
            });
        }
    } else
    {
        if (country != "all") {
            Provider.find({country: country}).then((providers) => { 
                providers.forEach(function (provider_detail) {
                    //myUtils.sendSMS(provider_detail.country_phone_code+provider_detail.phone, req.body.message);

                });
                res.redirect('/send_mass_sms');
            });
        } else
        {
            Provider.find({}).then((providers) => { 
                providers.forEach(function (provider_detail) {
                    //myUtils.sendSMS(provider_detail.country_phone_code+provider_detail.phone, req.body.message);

                });
                res.redirect('/send_mass_sms');
            });
        }
    }
};



exports.fetch_providers_list = function (req, res) {
    var country = req.body.country;

    var query = {};
    if (country != 'all') {
        query['country'] = country;
    }

    if (typeof req.session.userid != 'undefined') {

        Provider.find(query).then((provider_detail) => { 
           
                res.json({provider_detail: provider_detail});
            
        });
    } else {
        res.redirect('/admin');
    }
};