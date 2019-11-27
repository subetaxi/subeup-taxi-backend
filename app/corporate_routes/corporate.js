var corporate = require('../corporate_controllers/corporate');

module.exports = function (app) {

    app.route('/corporate_header').get(corporate.corporate_header);
    app.route('/corporate_login').get(corporate.login);
    app.route('/corporate_login').post(corporate.corporate_login);
    app.route('/corporate_register').get(corporate.register);
    app.route('/corporate_register').post(corporate.corporate_create);
    app.route('/corporate_forgot_password').get(corporate.corporate_forgot_password);
    app.route('/corporate_forgot_password_email').post(corporate.corporate_forgot_password_email);
    app.route('/corporate_update_psw').post(corporate.update_psw);
    app.route('/corporate_newpassword').get(corporate.edit_psw);
    app.route('/corporate_profile').get(corporate.corporate_profile);
    app.route('/corporate_edit_profile').post(corporate.corporate_edit_profile);
    app.route('/corporate_sign_out').get(corporate.corporate_sign_out);

    app.route('/corporate_users').get(corporate.corporate_users);
    app.route('/corporate_users').post(corporate.corporate_users);
    app.route('/corporate_send_request').post(corporate.corporate_send_request);
    app.route('/corporate_remove_user').post(corporate.corporate_remove_user);
    
    app.route('/corporate_create_trip').get(corporate.corporate_create_trip);
    app.route('/corporate_request').get(corporate.corporate_request);
    app.route('/corporate_request').post(corporate.corporate_request);

    app.route('/corporate_future_request').get(corporate.corporate_future_request);
    app.route('/corporate_future_request').post(corporate.corporate_future_request);

    app.route('/corporate_trip_map').post(corporate.corporate_trip_map);


}