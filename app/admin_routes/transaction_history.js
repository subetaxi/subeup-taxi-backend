var transaction_history = require('../admin_controllers/transaction_history');

module.exports = function (app) {
    app.route('/transaction_history').get(transaction_history.admin_transaction_history);
    app.route('/transaction_history').post(transaction_history.admin_transaction_history);
    app.route('/generate_transaction_history_excel').post(transaction_history.generate_transaction_history_excel);
    
};