var partner_weekly_earning = require('../admin_controllers/admin_partner_weekly_earning');

module.exports = function (app) {
    ///// Admin Partner earning 
    app.route('/admin_partner_weekly_earning').get(partner_weekly_earning.admin_partner_weekly_earning);
    app.route('/admin_partner_weekly_earning').post(partner_weekly_earning.admin_partner_weekly_earning);

    app.route('/admin_partner_weekly_earning_statement').post(partner_weekly_earning.admin_partner_weekly_earning_statement);

    app.route('/generate_partner_weekly_earning_excel').post(partner_weekly_earning.generate_partner_weekly_earning_excel);


};