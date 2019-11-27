var utils = require('./utils');
var myAnalytics = require('./provider_analytics');
require('./constant');
var Provider_daily_analytic = require('mongoose').model('provider_daily_analytic');
var moment = require('moment');
var utils = require('./utils');

exports.insert_daily_provider_analytics_with_date = function (date_now, city_timezone, provider_id, trip_status, start_time) {

    var city_date_now = utils.get_date_now_at_city(date_now, city_timezone);
    var today = moment(city_date_now).startOf('day');

    var tag_date = moment(today).format(constant_json.DATE_FORMAT_MMM_D_YYYY);

    var trip_status = Number(trip_status);
    Provider_daily_analytic.findOne({provider_id: provider_id, date_tag: tag_date}).then((provider_daily_analytic) => { 
        var received = 0, accepted = 0, rejected = 0, not_answered = 0, cancelled = 0, completed = 0;
        var acception_ratio = 0, cancellation_ratio = 0, rejection_ratio = 0, completed_ratio = 0;
        var total_online_time = 0;
        var online_times = [];


        if (provider_daily_analytic) {
            received = provider_daily_analytic.received;
            accepted = provider_daily_analytic.accepted;
            rejected = provider_daily_analytic.rejected;
            not_answered = provider_daily_analytic.not_answered;
            cancelled = provider_daily_analytic.cancelled;
            completed = provider_daily_analytic.completed;
            acception_ratio = provider_daily_analytic.acception_ratio;
            cancellation_ratio = provider_daily_analytic.cancellation_ratio;
            rejection_ratio = provider_daily_analytic.rejection_ratio;
            completed_ratio = provider_daily_analytic.completed_ratio;
            total_online_time = provider_daily_analytic.total_online_time;
            online_times = provider_daily_analytic.online_times;
        }

        if (trip_status > 0) {

            switch (trip_status) {
                case TRIP_STATUS.WAITING_FOR_PROVIDER:
                    received++;
                    break;

                case TRIP_STATUS.PROVIDER_ACCEPTED:
                    accepted++;
                    break;

                case TRIP_STATUS.PROVIDER_REJECTED:
                    rejected++;
                    break;

                case TRIP_STATUS.PROVIDER_CANCELLED:
                    cancelled++;
                    break;

                case TRIP_STATUS.TRIP_COMPLETED:
                    completed++;
                    break;
                case TRIP_STATUS.NOT_ANSWERED:
                    not_answered++;
                    break;
                case TRIP_STATUS.INITIATE_TRIP:
                    received++;
                    accepted++;
                    break;
                default :
                    break;
            }

            if ((Number(received)) > 0) {
                acception_ratio = utils.precisionRoundTwo(Number((accepted * 100) / received));
                cancellation_ratio = utils.precisionRoundTwo(Number((cancelled * 100) / received));
                completed_ratio = utils.precisionRoundTwo(Number((completed * 100) / received));
                rejection_ratio = utils.precisionRoundTwo(Number((rejected * 100) / received));
            }
        } else {
            var time = {is_start_time: true, time: date_now};
            if (start_time != null) {
                time.is_start_time = false;
                time_diff_in_sec = utils.getTimeDifferenceInSecond(date_now, start_time);
                total_online_time = +total_online_time + +time_diff_in_sec;
            }
            online_times.push(time);
        }

        if (total_online_time < 0) {
            total_online_time = 0;
        }


        if (provider_daily_analytic) {
            if (trip_status > 0) {
                provider_daily_analytic.received = received;
                provider_daily_analytic.accepted = accepted;
                provider_daily_analytic.rejected = rejected;
                provider_daily_analytic.not_answered = not_answered;
                provider_daily_analytic.cancelled = cancelled;
                provider_daily_analytic.completed = completed;
                provider_daily_analytic.acception_ratio = acception_ratio;
                provider_daily_analytic.cancellation_ratio = cancellation_ratio;
                provider_daily_analytic.rejection_ratio = rejection_ratio;
                provider_daily_analytic.completed_ratio = completed_ratio;
            } else {
                provider_daily_analytic.total_online_time = total_online_time;
                provider_daily_analytic.online_times = online_times;
            }

            provider_daily_analytic.save().then(() => { 
                console.log("provider_analytic_daily saved.");
            }, (err) => {
                console.log(err)
                myAnalytics.insert_daily_provider_analytics_with_date(date_now, city_timezone, provider_id, trip_status, start_time)
            });

        } else {

            var provider_daily_analytic = new Provider_daily_analytic({
                provider_id: provider_id,
                date_server_timezone: tag_date,
                date_tag: tag_date,
                received: received,
                accepted: accepted,
                rejected: rejected,
                not_answered: not_answered,
                cancelled: cancelled,
                completed: completed,
                acception_ratio: acception_ratio,
                cancellation_ratio: cancellation_ratio,
                rejection_ratio: rejection_ratio,
                completed_ratio: completed_ratio,
                total_online_time: total_online_time
            });
            provider_daily_analytic.save().then(() => { 
                console.log("provider_analytic_daily saved.");
            }, (err) => {
                console.log(err)
                myAnalytics.insert_daily_provider_analytics_with_date(date_now, city_timezone, provider_id, trip_status, start_time)
            });
        }
    });
};


exports.insert_daily_provider_analytics = function (city_timezone, provider_id, trip_status, start_time) {
    var date_now = new Date();
    myAnalytics.insert_daily_provider_analytics_with_date(date_now, city_timezone, provider_id, trip_status, start_time);
};

