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
var fs = require('fs');
var console = require('../controllers/console');

exports.country_type = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        var Country = require('mongoose').model('Country');

        Country.count({}).then((country_count) => {
            if (country_count == 0) {
                res.render('country_type', {country_data: array});
            } else {
                Country.find({}).then((country) => {
                    res.render('country_type', {country_data: country});
                    delete message;
                });
            }
        });
    } else {
        res.redirect('/admin');
    }
};


exports.getcountryphonelength = function (req, res, next) {
    Country.findOne({"countryname" :req.body.countryname}).then((country_data) => {
        res.json({phone_number_length:country_data.phone_number_length, 
            phone_number_min_length:country_data.phone_number_min_length,
            currencycode:country_data.currencycode, country_id: country_data._id
        })
    })
}

exports.countries_sort = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        var Country = require('mongoose').model('Country');
        var field = req.body.sort_item[0];
        var order = req.body.sort_item[1];
        sort = {};
        sort[field] = order;

        Country.find({}, function (err, country) {
            if (err) {
                //console.log(err);
            } else {
                res.render('country_type', {country_data: country});
            }
        }).sort(sort);
    } else {
        res.redirect('/admin');
    }
};

exports.countries_search = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        var Country = require('mongoose').model('Country');
        var item = req.body.search_item;
        var value = req.body.search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');
        query = {};
        query[item] = new RegExp(value, 'i');

        Country.find(query, function (err, country) {
            if (err) {
                //console.log(err);
            } else {
                res.render('country_type', {country_data: country});
            }
        });
    } else {
        res.redirect('/admin');
    }
};


exports.add_country_detail = function (req, res) {
    var Country = require('mongoose').model('Country');
    if (typeof req.session.userid != "undefined") {
        var add_country = new Country({
            countryname: req.body.countryname.replace(/'/g, ''),
            flag_url: '',
            countrycode: req.body.countrycode,
            alpha2: req.body.alpha2,
            currency: req.body.currency,
            currencycode: req.body.currencycode,
            currencysign: req.body.currencysign,
            countrytimezone: req.body.countrytimezone,
            country_all_timezone: req.body.country_all_timezone.split(","),
            countryphonecode: req.body.countryphonecode,
            referral_bonus_to_user: req.body.referral_bonus_to_user,
            bonus_to_userreferral: req.body.bonus_to_userreferral,
            userreferral: req.body.userreferral,
            phone_number_length: req.body.phone_number_length,
            phone_number_min_length: req.body.phone_number_min_length,
            isBusiness: req.body.isBusiness,
            is_referral: req.body.is_referral,
            auto_transfer_day: req.body.auto_transfer_day,
            is_auto_transfer: req.body.is_auto_transfer,

            referral_bonus_to_provider: req.body.referral_bonus_to_provider,
            bonus_to_providerreferral: req.body.bonus_to_providerreferral,
            providerreferral: req.body.providerreferral,
            is_provider_referral: req.body.is_provider_referral


        });

        var file_new_name = (add_country.countryname).split(' ').join('_').toLowerCase() + '.gif';
        var file_upload_path = '/flags/' + file_new_name;
        add_country.flag_url = file_upload_path;

        add_country.save().then(() => {
            message = admin_messages.success_message_country_add;
            res.redirect('/country');
        }, (err) => {
            utils.error_response(err, res)
        });
    } else {
        res.redirect('/admin');
    }
};




exports.add_country_form = function (req, res) {
    var countryList = require('country-data').callingCountries;
    res.render('add_country_form', {country: countryList.all});
};

exports.edit_country_form = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        var id = req.body.id;
        Country.find({'_id': id}).then((country) => {
            res.render('add_country_form', {country_data: country});
        });
    } else {
        res.redirect('/admin');
    }
};

exports.update_country_detail = function (req, res) {
    var Country = require('mongoose').model('Country');
    var id = req.body.id;

    if (typeof req.session.userid != "undefined") {
        Country.findByIdAndUpdate(id, req.body).then((country) => {
            message = admin_messages.success_message_country_update;
            res.redirect('/country');
        });
    } else {
        res.redirect('/admin');
    }
};

exports.check_country_available = function (req, res) {
    var Country = require('mongoose').model('Country');
    if (typeof req.session.userid != 'undefined') {
        
        var countryname = req.body.countryname.replace(/'/g, '');
        var query = {};
        query['countryname'] = countryname;
       
        Country.count(query).then((country_list) => {
            if (country_list != 0) {
                res.json(1);
            } else {
                res.json(0);
            }
        });
    } else {
        res.redirect('/admin');
    }
};

exports.fetch_country_detail = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        var countriesAndTimezones = require('countries-and-timezones');
        var countryList = require('country-data').callingCountries;
        var lookup = require('country-data').lookup;
        var currencies = require('country-data').currencies;
        var getSymbolFromCurrency = require('currency-symbol-map').getSymbolFromCurrency;

        var countryname = req.body.countryname.replace(/'/g, '');

        var lookup = lookup.countries({name: countryname})[0];
        var currency = lookup.currencies;
        currency = currency[0];
        var currency_symbol = getSymbolFromCurrency(currency);
        var country_alpha2 = lookup.alpha2;
        var country_timezone = countriesAndTimezones.getTimezonesForCountry(country_alpha2);

        res.json({lookup: lookup, currency_symbol: currency_symbol, country_timezone: country_timezone});
    } else {
        res.redirect('/admin');
    }
};

exports.fetch_added_country_detail = function (req, res, next) {
    Country.findOne({"countryname": req.body.countryname}).then((country_detail) => {
        res.json({country_timezone:country_detail.country_all_timezone})
    });
}

