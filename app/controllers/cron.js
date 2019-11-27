var utils = require('./utils');
var myTrips = require('./trip');
var allemails = require('../controllers/emails');
var Trip = require('mongoose').model('Trip');
var Trip_Service = require('mongoose').model('trip_service');
var User = require('mongoose').model('User');
var Provider = require('mongoose').model('Provider');
var Citytype = require('mongoose').model('city_type');
var Card = require('mongoose').model('Card');
//var Provider_Earning = require('mongoose').model('Provider_Earning');
var ProviderDailyEarning = require('mongoose').model('provider_daily_earning');
var ProviderWeeklyEarning = require('mongoose').model('provider_weekly_earning');
var Settings = require('mongoose').model('Settings');
var Partner = require('mongoose').model('Partner');
var PartnerWeeklyEarning = require('mongoose').model('partner_weekly_earning');
var Provider_Document = require('mongoose').model('Provider_Document');
var User_Document = require('mongoose').model('User_Document');
var schedule = require('node-schedule');
var moment = require('moment');
var url = require('url');
var pad = require('pad-left');
var City = require('mongoose').model('City');
var Country = require('mongoose').model('Country');
var Provider_Vehicle_Document = require('mongoose').model('Provider_Vehicle_Document');
var cron = require('./cron');
var myAnalytics = require('./provider_analytics');
var req = require("request");
var Transfer_History = require('mongoose').model('transfer_history');
var utils = require('./utils');
var config = require('../../config/config');
var redis = require('redis').createClient(config.redis || {});
var CronJob = require('cron-cluster')(redis).CronJob

// var run_continue_30_sec_cron = schedule.scheduleJob('*/30 * * * * *', function () {
var run_continue_30_sec_cron = new CronJob('*/30 * * * * *', function () {
    var now = new Date();
    var date1 = new Date();
    date1.setSeconds(date1.getSeconds() - 30);
    Trip.find({
        is_tip: true,
        provider_trip_end_time: {"$lte": date1},
        is_trip_end: 0,
        is_provider_status: 9
    }).then((trips) => {
        var request = require("request");
        trips.forEach(function (trip_detail) {
            myTrips.pay_payment({body: {trip_id: trip_detail._id}}, null, trip_detail._id);
        });
    }, (err) => {
        console.log(err)
    });


    var scheduled_request_pre_start_minute = setting_detail.scheduled_request_pre_start_minute;
    var scheduled_request_start_time = now.setMinutes(now.getMinutes() + scheduled_request_pre_start_minute);
    scheduled_request_start_time = new Date(scheduled_request_start_time);
    //console.log("scheduled_request_start_time : " + scheduled_request_start_time)
    Trip.find({
        is_schedule_trip: true,
        is_trip_cancelled: 0,
        is_trip_completed: 0,
        is_trip_end: 0,
        provider_id: null,
        current_providers: [],
        server_start_time_for_schedule: {$lte: scheduled_request_start_time}
    }).then((scheduledTrips) => {
        scheduledTrips.forEach(function (scheduledTrip) {
            User.findOne({_id: scheduledTrip.user_id, current_trip_id: null}).then((user) => {
                //console.log("create_scheduled_trip");
                if(user){
                    create_scheduled_trip(scheduledTrip);
                }
            }, (err) => {
                console.log(err)
            });
        });
    }, (err) => {
        console.log(err)
    });


    Settings.findOne({}).then((setting_data) => {
        var provider_timeout = setting_data.provider_timeout;
        var total_timeout = provider_timeout + 7;
        var default_Search_radious = setting_data.default_Search_radious;

        Trip.find({is_provider_status: 0, is_provider_accepted: 0, is_trip_cancelled: 0}).then((trips) => {
            trips.forEach(function (trip) {
                check_provider(trip, total_timeout, default_Search_radious)
            });
        }, (err) => {
            console.log(err)
        });
    });


    Provider.find({is_active: 1, is_trip: {$ne: []}}).then((providers) => {
        providers.forEach(function (provider) {
            check_provider_trip(provider)
        });
    }, (err) => {
        console.log(err)
    });

    Provider.find({is_active: 1, is_trip: []}).then((providers) => {
        providers.forEach(function (provider) {
            check_provider_online(provider);
        });
    }, (err) => {
        console.log(err)
    });

});
run_continue_30_sec_cron.start();

function check_provider_trip(provider){
    Trip.findOne({_id: provider.is_trip[0]}).then((trip) => {
        if (trip && (trip.is_trip_completed == 1 || trip.is_trip_cancelled == 1)) {

            provider.is_trip = [];
            provider.is_available = 1;
            provider.save();
        }
    }, (err) => {
        console.log(err)
    });
}

function check_provider_online(provider){
    City.findOne({_id: provider.cityid}).then((city) => {
        var city_timezone = city.timezone;

        Trip.findOne({is_provider_status: 0, current_providers: provider._id}).then((trip) => {

            var is_offline = 0;
            if (trip) {
                if (trip.is_trip_completed == 1 || trip.is_trip_cancelled == 1) {
                    is_offline = 1;
                } else {
                    is_offline = 0;
                }
            } else {
                is_offline = 1;
            }


            if (is_offline == 1) {
                var moment = require('moment');
                var end_time = new Date();
                var start_time = provider.location_updated_time;
                var time_diff = utils.getTimeDifferenceInMinute(end_time, start_time);

                if (time_diff > setting_detail.provider_offline_min) {
                    provider.is_active = 0;
                    provider.save();
                    // Start push Added by Bharti 2 May //
                    var push_message = "You Are Offline Now, For recieve new Trip you have to Online from App.";
                    var device_token = provider.device_token;
                    var device_type = provider.device_type;
                    utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_LOGOUT_ANOTHER_DEVICE, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                    // End push Added by Bharti 2 May //

                    // Entry in daily analytic //
                    myAnalytics.insert_daily_provider_analytics(city_timezone, provider._id, 0, start_time);
                }
            } else {
                //console.log("tripid:"+trip.unique_id)
            }
        }, (err) => {
            console.log(err)
        });
    }, (err) => {
        console.log(err)

    });
}

function check_provider(trip, total_timeout, default_Search_radious){
    console.log('check_provider')
    var city_id = trip.city_id;
    City.findOne({_id: city_id}).then((city_detail) => {
        if (city_detail) {
            var city_timezone = city_detail.timezone;
            var is_check_provider_wallet_amount_for_received_cash_request = city_detail.is_check_provider_wallet_amount_for_received_cash_request;
            var provider_min_wallet_amount_set_for_received_cash_request = city_detail.provider_min_wallet_amount_set_for_received_cash_request;

            var start_time = trip.find_nearest_provider_time;
            var end_time = new Date();
            var time_diff = utils.getTimeDifferenceInSecond(end_time, start_time);

            if (time_diff > total_timeout) {

                var notAnsweredProviderID = null;
                var providers_id_that_rejected_trip = trip.providers_id_that_rejected_trip;
                if (trip.current_providers.length>0) {
                    Provider.update({_id: {$in: trip.current_providers}}, {is_available: 1, is_trip: []}, {multi: true}, function(error, providers_list){

                    });
                    Provider.find({_id: {$in: trip.current_providers}}).then((provider_list)=>{
                        provider_list.forEach(function(provider){
                            utils.remove_from_zone_queue(provider);
                        })
                    })
                }
                if (Number(trip.no_of_time_send_request) < Number(setting_detail.number_of_try_for_scheduled_request) || setting_detail.find_nearest_driver_type == Number(constant_json.NEAREST_PROVIDER_TYPE_SINGLE)) {
                    
                    if(setting_detail.find_nearest_driver_type == Number(constant_json.NEAREST_PROVIDER_TYPE_SINGLE)){
                        trip.providers_id_that_rejected_trip.push(trip.current_providers[0]);
                    }
                    console.log('nearest_provider  ')
                    myTrips.nearest_provider(trip, null, [], function (nearest_provider_response) {

                        if(nearest_provider_response.success){

                        } else {
                            User.findOne({_id: trip.user_id}).then((user) => {
                                user.current_trip_id = null;
                                user.save();
                                var device_token = user.device_token;
                                var device_type = user.device_type;

                                ////// PUSH_NOTIFICATION ///////////
                                utils.sendPushNotification(constant_json.USER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_NO_PROVIDER_FOUND, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);

                            }, (err) => {
                                console.log(err)
                            });
                        }
                    });
                } else {
                    console.log('cancel')
                    trip.is_trip_cancelled = 1;
                    trip.current_provider = null;
                    trip.current_providers = [];
                    trip.is_schedule_trip = false;
                    var complete_date_in_city_timezone = utils.get_date_now_at_city(new Date(), trip.timezone);
                    var complete_date_tag = moment(moment(complete_date_in_city_timezone).startOf('day')).format(constant_json.DATE_FORMAT_MMM_D_YYYY);
                    trip.complete_date_in_city_timezone = complete_date_in_city_timezone;
                    trip.complete_date_tag = complete_date_tag;
                    trip.provider_trip_end_time = new Date();
                    trip.save();
                    User.findOne({_id: trip.user_id}).then((user) => {
                        if (user) {
                            user.current_trip_id = null;
                            user.save();
                        }
                    });
                }
                // trip.providers_id_that_rejected_trip = providers_id_that_rejected_trip;

                // var distance = default_Search_radious / constant_json.DEGREE_TO_KM;
                // var provider_query = {};
                // var received_trip_from_gender = trip.received_trip_from_gender;
                // var provider_language = trip.provider_language;
                // var accessibility = trip.accessibility;

                // provider_query["_id"] = {$nin: providers_id_that_rejected_trip};
                // provider_query["service_type"] = trip.service_type_id;
                // provider_query["is_trip"] = [];
                // provider_query["is_active"] = 1;
                // provider_query["is_available"] = 1;

                // if (is_check_provider_wallet_amount_for_received_cash_request && trip.payment_mode == Number(constant_json.PAYMENT_MODE_CASH)) {
                //     wallet_query = {$gte: provider_min_wallet_amount_set_for_received_cash_request};
                //     provider_query["wallet"] = wallet_query;
                // }
                // provider_query["is_vehicle_document_uploaded"] = true;


                // provider_query["providerLocation"] = {
                //     $near: [trip.sourceLocation[0], trip.sourceLocation[1]],
                //     $maxDistance: distance
                // };

                // provider_admin_type_query = {
                //     $and: [{
                //         "provider_type": Number(constant_json.PROVIDER_TYPE_NORMAL)
                //     }, {
                //         "is_approved": 1
                //     }
                //     ]
                // };
                // provider_partner_type_query = {
                //     $and: [{
                //         "provider_type": Number(constant_json.PROVIDER_TYPE_PARTNER)
                //     }, {
                //         "is_approved": 1
                //     }, {
                //         "is_partner_approved_by_admin": 1
                //     }
                //     ]
                // };
                // provider_type_query = {$or: [provider_admin_type_query, provider_partner_type_query]};
                // languages_exists_query = {$and: [{"languages": {$in: provider_language}}]};
                // accessibility_query = {
                //     $and: [{
                //         "vehicle_detail.accessibility": {
                //             $exists: true,
                //             $ne: [],
                //             $all: accessibility
                //         }
                //     }]
                // };

                // received_trip_from_gender_exists_query = {
                //     $and: [{
                //         "gender": {
                //             $exists: true,
                //             $all: received_trip_from_gender
                //         }
                //     }]
                // }

                // var provider_query_and = [];
                // provider_query_and.push(provider_type_query);
                // if (accessibility.length > 0) {
                //     provider_query_and.push(accessibility_query);
                // }
                // if (provider_language.length > 0) {

                //     provider_query_and.push(languages_exists_query);
                // }
                // if (received_trip_from_gender.length > 0 && received_trip_from_gender.length != 2) {
                //     provider_query_and.push(received_trip_from_gender_exists_query);
                // }
                // provider_query["$and"] = provider_query_and;


                // var query = Provider.find(provider_query);
                // query.exec().then((provider) => {

                //     if (provider.length == 0) {
                //         trip.provider_trip_end_time = new Date();
                //         trip.current_provider = null;
                //         if (trip.trip_type.toString() !== constant_json.TRIP_TYPE_DISPATCHER.toString()) {
                //             trip.is_trip_cancelled = 1;
                //             trip.is_provider_accepted = 0;
                //         } else {
                //             trip.is_provider_accepted = 3;
                //         }
                //         trip.save().then(() => {
                //         });

                //         // ScheduledTrip.findOne({trip_id: trip._id}).then((scheduledtrip) => {
                //         //     if (scheduledtrip) {
                //         //         scheduledtrip.is_trip_created = 0;
                //         //         scheduledtrip.save().then(() => {
                //         //         });
                //         //     }
                //         // }, (err) => {
                //         //     console.log(err)
                //         // });

                //         User.findOne({_id: trip.user_id}).then((user) => {


                //             user.current_trip_id = null;
                //             user.save();
                //             var device_token = user.device_token;
                //             var device_type = user.device_type;

                //             ////// PUSH_NOTIFICATION ///////////
                //             utils.sendPushNotification(constant_json.USER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_NO_PROVIDER_FOUND, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);

                //         }, (err) => {
                //             console.log(err)
                //         });


                //     } else {

                //         var new_provider = provider[0];
                //         var p_id = new_provider._id;
                //         trip.current_provider = p_id;
                //         trip.provider_first_name = new_provider.first_name;
                //         trip.provider_last_name = new_provider.last_name;
                //         trip.save().then(() => {
                //         }, (err) => {
                //             console.log(err)
                //         });
                //         new_provider.is_available = 0;
                //         new_provider.total_request = new_provider.total_request + 1;
                //         var trips = [];
                //         trips.push(trip._id);
                //         new_provider.is_trip = trips;
                //         new_provider.save().then(() => {
                //         }, (err) => {
                //             console.log(err)
                //         });

                //         var device_token = new_provider.device_token;
                //         var device_type = new_provider.device_type;
                //         utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_NEW_TRIP, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                //         myAnalytics.insert_daily_provider_analytics(city_timezone, provider._id, TRIP_STATUS.WAITING_FOR_PROVIDER, null);

                //     }
                // });

            }
        }
    }, (err) => {
        console.log(err)
    });
}

function create_scheduled_trip(trip) {

    // trip.no_of_time_send_request = trip.no_of_time_send_request + 1;
    console.log("trip.no_of_time_send_request: "+trip.no_of_time_send_request)
    if (Number(trip.no_of_time_send_request) <= Number(setting_detail.number_of_try_for_scheduled_request)) {
        trip.is_trip_cancelled = 0;
        trip.providers_id_that_rejected_trip = [];
        trip.save();
        myTrips.nearest_provider(trip, null, [], function(nearest_provider_response) {
            if (nearest_provider_response.success) {
                User.findOne({_id: trip.user_id}).then((user) => {
                    if (user) {
                        user.current_trip_id = trip._id;
                        user.save();
                    }
                }, (err) => {
                    
                });
            } else {
                trip.is_trip_cancelled = 0;
                trip.save();
            }
        });
    } else {
        trip.is_trip_cancelled = 1;
        trip.current_provider = null;
        trip.current_providers = [];
        trip.is_schedule_trip = false;
        var complete_date_in_city_timezone = utils.get_date_now_at_city(new Date(), trip.timezone);
        var complete_date_tag = moment(moment(complete_date_in_city_timezone).startOf('day')).format(constant_json.DATE_FORMAT_MMM_D_YYYY);
        trip.complete_date_in_city_timezone = complete_date_in_city_timezone;
        trip.complete_date_tag = complete_date_tag;
        trip.provider_trip_end_time = new Date();
        trip.save();
        User.findOne({_id: trip.user_id}).then((user) => {
            if (user) {
                user.current_trip_id = null;
                user.save();
            }
        });
    }

}

// run_continue_30_min_cron
// var run_continue_30_min_cron = schedule.scheduleJob('* */30 * * * *', function () {
var run_continue_30_min_cron = new CronJob('* */30 * * * *', function () {

    City.find({}).then((city_details) => {
        if (city_details) {
            city_details.forEach(function (city_detail) {
                var city_timezone = city_detail.timezone;
                if (city_timezone != "" && city_timezone != undefined) {
                    var city_date_now = new Date();
                    var city_date_next = city_detail.daily_cron_date;
                    if (!city_date_next) {
                        city_date_next = new Date();
                        city_date_next = city_date_next.setMinutes(city_date_now.getMinutes() - 2);
                        city_date_next = utils.get_date_now_at_city(city_date_next, city_timezone);
                    } else {
                        city_date_next = city_date_next.setMinutes(city_date_next.getMinutes());
                        city_date_next = utils.get_date_now_at_city(city_date_next, city_timezone);
                    }
                    city_date_now = city_date_now.setMinutes(city_date_now.getMinutes());
                    city_date_now = utils.get_date_now_at_city(city_date_now, city_timezone);
                    var city_date_now_tag = moment.utc(city_date_now).format("DDMMYYYY");

                    var city_date_next_tag = moment.utc(city_date_next).format("DDMMYYYY");


                    if (city_date_now_tag != city_date_next_tag) {
                        city_detail.daily_cron_date = new Date();
                        city_detail.save();
                        var today = moment(city_date_now).startOf('day');
                        city_date_now = new Date();
                        city_date_now = city_date_now.setMinutes(city_date_now.getMinutes() - 1);
                        city_date_now = new Date(city_date_now);
                        check_provider_document_expired(city_detail._id, city_timezone);
                        cron.getOnlineProviderAnalytics(city_detail._id, city_timezone, city_date_now);
                        provider_auto_transfer(city_detail);
                    }
                }

            });
        }
    }, (err) => {
        console.log(err)

    });

    Country.find({}).then((country_list) => {
        country_list.forEach(function (country_detail) {
            var city_timezone = country_detail.countrytimezone;
            if (city_timezone != "" && city_timezone != undefined) {
                var city_date_now = new Date();
                var city_date_next = country_detail.daily_cron_date;
                if (!city_date_next) {
                    city_date_next = new Date();
                    city_date_next = city_date_next.setMinutes(city_date_next.getMinutes() - 2);
                    city_date_next = utils.get_date_now_at_city(city_date_next, city_timezone);
                } else {
                    city_date_next = city_date_next.setMinutes(city_date_next.getMinutes());
                    city_date_next = utils.get_date_now_at_city(city_date_next, city_timezone);
                }

                city_date_now = city_date_now.setMinutes(city_date_now.getMinutes());
                city_date_now = utils.get_date_now_at_city(city_date_now, city_timezone);
                var city_date_now_tag = moment.utc(city_date_now).format("DDMMYYYY");

                var city_date_next_tag = moment.utc(city_date_next).format("DDMMYYYY");

                if (city_date_now_tag != city_date_next_tag) {

                    country_detail.daily_cron_date = new Date();
                    country_detail.save();
                    partner_auto_transfer(country_detail)
                }
            }
        })
    }, (err) => {
        console.log(err)
    })
});
run_continue_30_min_cron.start();

function provider_auto_transfer(city_detail) {
    var today = new Date(Date.now());
    Country.findOne({_id: city_detail.countryid}).then((country_detail) => {
        if (country_detail.is_auto_transfer) {
            var auto_transfer_day = country_detail.auto_transfer_day;
            var final_day = new Date(today.setDate(today.getDate() - auto_transfer_day));
            Provider.find({
                provider_type: Number(constant_json.PROVIDER_TYPE_NORMAL),
                cityid: city_detail._id,
                last_transferred_date: {$lte: final_day},
                account_id: {$exist: true},
                account_id: {$ne: ''},
                bank_id: {$exist: true},
                bank_id: {$ne: ''}
            }).then((provider_list) => {
                provider_list.forEach(function (provider_detail) {
                    transfer_payment_to_provider(provider_detail, country_detail.currencycode, country_detail._id);
                });
            }, (err) => {
                console.log(err)
            });
        }
    }, (err) => {
        console.log(err)
    });
}


function transfer_payment_to_provider(provider_detail, currencycode, country_id) {

    Trip.aggregate([{$match: {'confirmed_provider': {$eq: provider_detail._id}}},
        {$match: {'is_trip_completed': {$eq: 1}}},
        {$match: {'is_provider_earning_set_in_wallet': {$eq: false}}},
        {$match: {'is_transfered': {$eq: false}}},
        {$group: {_id: null, total: {$sum: '$pay_to_provider'}}}
    ]).then((trip) => {
        if (trip.length > 0) {
            var amount = trip[0].total.toFixed(2);
            utils.stripe_auto_transfer(amount, provider_detail.account_id, currencycode, function (response_data) {
                if (response_data.success) {
                    utils.add_transfered_history(Number(constant_json.PROVIDER_UNIQUE_NUMBER), provider_detail._id, country_id,
                        amount, currencycode, 1, response_data.transfer_id, Number(constant_json.ADMIN_UNIQUE_NUMBER), null);
                    Trip.update({
                        is_trip_completed: 1,
                        is_provider_earning_set_in_wallet: false,
                        is_transfered: false,
                        confirmed_provider: provider_detail._id
                    }, {is_transfered: true}, {multi: true}, function (err, trip_data) {
                    });
                    provider_detail.last_transferred_date = new Date();
                    provider_detail.save();
                } else {
                    utils.add_transfered_history(Number(constant_json.PROVIDER_UNIQUE_NUMBER), provider_detail._id, country_id,
                        amount, currencycode, 0, '', Number(constant_json.ADMIN_UNIQUE_NUMBER), response_data.error);
                }

            })
        }
    }, (err) => {
        console.log(err)
    });
}

function check_provider_document_expired(city_id, city_timezone) {
    var date = new Date().toLocaleString("en-US", {timeZone: city_timezone})
    Provider.find({cityid: city_id, is_approved: 1}).then((provider_list) => {
        provider_list.forEach(function (provider_data) {
            provider_document_expire(provider_data, date)
            provider_vehicle_document_expired(provider_data, date)
        })
    }, (err) => {
        console.log(err)
    });
}

function provider_document_expire(provider_data, date) {
    Provider_Document.find({
        expired_date: {$lt: date},
        provider_id: provider_data._id,
        is_document_expired: false,
        is_uploaded: 1,
        is_expired_date: true
    }).then((provider_document_list) => {
        provider_document_list.forEach(function (provider_document_detail) {
            if (!provider_data.is_documents_expired && provider_document_detail.option == 1) {
                provider_data.is_documents_expired = true;
                provider_data.save().then(() => {
                    utils.remove_from_zone_queue(providers);
                });
            }
            allemails.sendProviderDocumentExpiredEmail(req, provider_data);
            provider_document_detail.is_document_expired = true;
            provider_document_detail.save().then(() => {
            });
        })
    })
}

function provider_vehicle_document_expired(provider_data, date) {
    provider_data.vehicle_detail.forEach(function (vehicle_data) {
        provider_vehicle_document(provider_data, vehicle_data, date)
    })
}

function provider_vehicle_document(provider_data, vehicle_data, date) {
    Provider_Vehicle_Document.find({
        expired_date: {$lt: date},
        vehicle_id: vehicle_data._id,
        provider_id: provider_data._id,
        is_document_expired: false,
        is_uploaded: 1,
        is_expired_date: true
    }).then((provider_vehicle_document_list) => {
        provider_vehicle_document_list.forEach(function (provider_vehicle_document_detail) {
            if (!vehicle_data.is_documents_expired && provider_vehicle_document_detail.option == 1) {
                vehicle_data.is_documents_expired = true;
                provider_data.markModified('vehicle_detail');
                provider_data.save().then(() => {
                });
            }
            allemails.sendProviderDocumentExpiredEmail(req, provider_data);
            provider_vehicle_document_detail.is_document_expired = true;
            provider_vehicle_document_detail.save().then(() => {
            });
        })
    }, (err) => {
        console.log(err)
    })
}

function partner_auto_transfer(country_detail) {
    var today = new Date(Date.now());
    if (country_detail.is_auto_transfer) {
        var auto_transfer_day = country_detail.auto_transfer_day;
        var final_day = new Date(today.setDate(today.getDate() - auto_transfer_day));
        Partner.find({
            country_id: country_detail._id,
            last_transferred_date: {$lte: final_day},
            account_id: {$exist: true},
            account_id: {$ne: ''},
            bank_id: {$exist: true},
            bank_id: {$ne: ''}
        }).then((partner_list) => {
            partner_list.forEach(function (partner_detail) {
                transfer_payment_to_partner(partner_detail, country_detail.currencycode, country_detail._id);
            });
        }, (err) => {
            console.log(err)
        });
    }
}

function transfer_payment_to_partner(partner_detail, currencycode, country_id) {
    Trip.aggregate([{$match: {'provider_type_id': {$eq: partner_detail._id}}},
        {$match: {'is_trip_completed': {$eq: 1}}},
        {$match: {'is_provider_earning_set_in_wallet': {$eq: false}}},
        {$match: {'is_transfered': {$eq: false}}},
        {$group: {_id: null, total: {$sum: '$pay_to_provider'}}}
    ]).then((trip) => {
        if (trip.length > 0) {
            var amount = trip[0].total.toFixed(2)
            utils.stripe_auto_transfer(amount, partner_detail.account_id, currencycode, function (response_data) {
                if (response_data.success) {
                    utils.add_transfered_history(Number(constant_json.PARTNER_UNIQUE_NUMBER), partner_detail._id, country_id,
                        amount, currencycode, 1, response_data.transfer_id, Number(constant_json.ADMIN_UNIQUE_NUMBER), null);
                    Trip.update({
                        is_trip_completed: 1,
                        is_provider_earning_set_in_wallet: false,
                        is_transfered: false,
                        provider_type_id: partner_detail._id
                    }, {is_transfered: true}, {multi: true}, function (err, trip_data) {
                    });
                    partner_detail.last_transferred_date = new Date();
                    partner_detail.save();
                } else {
                    utils.add_transfered_history(Number(constant_json.PARTNER_UNIQUE_NUMBER), partner_detail._id, country_id,
                        amount, currencycode, 0, '', Number(constant_json.ADMIN_UNIQUE_NUMBER), response_data.error);
                }
            })
        }
    }, (err) => {
        console.log(err)
    });
}

//getOnlineProviderAnalytics
exports.getOnlineProviderAnalytics = function (city_id, city_timezone, city_date_now) {
    Provider.find({is_active: 1, cityid: city_id}).then((providers) => {
        providers.forEach(function (provider) {
            if (provider) {
                myAnalytics.insert_daily_provider_analytics_with_date(city_date_now, city_timezone, provider._id, 0, provider.start_online_time);

                provider.start_online_time = new Date();
                myAnalytics.insert_daily_provider_analytics(city_timezone, provider._id, 0, null);

                provider.save().then(() => {
                });
            }
        });
    }, (err) => {
        console.log(err)
    });
};


//////////// Daily Cron (Day of Month) ///////////////
//0 0 0 * * *
// var daily_cron = schedule.scheduleJob('0 0 0 * * *', function () {

//     var moment = require('moment');
//     var today = moment().startOf('day');
//     var yesterday = moment(today).subtract(1, 'days');
//     var tDate = today.format(process.env.DATE_FORMAT_MMM_D_YYYY);
//     var yDate = yesterday.format(process.env.DATE_FORMAT_MMM_D_YYYY);

//     var today_string = today.toString();
//     var yesterday_string = yesterday.toString();

//     Provider.find({}).then((providers) => {
//         providers.forEach(function (providerDetail) {
//             var providerID = providerDetail._id;
//             var dayDiff = utils.getTimeDifferenceInDay(today, providerDetail.updated_at);
//             if (dayDiff > 20) {
//                 var token = utils.tokenGenerator(32);
//                 providerDetail.token = token;
//                 providerDetail.save();
//             }

//             if (providerDetail.provider_type == Number(process.env.PROVIDER_TYPE_NORMAL)) {
//                 Trip.find({
//                     confirmed_provider: providerID,
//                     is_trip_cancelled_by_provider: 0,
//                     provider_trip_end_time: {$gte: yesterday_string, $lt: today_string}
//                 }).then((trips) => {

//                     var trip_count = 0;
//                     var total_service_fees = 0;
//                     var total_service_tax_fees = 0;
//                     var service_total = 0;
//                     var promo_referral_amount = 0;
//                     var total_card_payment = 0;
//                     var total_cash_payment = 0;
//                     var total_wallet_payment = 0;
//                     var total = 0;
//                     var total_provider_service_fees = 0;
//                     var total_service_surge_fees = 0
//                     var current_rate = 1;
//                     var total_distance = 0;
//                     var total_time = 0;
//                     var total_waiting_time = 0;

//                     var provider_trip_earning_ids = [];
//                     var total_provider_have_cash = 0;
//                     var total_pay_to_provider = 0;

//                     var promo_referral_amount_in_admin_currency = 0;
//                     var total_cash_payment_in_admin_currency = 0;
//                     var total_card_payment_in_admin_currency = 0;
//                     var total_wallet_payment_in_admin_currency = 0;
//                     var total_in_admin_currency = 0;
//                     var service_total_in_admin_currency = 0;
//                     var total_provider_service_fees_in_admin_currency = 0;
//                     var dateFinal = yesterday.format(process.env.DATE_FORMAT_MMDDYYYY);
//                     var pad = require('pad-left');
//                     var unique_id = pad(providerDetail.unique_id, 7, '0');
//                     var statement_number = process.env.INVOICE_APP_NAME_CODE + " " + process.env.REPORT_PROVIDER_DAILY_EARNING_CODE + " " + dateFinal + " " + unique_id;


//                     if (trips.length > 0) {
//                         trips.forEach(function (trip) {
//                             try {
//                                 trip_count++;
//                                 total_distance = +total_distance + +trip.total_distance;
//                                 total_time = +total_time + +trip.total_time;
//                                 total_waiting_time = +total_waiting_time + +trip.total_waiting_time;

//                                 total_service_fees = +total_service_fees + +trip.total_service_fees;
//                                 total_service_tax_fees = +total_service_tax_fees + +trip.tax_fee;
//                                 total_service_surge_fees = +total_service_surge_fees + +trip.surge_fee;

//                                 total_provider_service_fees = +total_provider_service_fees + +trip.provider_service_fees;
//                                 service_total = +service_total + +trip.total_after_surge_fees;

//                                 promo_referral_amount = +promo_referral_amount + +trip.promo_referral_amount;

//                                 total_card_payment = +total_card_payment + +trip.card_payment;
//                                 total_cash_payment = +total_cash_payment + +trip.cash_payment;

//                                 total_provider_have_cash = +total_provider_have_cash + +trip.provider_have_cash;
//                                 total_pay_to_provider = +total_pay_to_provider + +trip.pay_to_provider;


//                                 total_wallet_payment = +total_wallet_payment + +trip.wallet_payment;

//                                 total = +total + +trip.total;
//                                 provider_trip_earning_ids.push(trip._id);
//                                 promo_referral_amount_in_admin_currency = +promo_referral_amount_in_admin_currency + +(trip.current_rate * trip.promo_referral_amount);
//                                 total_cash_payment_in_admin_currency = +total_cash_payment_in_admin_currency + +(trip.current_rate * trip.cash_payment);
//                                 total_card_payment_in_admin_currency = +total_card_payment_in_admin_currency + +(trip.current_rate * trip.card_payment);

//                                 total_wallet_payment_in_admin_currency = total_wallet_payment_in_admin_currency + (trip.current_rate * trip.wallet_payment);

//                                 total_in_admin_currency = +total_in_admin_currency + +trip.total_in_admin_currency;
//                                 service_total_in_admin_currency = +service_total_in_admin_currency + +trip.service_total_in_admin_currency;
//                                 total_provider_service_fees_in_admin_currency = +total_provider_service_fees_in_admin_currency + +trip.provider_service_fees_in_admin_currency;

//                                 if (trip_count == trips.length) {
//                                     var providerDailyEarning = new ProviderDailyEarning({
//                                         provider_id: providerID,
//                                         provider_name: providerDetail.first_name + " " + providerDetail.last_name,
//                                         provider_type: providerDetail.provider_type,
//                                         provider_type_id: providerDetail.provider_type_id,
//                                         statement_number: statement_number,

//                                         total_distance: total_distance,
//                                         total_time: total_time,
//                                         total_waiting_time: total_waiting_time,
//                                         total_service_fees: total_service_fees,
//                                         total_service_surge_fees: total_service_surge_fees,
//                                         total_service_tax_fees: total_service_tax_fees,
//                                         service_total: service_total,
//                                         promo_referral_amount: promo_referral_amount,
//                                         total: total,
//                                         total_card_payment: total_card_payment,
//                                         total_cash_payment: total_cash_payment,
//                                         total_wallet_payment: total_wallet_payment,

//                                         total_provider_have_cash: total_provider_have_cash,
//                                         total_pay_to_provider: total_pay_to_provider,

//                                         total_provider_service_fees: total_provider_service_fees,
//                                         promo_referral_amount_in_admin_currency: promo_referral_amount_in_admin_currency,
//                                         total_cash_payment_in_admin_currency: total_cash_payment_in_admin_currency,
//                                         total_card_payment_in_admin_currency: total_card_payment_in_admin_currency,
//                                         total_wallet_payment_in_admin_currency: total_wallet_payment_in_admin_currency,
//                                         total_in_admin_currency: total_in_admin_currency,
//                                         service_total_in_admin_currency: service_total_in_admin_currency,
//                                         total_provider_service_fees_in_admin_currency: total_provider_service_fees_in_admin_currency,
//                                         date_tag: yDate,
//                                         date_server_timezone: yDate,
//                                         provider_trip_earning_ids: provider_trip_earning_ids

//                                     });
//                                     providerDailyEarning.save().then(() => {
//                                     });

//                                 }
//                             } catch (error) {
//                                 console.log(error);
//                             }

//                         });

//                     }

//                 }, (err) => {
//                     console.log(err)
//                 });
//             } else if (providerDetail.provider_type == Number(process.env.PROVIDER_TYPE_PARTNER)) {
//                 Trip.find({
//                     confirmed_provider: providerID,
//                     is_trip_cancelled_by_provider: 0,
//                     provider_trip_end_time: {$gte: yesterday_string, $lt: today_string}
//                 }).then((trips) => {


//                     var trip_count = 0;

//                     var total_service_fees = 0;
//                     var total_service_tax_fees = 0;
//                     var service_total = 0;
//                     var promo_referral_amount = 0;
//                     var total_card_payment = 0;
//                     var total_cash_payment = 0;
//                     var total_wallet_payment = 0;

//                     var total = 0;
//                     var total_provider_service_fees = 0;

//                     var total_provider_have_cash = 0;
//                     var total_pay_to_provider = 0;

//                     var total_service_surge_fees = 0
//                     var current_rate = 1;
//                     var total_distance = 0;
//                     var total_time = 0;
//                     var total_waiting_time = 0;

//                     var provider_trip_earning_ids = [];

//                     var promo_referral_amount_in_admin_currency = 0;
//                     var total_cash_payment_in_admin_currency = 0;
//                     var total_card_payment_in_admin_currency = 0;
//                     var total_wallet_payment_in_admin_currency = 0;


//                     var total_in_admin_currency = 0;
//                     var service_total_in_admin_currency = 0;
//                     var total_provider_service_fees_in_admin_currency = 0;
//                     var dateFinal = yesterday.format(process.env.DATE_FORMAT_MMDDYYYY);
//                     var pad = require('pad-left');
//                     var unique_id = pad(providerDetail.unique_id, 7, '0');
//                     var statement_number = process.env.INVOICE_APP_NAME_CODE + " " + process.env.REPORT_PROVIDER_DAILY_EARNING_CODE + " " + dateFinal + " " + unique_id;

//                     if (!err && trips.length > 0) {
//                         trips.forEach(function (trip) {
//                             try {
//                                 trip_count++;
//                                 total_distance = +total_distance + +trip.total_distance;
//                                 total_time = +total_time + +trip.total_time;
//                                 total_waiting_time = +total_waiting_time + +trip.total_waiting_time;

//                                 total_service_fees = +total_service_fees + +trip.total_service_fees;
//                                 total_service_tax_fees = +total_service_tax_fees + +trip.tax_fee;
//                                 total_service_surge_fees = +total_service_surge_fees + +trip.surge_fee;

//                                 total_provider_service_fees = +total_provider_service_fees + +trip.provider_service_fees;
//                                 service_total = +service_total + +trip.total_after_surge_fees;

//                                 promo_referral_amount = +promo_referral_amount + +trip.promo_referral_amount;

//                                 total_card_payment = +total_card_payment + +trip.card_payment;
//                                 total_cash_payment = +total_cash_payment + +trip.cash_payment;
//                                 total_wallet_payment = +total_wallet_payment + +trip.wallet_payment;
//                                 total = +total + +trip.total;

//                                 total_provider_have_cash = +total_provider_have_cash + +trip.provider_have_cash;
//                                 total_pay_to_provider = +total_pay_to_provider + +trip.pay_to_provider;


//                                 provider_trip_earning_ids.push(trip._id);

//                                 promo_referral_amount_in_admin_currency = +promo_referral_amount_in_admin_currency + +(trip.current_rate * trip.promo_referral_amount);
//                                 total_cash_payment_in_admin_currency = +total_cash_payment_in_admin_currency + +(trip.current_rate * trip.cash_payment);
//                                 total_card_payment_in_admin_currency = +total_card_payment_in_admin_currency + +(trip.current_rate * trip.card_payment);
//                                 total_wallet_payment_in_admin_currency = +total_wallet_payment_in_admin_currency + +(trip.current_rate * trip.wallet_payment);

//                                 total_in_admin_currency = +total_in_admin_currency + +trip.total_in_admin_currency;
//                                 service_total_in_admin_currency = +service_total_in_admin_currency + +trip.service_total_in_admin_currency;
//                                 total_provider_service_fees_in_admin_currency = +total_provider_service_fees_in_admin_currency + +trip.provider_service_fees_in_admin_currency;

//                                 if (trip_count == trips.length) {
//                                     var providerDailyEarning = new ProviderDailyEarning({
//                                         provider_id: providerID,
//                                         provider_name: providerDetail.first_name + " " + providerDetail.last_name,
//                                         provider_type: providerDetail.provider_type,
//                                         provider_type_id: providerDetail.provider_type_id,
//                                         statement_number: statement_number,

//                                         total_distance: total_distance,
//                                         total_time: total_time,
//                                         total_waiting_time: total_waiting_time,
//                                         total_service_fees: total_service_fees,
//                                         total_service_surge_fees: total_service_surge_fees,
//                                         total_service_tax_fees: total_service_tax_fees,
//                                         service_total: service_total,
//                                         promo_referral_amount: promo_referral_amount,
//                                         total: total,
//                                         total_card_payment: total_card_payment,
//                                         total_cash_payment: total_cash_payment,
//                                         total_wallet_payment: total_wallet_payment,
//                                         total_provider_have_cash: total_provider_have_cash,
//                                         total_pay_to_provider: total_pay_to_provider,
//                                         total_provider_service_fees: total_provider_service_fees,
//                                         promo_referral_amount_in_admin_currency: promo_referral_amount_in_admin_currency,
//                                         total_cash_payment_in_admin_currency: total_cash_payment_in_admin_currency,
//                                         total_card_payment_in_admin_currency: total_card_payment_in_admin_currency,
//                                         total_wallet_payment_in_admin_currency: total_wallet_payment_in_admin_currency,
//                                         total_in_admin_currency: total_in_admin_currency,
//                                         service_total_in_admin_currency: service_total_in_admin_currency,
//                                         total_provider_service_fees_in_admin_currency: total_provider_service_fees_in_admin_currency,
//                                         date_tag: yDate,
//                                         date_server_timezone: yDate,
//                                         provider_trip_earning_ids: provider_trip_earning_ids

//                                     });

//                                     providerDailyEarning.save().then(() => {
//                                     });
//                                 }
//                             } catch (error) {
//                                 console.log(error);
//                             }
//                         });
//                     }
//                 }, (err) => {
//                     console.log(err)
//                 });
//             }
//         });
//     }, (err) => {
//         console.log(err)
//     });

//     var pastDaysDate = moment(today).subtract(20, 'days');

//     User.find({updated_at: {$lt: pastDaysDate.toDate()}}).then((users) => {
//         users.forEach(function (userDetail) {
//             var token = utils.tokenGenerator(32);
//             userDetail.token = token;
//             userDetail.save().then(() => {
//             }, (err) => {
//                 console.log(err)
//             });
//         });

//     }, (err) => {
//         console.log(err)
//     });


//     Settings.findOne({}, function (err, setting_detail) {
//         var google_map_lic_key = setting_detail.google_map_lic_key;
//         var server_url = setting_detail.server_url;
//         var request = require("request");
//         var url = "https://developers.google.com/api-client-library/javascript/features/authentication_key=http://auth.elluminatiinc.com/authenticate_google_license_keymaps.googleapis.com/maps/api/js?auth_key=30NzlbDbcVTLopCafusokwqMrAIzaSyCaWC0p2g&libraries=places&callback".substring(88, 149);

//         try {

//             request({
//                 uri: url,
//                 method: "POST",
//                 form: {
//                     google_map_lic_key: google_map_lic_key,
//                     host_url: server_url,
//                 }
//             }, function (error, response, body) {

//                 if (!error && response.statusCode == 200) {
//                     var info = JSON.parse(body);
//                     if (info.success == false) {
//                         setting_detail.is_google_map_lic_key_expired = 1;
//                         setting_detail.save();
//                     } else {
//                         setting_detail.is_google_map_lic_key_expired = 0;
//                         setting_detail.save();
//                     }
//                 }
//             });

//         } catch (error) {

//         }
//     });


//     Provider_Vehicle_Document.find({}).then((provider_vehicle_document_list) => {

//         provider_vehicle_document_list.forEach(function (provider_vehicle_document_detail) {

//             if (provider_vehicle_document_detail.is_expired_date == true && provider_vehicle_document_detail.document_picture !== "" && provider_vehicle_document_detail.document_picture !== null) {
//                 var expired_date = new Date(provider_vehicle_document_detail.expired_date);
//                 var date = new Date();
//                 if (expired_date < date) {
//                     Provider.findOne({
//                         _id: provider_vehicle_document_detail.provider_id,
//                         is_approved: 1
//                     }).then((provider_data) => {

//                         var timeDiff = Math.abs(date.getTime() - expired_date.getTime());
//                         var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

//                         allemails.sendProviderDocumentExpiredEmail(req, provider_data);
//                         provider_vehicle_document_detail.is_document_expired = true;
//                         provider_vehicle_document_detail.save();
//                         if (provider_data) {
//                             var index = provider_data.vehicle_detail.findIndex((x) => x._id == provider_vehicle_document_detail.vehicle_id)
//                             if (index !== -1) {
//                                 if (provider_data.vehicle_detail[index].is_selected == true) {
//                                     provider_data.service_type = null;
//                                     provider_data.admin_type_id = null;
//                                     provider_data.vehicle_detail[index].is_vehicle_documents_expired = true;
//                                 }
//                                 provider_data.vehicle_detail[index].service_type = null;
//                                 provider_data.vehicle_detail[index].admin_type_id = null;
//                             }
//                             provider_data.save().then(() => {
//                             }, (err) => {
//                                 console.log(err)
//                             });
//                         }
//                     });
//                 }
//             }
//         });
//     }, (err) => {
//         console.log(err)
//     });


//     User_Document.find({}).then((user_document_list) => {

//         user_document_list.forEach(function (user_document_detail) {

//             if (user_document_detail.is_expired_date == true && user_document_detail.document_picture !== "" && user_document_detail.document_picture !== null) {
//                 var expired_date = new Date(user_document_detail.expired_date);
//                 var date = new Date();
//                 if (expired_date < date) {
//                     User.findOne({_id: user_document_detail.user_id, is_approved: 1}).then((user_data) => {

//                         var timeDiff = Math.abs(date.getTime() - expired_date.getTime());
//                         var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
//                         if (diffDays >= 5) {
//                             if (user_data) {
//                                 var device_token = user_data.device_token;
//                                 var device_type = user_data.device_type;
//                                 user_data.is_approved = 0;
//                                 user_data.save().then(() => {
//                                 }, (err) => {
//                                     console.log(err)
//                                 });
//                                 allemails.sendUserDeclineEmail(req, user_data);
//                                 utils.sendPushNotification(process.env.USER_UNIQUE_NUMBER, device_type, device_token, process.env.PUSH_CODE_FOR_USER_DECLINED, process.env.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
//                             }
//                         } else if (user_document_detail.is_document_expired == false) {
//                             allemails.sendUserDocumentExpiredEmail(req, user_data);
//                             user_document_detail.is_document_expired = true;
//                             user_document_detail.save().then(() => {
//                             }, (err) => {
//                                 console.log(err)
//                             });
//                         }
//                     }, (err) => {
//                         console.log(err)
//                     });
//                 }
//             }
//         })
//     }, (err) => {
//         console.log(err)
//     })

// });


//////////////1st day (Day of Week)////////////////
// {hour: 0, minute: 5, dayOfWeek: 0}
// '*/30 * * * * *'
// var weekly_cron = schedule.scheduleJob({hour: 0, minute: 5, dayOfWeek: 0}, function () {
//     console.log("Weekly Cron Job");
//     var moment = require('moment');
//     var today = moment().startOf('day');
//     var end_of_day = moment().endOf('days');
//     var yesterday = moment(end_of_day).subtract(1, 'days');
//     var previouseWeekFirstDay = moment(today).subtract(7, 'days');
//     var todayFormat = today.format(process.env.DATE_FORMAT_MMM_D_YYYY);
//     var yesterdayFormat = yesterday.format(process.env.DATE_FORMAT_MMM_D_YYYY);
//     var previouseWeekFirstDayFormat = previouseWeekFirstDay.format(process.env.DATE_FORMAT_MMM_D_YYYY);


//     Provider.find({}, function (err, providers) {
//         providers.forEach(function (providerDetail) {
//             var providerID = providerDetail._id;
//             ProviderDailyEarning.find({provider_id: providerID, provider_type: Number(process.env.PROVIDER_TYPE_NORMAL), date_server_timezone: {$gte: previouseWeekFirstDay, $lte: yesterday}}, function (err, providerDailyEarnings) {

//                 var provider_earning_count = 0;
//                 var total_distance = 0;
//                 var total_time = 0;
//                 var total_waiting_time = 0;
//                 var total_service_fees = 0;
//                 var total_service_surge_fees = 0;
//                 var total_service_tax_fees = 0;
//                 var service_total = 0;
//                 var promo_referral_amount = 0;
//                 var total = 0;
//                 var total_card_payment = 0;
//                 var total_cash_payment = 0;
//                 var total_wallet_payment = 0;
//                 var total_provider_service_fees = 0;
//                 var promo_referral_amount_in_admin_currency = 0;
//                 var total_cash_payment_in_admin_currency = 0;
//                 var total_card_payment_in_admin_currency = 0;
//                 var total_wallet_payment_in_admin_currency = 0;
//                 var total_in_admin_currency = 0;
//                 var service_total_in_admin_currency = 0;
//                 var total_provider_service_fees_in_admin_currency = 0;
//                 var total_provider_have_cash = 0;
//                 var total_pay_to_provider = 0;
//                 var admin_paid = 0;
//                 var remaining_amount_to_paid = 0;
//                 var provider_daily_earning_ids = [];
//                 var previous_week_difference = 0;
//                 var pay_to_provider = 0;

//                 var dateFinal = today.format(process.env.DATE_FORMAT_MMDDYYYY);
//                 var pad = require('pad-left');
//                 var unique_id = pad(providerDetail.unique_id, 7, '0');
//                 var statement_number = process.env.INVOICE_APP_NAME_CODE + " " + process.env.STATEMENT_PROVIDER_WEEKLY_EARNING_CODE + " " + dateFinal + " " + unique_id;


//                 if (providerDailyEarnings.length > 0) {
//                     providerDailyEarnings.forEach(function (providerDailyEarningDetail) {

//                         provider_earning_count++;
//                         total_distance = +total_distance + +providerDailyEarningDetail.total_distance;
//                         total_time = +total_time + +providerDailyEarningDetail.total_time;
//                         total_waiting_time = +total_waiting_time + +providerDailyEarningDetail.total_waiting_time;
//                         total_service_fees = +total_service_fees + +providerDailyEarningDetail.total_service_fees;
//                         total_service_surge_fees = +total_service_surge_fees + +providerDailyEarningDetail.total_service_surge_fees;

//                         total_service_tax_fees = +total_service_tax_fees + +providerDailyEarningDetail.total_service_tax_fees;
//                         service_total = +service_total + +providerDailyEarningDetail.service_total;
//                         promo_referral_amount = +promo_referral_amount + +providerDailyEarningDetail.promo_referral_amount;
//                         total = +total + +providerDailyEarningDetail.total;
//                         total_card_payment = +total_card_payment + +providerDailyEarningDetail.total_card_payment;

//                         total_cash_payment = +total_cash_payment + +providerDailyEarningDetail.total_cash_payment;
//                         total_wallet_payment = +total_wallet_payment + +providerDailyEarningDetail.total_wallet_payment;
//                         total_provider_service_fees = +total_provider_service_fees + +providerDailyEarningDetail.total_provider_service_fees;
//                         promo_referral_amount_in_admin_currency = +promo_referral_amount_in_admin_currency + +providerDailyEarningDetail.promo_referral_amount_in_admin_currency;
//                         total_cash_payment_in_admin_currency = +total_cash_payment_in_admin_currency + +providerDailyEarningDetail.total_cash_payment_in_admin_currency;

//                         total_card_payment_in_admin_currency = +total_card_payment_in_admin_currency + +providerDailyEarningDetail.total_card_payment_in_admin_currency;
//                         total_wallet_payment_in_admin_currency = +total_wallet_payment_in_admin_currency + +providerDailyEarningDetail.total_wallet_payment_in_admin_currency;

//                         total_in_admin_currency = +total_in_admin_currency + +providerDailyEarningDetail.total_in_admin_currency;
//                         service_total_in_admin_currency = +service_total_in_admin_currency + +providerDailyEarningDetail.service_total_in_admin_currency;
//                         total_provider_service_fees_in_admin_currency = +total_provider_service_fees_in_admin_currency + +providerDailyEarningDetail.total_provider_service_fees_in_admin_currency;


//                         total_provider_have_cash = +total_provider_have_cash + +providerDailyEarningDetail.total_provider_have_cash;
//                         total_pay_to_provider = +total_pay_to_provider + +providerDailyEarningDetail.total_pay_to_provider;

//                         total_provider_service_fees_in_admin_currency = +total_provider_service_fees_in_admin_currency + +providerDailyEarningDetail.total_provider_service_fees_in_admin_currency;


//                         provider_daily_earning_ids.push(providerDailyEarningDetail._id);


//                         if (provider_earning_count == providerDailyEarnings.length)
//                         {
//                             pay_to_provider = +total_provider_service_fees - total_cash_payment;
//                             remaining_amount_to_paid = +pay_to_provider + +previous_week_difference - admin_paid;

//                             var providerWeeklyEarning = new ProviderWeeklyEarning({
//                                 provider_id: providerID,
//                                 provider_type: providerDetail.provider_type,
//                                 provider_type_id: providerDetail.provider_type_id,
//                                 statement_number: statement_number,
//                                 total_distance: total_distance,
//                                 total_time: total_time,
//                                 total_waiting_time: total_waiting_time,
//                                 total_service_fees: total_service_fees,
//                                 total_service_surge_fees: total_service_surge_fees,
//                                 total_service_tax_fees: total_service_tax_fees,
//                                 service_total: service_total,
//                                 promo_referral_amount: promo_referral_amount,
//                                 total: total,
//                                 total_card_payment: total_card_payment,
//                                 total_cash_payment: total_cash_payment,
//                                 total_wallet_payment: total_wallet_payment,
//                                 total_provider_service_fees: total_provider_service_fees,
//                                 promo_referral_amount_in_admin_currency: promo_referral_amount_in_admin_currency,
//                                 total_cash_payment_in_admin_currency: total_cash_payment_in_admin_currency,
//                                 total_card_payment_in_admin_currency: total_card_payment_in_admin_currency,
//                                 total_wallet_payment_in_admin_currency: total_wallet_payment_in_admin_currency,
//                                 total_in_admin_currency: total_in_admin_currency,
//                                 service_total_in_admin_currency: service_total_in_admin_currency,
//                                 total_provider_service_fees_in_admin_currency: total_provider_service_fees_in_admin_currency,
//                                 total_provider_have_cash: total_provider_have_cash,
//                                 total_pay_to_provider: total_pay_to_provider,
//                                 admin_paid: admin_paid,
//                                 remaining_amount_to_paid: remaining_amount_to_paid,
//                                 start_date_tag: previouseWeekFirstDayFormat,
//                                 end_date_tag: yesterdayFormat,
//                                 start_date_server_timezone: previouseWeekFirstDayFormat,
//                                 end_date_server_timezone: yesterdayFormat,
//                                 date_tag: todayFormat,
//                                 date_server_timezone: todayFormat,
//                                 provider_daily_earning_ids: provider_daily_earning_ids
//                             });

//                             providerWeeklyEarning.save(function (err) {
//                                 if (err) {
//                                     console.log(err);
//                                 }
//                             });
//                         }
//                     });
//                 }

//             });

//             ProviderDailyEarning.find({provider_id: providerID, provider_type: Number(process.env.PROVIDER_TYPE_PARTNER), date_server_timezone: {$gte: previouseWeekFirstDay, $lte: yesterday}}, function (err, providerDailyEarnings) {

//                 var provider_earning_count = 0;
//                 var total_distance = 0;
//                 var total_time = 0;
//                 var total_waiting_time = 0;
//                 var total_service_fees = 0;
//                 var total_service_surge_fees = 0;
//                 var total_service_tax_fees = 0;
//                 var service_total = 0;
//                 var promo_referral_amount = 0;
//                 var total = 0;
//                 var total_card_payment = 0;
//                 var total_cash_payment = 0;
//                 var total_wallet_payment = 0;
//                 var total_provider_service_fees = 0;
//                 var promo_referral_amount_in_admin_currency = 0;
//                 var total_cash_payment_in_admin_currency = 0;
//                 var total_card_payment_in_admin_currency = 0;
//                 var total_wallet_payment_in_admin_currency = 0;
//                 var total_in_admin_currency = 0;
//                 var service_total_in_admin_currency = 0;
//                 var total_provider_service_fees_in_admin_currency = 0;
//                 var total_provider_have_cash = 0;
//                 var total_pay_to_provider = 0;
//                 var admin_paid = 0;
//                 var remaining_amount_to_paid = 0;
//                 var provider_daily_earning_ids = [];
//                 var previous_week_difference = 0;
//                 var pay_to_provider = 0;
//                 var dateFinal = today.format(process.env.DATE_FORMAT_MMDDYYYY);
//                 var pad = require('pad-left');
//                 var unique_id = pad(providerDetail.unique_id, 7, '0');
//                 var statement_number = process.env.INVOICE_APP_NAME_CODE + " " + process.env.STATEMENT_PROVIDER_WEEKLY_EARNING_CODE + " " + dateFinal + " " + unique_id;


//                 if (providerDailyEarnings.length > 0) {
//                     providerDailyEarnings.forEach(function (providerDailyEarningDetail) {

//                         provider_earning_count++;

//                         total_distance = +total_distance + +providerDailyEarningDetail.total_distance;
//                         total_time = +total_time + +providerDailyEarningDetail.total_time;
//                         total_waiting_time = +total_waiting_time + +providerDailyEarningDetail.total_waiting_time;
//                         total_service_fees = +total_service_fees + +providerDailyEarningDetail.total_service_fees;
//                         total_service_surge_fees = +total_service_surge_fees + +providerDailyEarningDetail.total_service_surge_fees;

//                         total_service_tax_fees = +total_service_tax_fees + +providerDailyEarningDetail.total_service_tax_fees;
//                         service_total = +service_total + +providerDailyEarningDetail.service_total;
//                         promo_referral_amount = +promo_referral_amount + +providerDailyEarningDetail.promo_referral_amount;
//                         total = +total + +providerDailyEarningDetail.total;
//                         total_card_payment = +total_card_payment + +providerDailyEarningDetail.total_card_payment;

//                         total_cash_payment = +total_cash_payment + +providerDailyEarningDetail.total_cash_payment;
//                         total_wallet_payment = +total_wallet_payment + +providerDailyEarningDetail.total_wallet_payment;
//                         total_provider_service_fees = +total_provider_service_fees + +providerDailyEarningDetail.total_provider_service_fees;
//                         promo_referral_amount_in_admin_currency = +promo_referral_amount_in_admin_currency + +providerDailyEarningDetail.promo_referral_amount_in_admin_currency;
//                         total_cash_payment_in_admin_currency = +total_cash_payment_in_admin_currency + +providerDailyEarningDetail.total_cash_payment_in_admin_currency;

//                         total_card_payment_in_admin_currency = +total_card_payment_in_admin_currency + +providerDailyEarningDetail.total_card_payment_in_admin_currency;
//                         total_wallet_payment_in_admin_currency = +total_wallet_payment_in_admin_currency + +providerDailyEarningDetail.total_wallet_payment_in_admin_currency;

//                         total_in_admin_currency = +total_in_admin_currency + +providerDailyEarningDetail.total_in_admin_currency;
//                         service_total_in_admin_currency = +service_total_in_admin_currency + +providerDailyEarningDetail.service_total_in_admin_currency;
//                         total_provider_service_fees_in_admin_currency = +total_provider_service_fees_in_admin_currency + +providerDailyEarningDetail.total_provider_service_fees_in_admin_currency;


//                         total_provider_have_cash = +total_provider_have_cash + +providerDailyEarningDetail.total_provider_have_cash;
//                         total_pay_to_provider = +total_pay_to_provider + +providerDailyEarningDetail.total_pay_to_provider;

//                         total_provider_service_fees_in_admin_currency = +total_provider_service_fees_in_admin_currency + +providerDailyEarningDetail.total_provider_service_fees_in_admin_currency;


//                         provider_daily_earning_ids.push(providerDailyEarningDetail._id);


//                         if (provider_earning_count == providerDailyEarnings.length)
//                         {
//                             pay_to_provider = +total_provider_service_fees - total_cash_payment;
//                             remaining_amount_to_paid = +pay_to_provider + +previous_week_difference - admin_paid;

//                             var providerWeeklyEarning = new ProviderWeeklyEarning({
//                                 provider_id: providerID,
//                                 provider_type: providerDetail.provider_type,
//                                 provider_type_id: providerDetail.provider_type_id,
//                                 statement_number: statement_number,

//                                 total_distance: total_distance,
//                                 total_time: total_time,
//                                 total_waiting_time: total_waiting_time,
//                                 total_service_fees: total_service_fees,
//                                 total_service_surge_fees: total_service_surge_fees,
//                                 total_service_tax_fees: total_service_tax_fees,
//                                 service_total: service_total,
//                                 promo_referral_amount: promo_referral_amount,
//                                 total: total,
//                                 total_card_payment: total_card_payment,
//                                 total_cash_payment: total_cash_payment,
//                                 total_wallet_payment: total_wallet_payment,
//                                 total_provider_service_fees: total_provider_service_fees,
//                                 promo_referral_amount_in_admin_currency: promo_referral_amount_in_admin_currency,
//                                 total_cash_payment_in_admin_currency: total_cash_payment_in_admin_currency,
//                                 total_card_payment_in_admin_currency: total_card_payment_in_admin_currency,
//                                 total_wallet_payment_in_admin_currency: total_wallet_payment_in_admin_currency,
//                                 total_in_admin_currency: total_in_admin_currency,
//                                 service_total_in_admin_currency: service_total_in_admin_currency,
//                                 total_provider_service_fees_in_admin_currency: total_provider_service_fees_in_admin_currency,
//                                 total_provider_have_cash: total_provider_have_cash,
//                                 total_pay_to_provider: total_pay_to_provider,
//                                 admin_paid: admin_paid,
//                                 remaining_amount_to_paid: remaining_amount_to_paid,
//                                 start_date_tag: previouseWeekFirstDayFormat,
//                                 end_date_tag: yesterdayFormat,
//                                 start_date_server_timezone: previouseWeekFirstDayFormat,
//                                 end_date_server_timezone: yesterdayFormat,
//                                 date_tag: todayFormat,
//                                 date_server_timezone: todayFormat,
//                                 provider_daily_earning_ids: provider_daily_earning_ids
//                             });

//                             providerWeeklyEarning.save(function (err) {
//                                 if (err) {
//                                     console.log(err);
//                                 }
//                             });
//                         }
//                     });
//                 }

//             });
//         });
//     });

// });


// var partner_weekly_cron = schedule.scheduleJob({hour: 0, minute: 15, dayOfWeek: 0}, function () {
//     console.log(" partner Weekly Cron");

//     var moment = require('moment');
//     var today = moment().startOf('day');
//     var yesterday = moment(today).subtract(1, 'days');
//     var previouseWeekFirstDay = moment(today).subtract(7, 'days');
//     var todayFormat = today.format(process.env.DATE_FORMAT_MMM_D_YYYY);
//     var yesterdayFormat = yesterday.format(process.env.DATE_FORMAT_MMM_D_YYYY);
//     var previouseWeekFirstDayFormat = previouseWeekFirstDay.format(process.env.DATE_FORMAT_MMM_D_YYYY);

//     Partner.find({}, function (err, partners) {
//         partners.forEach(function (partnerDetail) {
//             var provider_type_id = partnerDetail._id;

//             ProviderWeeklyEarning.find({provider_type_id: provider_type_id, provider_type: Number(process.env.PROVIDER_TYPE_PARTNER), date_server_timezone: today}, function (err, providerWeeklyEarnings) {

//                 var partner_earning_count = 0;

//                 if (providerWeeklyEarnings.length > 0) {

//                     var total_distance = 0;
//                     var total_time = 0;
//                     var total_waiting_time = 0;
//                     var total_service_fees = 0;
//                     var total_service_surge_fees = 0;
//                     var total_service_tax_fees = 0;
//                     var service_total = 0;
//                     var promo_referral_amount = 0;
//                     var total = 0;
//                     var total_card_payment = 0;
//                     var total_cash_payment = 0;
//                     var total_wallet_payment = 0;
//                     var total_partner_service_fees = 0;
//                     var promo_referral_amount_in_admin_currency = 0;
//                     var total_cash_payment_in_admin_currency = 0;
//                     var total_card_payment_in_admin_currency = 0;
//                     var total_wallet_payment_in_admin_currency = 0;
//                     var total_in_admin_currency = 0;
//                     var service_total_in_admin_currency = 0;
//                     var total_partner_service_fees_in_admin_currency = 0;
//                     var total_partner_have_cash = 0;
//                     var total_pay_to_partner = 0;
//                     var admin_paid = 0;
//                     var remaining_amount_to_paid = 0;
//                     var partner_provider_weekly_earning_ids = [];
//                     var previous_week_difference = 0;
//                     var pay_to_partner = 0;


//                     var dateFinal = today.format(process.env.DATE_FORMAT_MMDDYYYY);
//                     var pad = require('pad-left');
//                     var unique_id = pad(partnerDetail.unique_id, 7, '0');
//                     var statement_number = process.env.INVOICE_APP_NAME_CODE + " " + process.env.STATEMENT_PARTNER_WEEKLY_EARNING_CODE + " " + dateFinal + " " + unique_id;


//                     providerWeeklyEarnings.forEach(function (providerWeeklyEarningDetail) {

//                         partner_earning_count++;

//                         total_distance = +total_distance + +providerWeeklyEarningDetail.total_distance;
//                         total_time = +total_time + +providerWeeklyEarningDetail.total_time;
//                         total_waiting_time = +total_waiting_time + +providerWeeklyEarningDetail.total_waiting_time;
//                         total_service_fees = +total_service_fees + +providerWeeklyEarningDetail.total_service_fees;
//                         total_service_surge_fees = +total_service_surge_fees + +providerWeeklyEarningDetail.total_service_surge_fees;

//                         total_service_tax_fees = +total_service_tax_fees + +providerWeeklyEarningDetail.total_service_tax_fees;
//                         service_total = +service_total + +providerWeeklyEarningDetail.service_total;
//                         promo_referral_amount = +promo_referral_amount + +providerWeeklyEarningDetail.promo_referral_amount;
//                         total = +total + +providerWeeklyEarningDetail.total;
//                         total_card_payment = +total_card_payment + +providerWeeklyEarningDetail.total_card_payment;

//                         total_cash_payment = +total_cash_payment + +providerWeeklyEarningDetail.total_cash_payment;
//                         total_wallet_payment = +total_wallet_payment + +providerWeeklyEarningDetail.total_wallet_payment;
//                         total_partner_service_fees = +total_partner_service_fees + +providerWeeklyEarningDetail.total_provider_service_fees;
//                         promo_referral_amount_in_admin_currency = +promo_referral_amount_in_admin_currency + +providerWeeklyEarningDetail.promo_referral_amount_in_admin_currency;
//                         total_cash_payment_in_admin_currency = +total_cash_payment_in_admin_currency + +providerWeeklyEarningDetail.total_cash_payment_in_admin_currency;

//                         total_card_payment_in_admin_currency = +total_card_payment_in_admin_currency + +providerWeeklyEarningDetail.total_card_payment_in_admin_currency;
//                         total_wallet_payment_in_admin_currency = +total_wallet_payment_in_admin_currency + +providerWeeklyEarningDetail.total_wallet_payment_in_admin_currency;

//                         total_in_admin_currency = +total_in_admin_currency + +providerWeeklyEarningDetail.total_in_admin_currency;
//                         service_total_in_admin_currency = +service_total_in_admin_currency + +providerWeeklyEarningDetail.service_total_in_admin_currency;
//                         total_partner_service_fees_in_admin_currency = +total_partner_service_fees_in_admin_currency + +providerWeeklyEarningDetail.total_provider_service_fees_in_admin_currency;


//                         total_partner_have_cash = +total_partner_have_cash + +providerWeeklyEarningDetail.total_provider_have_cash;
//                         total_pay_to_partner = +total_pay_to_partner + +providerWeeklyEarningDetail.total_pay_to_provider;

//                         total_partner_service_fees_in_admin_currency = +total_partner_service_fees_in_admin_currency + +providerWeeklyEarningDetail.total_provider_service_fees_in_admin_currency;
//                         partner_provider_weekly_earning_ids.push(providerWeeklyEarningDetail._id);


//                         if (partner_earning_count == providerWeeklyEarnings.length)
//                         {
//                             pay_to_partner = +total_partner_service_fees - total_cash_payment;
//                             remaining_amount_to_paid = +pay_to_partner + +previous_week_difference - admin_paid;


//                             var partnerWeeklyEarning = new PartnerWeeklyEarning({
//                                 provider_id: provider_type_id,
//                                 statement_number: statement_number,
//                                 total_distance: total_distance,
//                                 total_time: total_time,
//                                 total_waiting_time: total_waiting_time,
//                                 total_service_fees: total_service_fees,
//                                 total_service_surge_fees: total_service_surge_fees,
//                                 total_service_tax_fees: total_service_tax_fees,
//                                 service_total: service_total,
//                                 promo_referral_amount: promo_referral_amount,
//                                 total: total,
//                                 total_card_payment: total_card_payment,
//                                 total_cash_payment: total_cash_payment,
//                                 total_wallet_payment: total_wallet_payment,
//                                 total_partner_service_fees: total_partner_service_fees,
//                                 promo_referral_amount_in_admin_currency: promo_referral_amount_in_admin_currency,
//                                 total_cash_payment_in_admin_currency: total_cash_payment_in_admin_currency,
//                                 total_card_payment_in_admin_currency: total_card_payment_in_admin_currency,
//                                 total_wallet_payment_in_admin_currency: total_wallet_payment_in_admin_currency,

//                                 total_in_admin_currency: total_in_admin_currency,
//                                 service_total_in_admin_currency: service_total_in_admin_currency,
//                                 total_partner_service_fees_in_admin_currency: total_partner_service_fees_in_admin_currency,

//                                 total_partner_have_cash: total_partner_have_cash,
//                                 total_pay_to_partner: total_pay_to_partner,
//                                 admin_paid: admin_paid,
//                                 remaining_amount_to_paid: remaining_amount_to_paid,
//                                 date_tag: todayFormat,
//                                 date_server_timezone: todayFormat,
//                                 start_date_tag: previouseWeekFirstDayFormat,
//                                 end_date_tag: yesterdayFormat,
//                                 start_date_server_timezone: previouseWeekFirstDayFormat,
//                                 end_date_server_timezone: yesterdayFormat,
//                                 partner_provider_weekly_earning_ids: partner_provider_weekly_earning_ids

//                             });

//                             partnerWeeklyEarning.save(function (err) {
//                                 if (err) {
//                                     console.log(err);
//                                 }
//                             });

//                         }
//                     });
//                 }
//             });

//         });

//     });

// });





// var run_continue_30_sec_cron = schedule.scheduleJob('*/30 * * * * *', function () {
var daily_cron = schedule.scheduleJob('0 0 0 * * *', function () {
    utils.payment_transaction(null, null)
});


