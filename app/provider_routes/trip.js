var providers = require('../provider_controllers/trip');
module.exports = function (app) {

    app.route('/provider_history').get(providers.provider_request);
    app.route('/provider_history').post(providers.provider_request);
    
    app.route('/provider_wallet_history').get(providers.provider_wallet_history);
    app.route('/provider_wallet_history').post(providers.provider_wallet_history);
    
    app.route('/provider_history_export_excel').post(providers.provider_history_export_excel);

    
};