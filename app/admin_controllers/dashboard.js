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
var User = require('mongoose').model('User');
var Partner = require('mongoose').model('Partner');
var Providers = require('mongoose').model('Provider');
var Country = require('mongoose').model('Country');
var Trip = require('mongoose').model('Trip');
var City_type = require('mongoose').model('city_type');
var console = require('../controllers/console');

exports.index = function (req, res) {
    var array = [];

    array['total_users'] = 0;
    array['total_providers'] = 0;
    array['total_countries'] = 0;
    array['total_cities'] = 0;

    array['total_trips'] = 0;
    array['total_trips_completed'] = 0;
    array['cancelled_by_user'] = 0;
    array['cancelled_by_provider'] = 0;
    array['is_trip_cancelled'] = 0;
    array['running'] = 0;

    array['Total_payment'] = 0;
    array['total_card_payment'] = 0;
    array['total_cash_payment'] = 0;
    array['total_referral_payment'] = 0;
    array['total_promo_payment'] = 0;
    array['total_wallet_payment'] = 0;
    array['total_remaining_payment'] = 0;

    array['total_card_payment_per'] = 0;
    array['total_cash_payment_per'] = 0;
    array['total_referral_payment_per'] = 0;
    array['total_promo_payment_per'] = 0;
    array['total_wallet_payment_per'] = 0;
    array['total_remaining_payment_per'] = 0;

    array['total_admin_earning'] = 0;
    array['total_provider_earning'] = 0;

    if (typeof req.session.userid != "undefined") {

        User.count({}, function (err, total_user) {
            if (err) {
                console.log(err);
            } else {
                array['total_users'] = total_user;
            }
        });

        Providers.count({}, function (err, total_provider) {
            if (err) {

                console.log(err);
            } else {
                array['total_providers'] = total_provider;
            }
        });

        Country.count({}, function (err, total_countries) {
            if (err) {
                console.log(err);
            } else {
                array['total_countries'] = total_countries;
            }
        });

        City.count({}, function (err, total_cities) {
            if (err) {
                console.log(err);
            } else {
                array['total_cities'] = total_cities;
            }
        });

        Trip.aggregate([
            {
                $group: {
                    _id: null,
                    completed: {$sum: {$cond: [{$eq: ["$is_trip_completed", 1]}, 1, 0]}},
                    canclled_by_user: {$sum: {$cond: [{$eq: ["$is_trip_cancelled_by_user", 1]}, 1, 0]}},
                    cancelled_by_provider: {$sum: {$cond: [{$eq: ["$is_trip_cancelled_by_provider", 1]}, 1, 0]}},
                    cancelled: {$sum: {$cond: [{$and: [{$eq: ["$is_trip_cancelled", 1]},
                                        {$eq: ["$is_trip_cancelled_by_user", 0]},
                                        {$eq: ["$is_trip_cancelled_by_provider", 0]}]}, 1, 0]}},
                    running: {$sum: {$cond: [{$and: [{$eq: ["$is_trip_cancelled", 0]},
                                        {$eq: ["$is_trip_completed", 0]}]}, 1, 0]}}
                },
            }], function (err, total) {

            if (err) {
                console.log(err);
            } else {
                if (total.length !== 0)
                {
                    array['total_trips_completed'] = total[0].completed;
                    array['cancelled_by_user'] = total[0].canclled_by_user;
                    array['cancelled_by_provider'] = total[0].cancelled_by_provider;
                    array['is_trip_cancelled'] = total[0].cancelled;
                    array['running'] = total[0].running;
                }
            }
        });

        Trip.count({}, function (err, total_trips) {
            if (err) {
                console.log(err);
            } else {

                array['total_trips'] = total_trips;

                if (total_trips != constant_json.ZERO) {

                    var query = {$group: {_id: null, total: {$sum: '$total_in_admin_currency'},
                            card_payment: {$sum: {$multiply: ['$card_payment', '$current_rate']}},
                            cash_payment: {$sum: {$multiply: ['$cash_payment', '$current_rate']}},
                            wallet_payment: {$sum: {$multiply: ['$wallet_payment', '$current_rate']}},
                            referral_payment: {$sum: {$multiply: ['$referral_payment', '$current_rate']}},
                            promo_payment: {$sum: {$multiply: ['$promo_payment', '$current_rate']}},
                            remaining_payment: {$sum: {$multiply: ['$remaining_payment', '$current_rate']}},
                            admin_earning: {$sum: {$subtract: ['$total_in_admin_currency', '$provider_service_fees_in_admin_currency']}},
                            provider_earning: {$sum: '$provider_service_fees_in_admin_currency'}
                        }};

                    Trip.aggregate([query], function (err, result) {
                        if (err) {
                            console.log(err);
                        } else {
                            if (result.length !== 0)
                            {
                                var total = result[0].total;


                                var total_card_payment = result[0].card_payment;
                                var total_cash_payment = result[0].cash_payment;
                                var total_wallet_payment = result[0].wallet_payment;
                                var total_referral_payment = result[0].referral_payment;
                                var total_promo_payment = result[0].promo_payment;
                                var total_admin_earning = result[0].admin_earning;
                                var total_provider_earning = result[0].provider_earning;
                                var total_remaining_payment = result[0].remaining_payment;

                                array['total_card_payment'] = total_card_payment;
                                array['total_cash_payment'] = total_cash_payment;
                                array['total_wallet_payment'] = total_wallet_payment;
                                array['total_referral_payment'] = total_referral_payment;
                                array['total_promo_payment'] = total_promo_payment;
                                array['total_remaining_payment'] = total_remaining_payment;
                                array['total_admin_earning'] = total_admin_earning;
                                array['total_provider_earning'] = total_provider_earning;

                                array['Total_payment'] = total + total_promo_payment + total_referral_payment;

                                var total_card_payment_per = total_card_payment * 100 / total;
                                var total_cash_payment_per = total_cash_payment * 100 / total;
                                var total_wallet_payment_per = total_wallet_payment * 100 / total;
                                var total_referral_payment_per = total_referral_payment * 100 / total;
                                var total_promo_payment_per = total_promo_payment * 100 / total;
                                var total_remaining_payment_per = total_remaining_payment * 100 / total;


                                array['total_card_payment_per'] = total_card_payment_per;
                                array['total_cash_payment_per'] = total_cash_payment_per;
                                array['total_wallet_payment_per'] = total_wallet_payment_per;
                                array['total_referral_payment_per'] = total_referral_payment_per;
                                array['total_promo_payment_per'] = total_promo_payment_per;
                                array['total_remaining_payment_per'] = total_remaining_payment_per;
                                res.render('dashboard', {detail: array});
                                delete message;
                            } else
                            {
                                res.render('dashboard', {detail: array});
                                delete message;
                            }
                        }
                    });
                } else
                {
                    res.render('dashboard', {detail: array})
                    delete message;
                }


            }
        });

    } else {
        res.redirect('/admin');
    }
}

exports.app_version_chart = function (req, res) {

    Settings.findOne({}, function (err, setting_data) {
        if (setting_data)
        {
            var array = [setting_data.android_provider_app_version_code, setting_data.android_user_app_version_code, setting_data.ios_provider_app_version_code, setting_data.ios_user_app_version_code]
            array.sort();
            var first = array[0];
            first = first.replace('.', '');
            first = first.replace('.', '');
            var last = array[array.length - 1]
            last = last.replace('.', '');
            last = last.replace('.', '');

            var version_array = [];

            if (first.length < 3)
            {
                var first_diff = 3 - first.length
                for (var i = 0; i < first_diff; i++)
                {
                    first = first + '0';
                }
            }
            if (last.length < 3)
            {
                var last_diff = 3 - first.length
                for (var i = 0; i < last_diff; i++)
                {
                    last = last + '0';
                }
            }

            first = parseInt(first)
            last = parseInt(last)
            version_array.push({'version': '<', 'total_android_user': 0, 'total_android_provider': 0, 'total_ios_user': 0, 'total_ios_provider': 0})

            for (var i = first; i <= last; i++)
            {
                i = i.toString();
                var version = i[0] + '.' + i[1] + '.' + i[2];
                version_array.push({'version': version, 'total_android_user': 0, 'total_android_provider': 0, 'total_ios_user': 0, 'total_ios_provider': 0})
            }
            User.find({}, function (err, user_detail) {
                user_detail.forEach(function (user_data) {
                    var a = version_array.findIndex(x => x.version == user_data.app_version);
                    if (a == -1)
                    {
                        if (user_data.device_type == 'android')
                        {
                            version_array[0].total_android_user++;
                        } else if (user_data.device_type == 'ios')
                        {
                            version_array[0].total_ios_user++;
                        }
                    } else
                    {
                        if (user_data.device_type == 'android')
                        {
                            version_array[a].total_android_user++;
                        } else if (user_data.device_type == 'ios')
                        {
                            version_array[a].total_ios_user++;
                        }
                    }
                })
            })
            Providers.find({}, function (err, provider_detail) {
                provider_detail.forEach(function (provider_data) {
                    var a = version_array.findIndex(x => x.version == provider_data.app_version);
                    if (a == -1)
                    {
                        if (provider_data.device_type == 'android')
                        {
                            version_array[0].total_android_provider++;
                        } else if (provider_data.device_type == 'ios')
                        {
                            version_array[0].total_ios_provider++;
                        }
                    } else
                    {
                        if (provider_data.device_type == 'android')
                        {
                            version_array[a].total_android_provider++;
                        } else if (provider_data.device_type == 'ios')
                        {
                            version_array[a].total_ios_provider++;
                        }
                    }
                })
            });
            setTimeout(function () {
                if (version_array.length == 1)
                {
                    version_array[0].version = '<' + '1.0.0'
                } else
                {
                    version_array[0].version = '<' + version_array[1].version
                }

                res.json(version_array)
            }, 3000);
        } else
        {
            res.json(false)
        }
    })
};

exports.monthly_registration_chart = function (req, res) {
    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var current_date = new Date(Date.now());
    var current_month = current_date.getMonth() + 1;
    var current_year = current_date.getFullYear();
    var last_six_month_array = [];

    var month1_data = {};
    var month2_data = {};
    var month3_data = {};
    var month4_data = {};
    var month5_data = {};
    var month6_data = {};

    var array_month = [];
    for (var i = 6; i > 0; i--) {
        var firstDay = new Date(current_year, current_month - i, 1);
        var lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0);

        var month_name = monthNames[firstDay.getMonth()]
        array_month.push({'firstDay': firstDay, 'lastDay': lastDay, 'month_name': month_name})

        if (array_month.length == 6)
        {
            month1_data['month_name'] = array_month[0].month_name
            month2_data['month_name'] = array_month[1].month_name
            month3_data['month_name'] = array_month[2].month_name
            month4_data['month_name'] = array_month[3].month_name
            month5_data['month_name'] = array_month[4].month_name
            month6_data['month_name'] = array_month[5].month_name
            User.aggregate([
                {
                    $group: {
                        _id: null,
                        month1_user: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[0].firstDay]}, {$lt: ["$created_at", array_month[0].lastDay]}]}, 1, 0]}},
                        month2_user: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[1].firstDay]}, {$lt: ["$created_at", array_month[1].lastDay]}]}, 1, 0]}},
                        month3_user: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[2].firstDay]}, {$lt: ["$created_at", array_month[2].lastDay]}]}, 1, 0]}},
                        month4_user: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[3].firstDay]}, {$lt: ["$created_at", array_month[3].lastDay]}]}, 1, 0]}},
                        month5_user: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[4].firstDay]}, {$lt: ["$created_at", array_month[4].lastDay]}]}, 1, 0]}},
                        month6_user: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[5].firstDay]}, {$lt: ["$created_at", array_month[5].lastDay]}]}, 1, 0]}},
                    }
                }], function (err, total_user) {

                if (err) {
                    console.log(err);
                } else {
                    if (total_user.length != 0)
                    {
                        month1_data['user'] = total_user[0].month1_user
                        month2_data['user'] = total_user[0].month2_user
                        month3_data['user'] = total_user[0].month3_user
                        month4_data['user'] = total_user[0].month4_user
                        month5_data['user'] = total_user[0].month5_user
                        month6_data['user'] = total_user[0].month6_user
                    }
                }
            });


            Providers.aggregate([
                {
                    $group: {
                        _id: null,
                        month1_provider: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[0].firstDay]}, {$lt: ["$created_at", array_month[0].lastDay]}]}, 1, 0]}},
                        month2_provider: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[1].firstDay]}, {$lt: ["$created_at", array_month[1].lastDay]}]}, 1, 0]}},
                        month3_provider: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[2].firstDay]}, {$lt: ["$created_at", array_month[2].lastDay]}]}, 1, 0]}},
                        month4_provider: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[3].firstDay]}, {$lt: ["$created_at", array_month[3].lastDay]}]}, 1, 0]}},
                        month5_provider: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[4].firstDay]}, {$lt: ["$created_at", array_month[4].lastDay]}]}, 1, 0]}},
                        month6_provider: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[5].firstDay]}, {$lt: ["$created_at", array_month[5].lastDay]}]}, 1, 0]}},
                    }
                }], function (err, total_provider) {

                if (err) {
                    console.log(err);
                } else {
                    if (total_provider.length != 0)
                    {
                        month1_data['provider'] = total_provider[0].month1_provider
                        month2_data['provider'] = total_provider[0].month2_provider
                        month3_data['provider'] = total_provider[0].month3_provider
                        month4_data['provider'] = total_provider[0].month4_provider
                        month5_data['provider'] = total_provider[0].month5_provider
                        month6_data['provider'] = total_provider[0].month6_provider
                    }
                }
            });

            Country.aggregate([
                {
                    $group: {
                        _id: null,
                        month1_country: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[0].firstDay]}, {$lt: ["$created_at", array_month[0].lastDay]}]}, 1, 0]}},
                        month2_country: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[1].firstDay]}, {$lt: ["$created_at", array_month[1].lastDay]}]}, 1, 0]}},
                        month3_country: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[2].firstDay]}, {$lt: ["$created_at", array_month[2].lastDay]}]}, 1, 0]}},
                        month4_country: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[3].firstDay]}, {$lt: ["$created_at", array_month[3].lastDay]}]}, 1, 0]}},
                        month5_country: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[4].firstDay]}, {$lt: ["$created_at", array_month[4].lastDay]}]}, 1, 0]}},
                        month6_country: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[5].firstDay]}, {$lt: ["$created_at", array_month[5].lastDay]}]}, 1, 0]}},
                    }
                }], function (err, total_country) {

                if (err) {
                    console.log(err);
                } else {
                    if (total_country.length != 0)
                    {
                        month1_data['country'] = total_country[0].month1_country
                        month2_data['country'] = total_country[0].month2_country
                        month3_data['country'] = total_country[0].month3_country
                        month4_data['country'] = total_country[0].month4_country
                        month5_data['country'] = total_country[0].month5_country
                        month6_data['country'] = total_country[0].month6_country
                    }
                }
            });

            City.aggregate([
                {
                    $group: {
                        _id: null,
                        month1_city: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[0].firstDay]}, {$lt: ["$created_at", array_month[0].lastDay]}]}, 1, 0]}},
                        month2_city: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[1].firstDay]}, {$lt: ["$created_at", array_month[1].lastDay]}]}, 1, 0]}},
                        month3_city: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[2].firstDay]}, {$lt: ["$created_at", array_month[2].lastDay]}]}, 1, 0]}},
                        month4_city: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[3].firstDay]}, {$lt: ["$created_at", array_month[3].lastDay]}]}, 1, 0]}},
                        month5_city: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[4].firstDay]}, {$lt: ["$created_at", array_month[4].lastDay]}]}, 1, 0]}},
                        month6_city: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[5].firstDay]}, {$lt: ["$created_at", array_month[5].lastDay]}]}, 1, 0]}},
                    }
                }], function (err, total_city) {

                if (err) {
                    console.log(err);
                } else {
                    if (total_city.length != 0)
                    {
                        month1_data['city'] = total_city[0].month1_city
                        month2_data['city'] = total_city[0].month2_city
                        month3_data['city'] = total_city[0].month3_city
                        month4_data['city'] = total_city[0].month4_city
                        month5_data['city'] = total_city[0].month5_city
                        month6_data['city'] = total_city[0].month6_city
                    }
                    Partner.aggregate([
                        {
                            $group: {
                                _id: null,
                                month1_partner: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[0].firstDay]}, {$lt: ["$created_at", array_month[0].lastDay]}]}, 1, 0]}},
                                month2_partner: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[1].firstDay]}, {$lt: ["$created_at", array_month[1].lastDay]}]}, 1, 0]}},
                                month3_partner: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[2].firstDay]}, {$lt: ["$created_at", array_month[2].lastDay]}]}, 1, 0]}},
                                month4_partner: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[3].firstDay]}, {$lt: ["$created_at", array_month[3].lastDay]}]}, 1, 0]}},
                                month5_partner: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[4].firstDay]}, {$lt: ["$created_at", array_month[4].lastDay]}]}, 1, 0]}},
                                month6_partner: {$sum: {$cond: [{$and: [{$gte: ["$created_at", array_month[5].firstDay]}, {$lt: ["$created_at", array_month[5].lastDay]}]}, 1, 0]}},
                            }
                        }], function (err, total_partner) {

                        if (err) {
                            console.log(err);
                        } else {
                            if (total_partner.length != 0)
                            {
                                month1_data['partner'] = total_partner[0].month1_partner
                                month2_data['partner'] = total_partner[0].month2_partner
                                month3_data['partner'] = total_partner[0].month3_partner
                                month4_data['partner'] = total_partner[0].month4_partner
                                month5_data['partner'] = total_partner[0].month5_partner
                                month6_data['partner'] = total_partner[0].month6_partner
                            }

                            last_six_month_array[0] = month1_data
                            last_six_month_array[1] = month2_data
                            last_six_month_array[2] = month3_data
                            last_six_month_array[3] = month4_data
                            last_six_month_array[4] = month5_data
                            last_six_month_array[5] = month6_data
                            if (last_six_month_array.length == 6)
                            {
                                setTimeout(function () {
                                    res.json(last_six_month_array);
                                }, 1000);

                            }
                        }
                    });
                }
            });

        }
    }
}

exports.country_total_chart = function (req, res) {
    var country_array = []
    // Trip.find({}, function (err, trip_detail) {
    //     var i = 0;

    //         var lookup = {
    //             $lookup:
    //                     {
    //                         from: "countries",
    //                         localField: "countryid",
    //                         foreignField: "_id",
    //                         as: "country_detail"
    //                     }
    //         };
    //         var unwind = {$unwind: "$country_detail"};

    //         var mongoose = require('mongoose');
    //         var Schema = mongoose.Types.ObjectId;
    //         var condition = {"$match": {'_id': {$eq: Schema(trip_data.service_type_id)}}};

    //         City_type.aggregate([condition, lookup, unwind], function (err, array) {
    //             if (array.length != 0)
    //             {
    //                 var a = country_array.findIndex(x => x.countryname == array[0].country_detail.countryname);
    //                 if (a == -1)
    //                 {
    //                     country_array.push({'countryname': array[0].country_detail.countryname, 'total': trip_data.total_in_admin_currency});
    //                 } else
    //                 {
    //                     country_array[a].total = country_array[a].total + trip_data.total_in_admin_currency;
    //                 }
    //                 i++;
    //             } else
    //             {
    //                 i++;
    //             }
    //             if (i == trip_detail.length)
    //             {
    //                 function sort_country_array(a, b) {
    //                     if (a.countryname < b.countryname)
    //                         return -1;
    //                     if (a.countryname > b.countryname)
    //                         return 1;
    //                     return 0;
    //                 }
    //                 country_array.sort(sort_country_array);

    //                 setTimeout(function () {
                        res.json([]);
    //                 }, 1000);
    //             }

    //         });


    // });
};

