var admin = require('../admin_controllers/city_service_type');
var admins = require('mongoose').model('admin');
var session = require("express-session");

module.exports = function (app) {

    app.route('/city_type').get(admin.city_type);
    app.route('/city_type').post(admin.city_type);
    app.route('/update_surge_time').post(admin.update_surge_time);

    app.route('/genetare_city_type_excel').post(admin.genetare_city_type_excel);


    app.route('/add_city_type_form').post(admin.add_city_type_form);
    app.route('/add_city_type_detail').post(admin.add_city_type_detail);
    app.route('/edit_city_type_form').post(admin.edit_city_type_form);
    app.route('/update_city_type_detail').post(admin.update_city_type_detail);
    app.route('/view_city_type_detail').post(admin.view_city_type_detail);

    app.route('/getcitytype').post(admin.getcitytype);
    app.route('/add_carrental_data').post(admin.add_carrental_data);
    app.route('/update_carrental_data').post(admin.update_carrental_data);
    app.route('/delete_carrental_data').post(admin.delete_carrental_data);


}