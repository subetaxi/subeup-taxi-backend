var wallet_history = require('../../app/controllers/wallet_history'); // include wallet_history controller ////


module.exports = function (app) {
    app.route('/get_wallet_history').post(wallet_history.get_wallet_history);

}





