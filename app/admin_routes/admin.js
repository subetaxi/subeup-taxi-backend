var admin = require('../admin_controllers/admin');
var admins = require('mongoose').model('admin');
var session = require("express-session");

module.exports = function (app) {
    app.route('/admin').get(admin.login);
    app.route('/admin').post(admin.check_auth);
    app.route('/forgot_psw').get(admin.forgot_psw);
    app.route('/forgot_psw_email').post(admin.forgot_psw_email);
    app.route('/update_psw').post(admin.update_psw);
    app.route('/newpassword').get(admin.edit_psw);
    app.route('/sign_out').get(admin.sign_out);
    app.route('/admin_list').get(admin.admin_list);
    app.route('/add_admin').post(admin.add);
    app.route('/add_admin_detail').post(admin.add_admin_detail);
    app.route('/edit_admin').post(admin.edit);
    app.route('/delete_admin').post(admin.delete);
    app.route('/update_admin').post(admin.update_admin);
    app.route('/errorPage').get(admin.errorPage);
    app.route('/session_data').post(admin.session_data);
    app.route('/support').get(admin.support);

    // app.route('/languange_api_admin').get(admin.languange_api_admin);
    // app.route('/languange_api_dispatcher').get(admin.languange_api_dispatcher);
};