var users = require('../user_controllers/user');
module.exports = function (app) {

    app.route('/register').get(users.user_register);
    app.route('/user_register').post(users.user_register_post);
    app.route('/login').get(users.user_login);
    app.route('/').get(users.landing);
    app.route('/user_login').post(users.user_login_post);
    app.route('/logout').get(users.user_sign_out);
    app.route('/trip_map').post(users.user_trip_map);
    app.route('/profiles').get(users.user_profile);
    app.route('/user_profile_update').post(users.user_profile_update);
    app.route('/check_promocode').post(users.check_promocode);
    app.route('/user_forgot_password').get(users.forgot_password);
    app.route('/user_forgot_password').post(users.forgot_psw_email);
    app.route('/user_update_psw').post(users.update_psw);
    app.route('/user_newpassword').get(users.edit_psw);
    app.route('/user_document_panel').get(users.user_document_panel);
    app.route('/user_document_panel').post(users.user_document_panel);
    app.route('/user_update_documentpanel').post(users.user_update_documentpanel);
    app.route('/change_password').post(users.change_password);
    app.route('/change_password').post(users.change_password);
    app.route('/referral_user').post(users.apply_referral_code);

    app.route('/user_social_login_web').post(users.user_social_login_web);

    app.route('/user_document_edit').post(users.user_documents_edit);
    app.route('/user_document_update').post(users.user_documents_update);
    
    app.route('/generate_user_history_export_excel').post(users.generate_user_history_export_excel);
    
    app.route('/generate_user_future_trip_export_excel').post(users.generate_user_future_trip_export_excel);
    
};