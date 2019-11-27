var payments = require('../user_controllers/payments');
module.exports = function (app) {
    app.route('/payments').get(payments.user_payments);
    app.route('/card_type').post(payments.card_type);
    app.route('/add_card').post(payments.add_card);
    app.route('/delete_user_card').post(payments.delete_card);
    app.route('/user_card_selection').post(payments.card_selection);
    app.route('/check_card').post(payments.check_card);
    app.route('/user_add_wallet_amount').post(payments.user_add_wallet_amount);
   	 
};