var partner_payments = require('../admin_controllers/partner_payments');
module.exports = function (app) {
    app.route('/partner_payments').get(partner_payments.partner_payments);
    app.route('/partner_card_type').post(partner_payments.card_type);
    app.route('/partner_add_card').post(partner_payments.add_card);
    app.route('/delete_partner_card').post(partner_payments.delete_card);
    app.route('/partner_card_selection').post(partner_payments.card_selection);
    app.route('/check_card').post(partner_payments.check_card);
    app.route('/partner_add_wallet_amount').post(partner_payments.partner_add_wallet_amount);
   	 
};