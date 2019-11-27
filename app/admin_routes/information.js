var admin = require('../admin_controllers/information');
var admins = require('mongoose').model('admin');
 var session = require("express-session");

module.exports = function(app){

	app.route('/information').get(admin.information);
	app.route('/add_info_form').post(admin.add_info_form);
	app.route('/add_info_detail').post(admin.add_info_detail);
	app.route('/add_info_form').get(admin.edit_info_form);
	app.route('/update_info_detail').post(admin.update_info_detail);
	app.route('/info_search').post(admin.info_search);
}