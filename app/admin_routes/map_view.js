var admin = require('../admin_controllers/map_view');
var admins = require('mongoose').model('admin');
var session = require("express-session");

module.exports = function (app) {

    app.route('/mapview').get(admin.map);
    app.route('/provider_track').get(admin.provider_track);
    app.route('/fetch_provider_list').post(admin.fetch_provider_list);
    app.route('/fetch_provider_detail').post(admin.fetch_provider_detail);
    app.route('/fetch_provider_list_of_refresh').post(admin.fetch_provider_list_of_refresh);
    
    app.route('/get_all_provider_list').post(admin.get_all_provider_list);
}