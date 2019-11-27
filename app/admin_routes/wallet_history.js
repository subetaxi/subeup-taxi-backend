var wallet_history = require('../admin_controllers/wallet_history');

module.exports = function (app) {
    app.route('/wallet_history').get(wallet_history.admin_wallet_history);
    app.route('/wallet_history').post(wallet_history.admin_wallet_history);
    app.route('/generate_wallet_history_excel').post(wallet_history.generate_wallet_history_excel);
    
    
};