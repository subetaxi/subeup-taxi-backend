var providers = require('../../app/controllers/providers'); // include Provider controller ////


module.exports = function (app) {

    app.route('/providerregister').post(providers.provider_register);
    app.route('/providerupdatedetail').post(providers.provider_update);
    app.route('/provider_location').post(providers.update_location);
    app.route('/providerslogin').post(providers.provider_login);
    app.route('/providerlogout').post(providers.logout);
    app.route('/togglestate').post(providers.change_provider_status);
    app.route('/get_provider_detail').post(providers.get_provider_detail);
    app.route('/get_provider_info').post(providers.get_provider_info);
    app.route('/getproviderlatlong').post(providers.getproviderlatlong);
    app.route('/providerupdatetype').post(providers.provider_updatetype);
    app.route('/updateproviderdevicetoken').post(providers.update_device_token);
    app.route('/provider_heat_map').post(providers.provider_heat_map);

    app.route('/apply_provider_referral_code').post(providers.apply_provider_referral_code);
    
    app.route('/update_provider_setting').post(providers.update_provider_setting);
    app.route('/get_provider_referal_credit').post(providers.get_provider_referal_credit);

    app.route('/get_provider_terms_and_condition').get(providers.get_provider_terms_and_condition);
    app.route('/get_provider_privacy_policy').get(providers.get_provider_privacy_policy);

    app.route('/provider_add_vehicle').post(providers.provider_add_vehicle);
    app.route('/upload_vehicle_document').post(providers.upload_vehicle_document);
    app.route('/get_provider_vehicle_detail').post(providers.get_provider_vehicle_detail);
    app.route('/get_provider_vehicle_list').post(providers.get_provider_vehicle_list);
    app.route('/change_current_vehicle').post(providers.change_current_vehicle);
    app.route('/provider_update_vehicle_detail').post(providers.provider_update_vehicle_detail);
    app.route('/provider_delete_vehicle_detail').post(providers.provider_delete_vehicle_detail);
    app.route('/get_provider_setting_detail').post(providers.get_provider_setting_detail);

};