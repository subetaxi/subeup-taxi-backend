var users = require('../admin_controllers/user');
module.exports = function (app) {

    app.route('/users').post(users.list);
    app.route('/declined_users').post(users.list);

    app.route('/referral_history').get(users.referral_history);
    app.route('/referral_history').post(users.referral_history);

    app.route('/referral_report').get(users.referral_report);
    app.route('/referral_report').post(users.referral_report);

    app.route('/generate_user_excel').post(users.generate_user_excel);
    app.route('/generate_user_history_excel').post(users.generate_user_history_excel);
  

    app.route('/users').get(users.list);
    app.route('/declined_users').get(users.list);
    app.route('/customer_detail_edit').post(users.edit);
    app.route('/customerupdate').post(users.update);
    app.route('/history_u').post(users.history);
    app.route('/user_profile_is_approved').post(users.profile_is_approved);
    app.route('/declined_users').get(users.list);
    app.route('/user_documents').post(users.user_documents);

    app.route('/admin_add_wallet_amount').post(users.add_wallet_amount);

};