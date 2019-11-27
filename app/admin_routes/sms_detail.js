var admin = require('../admin_controllers/sms_detail');
var admins = require('mongoose').model('sms_detail');
var session = require("express-session");

module.exports = function (app) {
    app.route('/sms').get(admin.sms);
    app.route('/get_sms_data').post(admin.get_sms_data);
    app.route('/update_sms_detail').post(admin.update_sms_detail);
    
}