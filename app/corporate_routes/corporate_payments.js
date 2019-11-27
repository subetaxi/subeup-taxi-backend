var corporate_payments = require('../corporate_controllers/corporate_payments');
module.exports = function (app) {
    app.route('/corporate_payments').get(corporate_payments.corporate_payments);
    app.route('/corporate_card_type').post(corporate_payments.card_type);
    app.route('/corporate_add_card').post(corporate_payments.add_card);
    app.route('/delete_corporate_card').post(corporate_payments.delete_card);
    app.route('/corporate_card_selection').post(corporate_payments.card_selection);
    app.route('/check_card').post(corporate_payments.check_card);
    app.route('/corporate_add_wallet_amount').post(corporate_payments.corporate_add_wallet_amount);

    app.route('/add_bank_detail_corporate').post(corporate_payments.add_bank_detail_corporate);
    app.route('/delete_bank_detail_corporate').post(corporate_payments.delete_bank_detail_corporate);
    app.route('/get_bank_detail_corporate').post(corporate_payments.get_bank_detail_corporate);

    app.route('/corporate_wallet_history').get(corporate_payments.corporate_wallet_history);
    app.route('/corporate_wallet_history').post(corporate_payments.corporate_wallet_history);
   	 
};