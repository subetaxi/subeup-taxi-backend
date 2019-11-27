var Country = require('mongoose').model('Country');
var console = require('./console');
var utils = require('./utils');

exports.country_list = function (req, res) {
    utils.check_request_params(req.body, [], function (response) {
        if (response.success) {
            Country.find({isBusiness: constant_json.YES}).then((country) => {
                if (country.length === 0) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_NO_COUNTRY_FOUND});
                } else {
                    function sortCountry(a, b) {
                        if (a.countryname < b.countryname)
                            return -1;
                        if (a.countryname > b.countryname)
                            return 1;
                        return 0;
                    }
                    country.sort(sortCountry);
                    res.json({
                        success: true,
                        message: success_messages.MESSAGE_CODE_GET_COUNTRY_LIST_SUCCESSFULLY,
                        country: country
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

exports.get_country_city_list = function (req, res) {
    utils.check_request_params(req.body, [], function (response) {
        if (response.success) {
            var lookup = {
                $lookup:
                        {
                            from: "cities",
                            localField: "_id",
                            foreignField: "countryid",
                            as: "city_detail"
                        }
            };
            var unwind = {$unwind: "$city_detail"};
            var condition = {$match: {isBusiness: {$eq: 1}}}
            var rrr = {"$redact": {"$cond": [{'$eq': ["$city_detail.isBusiness", 1]}, "$$KEEP", "$$PRUNE"]}}

            var group = {
                $group: {
                    _id: '$_id',
                    countryname: {$first: '$countryname'},
                    countryphonecode: {$first: '$countryphonecode'},
                    phone_number_min_length: {$first: '$phone_number_min_length'},
                    phone_number_length: {$first: '$phone_number_length'},
                    city_list: {$push: {_id: '$city_detail._id', full_cityname: '$city_detail.full_cityname', cityname: '$city_detail.cityname'}}
                }
            }

            Country.aggregate([condition, lookup, unwind, rrr, group]).then((country_list) =>{
                res.json({success: true, country_list: country_list})
            }, (error)=>{
                res.json({success: true, country_list: []})
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


exports.countries_list = function (req, res) {
    utils.check_request_params(req.body, [], function (response) {
        if (response.success) {
            Country.find({isBusiness: constant_json.YES}, {
                "countryname": 1,
                "countryphonecode": 1,
                "phone_number_min_length": 1,
                "phone_number_length": 1,
                "flag_url": 1
            }).then((country) => {
                if (country.length === 0) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_NO_COUNTRY_FOUND});
                } else {
                    function sortCountry(a, b) {
                        if (a.countryname < b.countryname)
                            return -1;
                        if (a.countryname > b.countryname)
                            return 1;
                        return 0;
                    }
                    country.sort(sortCountry);
                    res.json({
                        success: true,
                        message: success_messages.MESSAGE_CODE_GET_COUNTRY_LIST_SUCCESSFULLY,
                        country: country
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