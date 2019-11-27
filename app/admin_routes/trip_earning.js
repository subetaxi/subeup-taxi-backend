var trip_earning = require('../admin_controllers/trip_earning');
 ///// Provider Earning /////
 module.exports = function(app){
    app.route('/trip_earning').get(trip_earning.trip_earning);
    app.route('/trip_earning').post(trip_earning.trip_earning);
    
   // app.route('/trip_earning_excel').post(trip_earning.trip_earning_excel);
    
    app.route('/generate_trip_earning_excel').post(trip_earning.generate_trip_earning_excel);
}
