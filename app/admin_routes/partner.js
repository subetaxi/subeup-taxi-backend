var partner = require('../admin_controllers/partner');

module.exports = function (app) {

    app.route('/partner_header').get(partner.header);
    app.route('/partner_login').get(partner.login);



    app.route('/partner_login').post(partner.partner_login);
    app.route('/partner_register').get(partner.register);
    app.route('/partner_register').post(partner.partner_create);
    app.route('/partner_forgot_password').get(partner.partner_forgot_password);
    app.route('/partner_forgot_password_email').post(partner.partner_forgot_password_email);
    app.route('/partner_update_psw').post(partner.update_psw);
    app.route('/partner_newpassword').get(partner.edit_psw);
    app.route('/profile').get(partner.profile);
    app.route('/partner_edit_profile').post(partner.edit_profile);
    app.route('/partner_sign_out').get(partner.sign_out);
    app.route('/city_list').post(partner.city_list);
    app.route('/partner_providers').get(partner.list);
    app.route('/partner_providers').post(partner.list);
    app.route('/partner_proivder_documents').post(partner.documents);
    app.route('/partner_provider_history').post(partner.partner_provider_history);
    app.route('/partner_add_provider').get(partner.add);
    app.route('/partner_add_provider').post(partner.create_provider);
    app.route('/partner_provider_edit').post(partner.edit);
    app.route('/partner_provider_update').post(partner.update);
    app.route('/partner_trip_map').post(partner.partner_trip_map);
    app.route('/partners').get(partner.partner_list);
    app.route('/partners').post(partner.partner_list);
    app.route('/partner_provider_list').get(partner.partner_provider_list);
    app.route('/partner_provider_list').post(partner.partner_provider_list);
    app.route('/partner_is_approved').post(partner.partner_is_approved);
    app.route('/partner_detail').post(partner.partner_detail);
    app.route('/partner_requests').get(partner.partner_requests);
    app.route('/partner_requests').post(partner.partner_requests);

    app.route('/check_provider').post(partner.check_provider);
    app.route('/admin_add_partner_wallet_amount').post(partner.add_partner_wallet_amount);


    app.route('/add_bank_detail_partner').post(partner.add_bank_detail_partner);
    app.route('/delete_bank_detail_partner').post(partner.delete_bank_detail_partner);
    app.route('/get_bank_detail_partner').post(partner.get_bank_detail_partner);

    app.route('/partner_provider_documents_update').post(partner.partner_provider_documents_update);
    app.route('/partner_provider_documents_edit').post(partner.partner_provider_documents_edit);


    // PARTNER VEHICLE RELATED ALL API. //
    app.route('/partner_vehicle').get(partner.partner_vehicle);
    app.route('/partner_add_vehicle_details').post(partner.partner_add_vehicle_details);

    app.route('/partner_edit_vehicle_detail').post(partner.partner_edit_vehicle_detail);
    app.route('/partner_add_vehicle').get(partner.partner_add_vehicle);
    app.route('/partner_add_vehicle').post(partner.partner_add_vehicle);

    app.route('/partner_update_vehicle_details').post(partner.update_vehicle_detail);
    app.route('/vehicle_document_list_for_partner').post(partner.vehicle_document_list_for_partner);

    app.route('/vehicle_documents_edit_for_partner').post(partner.vehicle_documents_edit_for_partner);
    app.route('/vehicle_documents_update_for_partner').post(partner.vehicle_documents_update_for_partner);


    // 29 May //
    app.route('/genetare_partner_excel').post(partner.genetare_partner_excel);
    app.route('/genetare_partner_request_excel').post(partner.genetare_partner_request_excel);
    
    app.route('/genetare_partner_provider_excel').post(partner.genetare_partner_provider_excel);
    app.route('/partner_providers_excel').post(partner.partner_providers_excel);
   
    app.route('/generate_partner_provider_history_excel').post(partner.generate_partner_provider_history_excel);
    
    
    
    //    // 

    //FOR admin panel //
    app.route('/partner_vehicle_list').post(partner.partner_vehicle_list);
    app.route('/edit_partner_vehicle_detail').post(partner.edit_partner_vehicle_detail);
    app.route('/update_partner_vehicle_detail').post(partner.update_partner_vehicle_detail);

    app.route('/vehicle_document_list_partner').post(partner.vehicle_document_list_partner);
    app.route('/vehicle_documents_edit_partner').post(partner.vehicle_documents_edit_partner);
    app.route('/vehicle_documents_update_partner').post(partner.vehicle_documents_update_partner);
    app.route('/get_available_vehicle_list').post(partner.get_available_vehicle_list);

    app.route('/assign_vehicle_to_provider').post(partner.assign_vehicle_to_provider);
    app.route('/remove_vehicle_from_provider').post(partner.remove_vehicle_from_provider);


    app.route('/partner_wallet_history').get(partner.partner_wallet_history);
    app.route('/partner_wallet_history').post(partner.partner_wallet_history);


};
