var provider_earning = require('../../app/controllers/provider_earning');
var ProviderDailyEarning = require('mongoose').model('provider_daily_earning');

module.exports = function (app) {

    app.route('/get_provider_daily_earning_detail').post(provider_earning.get_provider_daily_earning_detail);
    app.route('/get_provider_weekly_earning_detail').post(provider_earning.get_provider_weekly_earning_detail);

};





