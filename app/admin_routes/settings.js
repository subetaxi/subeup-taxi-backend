var admin = require('../admin_controllers/settings');
var admins = require('mongoose').model('admin');
var session = require("express-session");

module.exports = function (app) {

    app.route('/installation_settings').get(admin.installation_settings);
    app.route('/terms_and_privacy_setting').get(admin.terms_and_privacy_setting);
    app.route('/admin_twilio_settings_update').post(admin.twilio_settings_update);
    app.route('/admin_email_settings_update').post(admin.email_settings_update);
    app.route('/admin_google_api_key_settings_update').post(admin.google_api_key_settings_update);
    app.route('/admin_gcm_api_key_settings_update').post(admin.gcm_api_key_settings_update);
    app.route('/admin_payment_gate_way_settings_update').post(admin.payment_gate_way_settings_update);

    app.route('/update_firebase_key').post(admin.update_firebase_key);
    app.route('/update_user_terms_and_condition').post(admin.update_user_terms_and_condition);
    app.route('/update_provider_terms_and_condition').post(admin.update_provider_terms_and_condition);
    app.route('/update_user_privacy_policy').post(admin.update_user_privacy_policy);
    app.route('/update_provider_privacy_policy').post(admin.update_provider_privacy_policy);



    app.route('/update_app_name').post(admin.update_app_name);
    app.route('/update_app_version').post(admin.update_app_version);

    app.route('/upload_ios_push_certificate').post(admin.upload_ios_push_certificate);
    app.route('/upload_logo_images').post(admin.upload_logo_images);
    app.route('/settings').get(admin.settings);
    app.route('/admin_settings_update').post(admin.admin_settings_update);

    app.route('/update_notification_setting').post(admin.update_notification_setting);
    app.route('/update_app_key').post(admin.update_app_key);

    app.route('/admin_android_app_url_settings_update').post(admin.android_app_url_settings_update);

    app.route('/admin_ios_app_url_settings_update').post(admin.ios_app_url_settings_update);
}