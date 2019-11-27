var admin = require('../admin_controllers/schedule');
var admins = require('mongoose').model('admin');
var session = require("express-session");

module.exports = function (app) {
    app.route('/schedules').get(admin.Schedules_list);
    app.route('/schedules').post(admin.Schedules_list);
    app.route('/genetare_schedules_request_excel').post(admin.genetare_schedules_request_excel);

};