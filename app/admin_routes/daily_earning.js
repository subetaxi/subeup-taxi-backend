var daily_earning = require('../admin_controllers/daily_earning');
module.exports = function (app) {
    app.route('/daily_earning').post(daily_earning.daily_earning);
    app.route('/daily_earning').get(daily_earning.daily_earning);
    app.route('/statement_provider_daily_earning').post(daily_earning.statement_provider_daily_earning);

//    app.route('/daily_earning_excel').post(daily_earning.daily_earning_excel);
    app.route('/get_city_list').post(daily_earning.get_city_list);

    app.route('/generate_daily_earning_excel').post(daily_earning.generate_daily_earning_excel);



};