var dispatcher = require('../admin_controllers/dispatcher');
var admins = require('mongoose').model('admin');
var session = require("express-session");

module.exports = function (app) {


    app.route('/dispatcher').get(dispatcher.list);
    app.route('/dispatcher').post(dispatcher.list);

    app.route('/add_dispatcher').post(dispatcher.add_dispatcher);
    app.route('/add_dispatcher_detail').post(dispatcher.add_dispatcher_detail);
    app.route('/edit_dispatcher').post(dispatcher.edit_dispatcher);
    app.route('/update_dispatcher_detail').post(dispatcher.update_dispatcher_detail);
    app.route('/genetare_dispatcher_excel').post(dispatcher.genetare_dispatcher_excel);
    app.route('/dispatcher_login').get(dispatcher.login);
    app.route('/dispatcher_login').post(dispatcher.dispatcher_login);
    app.route('/dispatcher_create_trip').get(dispatcher.dispatcher_create_trip);

    app.route('/dispatcher_header').get(dispatcher.dispatcher_header);

    app.route('/dispatcher_request').get(dispatcher.dispatcher_request);
    app.route('/dispatcher_request').post(dispatcher.dispatcher_request);

    app.route('/dispatcher_future_request').get(dispatcher.dispatcher_future_request);
    app.route('/dispatcher_future_request').post(dispatcher.dispatcher_future_request);

    app.route('/dispatcher_trip_map').post(dispatcher.dispatcher_trip_map);

    app.route('/dispatcher_forgot_password').get(dispatcher.dispatcher_forgot_password);
    app.route('/dispatcher_forgot_password').post(dispatcher.dispatcher_forgot_psw_email);
    app.route('/dispatcher_update_psw').post(dispatcher.update_psw);
    app.route('/dispatcher_newpassword').get(dispatcher.edit_psw);

    app.route('/dispatcher_sign_out').get(dispatcher.dispatcher_sign_out);
    app.route('/checkuser').post(dispatcher.checkuser);

    app.route('/calculate_estimate').post(dispatcher.calculate_estimate);

    app.route('/getsurge_time').post(dispatcher.getsurge_time);

    app.route('/user_detail').post(dispatcher.user_detail);
    app.route('/provider_detail').post(dispatcher.provider_detail);

    app.route('/get_server_time').post(dispatcher.get_server_time);

    app.route('/dispatcher_new_request').post(dispatcher.dispatcher_new_request);

    app.route('/get_all_provider').post(dispatcher.get_all_provider);
    app.route('/get_trip_info').post(dispatcher.get_trip_info);
    
    app.route('/generate_dispatcher_request_export_excel').post(dispatcher.generate_dispatcher_request_export_excel);

    app.route('/generate_dispatcher_future_request_export_excel').post(dispatcher.generate_dispatcher_future_request_export_excel);

}
