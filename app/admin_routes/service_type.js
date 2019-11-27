var admin = require('../admin_controllers/service_type');
var admins = require('mongoose').model('admin');
 var session = require("express-session");

module.exports = function(app){

	app.route('/service_types').get(admin.service_types);
	app.route('/add_service_form').post(admin.add_service_form);
	app.route('/add_service_detail').post(admin.add_service_detail);
	app.route('/edit_service_form').post(admin.edit_service_form);
	app.route('/update_service_detail').post(admin.update_service_detail);
	app.route('/service_type_search').post(admin.service_type_search);
	app.route('/service_type_sort').post(admin.service_type_sort);
	app.route('/check_type_available').post(admin.check_type_available);
	app.route('/fetch_servicetype_list').post(admin.fetch_servicetype_list);
	app.route('/check_type_priority_available').post(admin.check_type_priority_available);
}