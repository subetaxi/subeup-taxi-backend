var providers = require('../provider_controllers/provider');
var provider_earning = require('../admin_controllers/provider_earning');
var provider_daily_earning = require('../admin_controllers/provider_daily_earning');
var provider_weekly_earning = require('../admin_controllers/provider_weekly_earning');
module.exports = function (app) {

    app.route('/provider_register').get(providers.provider_register);
    app.route('/provider_register').post(providers.provider_register_post);
    app.route('/provider_login').get(providers.provider_login);
    app.route('/provider_login').post(providers.provider_login_post);
    app.route('/provider_logout').get(providers.provider_sign_out);
    app.route('/provider_trip_map').post(providers.provider_trip_map);
    app.route('/provider_profiles').get(providers.provider_profile);
    app.route('/provider_profile_update').post(providers.provider_profile_update);
    app.route('/provider_document_panel').get(providers.provider_document_panel);
    app.route('/provider_document_panel').post(providers.provider_document_panel);
    app.route('/provider_update_documentpanel').post(providers.provider_update_documentpanel);
    app.route('/provider_forgot_password').get(providers.forgot_password);
    app.route('/provider_forgot_password').post(providers.forgot_psw_email);
    app.route('/provider_update_psw').post(providers.update_psw);
    app.route('/provider_newpassword').get(providers.edit_psw);


    app.route('/provider_earnings').post(provider_earning.provider_earning);
    app.route('/provider_daily_earnings').post(provider_daily_earning.provider_daily_earning);
    app.route('/provider_weekly_earnings').post(provider_weekly_earning.provider_weekly_earning);

    app.route('/provider_social_login_web').post(providers.provider_social_login_web);

    app.route('/provider_vehicle').get(providers.provider_vehicle);
    app.route('/provider_add_vehicle_details').post(providers.provider_add_vehicle_details);

    app.route('/provider_edit_vehicle_detail').post(providers.edit_vehicle_detail);
    app.route('/provider_add_vehicle').get(providers.provider_add_vehicle);
    app.route('/provider_update_vehicle_details').post(providers.update_vehicle_detail);
    app.route('/provider_vehicle_document_list').post(providers.vehicle_document_list);

    app.route('/vehicle_documents_edit').post(providers.provider_vehicle_documents_edit);
    app.route('/vehicle_documents_update').post(providers.provider_vehicle_documents_update);

    app.route('/provider_document_edit').post(providers.provider_documents_edit);
    app.route('/provider_document_update').post(providers.provider_documents_update);
};