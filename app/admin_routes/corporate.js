var corporate = require('../admin_controllers/corporate');
var admins = require('mongoose').model('admin');
var session = require("express-session");

module.exports = function (app) {


    app.route('/corporate').get(corporate.list);
    app.route('/corporate').post(corporate.list);
    app.route('/genetare_corporate_excel').post(corporate.genetare_corporate_excel);
    app.route('/edit_corporate').post(corporate.edit_corporate);
    app.route('/update_corporate_detail').post(corporate.update_corporate_detail);
    app.route('/corporate_is_approved').post(corporate.corporate_is_approved);
    app.route('/admin_add_corporate_wallet_amount').post(corporate.add_corporate_wallet_amount);

}
