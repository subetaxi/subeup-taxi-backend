var payment_transaction = require('../admin_controllers/payment_transaction');
var utils = require('../controllers/utils');
module.exports = function (app) {

    app.route('/admin_add_card').post(payment_transaction.add_card);
    app.route('/admin_delete_card').post(payment_transaction.delete_card);
    app.route('/payment_pending').get(payment_transaction.payment_pending);
    app.route('/payment_transaction').get(utils.payment_transaction);
};