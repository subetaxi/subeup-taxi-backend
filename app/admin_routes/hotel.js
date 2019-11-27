var hotel = require('../admin_controllers/hotel');


module.exports = function(app){
	
	
	app.route('/hotel').get(hotel.list);
	app.route('/hotel').post(hotel.list);
        
        app.route('/genetare_hotel_excel').post(hotel.genetare_hotel_excel);
        app.route('/genetare_hotel_request_excel').post(hotel.genetare_hotel_request_excel);
        app.route('/genetare_hotel_future_request_excel').post(hotel.genetare_hotel_future_request_excel);
        
	app.route('/add_hotel').post(hotel.add_hotel);
	app.route('/add_hotel_detail').post(hotel.add_hotel_detail);
	app.route('/edit_hotel').post(hotel.edit_hotel);
	app.route('/update_hotel_detail').post(hotel.update_hotel_detail);

	app.route('/hotel_login').get(hotel.login);
	app.route('/hotel_login').post(hotel.hotel_login);

	app.route('/hotel_forgot_password').get(hotel.hotel_forgot_password);
	app.route('/hotel_forgot_password').post(hotel.hotel_forgot_psw_email);
	app.route('/hotel_update_psw').post(hotel.update_psw);
	app.route('/hotel_newpassword').get(hotel.edit_psw);

	app.route('/hotel_header').get(hotel.hotel_header);
	app.route('/hotel_profile').get(hotel.hotel_profile);
	app.route('/hotel_update_profile').post(hotel.hotel_update_profile);
	app.route('/hotel_create_trip').get(hotel.hotel_create_trip);

	app.route('/hotel_request').get(hotel.hotel_request);
	app.route('/hotel_request').post(hotel.hotel_request);

	app.route('/hotel_future_request').get(hotel.hotel_future_request);
	app.route('/hotel_future_request').post(hotel.hotel_future_request);

	app.route('/hotel_trip_map').post(hotel.hotel_trip_map);

	app.route('/hotel_sign_out').get(hotel.hotel_sign_out);
	
}
