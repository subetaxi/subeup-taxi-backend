var pending_payments = require('../admin_controllers/pending_payments');
module.exports = function(app){
    app.route('/pending_payment').get(pending_payments.pending_payment);
    app.route('/pending_payment').post(pending_payments.pending_payment);
    app.route('/is_paid').post(pending_payments.is_paid);
    app.route('/pending_payment_excel').post(pending_payments.pending_payment_excel);
}