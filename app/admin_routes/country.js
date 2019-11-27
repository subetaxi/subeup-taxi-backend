var admin = require('../admin_controllers/country');
var admins = require('mongoose').model('admin');
var session = require("express-session");

module.exports = function (app) {

    app.route('/country').get(admin.country_type);
    app.route('/add_country_form').post(admin.add_country_form);
    app.route('/add_country_detail').post(admin.add_country_detail);
    app.route('/edit_country_form').post(admin.edit_country_form);
    app.route('/update_country_detail').post(admin.update_country_detail);
    app.route('/check_country_available').post(admin.check_country_available);
    ///// FOR SORTING /////
    app.route('/countries_sort').post(admin.countries_sort);

    ///// FOR SEARCH /////
    app.route('/countries_search').post(admin.countries_search);
    app.route('/fetch_country_detail').post(admin.fetch_country_detail);
    app.route('/fetch_added_country_detail').post(admin.fetch_added_country_detail);

    app.route('/getcountryphonelength').post(admin.getcountryphonelength);


};