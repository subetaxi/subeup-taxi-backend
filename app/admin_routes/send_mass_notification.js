var admin = require('../admin_controllers/send_mass_notifications');

module.exports = function (app) {
    app.route('/send_mass_notification').get(admin.sms_notification);

    app.route('/send_mass_notification').post(admin.send_mass_notification);

     app.route('/fetch_users_list').post(admin.fetch_user_list);
     app.route('/fetch_providers_list').post(admin.fetch_providers_list);
    
}