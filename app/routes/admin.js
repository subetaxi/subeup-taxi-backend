var admin = require('../controllers/admin');

var admins = require('mongoose').model('admin');
var session = require("express-session");

module.exports = function (app) {
     app.route('/sendmasssms').get(admin.sendmasssms);
     
    app.route('/getappkeys').post(admin.getappkeys);
    app.route('/getlanguages').post(admin.getlanguages);
    app.route('/updateDatabaseTable').get(admin.updateDatabaseTable);
    app.route('/getsettingdetail').post(admin.getsettingdetail);
    app.route('/delete_users').post(admin.delete_users);
    
};
