var provider_earning = require('../admin_controllers/provider_earning');
 ///// Provider Earning /////
 module.exports = function(app){
    app.route('/provider_earning').get(provider_earning.provider_earning);
    app.route('/provider_earning').post(provider_earning.provider_earning);
    app.route('/statement_provider_earning').post(provider_earning.statement_provider_earning);
    app.route('/provider_earning_export_excel').post(provider_earning.provider_earning_export_excel);

}
