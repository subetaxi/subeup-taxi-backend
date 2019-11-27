var Country = require('mongoose').model('Country');
var Setting = require('mongoose').model('Settings');
var City = require('mongoose').model('City');
var utils = require('../controllers/utils');
var CityType = require('mongoose').model('city_type');
var mongoose = require('mongoose');
var Schema = mongoose.Types.ObjectId;
var console = require('../controllers/console');
var Type = require('mongoose').model('Type');

exports.drive = function (req, res, next) {
    page_type = 2;
    res.render('drive');
}

exports.ride = function (req, res, next) {
    page_type = 1;
    Type.find({}).then((type_list) => {
        res.render('ride', {setting_data: setting_detail, type_list: type_list});  
    });     
}

exports.how_it_works = function (req, res, next){
	res.render('how-it-works');
} 

exports.fare_estimate = function (req, res, next){
	Setting.findOne({}, function(error, setting_detail){
		res.render('fare-estimate', {data: req.body, map_key: setting_detail.web_app_google_key});
	})
} 

exports.safety = function (req, res, next){
	res.render('safety');
} 

exports.cities = function (req, res, next){

	var city_lookup = {
        $lookup:
        {
            from: "cities",
            localField: "_id",
            foreignField: "countryid",
            as: "city_list"
        }
    };

	Country.aggregate([city_lookup]).then((country_list) => { 
			res.render('cities', {map_key: setting_detail.web_app_google_key, country_list: country_list});
		
    }, (err) => {
        utils.error_response(err, res)
	})
	
} 


exports.get_city_data = function (req, res, next){
	var city = req.body.city;
    var subAdminCity = req.body.subAdminCity;
	City.findOne({$or: [{cityname: city}, {cityname: subAdminCity}]}).then((city_detail) => { 
        if (!city_detail) {
        	res.json({success: false});
        } else {	
        	res.json({success: true});
        }
    });

};

exports.driver_app = function (req, res, next){
	res.render('driver-app');
} 

exports.driver_safety = function (req, res, next){
	res.render('drive-safety');
} 

exports.requirements = function (req, res, next){
	res.render('requirements');
} 

exports.terms = function (req, res, next){
	res.render('terms&condition');
} 

exports.privacy = function (req, res, next){
	res.render('privacy_policy');
}

exports.sign_in = function (req, res, next){
    page_type = 3;
    res.render('signin');
}

exports.login = function (req, res, next){
    req.session.type = req.body.type;
    if(req.body.type == 'user'){
        res.render('user-login-form');
    } else {
        res.render('driver-login-form');
    }
    delete message;
}

exports.forgot_password = function (req, res, next) {
    var type = req.params.type;
    res.render('forgot_password',{type:type});
}

exports.get_fare_estimate_all_type = function (req, res, next){

	
    var currentCityLatLong = [req.body.pickup_latitude, req.body.pickup_longitude];

	City.find({isBusiness: constant_json.YES}).then((cityList) => { 
        var size = cityList.length;
        var count = 0;
        if (size == 0) {
            return res.json({success: false, error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY});
        } else {
            var finalCityId = null;
            var finalDistance = 1000000;
            var city_unit = null;
            cityList.forEach(function (city_detail) {
                count++;
                var cityLatLong = city_detail.cityLatLong;
                var distanceFromSubAdminCity = utils.getDistanceFromTwoLocation(currentCityLatLong, cityLatLong);
                var cityRadius = city_detail.cityRadius;

                if (distanceFromSubAdminCity < cityRadius) {
                    if (distanceFromSubAdminCity < finalDistance) {
                        finalDistance = distanceFromSubAdminCity;
                        finalCityId = city_detail._id;
                        city_unit = city_detail.unit;
                    }
                }
                if (count == size) {
                    if (finalCityId != null) {
                        var city_id = finalCityId;
                        var time = req.body.time;
                        var timeMinutes;
                        timeMinutes = time * 0.0166667;

                        var distance = req.body.distance;
                        var distanceKmMile = distance;
                        if (city_unit == 1) {
                            distanceKmMile = distance * 0.001;
                        } else {
                            distanceKmMile = distance * 0.000621371;
                        }

                        var lookup = {
                            $lookup:
                                {
                                    from: "types",
                                    localField: "typeid",
                                    foreignField: "_id",
                                    as: "type_detail"
                                }
                        };
                        var unwind = {$unwind: "$type_detail"};
                        var condition = {$match: {'cityid': {$eq: Schema(city_id)}}};
						CityType.aggregate([condition, lookup, unwind]).then((city_type_list) => { 
							if(city_type_list.length == 0){
                                res.json({success: false, error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY});
							} else {
								var array = [];
                                var count = 0;
                                city_type_list.forEach(function (citytype) {
                                    count++;
                                    var base_distance = citytype.base_price_distance;
                                    var base_price = citytype.base_price;
                                    var price_per_unit_distance1 = citytype.price_per_unit_distance;
                                    var price_for_total_time1 = citytype.price_for_total_time;
                                    var tax = citytype.tax;
                                    var min_fare = citytype.min_fare;
                                    var surge_multiplier = citytype.surge_multiplier;
                                    var user_tax = citytype.user_tax;
                                    var user_miscellaneous_fee = citytype.user_miscellaneous_fee;

                                    if (distanceKmMile <= base_distance) {
                                        price_per_unit_distance = 0;
                                    } else {
                                        price_per_unit_distance = (price_per_unit_distance1 * (distanceKmMile - base_distance)).toFixed(2);
                                    }

                                    price_for_total_time = Number(price_for_total_time1 * timeMinutes);
                                    var total = 0;
                                    total = +base_price + +price_per_unit_distance + +price_for_total_time;
                                    // tax cal
                                    total = total + total * 0.01 * tax;
                                    try {
                                        if (Number(body.is_surge_hours) == 1) {
                                            total = total * surge_multiplier;
                                        }
                                    } catch (error) {

                                    }
                                    var is_min_fare_used = 0;
                                    var user_tax_fee = Number((user_tax * 0.01 * total).toFixed(2));

                                    total =total + user_tax_fee + user_miscellaneous_fee;
                                    if (total < min_fare) {
                                        total = min_fare;
                                        is_min_fare_used = 1;
                                    }
                                    var estimated_fare = Math.ceil(total);
                                    array.push({cancellation_fee: citytype.cancellation_fee, min_fare:min_fare, name: citytype.type_detail.typename, user_tax_fee:user_tax_fee, user_miscellaneous_fee:user_miscellaneous_fee, message: success_messages.MESSAGE_CODE_YOU_GET_FARE_ESTIMATE, time: timeMinutes, distance: (distanceKmMile).toFixed(2), is_min_fare_used: is_min_fare_used, base_price: base_price, price_per_unit_distance: price_per_unit_distance, price_per_unit_time: price_for_total_time, estimated_fare: estimated_fare});

                                	if(count == city_type_list.length){
                                        Country.findOne({countryname: city_type_list[0].countryname}, function(error, country){
                                        
										    res.json({success: true, type_list: array, currencysign: country.currencysign});
                                        })
									}
                                })
							}
                        }, (err) => {
                                    utils.error_response(err, res)
                        })
                    } else {
                        res.json({success: false, error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY});
					}
                }
            });
        }
	});

}