var partner_earning = require('../admin_controllers/partner_earning');

module.exports = function (app) {
    app.route('/partner_earning').get(partner_earning.partner_earning);
    app.route('/partner_earning').post(partner_earning.partner_earning);
    
    app.route('/statement_partner_weekly_earning').post(partner_earning.statement_partner_weekly_earning);
   
};