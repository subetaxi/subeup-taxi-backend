var users = require('../user_controllers/trip');
module.exports = function (app) {

    app.route('/create_trip').get(users.user_create_trip);
    app.route('/get_nearby_provider').post(users.get_nearby_provider);
    app.route('/history').get(users.user_request);
    app.route('/history').post(users.user_request);

    app.route('/user_future_request').get(users.user_future_request);
    app.route('/user_future_request').post(users.user_future_request);
    app.route('/check_old_trip').post(users.check_old_trip);
    app.route('/user_trip_map').post(users.user_trip_map);
    app.route('/user_trip_invoice').post(users.user_trip_invoice);

};