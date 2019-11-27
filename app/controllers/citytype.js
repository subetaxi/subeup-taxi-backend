var utils = require('./utils');
var Citytype = require('mongoose').model('city_type');
var City = require('mongoose').model('City');
var Country = require('mongoose').model('Country');
var User = require('mongoose').model('User');
var Provider = require('mongoose').model('Provider');
var geolib = require('geolib');
var console = require('./console');
var utils = require('./utils');
var RedZoneArea = require('mongoose').model('RedZoneArea');
var CityZone = require('mongoose').model('CityZone');
var Corporate = require('mongoose').model('Corporate');

// list
exports.list = function (req, res) {
    utils.check_request_params(req.body, [
        {name: 'country', type: 'string'}], function (response) {
        if (response.success) {
            var currentCityLatLong = [req.body.latitude, req.body.longitude];
            var user_id = req.body.user_id;
            var provider_id = req.body.provider_id;
            var country = req.body.country;
            var country_code = req.body.country_code;
            if (provider_id !== undefined) {
                id = req.body.provider_id;
                table = Provider;
            } else {
                id = req.body.user_id;
                table = User;
            }
            if(!country_code){
                country_code = null;
            }

            table.findOne({_id: id}).then((detail) => {
                if (detail) {
                    if (req.body.token !== null && detail.token !== req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});

                    }
                }
                Country.findOne({$and: [{$or: [{countryname: country}, { alpha2: {$exists: true, $eq: country_code}}]}, {isBusiness: constant_json.YES}]}).then((country) => {
        
                    if (!country) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_COUNTRY});
                    } else {

                        var country_id = country._id;
                        var currency = country.currencysign;
                        var currencycode = country.currencycode;
                        var server_time = new Date();
                        City.find({countryid: country_id, isBusiness: constant_json.YES}).then((cityList) => {

                            var size = cityList.length;
                            var count = 0;
                            if (size == 0) {
                                res.json({
                                    success: false,
                                    error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
                                });
                            } else {
                                var finalCityId = null;
                                var finalDistance = 1000000;
                                var final_city_details = {};
                                cityList.forEach(function (city_detail) {
                                    count++;
                                    var cityLatLong = city_detail.cityLatLong;
                                    var distanceFromSubAdminCity = utils.getDistanceFromTwoLocation(currentCityLatLong, cityLatLong);
                                    var cityRadius = city_detail.cityRadius;

                                    if (!city_detail.is_use_city_boundary) {
                                        if (distanceFromSubAdminCity < cityRadius) {
                                            if (distanceFromSubAdminCity < finalDistance) {
                                                finalDistance = distanceFromSubAdminCity;
                                                finalCityId = city_detail._id;
                                                final_city_details = city_detail;
                                            }
                                        }
                                    } else {
                                        var city_zone = geolib.isPointInside(
                                            {
                                                latitude: Number(req.body.latitude),
                                                longitude: Number(req.body.longitude)
                                            },
                                            city_detail.city_locations);
                                        if (city_zone) {
                                            if (distanceFromSubAdminCity < finalDistance) {
                                                finalDistance = distanceFromSubAdminCity;
                                                finalCityId = city_detail._id;
                                                final_city_details = city_detail;
                                            }
                                        }
                                    }
                                    if (count == size) {
                                        if (finalCityId != null) {
                                            var city_id = finalCityId;

                                            RedZoneArea.find({cityid: city_id}).then((red_zone_area_list)=>{
                                                var inside_red_zone = false;
                                                red_zone_area_list.forEach(function(red_zone_area_data, index){
                                                    var inside_zone = geolib.isPointInside(
                                                        {
                                                            latitude: Number(req.body.latitude),
                                                            longitude: Number(req.body.longitude)
                                                        }, red_zone_area_data.kmlzone);
                                                    if (inside_zone) {
                                                        inside_red_zone = true;
                                                    }
                                                })
                                                if(!inside_red_zone){
                                                    CityZone.find({cityid: city_id}).then((zone_list)=>{
                                                        var zone_id = null;
                                                        zone_list.forEach(function(zone_data, index){
                                                            var inside_zone = geolib.isPointInside(
                                                                {
                                                                    latitude: Number(req.body.latitude),
                                                                    longitude: Number(req.body.longitude)
                                                                }, zone_data.kmlzone);
                                                            if (inside_zone) {
                                                                zone_id = zone_data._id;
                                                            }
                                                        });

                                                        var city_type_to_type_query = {
                                                            $lookup:
                                                                {
                                                                    from: "types",
                                                                    localField: "typeid",
                                                                    foreignField: "_id",
                                                                    as: "type_details"
                                                                }
                                                        };
                                                        var array_to_json = {$unwind: "$type_details"};

                                                        var countryid_condition = {$match: {'countryid': {$eq: country_id}}};
                                                        var cityid_condition = {$match: {'cityid': {$eq: city_id}}};
                                                        var buiesness_condotion = {$match: {'is_business': {$eq: 1}}};

                                                        var rrr = {"$redact": {"$cond": [{'$eq': ["$type_details.is_business", 1]}, "$$KEEP", "$$PRUNE"]}}

                                                        var lookup = {
                                                            $lookup:
                                                            {
                                                                from: "city_types",
                                                                localField: "car_rental_ids",
                                                                foreignField: "_id",
                                                                as: "car_rental_list"
                                                            }
                                                        };

                                                        Citytype.aggregate([countryid_condition, cityid_condition, buiesness_condotion, city_type_to_type_query, array_to_json, rrr, lookup]).then((citytypes) => {
                                                            var PAYMENT_TYPES = utils.PAYMENT_TYPES();
                                                            if(zone_id){
                                                                citytypes.forEach(function(citytype_data){
                                                                    if(citytype_data.rich_area_surge){
                                                                        var zone_index = citytype_data.rich_area_surge.findIndex((x) => (x.id).toString() == zone_id.toString());
                                                                        if(zone_index !== -1 && citytype_data.rich_area_surge[zone_index].surge_multiplier>0){
                                                                            citytype_data.rich_area_surge_multiplier = citytype_data.rich_area_surge[zone_index].surge_multiplier;
                                                                        }
                                                                    }
                                                                })
                                                            }
                                                            citytypes.forEach(function(citytype_data){
                                                                if(citytype_data.is_car_rental_business){
                                                                    var car_rental_list = citytype_data.car_rental_list;
                                                                    citytype_data.car_rental_list = [];
                                                                    car_rental_list.forEach(function(car_rental_data){
                                                                        if(car_rental_data.is_business){
                                                                            citytype_data.car_rental_list.push(car_rental_data);
                                                                        }
                                                                    })
                                                                } else {
                                                                    citytype_data.car_rental_list = [];
                                                                }
                                                            });
                                                            if (citytypes.length != 0) {

                                                                 var corporate_id = null;
                                                                if(detail.corporate_ids && detail.corporate_ids.length>0){
                                                                    corporate_id = detail.corporate_ids[0].corporate_id;
                                                                }

                                                                Corporate.findOne({_id: corporate_id}).then((corporate_detail)=>{
                                                                    var is_corporate_request = false;
                                                                    if(corporate_detail && detail.corporate_ids[0].status == constant_json.CORPORATE_REQUEST_ACCEPTED && corporate_detail.is_approved){
                                                                        is_corporate_request = true;
                                                                    }

                                                                    res.json({
                                                                        success: true,
                                                                        message: success_messages.MESSAGE_CODE_GET_CITYTYPE_LIST_SUCCESSFULLY,
                                                                        currency: currency,
                                                                        currencycode: currencycode,
                                                                        city_detail: final_city_details,
                                                                        payment_gateway: PAYMENT_TYPES,
                                                                        citytypes: citytypes,
                                                                        server_time: server_time,
                                                                        is_corporate_request: is_corporate_request
                                                                    });
                                                                });

                                                            } else if (count == size) {
                                                                res.json({
                                                                    success: false,
                                                                    error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
                                                                });
                                                            }
                                                        });
                                                    });
                                                } else {
                                                    res.json({
                                                        success: false,
                                                        error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
                                                    }); 
                                                }
                                            });


                                        } else {
                                            res.json({
                                                success: false,
                                                error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
                                            });
                                        }
                                    }

                                });
                            }
                        });

                    }
                });
                    
                
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

exports.disptcher_city_type_list = function (req, res) {

    utils.check_request_params(req.body, [
        {name: 'subAdminCountry', type: 'string'}], function (response) {
        if (response.success) {
            var currentCityLatLong = [req.body.latitude, req.body.longitude];
            var subAdminCountry = req.body.subAdminCountry;
            Country.findOne({$and: [{$or: [{countryname: subAdminCountry},  { alpha2: {$exists: true, $eq: req.body.country_code}}]}, {isBusiness: constant_json.YES}]}).then((country) => {
        

                var server_time = new Date();
                if (!country) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_COUNTRY});
                } else {
                    var currency = country.currencysign;
                    City.find({countryname: subAdminCountry, isBusiness: constant_json.YES}).then((city_details) => {

                        var count = 0;
                        var size = city_details.length;
                        var finalDistance = 1000000;
                        var finalCityId = null;
                        var final_city_details = {};
                        if ( size == 0) {
                            res.json({success: false, error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY});
                        } else {
                            city_details.forEach(function (city_detail) {
                                count++;
                                var cityLatLong = city_detail.cityLatLong;
                                var distanceFromSubAdminCity = utils.getDistanceFromTwoLocation(currentCityLatLong, cityLatLong);
                                var cityRadius = city_detail.cityRadius;

                                if (!city_detail.is_use_city_boundary) {
                                    if (distanceFromSubAdminCity < cityRadius) {
                                        if (distanceFromSubAdminCity < finalDistance) {
                                            finalDistance = distanceFromSubAdminCity;
                                            finalCityId = city_detail._id;
                                            final_city_details = city_detail;
                                        }
                                    }
                                } else {
                                    var city_zone = geolib.isPointInside(
                                        {latitude: req.body.latitude, longitude: req.body.longitude},
                                        city_detail.city_locations);
                                    if (city_zone) {
                                        if (distanceFromSubAdminCity < finalDistance) {
                                            finalDistance = distanceFromSubAdminCity;
                                            finalCityId = city_detail._id;
                                            final_city_details = city_detail;
                                        }
                                    }
                                }


                                if (count == size) {

                                    if (finalCityId != null) {
                                        var city_id = finalCityId;
                                        var city_type_to_type_query = {
                                            $lookup:
                                                {
                                                    from: "types",
                                                    localField: "typeid",
                                                    foreignField: "_id",
                                                    as: "type_details"
                                                }
                                        };
                                        var array_to_json = {$unwind: "$type_details"};

                                        var countryid_condition = {$match: {'countryid': {$eq: country._id}}};
                                        var cityid_condition = {$match: {'cityid': {$eq: city_id}}};
                                        var buiesness_condition = {$match: {'is_business': {$eq: 1}}};

                                        var rrr = {"$redact": {"$cond": [{'$eq': ["$type_details.is_business", 1]}, "$$KEEP", "$$PRUNE"]}}

                                        Citytype.aggregate([countryid_condition, cityid_condition, buiesness_condition, city_type_to_type_query, array_to_json, rrr]).then((citytypes) => {

                                            var PAYMENT_TYPES = utils.PAYMENT_TYPES();

                                            if (citytypes.length != 0) {
                                                res.json({
                                                    success: true,
                                                    message: success_messages.MESSAGE_CODE_GET_CITYTYPE_LIST_SUCCESSFULLY,
                                                    currency: currency,
                                                    city_detail: final_city_details,
                                                    payment_gateway: PAYMENT_TYPES,
                                                    citytypes: citytypes,
                                                    server_time: server_time
                                                });
                                            } else if (count == size) {
                                                res.json({
                                                    success: false,
                                                    error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
                                                });
                                            }
                                        });


                                    } else {
                                        res.json({
                                            success: false,
                                            error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
                                        });
                                    }
                                }
                            });
                        }
                    });

                }

            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};

exports.user_city_type_list = function (req, res) {
    utils.check_request_params(req.body, [
        {name: 'country', type: 'string'}], function (response) {
        if (response.success) {
            var currentCityLatLong = [req.body.latitude, req.body.longitude];
            var user_id = req.body.user_id;
            var provider_id = req.body.provider_id;
            var country = req.body.country;
            if (provider_id !== undefined) {
                id = req.body.provider_id;
                table = Provider;
            } else {
                id = req.body.user_id;
                table = User;
            }

            table.findOne({_id: id}).then((detail) => {
                if (detail) {
                    if (req.body.token !== null && detail.token !== req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});

                    }
                }
                Country.findOne({$and: [{$or: [{countryname: country}, {alpha2: req.body.country_code}]}, {isBusiness: constant_json.YES}]}).then((country) => {
            
                    if (!country) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_COUNTRY});
                    } else {

                        var country_id = country._id;
                        var currency = country.currencysign;
                        var currencycode = country.currencycode;
                        var server_time = new Date();
                        City.find({countryid: country_id, isBusiness: constant_json.YES}).then((cityList) => {

                            var size = cityList.length;
                            var count = 0;
                            if (size == 0) {
                                res.json({
                                    success: false,
                                    error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
                                });
                            } else {
                                var finalCityId = null;
                                var finalDistance = 1000000;
                                var final_city_details = {};
                                cityList.forEach(function (city_detail) {
                                    count++;
                                    var cityLatLong = city_detail.cityLatLong;
                                    var distanceFromSubAdminCity = utils.getDistanceFromTwoLocation(currentCityLatLong, cityLatLong);
                                    var cityRadius = city_detail.cityRadius;

                                    if (!city_detail.is_use_city_boundary) {
                                        if (distanceFromSubAdminCity < cityRadius) {
                                            if (distanceFromSubAdminCity < finalDistance) {
                                                finalDistance = distanceFromSubAdminCity;
                                                finalCityId = city_detail._id;
                                                final_city_details = city_detail;
                                            }
                                        }
                                    } else {
                                        var city_zone = geolib.isPointInside(
                                            {
                                                latitude: Number(req.body.latitude),
                                                longitude: Number(req.body.longitude)
                                            },
                                            city_detail.city_locations);
                                        if (city_zone) {
                                            if (distanceFromSubAdminCity < finalDistance) {
                                                finalDistance = distanceFromSubAdminCity;
                                                finalCityId = city_detail._id;
                                                final_city_details = city_detail;
                                            }
                                        }
                                    }
                                    if (count == size) {
                                        if (finalCityId != null) {
                                            var city_id = finalCityId;

                                            RedZoneArea.find({cityid: city_id}).then((red_zone_area_list)=>{
                                                var inside_red_zone = false;
                                                red_zone_area_list.forEach(function(red_zone_area_data, index){
                                                    var inside_zone = geolib.isPointInside(
                                                        {
                                                            latitude: Number(req.body.latitude),
                                                            longitude: Number(req.body.longitude)
                                                        }, red_zone_area_data.kmlzone);
                                                    if (inside_zone) {
                                                        inside_red_zone = true;
                                                    }
                                                })
                                                if(!inside_red_zone){
                                                    CityZone.find({cityid: city_id}).then((zone_list)=>{
                                                        var zone_id = null;
                                                        zone_list.forEach(function(zone_data, index){
                                                            var inside_zone = geolib.isPointInside(
                                                                {
                                                                    latitude: Number(req.body.latitude),
                                                                    longitude: Number(req.body.longitude)
                                                                }, zone_data.kmlzone);
                                                            if (inside_zone) {
                                                                zone_id = zone_data._id;
                                                            }
                                                        });

                                                        var city_type_to_type_query = {
                                                            $lookup:
                                                                {
                                                                    from: "types",
                                                                    localField: "typeid",
                                                                    foreignField: "_id",
                                                                    as: "type_details"
                                                                }
                                                        };
                                                        var array_to_json = {$unwind: "$type_details"};

                                                        var countryid_condition = {$match: {'countryid': {$eq: country_id}}};
                                                        var cityid_condition = {$match: {'cityid': {$eq: city_id}}};
                                                        var buiesness_condotion = {$match: {'is_business': {$eq: 1}}};

                                                        var rrr = {"$redact": {"$cond": [{'$eq': ["$type_details.is_business", 1]}, "$$KEEP", "$$PRUNE"]}}

                                                        var lookup = {
                                                            $lookup:
                                                            {
                                                                from: "city_types",
                                                                localField: "car_rental_ids",
                                                                foreignField: "_id",
                                                                as: "car_rental_list"
                                                            }
                                                        };

                                                        Citytype.aggregate([countryid_condition, cityid_condition, buiesness_condotion, city_type_to_type_query, array_to_json, rrr, lookup]).then((citytypes) => {
                                                            var PAYMENT_TYPES = utils.PAYMENT_TYPES();
                                                            if(zone_id){
                                                                citytypes.forEach(function(citytype_data){
                                                                    if(citytype_data.rich_area_surge){
                                                                        var zone_index = citytype_data.rich_area_surge.findIndex((x) => (x.id).toString() == zone_id.toString());
                                                                        if(zone_index !== -1 && citytype_data.rich_area_surge[zone_index].surge_multiplier>0){
                                                                            citytype_data.rich_area_surge_multiplier = citytype_data.rich_area_surge[zone_index].surge_multiplier;
                                                                        }
                                                                    }
                                                                })
                                                            }
                                                            if (citytypes.length != 0) {

                                                                 var corporate_id = null;
                                                                if(detail.corporate_ids && detail.corporate_ids.length>0){
                                                                    corporate_id = detail.corporate_ids[0].corporate_id;
                                                                }

                                                                Corporate.findOne({_id: corporate_id}).then((corporate_detail)=>{
                                                                    var is_corporate_request = false;
                                                                    if(corporate_detail && detail.corporate_ids[0].status == constant_json.CORPORATE_REQUEST_ACCEPTED && corporate_detail.is_approved){
                                                                        is_corporate_request = true;
                                                                    }

                                                                    res.json({
                                                                        success: true,
                                                                        message: success_messages.MESSAGE_CODE_GET_CITYTYPE_LIST_SUCCESSFULLY,
                                                                        currency: currency,
                                                                        currencycode: currencycode,
                                                                        city_detail: final_city_details,
                                                                        payment_gateway: PAYMENT_TYPES,
                                                                        citytypes: citytypes,
                                                                        server_time: server_time,
                                                                        is_corporate_request: is_corporate_request
                                                                    });
                                                                });

                                                            } else if (count == size) {
                                                                res.json({
                                                                    success: false,
                                                                    error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
                                                                });
                                                            }
                                                        });
                                                    });
                                                } else {
                                                    res.json({
                                                        success: false,
                                                        error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
                                                    }); 
                                                }
                                            });


                                        } else {
                                            res.json({
                                                success: false,
                                                error_code: error_message.ERROR_CODE_OUR_BUSINESS_NOT_IN_YOUR_CITY
                                            });
                                        }
                                    }

                                });
                            }
                        });

                    }
                });
                    
                
            });
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};