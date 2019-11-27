var utils = require('./utils');
var Trip = require('mongoose').model('Trip');
var Settings = require('mongoose').model('Settings');
var User = require('mongoose').model('User');
var Card = require('mongoose').model('Card');
var moment = require('moment');
var Citytype = require('mongoose').model('city_type');
var utils = require('./utils');
//////////////  CREATE FUTURE TRIP/////////
exports.createfuturetrip = function (req, res) {

    utils.check_request_params(req.body, [], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}, function (err, user) {
                if (user) {
                    if (req.body.token != null && user.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        if (user.wallet < 0) {
                            res.json({success: false, error_code: error_message.ERROR_CODE_YOUR_TRIP_PAYMENT_IS_PENDING});
                        } else {

                            var service_type_id = req.body.service_type_id;
                            Citytype.findOne({_id: service_type_id}, function (err, citytype) {
                                if (citytype) {
                                    var city_id = citytype.cityid;
                                    var country_id = citytype.countryid;

                                    var ScheduledTripCount = 1;

                                    ScheduledTrip.findOne({}, function (err, scheduletrip_count) {

                                        if (scheduletrip_count) {
                                            ScheduledTripCount = scheduletrip_count.unique_id + 1;
                                        }


                                        var timezone = req.body.timezone;
                                        var start_time = req.body.start_time;
                                        var nowDate = new Date();
                                        var nowMiliSec = moment(nowDate, 'YYYY-MM-DD hh:mm:ss');
                                        var addMiliSec = new Date().getTime() + +start_time;
                                        var date = new Date(addMiliSec);
                                        // Start 6 March //
                                        var is_fixed_fare = false;
                                        var fixed_price = 0;
                                        var received_trip_from_gender = [];
                                        var provider_language = [];
                                        var accessibility = [];

                                        if (req.body.is_fixed_fare != undefined) {
                                            is_fixed_fare = req.body.is_fixed_fare;
                                            if (is_fixed_fare) {
                                                fixed_price = req.body.fixed_price;
                                            }
                                        }
                                        if (req.body.received_trip_from_gender != undefined) {
                                            received_trip_from_gender = req.body.received_trip_from_gender;
                                        }

                                        if (req.body.provider_language != undefined) {
                                            provider_language = req.body.provider_language;
                                        }

                                        if (req.body.accessibility != undefined) {
                                            accessibility = req.body.accessibility;
                                        }
                                        // End 6 March //

                                        User.findOne({_id: req.body.user_id}, function (err, user) {


                                            var scheduledtrip = new ScheduledTrip({
                                                user_id: req.body.user_id,
                                                unique_id: ScheduledTripCount,
                                                sourceLocation: [req.body.latitude, req.body.longitude],
                                                destinationLocation: [req.body.d_latitude, req.body.d_longitude],
                                                token: req.body.token,
                                                timezone: req.body.timezone,
                                                source_address: req.body.source_address,
                                                destination_address: req.body.destination_address,
                                                payment_mode: req.body.payment_mode,
                                                is_trip_created: 0,
                                                cancel_reason: "",
                                                is_schedule_trip_cancelled: 0,
                                                is_surge_hours: req.body.is_surge_hours,
                                                trip_id: null,
                                                no_of_time_send_request: 0,
                                                server_start_time: date,
                                                start_time: req.body.start_time,
                                                service_type_id: service_type_id,
                                                user_type: req.body.user_type,
                                                user_type_id: req.body.user_type_id,
                                                provider_type: Number(constant_json.PROVIDER_TYPE_NORMAL),
                                                provider_type_id: null,
                                                payment_id: req.body.payment_id,

                                                // Start 6 March //
                                                country_id: country_id,
                                                city_id: city_id,
                                                fixed_price: fixed_price,
                                                is_fixed_fare: is_fixed_fare,
                                                received_trip_from_gender: received_trip_from_gender,
                                                provider_language: provider_language,
                                                accessibility: accessibility
                                                // End 6 March //

                                            });

                                            Card.find({user_id: req.body.user_id}, function (err, card) {
                                                if (req.body.payment_mode === Number(constant_json.PAYMENT_MODE_CARD)) {

                                                    if (card.length === 0) {
                                                        return res.json({
                                                            success: false,
                                                            error_code: error_message.ERROR_CODE_ADD_CREDIT_CARD_FIRST
                                                        });
                                                    }
                                                }


                                                scheduledtrip.save(function (err) {
                                                    if (err) {
                                                        console.log(err);
                                                    } else {

                                                        Settings.findOne({}, function (err, settingData) {
                                                            User.findOne({_id: req.body.user_id}, function (err, user) {
                                                                var phoneWithCode = user.country_phone_code + user.phone;
                                                                var sms_notification = settingData.sms_notification;
                                                                if (sms_notification === true) {
                                                                    utils.sendOtherSMS(phoneWithCode, 4, "");
                                                                }
                                                                message = success_messages.success_message_schedule_trip_create_successfully;

                                                                res.json({
                                                                    success: true,
                                                                    message: success_messages.MESSAGE_CODE_YOUR_FUTURE_TRIP_CREATE_SUCCESSFULLY,
                                                                    _id: scheduledtrip._id,
                                                                    user_id: scheduledtrip.user_id,
                                                                    timezone: scheduledtrip.timezone,
                                                                    payment_mode: scheduledtrip.payment_mode,
                                                                    source_address: scheduledtrip.source_address,
                                                                    destination_address: scheduledtrip.destination_address,
                                                                    start_time: scheduledtrip.start_time,
                                                                    server_start_time: scheduledtrip.server_start_time,
                                                                    sourceLocation: scheduledtrip.sourceLocation,
                                                                    destinationLocation: scheduledtrip.destinationLocation


                                                                });
                                                            });
                                                        });
                                                    }
                                                });
                                            });

                                        });


                                    }).sort({_id: -1}).limit(1);

                                }
                            });

                        }
                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});

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


/////////////GET FUTURE TRIP///////////
exports.getfuturetrip = function (req, res) {
    User.findOne({_id: req.body.user_id}, function (err, user) {
        if (user)
        {
            if (req.body.token != null && user.token != req.body.token) {
                res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
            } else
            {
                Trip.find({user_id: req.body.user_id, is_schedule_trip: true, is_trip_cancelled: 0, is_trip_completed: 0, is_trip_end: 0, provider_id: null, current_provider: null}, function (err, scheduledtrip) {

                    if (err || scheduledtrip.length === 0) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_NO_SCHEDULED_TRIP_FOUND});

                    } else {
                        res.json({success: true, message: success_messages.MESSAGE_CODE_GET_YOUR_FUTURE_TRIP_SUCCESSFULLY, scheduledtrip: scheduledtrip});
                    }
                });
            }
        } else
        {
            res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});

        }
    });
};


//////////// cancelScheduledtrip////////////

exports.cancelScheduledtrip = function (req, res) {

    utils.check_request_params(req.body, [], function (response) {
        if (response.success) {
            ScheduledTrip.findOneAndUpdate({_id: req.body.scheduledtrip_id}, req.body, {new: true}, function (err, scheduledtrip) {

                if (scheduledtrip) {
                    if (scheduledtrip.is_schedule_trip_cancelled == 0 && scheduledtrip.is_trip_created == 0) {
                        scheduledtrip.is_schedule_trip_cancelled = 1;
                        scheduledtrip.save();
                        res.json({
                            success: true,
                            message: success_messages.MESSAGE_CODE_YOUR_FUTURE_TRIP_CANCELLED_SUCCESSFULLY,
                            is_schedule_trip_cancelled: scheduledtrip.is_schedule_trip_cancelled
                        });
                    } else {
                        res.json({
                            success: false,
                            error_code: error_message.ERROR_CODE_MIS_MATCH_SCHEDULETRIP_ID
                        });
                    }
                } else {
                    res.json({
                        success: false,
                        error_code: error_message.ERROR_CODE_MIS_MATCH_SCHEDULETRIP_ID
                    });
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


