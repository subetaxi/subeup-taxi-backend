var provider_daily_earning = require('../admin_controllers/provider_daily_earning');
module.exports = function(app){
    app.route('/provider_daily_earning').post(provider_daily_earning.provider_daily_earning);
    app.route('/provider_daily_earning').get(provider_daily_earning.provider_daily_earning);
    app.route('/get_city_list').post(provider_daily_earning.get_city_list);
    app.route('/provider_daily_earning_export_excel').post(provider_daily_earning.provider_daily_earning_export_excel);
}