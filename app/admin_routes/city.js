var admin = require('../admin_controllers/city');
var admins = require('mongoose').model('admin');
var session = require("express-session");

module.exports = function (app) {

    app.route('/city').get(admin.city);
    app.route('/city').post(admin.city);
    app.route('/all_city').get(admin.all_city);
    app.route('/fetch_all_city').post(admin.fetch_all_city);
    app.route('/genetare_city_excel').post(admin.genetare_city_excel);
    app.route('/update_city_zone').post(admin.update_city_zone);
    app.route('/update_city_red_zone').post(admin.update_city_red_zone);
    app.route('/update_airport').post(admin.update_airport);

    app.route('/add_city_form').post(admin.add_city_form);
    app.route('/add_city_detail').post(admin.add_city_detail);
    app.route('/edit_city_form').post(admin.edit_city_form);
    app.route('/update_city_detail').post(admin.update_city_detail);
    app.route('/check_city_available').post(admin.check_city_available);

    app.route('/autocomplete_cityname').post(admin.autocomplete_cityname);

    app.route('/fetch_city_list').post(admin.fetch_city_list);

    app.route('/fetch_destination_city_list').post(admin.fetch_destination_city_list);
    app.route('/fetch_destination_city_value').post(admin.fetch_destination_city_value);
    app.route('/fetch_airport_value').post(admin.fetch_airport_value);
    app.route('/get_city_airport_list').post(admin.get_city_airport_list);

    app.route('/zonevalueajax').post(admin.zonevalueajax);
    app.route('/deletezonevalueajax').post(admin.deletezonevalueajax);
    app.route('/updatezonevalueajax').post(admin.updatezonevalueajax);

}