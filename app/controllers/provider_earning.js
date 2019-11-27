var utils = require('./utils');
var mongoose = require('mongoose');
var Schema = mongoose.Types.ObjectId;
var moment = require('moment-timezone');
var Provider = require('mongoose').model('Provider');
var Trip = require('mongoose').model('Trip');
var City = require('mongoose').model('City');
var Country = require('mongoose').model('Country');
var Provider_daily_analytic = require('mongoose').model('provider_daily_analytic');
var console = require('./console');
var utils = require('./utils');
// get_provider_daily_earning_detail
exports.get_provider_daily_earning_detail = function (req, res) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'},{name: 'date', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {

                        Country.findOne({_id: provider.country_id}).then((country) => {
                            var currency = "";
                            var currencycode = "";
                            if (country) {
                                currency = country.currencysign;
                                currencycode = country.currencycode;
                            }

                            var provider_id = Schema(req.body.provider_id);

                            var today = req.body.date;
                            if (today == '' || today == undefined || today == null) {
                                today = new Date();
                            } else {
                                today = new Date(today);
                            }

                            var complete_date_tag = moment(moment(today).startOf('day')).format(constant_json.DATE_FORMAT_MMM_D_YYYY);
                            var date_filter = {$match: {"complete_date_tag": {$eq: complete_date_tag}}};

                            var trip_condition = {'is_trip_completed': 1};
                            var trip_condition_new = {$and: [{'is_trip_cancelled_by_user': 1}, {'pay_to_provider': {$gt: 0}}]};
                            trip_condition = {$match: {$or: [trip_condition, trip_condition_new]}}

                            var provider_match_condition = {$match: {'provider_id': {$eq: provider_id}}};

                            var provider_daily_analytic_data = {};
                            var provider_daily_earning_data = {};
                            var provider_trips_data = [];

                            Provider_daily_analytic.findOne({
                                provider_id: provider_id,
                                date_tag: complete_date_tag
                            }).then((provider_daily_analytic) => {
                                if (provider_daily_analytic) {
                                    provider_daily_analytic_data = provider_daily_analytic;
                                }

                                var project_selection_data_from_trip = {
                                    $project: {
                                        _id: 0,
                                        unique_id: 1,
                                        provider_service_fees: 1,
                                        total: 1,
                                        payment_mode: 1,
                                        provider_have_cash: 1,
                                        pay_to_provider: 1,
                                        provider_income_set_in_wallet: 1
                                    }
                                };

                                Trip.aggregate([trip_condition, date_filter, provider_match_condition, project_selection_data_from_trip]).then((daily_trips) => {

                                    if (daily_trips.length == 0) {
                                        res.json({
                                            success: true,
                                            currency: currency,
                                            currencycode: currencycode,
                                            provider_daily_analytic: provider_daily_analytic_data,
                                            provider_daily_earning: provider_daily_earning_data,
                                            trips: provider_trips_data
                                        })
                                    } else {

                                        var group_trip_data_condition = {
                                            $group: {
                                                _id: null,
                                                total_distance: {$sum: '$total_distance'},
                                                total_time: {$sum: '$total_time'},
                                                total_waiting_time: {$sum: '$total_waiting_time'},
                                                total_service_surge_fees: {$sum: '$surge_fee'},
                                                service_total: {$sum: '$total_after_surge_fees'},

                                                total_provider_tax_fees: {$sum: '$provider_tax_fee'},
                                                total_provider_miscellaneous_fees: {$sum: '$provider_miscellaneous_fee'},
                                                total_toll_amount: {$sum: '$toll_amount'},
                                                total_tip_amount: {$sum: '$tip_amount'},
                                                total_provider_service_fees: {$sum: '$provider_service_fees'},

                                                total_provider_have_cash: {$sum: {'$cond': [{'$eq': ['$payment_mode', 1]}, '$cash_payment', 0]}},
                                                total_deduct_wallet_amount: {
                                                    $sum: {
                                                        '$cond': [{
                                                            '$eq': ['$is_provider_earning_set_in_wallet', true],
                                                            '$eq': ['$payment_mode', 1]
                                                        }, '$provider_income_set_in_wallet', 0]
                                                    }
                                                },
                                                total_added_wallet_amount: {
                                                    $sum: {
                                                        '$cond': [{
                                                            '$eq': ['$is_provider_earning_set_in_wallet', true],
                                                            '$eq': ['$payment_mode', 0]
                                                        }, '$provider_income_set_in_wallet', 0]
                                                    }
                                                },
                                                total_paid_in_wallet_payment: {$sum: {'$cond': [{'$eq': ['$is_provider_earning_set_in_wallet', true]}, '$provider_income_set_in_wallet', 0]}},

                                                total_transferred_amount: {$sum: {'$cond': [{$and: [{'$eq': ['$is_provider_earning_set_in_wallet', false]}, {'$eq': ['$is_transfered', true]}]}, '$pay_to_provider', 0]}},
                                                total_pay_to_provider: {$sum: {'$cond': [{$and: [{'$eq': ['$is_provider_earning_set_in_wallet', false]}, {'$eq': ['$is_transfered', false]}]}, '$pay_to_provider', 0]}},

                                                currency: {$first: '$currency'},
                                                unit: {$first: '$unit'},
                                                statement_number: {$first: '$invoice_number'},

                                            }
                                        }

                                        Trip.aggregate([trip_condition, date_filter, provider_match_condition, group_trip_data_condition]).then((trips) => {
                                            if (trips.length == 0) {
                                                res.json({success: false, error_code: error_message.ERROR_CODE_EARNING_NOT_FOUND})
                                            } else {
                                                provider_daily_earning_data = trips[0];
                                                res.json({
                                                    success: true,
                                                    currency: currency,
                                                    currencycode: currencycode,
                                                    provider_daily_analytic: provider_daily_analytic_data,
                                                    provider_daily_earning: provider_daily_earning_data,
                                                    trips: daily_trips
                                                });
                                            }
                                        }, (err) => {
                                            console.log(err)
                                            res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                                        });
                                    }
                                }, (err) => {
                                    console.log(err)
                                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                                });
                            });
                        });
                    }
                }
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });

};


// get_provider_weekly_earning_detail
exports.get_provider_weekly_earning_detail = function (req, res) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'},{name: 'date', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        var country_id = provider.country_id;
                        var city_id = provider.cityid;
                        City.findOne({_id: city_id}).then((city) => {
                            if (city) {
                                country_id = city.countryid;
                                Country.findOne({_id: country_id}).then((country) => {
                                    if (country) {
                                        var currency = country.currencysign;
                                        var currencycode = country.currencycode;
                                        var provider_id = Schema(req.body.provider_id);
                                        var today = req.body.date;
                                        if (today == '' || today == undefined || today == null) {
                                            today = new Date();
                                        } else {
                                            today = new Date(today);
                                        }

                                        var start_date_view = today;
                                        var week_start_date_time = today;
                                        var trip_condition = {'is_trip_completed': 1};
                                        var trip_condition_new = {$and: [{'is_trip_cancelled_by_user': 1}, {'pay_to_provider': {$gt: 0}}]};
                                        trip_condition = {$match: {$or: [trip_condition, trip_condition_new]}}
                                        var provider_match_condition = {$match: {'provider_id': {$eq: provider_id}}};

                                        var provider_daily_analytic_data = [];
                                        for (var i = 0; i < 7; i++) {
                                            provider_daily_analytic_data.push(moment(today).format(constant_json.DATE_FORMAT_MMM_D_YYYY));
                                            today = moment(today).add(1, 'days');
                                        }
                                        var provider_daily_analytic_query = {$match: {date_tag: {$in: provider_daily_analytic_data}}};
                                        var date_filter = {$match: {complete_date_tag: {$in: provider_daily_analytic_data}}};

                                        var group_analytic_data_condition = {
                                            $group: {
                                                _id: null,
                                                received: {$sum: '$received'},
                                                accepted: {$sum: '$accepted'},
                                                rejected: {$sum: '$rejected'},
                                                not_answered: {$sum: '$not_answered'},
                                                cancelled: {$sum: '$cancelled'},
                                                completed: {$sum: '$completed'},
                                                acception_ratio: {$sum: '$acception_ratio'},
                                                rejection_ratio: {$sum: '$rejection_ratio'},
                                                cancellation_ratio: {$sum: '$cancellation_ratio'},
                                                completed_ratio: {$sum: '$completed_ratio'},

                                                total_online_time: {$sum: '$total_online_time'}
                                            }
                                        }

                                        Provider_daily_analytic.aggregate([provider_match_condition, provider_daily_analytic_query, group_analytic_data_condition]).then((provider_daily_analytic) => {
                                            var provider_weekly_analytic_data = {};

                                            if (provider_daily_analytic.length > 0) {
                                                provider_weekly_analytic_data = provider_daily_analytic[0];
                                                if ((Number(provider_weekly_analytic_data.received)) > 0) {
                                                    received = provider_weekly_analytic_data.received;
                                                    provider_weekly_analytic_data.acception_ratio = utils.precisionRoundTwo(Number((provider_weekly_analytic_data.accepted * 100) / received));
                                                    provider_weekly_analytic_data.cancellation_ratio = utils.precisionRoundTwo(Number((provider_weekly_analytic_data.cancelled * 100) / received));
                                                    provider_weekly_analytic_data.completed_ratio = utils.precisionRoundTwo(Number((provider_weekly_analytic_data.completed * 100) / received));
                                                    provider_weekly_analytic_data.rejection_ratio = utils.precisionRoundTwo(Number((provider_weekly_analytic_data.rejected * 100) / received));
                                                }
                                            }


                                            var provider_weekly_earning_data = {};
                                            var daily_condition = {
                                                $group: {
                                                    _id: null,
                                                    date1: {$sum: {$cond: [{$eq: ["$complete_date_tag", moment(new Date(moment(week_start_date_time).add(0, 'days'))).format(constant_json.DATE_FORMAT_MMM_D_YYYY)]}, '$provider_service_fees', 0]}},
                                                    date2: {$sum: {$cond: [{$eq: ["$complete_date_tag", moment(new Date(moment(week_start_date_time).add(1, 'days'))).format(constant_json.DATE_FORMAT_MMM_D_YYYY)]}, '$provider_service_fees', 0]}},
                                                    date3: {$sum: {$cond: [{$eq: ["$complete_date_tag", moment(new Date(moment(week_start_date_time).add(2, 'days'))).format(constant_json.DATE_FORMAT_MMM_D_YYYY)]}, '$provider_service_fees', 0]}},
                                                    date4: {$sum: {$cond: [{$eq: ["$complete_date_tag", moment(new Date(moment(week_start_date_time).add(3, 'days'))).format(constant_json.DATE_FORMAT_MMM_D_YYYY)]}, '$provider_service_fees', 0]}},
                                                    date5: {$sum: {$cond: [{$eq: ["$complete_date_tag", moment(new Date(moment(week_start_date_time).add(4, 'days'))).format(constant_json.DATE_FORMAT_MMM_D_YYYY)]}, '$provider_service_fees', 0]}},
                                                    date6: {$sum: {$cond: [{$eq: ["$complete_date_tag", moment(new Date(moment(week_start_date_time).add(5, 'days'))).format(constant_json.DATE_FORMAT_MMM_D_YYYY)]}, '$provider_service_fees', 0]}},
                                                    date7: {$sum: {$cond: [{$eq: ["$complete_date_tag", moment(new Date(moment(week_start_date_time).add(6, 'days'))).format(constant_json.DATE_FORMAT_MMM_D_YYYY)]}, '$provider_service_fees', 0]}}
                                                }

                                            }
                                            var date = {
                                                date1: new Date(moment(start_date_view)),
                                                date2: new Date(moment(start_date_view).add(1, 'days')),
                                                date3: new Date(moment(start_date_view).add(2, 'days')),
                                                date4: new Date(moment(start_date_view).add(3, 'days')),
                                                date5: new Date(moment(start_date_view).add(4, 'days')),
                                                date6: new Date(moment(start_date_view).add(5, 'days')),
                                                date7: new Date(moment(start_date_view).add(6, 'days'))

                                            }

                                            Trip.aggregate([trip_condition, date_filter, provider_match_condition, daily_condition]).then((daily_trips) => {

                                                if (daily_trips.length == 0) {
                                                    res.json({
                                                        success: true,
                                                        currency: currency,
                                                        currencycode: currencycode,
                                                        provider_weekly_analytic: provider_weekly_analytic_data,
                                                        provider_weekly_earning: provider_weekly_earning_data,
                                                        date: date,
                                                        trip_day_total: {}
                                                    })
                                                } else {
                                                    var group_trip_data_condition = {
                                                        $group: {
                                                            _id: null,
                                                            total_distance: {$sum: '$total_distance'},
                                                            total_time: {$sum: '$total_time'},
                                                            total_waiting_time: {$sum: '$total_waiting_time'},
                                                            total_service_surge_fees: {$sum: '$surge_fee'},
                                                            service_total: {$sum: '$total_after_surge_fees'},

                                                            total_provider_tax_fees: {$sum: '$provider_tax_fee'},
                                                            total_provider_miscellaneous_fees: {$sum: '$provider_miscellaneous_fee'},
                                                            total_toll_amount: {$sum: '$toll_amount'},
                                                            total_tip_amount: {$sum: '$tip_amount'},

                                                            total_provider_service_fees: {$sum: '$provider_service_fees'},
                                                            total_provider_have_cash: {$sum: {'$cond': [{'$eq': ['$payment_mode', 1]}, '$cash_payment', 0]}},
                                                            total_deduct_wallet_amount: {
                                                                $sum: {
                                                                    '$cond': [{
                                                                        '$eq': ['$is_provider_earning_set_in_wallet', true],
                                                                        '$eq': ['$payment_mode', 1]
                                                                    }, '$provider_income_set_in_wallet', 0]
                                                                }
                                                            },
                                                            total_added_wallet_amount: {
                                                                $sum: {
                                                                    '$cond': [{
                                                                        '$eq': ['$is_provider_earning_set_in_wallet', true],
                                                                        '$eq': ['$payment_mode', 0]
                                                                    }, '$provider_income_set_in_wallet', 0]
                                                                }
                                                            },
                                                            total_paid_in_wallet_payment: {$sum: {'$cond': [{'$eq': ['$is_provider_earning_set_in_wallet', true]}, '$provider_income_set_in_wallet', 0]}},
                                                            total_pay_to_provider: {$sum: {'$cond': [{'$eq': ['$is_provider_earning_set_in_wallet', false]}, '$pay_to_provider', 0]}},

                                                            currency: {$first: '$currency'},
                                                            unit: {$first: '$unit'},
                                                            statement_number: {$first: '$invoice_number'},

                                                        }
                                                    }

                                                    Trip.aggregate([trip_condition, date_filter, provider_match_condition, group_trip_data_condition]).then((trips) => {

                                                        if (trips.length == 0) {
                                                            res.json({
                                                                success: false,
                                                                error_code: error_message.ERROR_CODE_EARNING_NOT_FOUND
                                                            })
                                                        } else {
                                                            provider_weekly_earning_data = trips[0];
                                                            res.json({
                                                                success: true,
                                                                currency: currency,
                                                                currencycode: currencycode,
                                                                provider_weekly_analytic: provider_weekly_analytic_data,
                                                                provider_weekly_earning: provider_weekly_earning_data,
                                                                date: date,
                                                                trip_day_total: daily_trips[0]
                                                            });
                                                        }
                                                    }, (err) => {
                                                        console.log(err)
                                                        res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                                                    });

                                                }
                                            }, (err) => {
                                                console.log(err)
                                                res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                                            });
                                        });
                                    }
                                });


                            } else {
                                res.json({success: false, error_code: error_message.ERROR_CODE_EARNING_NOT_FOUND});

                            }
                        });

                    }
                }
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });

};