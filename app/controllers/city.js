var City = require('mongoose').model('City');
var Country = require('mongoose').model('Country');
var console = require('./console');
var utils = require('./utils');

exports.citylist = function (req, res) {

    utils.check_request_params(req.body, [{name: 'country', type: 'string'},], function (response) {
        if (response.success) {
            var country = req.body.country;
            if (country === "") {

                City.find({isBusiness: constant_json.YES}).then((city) => { 
                    if (!city) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_NO_CITY_LIST_FOUND, city: city});
                    } else {
                        res.json({success: true, message: success_messages.MESSAGE_CODE_GET_CITY_LIST_SUCCESSFULLY, city: city});
                    }
                });
            } else {
                Country.findOne({countryname: country}).then((country) => { 
                    if (!country) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_COUNTRY_NOT_FOUND});
                    } else {
                        var country_id = country._id;
                        City.find({countryid: country_id, isBusiness: constant_json.YES}).then((city) => { 
                            if (city.length == 0) {
                                res.json({success: false, error_code: error_message.ERROR_CODE_NO_CITY_LIST_FOUND, city: city});
                            } else {
                                res.json({success: true, message: success_messages.MESSAGE_CODE_GET_CITY_LIST_SUCCESSFULLY, city: city});
                            }
                        });
                    }
                });
            }
        } else {
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });
};


//exports.all_city_list = function (req, res) {
//    City.find({}, function (error, city_list) {
//        res.json({success: true,
//            city_list: city_list
//        });
//    });
//};