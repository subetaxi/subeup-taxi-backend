var city = require('../controllers/city');
var City = require('mongoose').model('City'); // include City model ////
module.exports = function (app) {

    app.route('/citilist_selectedcountry').post(city.citylist);
    //app.route('/get_all_city_list').post(city.all_city_list);

};



