var admin = require('../admin_controllers/email_detail');
var admins = require('mongoose').model('email_detail');
var session = require("express-session");

module.exports = function (app) {
    app.route('/email').get(admin.email);
    app.route('/get_email_data').post(admin.get_email_data);
    app.route('/update_email_detail').post(admin.update_email_detail);
    
}