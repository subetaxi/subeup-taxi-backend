var weekly_earning = require('../admin_controllers/weekly_earning');

module.exports = function (app) {
    app.route('/weekly_earning').get(weekly_earning.weekly_earning);
    app.route('/weekly_earning').post(weekly_earning.weekly_earning);
    app.route('/statement_provider_weekly_earning').post(weekly_earning.statement_provider_weekly_earning);
    app.route('/admin_paidtoprovider').post(weekly_earning.admin_paidtoprovider);
    app.route('/generate_weekly_earning_excel').post(weekly_earning.generate_weekly_earning_excel);
 
};