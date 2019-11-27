var users = require('../user_controllers/new_design');
module.exports = function (app) {

    app.route('/drive').get(users.drive);
    app.route('/ride').get(users.ride);
    app.route('/how-it-works').get(users.how_it_works);
    app.route('/fare-estimate').get(users.fare_estimate);
    app.route('/fare-estimate').post(users.fare_estimate);
    app.route('/safety').get(users.safety);
    app.route('/cities').get(users.cities);
    app.route('/driver-app').get(users.driver_app);
    app.route('/driver-safety').get(users.driver_safety);
    app.route('/requirements').get(users.requirements);
    
    app.route('/terms&condition').get(users.terms);
    app.route('/privacy').get(users.privacy);

    app.route('/get_city_data_new').post(users.get_city_data);
    app.route('/get_fare_estimate_all_type').post(users.get_fare_estimate_all_type);
    app.route('/sign-in').get(users.sign_in);
    app.route('/login').post(users.login);
    app.route('/forgot_password_:type').get(users.forgot_password);
};