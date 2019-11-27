var bankdetail = require('../admin_controllers/bank_detail'); 
var bank_detail = require('mongoose').model('bank_detail'); 


module.exports = function (app) {
    
    app.route('/partner_bank_detail').get(bankdetail.partner_bank_detail);

    app.route('/admin_partner_bank_detail').post(bankdetail.admin_partner_bank_detail);

    app.route('/admin_dispatcher_bank_detail').post(bankdetail.admin_dispatcher_bank_detail);
    
    app.route('/admin_corporate_bank_detail').post(bankdetail.admin_corporate_bank_detail);

    app.route('/partner_provider_bank_detail').post(bankdetail.partner_provider_bank_detail);
    
    app.route('/dispatcher_bank_detail').get(bankdetail.dispatcher_bank_detail);

    app.route('/provider_bank_detail').post(bankdetail.admin_provider_bank_detail);

    app.route('/provider_bank_detail').get(bankdetail.provider_bank_detail);
    
    app.route('/add_bank_details').post(bankdetail.add_bank_detail);

    app.route('/update_bank_details').post(bankdetail.update_bank_detail);
    
}





