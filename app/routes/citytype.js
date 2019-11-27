var citytype = require('../controllers/citytype');
var Citytype = require('mongoose').model('city_type'); // include Citytype model ////
var Country = require('mongoose').model('Country'); // include country model ////
var country = require('../controllers/country');
module.exports = function (app) {
    app.route('/typelist_selectedcountrycity').post(citytype.list);
    app.route('/typelist_for_dispatcher').post(citytype.disptcher_city_type_list);
    app.route('/user_city_type_list').post(citytype.list);
};



