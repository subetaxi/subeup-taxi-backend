var utils = require('../controllers/utils');
var Country = require('mongoose').model('Country');
var City = require('mongoose').model('City');
var moment = require('moment');
var array = [];
var Type = require('mongoose').model('Type');
var City_type = require('mongoose').model('city_type');
var City_to_City = require('mongoose').model('City_to_City');
var Airport_to_City = require('mongoose').model('Airport_to_City');
var Trip_Service = require('mongoose').model('trip_service');
var excelbuilder = require('msexcel-builder');
var fs = require("fs");
    var CityZone = require('mongoose').model('CityZone');
    var ZoneValue = require('mongoose').model('ZoneValue');
var console = require('../controllers/console');
var mongoose = require('mongoose');
var Schema = mongoose.Types.ObjectId;

var surge_hours = [{
            "is_surge": false,
            "day": 0,
            "day_time": []
        },
        {
            "is_surge": false,
            "day": 1,
            "day_time": []
        },
        {
            "is_surge": false,
            "day": 2,
            "day_time": []
        },
        {
            "is_surge": false,
            "day": 3,
            "day_time": []
        },
        {
            "is_surge": false,
            "day": 4,
            "day_time": []
        },
        {
            "is_surge": false,
            "day": 5,
            "day_time": []
        },
        {
            "is_surge": false,
            "day": 6,
            "day_time": []
        }];

exports.city_type = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {

        var array = [];
        if (req.body.page == undefined)
        {
            page = 0;
            next = 1;
            pre = 0;
        } else
        {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;
        }

        if (req.body.search_item == undefined)
        {
            search_item = 'city_detail.cityname';
            search_value = '';
            sort_order = 1;
            sort_field = 'city_detail.cityname';
            filter_start_date = '';
            filter_end_date = '';

        } else
        {
            var item = req.body.search_item;
            var value = req.body.search_value;
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');
            value = new RegExp(value, 'i');

            var field = req.body.sort_item[0];
            var order = req.body.sort_item[1];

            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
            search_item = req.body.search_item
            search_value = req.body.search_value;
            filter_start_date = req.body.start_date;
            filter_end_date = req.body.end_date;

        }
        if (req.body.start_date == '' || req.body.end_date == '') {
            if (req.body.start_date == '' && req.body.end_date == '') {
                var date = new Date(Date.now());
                date = date.setHours(0, 0, 0, 0);
                start_date = new Date(0);
                end_date = new Date(Date.now());
            } else if (req.body.start_date == '') {
                start_date = new Date(0);
                var end_date = req.body.end_date;
                end_date = new Date(end_date);
                end_date = end_date.setHours(23, 59, 59, 999);
                end_date = new Date(end_date);
            } else {
                var start_date = req.body.start_date;
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(Date.now());
            }
        } else if (req.body.start_date == undefined || req.body.end_date == undefined) {
            start_date = new Date(0);
            end_date = new Date(Date.now());
        } else {
            var start_date = req.body.start_date;
            var end_date = req.body.end_date;
            start_date = new Date(start_date);
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
            end_date = new Date(end_date);
            end_date = end_date.setHours(23, 59, 59, 999);
            end_date = new Date(end_date);
        }

        var number_of_rec = 10;

        var lookup = {
            $lookup:
                    {
                        from: "countries",
                        localField: "countryid",
                        foreignField: "_id",
                        as: "country_detail"
                    }
        };
        var unwind = {$unwind: "$country_detail"};

        var lookup1 = {
            $lookup:
                    {
                        from: "cities",
                        localField: "cityid",
                        foreignField: "_id",
                        as: "city_detail"
                    }
        };

        var unwind1 = {$unwind: "$city_detail"};

        var lookup2 = {
            $lookup:
                    {
                        from: "types",
                        localField: "typeid",
                        foreignField: "_id",
                        as: "type_detail"
                    }
        };

        var unwind2 = {$unwind: "$type_detail"};

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');


        var search = {"$match": {}};
        if(search_item == 'city_detail.cityname'){
            var query1 = {};
            var query2 = {};
            query1[search_item] = {$regex: new RegExp(value, 'i')};
            query2['city_detail.full_cityname'] = {$regex: new RegExp(value, 'i')};
            search = {"$match": {$or: [query1, query2]}};
        } else {
            search["$match"][search_item] = {$regex: new RegExp(value, 'i')}
        }

        var filter = {"$match": {}};
        filter["$match"]['created_at'] = {$gte: start_date, $lt: end_date};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;

        City_type.aggregate([lookup, unwind, lookup1, unwind1, lookup2, unwind2, search, filter, count]).then((array) => {
            if (!array || array.length == 0)
            {
                array = [];
                res.render('city_type', {detail: array, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment});
                delete message;
            } else
            {
                var pages = Math.ceil(array[0].total / number_of_rec);
                City_type.aggregate([lookup, unwind, lookup1, unwind1, lookup2, unwind2, search, filter, sort, skip, limit]).then((array) => {

                    res.render('city_type', {detail: array, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment});
                    delete message;
                });
            }
        });
    } else {
        res.redirect('/admin');
    }
};

exports.genetare_city_type_excel = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {

        var array = [];
        if (req.body.page == undefined)
        {
            page = 0;
            next = 1;
            pre = 0;
        } else
        {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;
        }

        if (req.body.search_item == undefined)
        {
            search_item = 'city_detail.cityname';
            search_value = '';
            sort_order = 1;
            sort_field = 'city_detail.cityname';
            filter_start_date = '';
            filter_end_date = '';

        } else
        {
            var item = req.body.search_item;
            var value = req.body.search_value;
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');
            value = new RegExp(value, 'i');

            var field = req.body.sort_item[0];
            var order = req.body.sort_item[1];

            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
            search_item = req.body.search_item
            search_value = req.body.search_value;
            filter_start_date = req.body.start_date;
            filter_end_date = req.body.end_date;

        }
        if (req.body.start_date == '' || req.body.end_date == '') {
            if (req.body.start_date == '' && req.body.end_date == '') {
                var date = new Date(Date.now());
                date = date.setHours(0, 0, 0, 0);
                start_date = new Date(0);
                end_date = new Date(Date.now());
            } else if (req.body.start_date == '') {
                start_date = new Date(0);
                var end_date = req.body.end_date;
                end_date = new Date(end_date);
                end_date = end_date.setHours(23, 59, 59, 999);
                end_date = new Date(end_date);
            } else {
                var start_date = req.body.start_date;
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(Date.now());
            }
        } else if (req.body.start_date == undefined || req.body.end_date == undefined) {
            start_date = new Date(0);
            end_date = new Date(Date.now());
        } else {
            var start_date = req.body.start_date;
            var end_date = req.body.end_date;
            start_date = new Date(start_date);
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
            end_date = new Date(end_date);
            end_date = end_date.setHours(23, 59, 59, 999);
            end_date = new Date(end_date);
        }

        var number_of_rec = 10;

        var lookup = {
            $lookup:
                    {
                        from: "countries",
                        localField: "countryid",
                        foreignField: "_id",
                        as: "country_detail"
                    }
        };
        var unwind = {$unwind: "$country_detail"};

        var lookup1 = {
            $lookup:
                    {
                        from: "cities",
                        localField: "cityid",
                        foreignField: "_id",
                        as: "city_detail"
                    }
        };

        var unwind1 = {$unwind: "$city_detail"};

        var lookup2 = {
            $lookup:
                    {
                        from: "types",
                        localField: "typeid",
                        foreignField: "_id",
                        as: "type_detail"
                    }
        };

        var unwind2 = {$unwind: "$type_detail"};

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        var search = {"$match": {}};
        search["$match"][search_item] = {$regex: new RegExp(value, 'i')};

        var filter = {"$match": {}};
        filter["$match"]['created_at'] = {$gte: start_date, $lt: end_date};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;

        City_type.aggregate([lookup, unwind, lookup1, unwind1, lookup2, unwind2, search, filter, sort]).then((array) => { 
            var date = new Date()
            var time = date.getTime()
            var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_city_type.xlsx');

            var sheet1 = workbook.createSheet('sheet1', 8, array.length + 1);

            sheet1.set(1, 1, config_json.title_country);
            sheet1.set(2, 1, config_json.title_country_business);
            sheet1.set(3, 1, config_json.title_city);
            sheet1.set(4, 1, config_json.title_city_business);
            sheet1.set(5, 1, config_json.title_type);
            sheet1.set(6, 1, config_json.title_type_business);
            sheet1.set(7, 1, config_json.title_bussiness);


            array.forEach(function (data, index) {
                sheet1.set(1, index + 2, data.country_detail.countryname);
                
                if (data.country_detail.isBusiness == 1) {
                    sheet1.set(2, index + 2, config_json.title_on);
                } else {
                    sheet1.set(2, index + 2, config_json.title_off);
                }
                
                
                sheet1.set(3, index + 2, data.city_detail.cityname);
                
                if (data.city_detail.isBusiness == 1) {
                    sheet1.set(4, index + 2, config_json.title_on);
                } else {
                    sheet1.set(4, index + 2, config_json.title_off);
                }
                
               
                sheet1.set(5, index + 2, data.type_detail.typename);
                
                if (data.type_detail.is_business == 1) {
                    sheet1.set(6, index + 2, config_json.title_on);
                } else {
                    sheet1.set(6, index + 2, config_json.title_off);
                }
                if (data.is_business == 1) {
                    sheet1.set(7, index + 2, config_json.title_on);
                } else {
                    sheet1.set(7, index + 2, config_json.title_off);
                }


                if (index == array.length - 1) {
                    workbook.save(function (err) {
                        if (err)
                        {
                            workbook.cancel();
                        } else {
                            var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_city_type.xlsx"
                            res.json(url);
                            setTimeout(function () {
                                fs.unlink('data/xlsheet/' + time + '_city_type.xlsx', function (err, file) {
                                });
                            }, 10000)
                        }
                    });
                }

            })
        });
    } else {
        res.redirect('/admin');
    }
};

exports.add_city_type_form = function (req, res, next) {
    if (typeof req.session.userid != "undefined") {
        Country.find({isBusiness: constant_json.YES}).then((country) => {
            Type.find({}).then((type) => {
                res.render('add_city_type_form', {city_type_data_country: country, surge_hours: surge_hours, city_type_data_type: type});
            });
        });
    } else {
        res.redirect('/admin');
    }
};

exports.add_city_type_detail = function (req, res) {

    Country.findOne({_id: req.body.countryid}).then((country_data) => {
        var countryname = (country_data.countryname).trim();
        City.findOne({_id: req.body.cityid}).then((city_data) => {
            var cityname = (city_data.cityname).trim();

            Type.findOne({typename: (req.body.typename).trim()}).then((type_data) => {
                var type_id = type_data._id;

                var service_type = type_data.service_type;
                var type_image = type_data.file;

                var surge_multiplier = 1;

                if (req.body.surge_multiplier) {
                    surge_multiplier = req.body.surge_multiplier;
                }
                    var citytype = new City_type({
                        countryid: req.body.countryid,
                        countryname: countryname,
                        cityname: cityname,
                        cityid: req.body.cityid,
                        typeid: type_id,
                        type_image: type_image,
                        service_type: service_type,
                        is_business: req.body.is_business,
                        is_car_rental_business: req.body.is_car_rental_business,
                        surge_multiplier: surge_multiplier,
                        surge_start_hour: req.body.surge_start_hour,
                        surge_end_hour: req.body.surge_end_hour,
                        is_surge_hours: req.body.is_surge_hours,
                        is_zone: req.body.is_zone,
                        // zone_multiplier: zone_multiplier,
                        typename: req.body.typename,
                        base_price_distance: req.body.base_price_distance,
                        base_price: req.body.base_price,
                        price_per_unit_distance: req.body.price_per_unit_distance,
                        waiting_time_start_after_minute: req.body.waiting_time_start_after_minute,
                        price_for_waiting_time: req.body.price_for_waiting,
                        price_for_total_time: req.body.price_for_total_time,
                        tax: req.body.tax,
                        min_fare: req.body.min_fare,
                        provider_profit: req.body.provider_profit,
                        max_space: req.body.max_space,
                        cancellation_fee: req.body.cancellation_fee,
                        user_miscellaneous_fee: req.body.user_miscellaneous_fee,
                        provider_miscellaneous_fee: req.body.provider_miscellaneous_fee,
                        user_tax: req.body.user_tax,
                        provider_tax: req.body.provider_tax
                    });

                    citytype.save().then(() => {
                        var city = citytype.cityid;
                        var country_id = citytype.countryid;
                        var trip_service = new Trip_Service({
                            service_type_id: citytype._id,
                            city_id: city,
                            service_type_name: (type_data.typename).trim(),
                            min_fare: citytype.min_fare,
                            provider_profit: citytype.provider_profit,
                            base_price_distance: citytype.base_price_distance,
                            base_price: citytype.base_price,
                            price_per_unit_distance: citytype.price_per_unit_distance,
                            waiting_time_start_after_minute: citytype.waiting_time_start_after_minute,
                            price_for_waiting_time: citytype.price_for_waiting_time,
                            is_car_rental_business: citytype.is_car_rental_business,
                            price_for_total_time: citytype.price_for_total_time,
                            surge_multiplier: citytype.surge_multiplier,
                            surge_start_hour: citytype.surge_start_hour,
                            surge_end_hour: citytype.surge_end_hour,
                            is_surge_hours: citytype.is_surge_hours,
                            tax: citytype.tax,
                            max_space: citytype.max_space,
                            cancellation_fee: citytype.cancellation_fee,
                            user_miscellaneous_fee: citytype.user_miscellaneous_fee,
                            provider_miscellaneous_fee: citytype.provider_miscellaneous_fee,
                            user_tax: citytype.user_tax,
                            provider_tax: citytype.provider_tax
                        });

                        trip_service.save().then(() => {
                        }, (err) => {
                            console.log(err)
                        });

                        if (req.body.airport_array !== undefined)
                        {
                            req.body.airport_array.forEach(function (airport_data, index) {

                                if (airport_data.price === null || airport_data.price === undefined)
                                {
                                    airport_data.price = 0;
                                }
                                var AirporttoCity = new Airport_to_City({
                                    city_id: req.body.cityid,
                                    airport_id: airport_data.id,
                                    price: airport_data.price,
                                    service_type_id: citytype._id
                                });
                                AirporttoCity.save().then(() => {
                                }, (err) => {
                                    console.log(err)
                                });
                            })
                        }

                        if (req.body.destcity_array !== undefined)
                        {
                            req.body.destcity_array.forEach(function (destcity_city_data, index) {

                                if (destcity_city_data.price === null || destcity_city_data.price === undefined)
                                {
                                    destcity_city_data.price = 0;
                                }
                                var CitytoCity = new City_to_City({
                                    city_id: req.body.cityid,
                                    destination_city_id: destcity_city_data.id,
                                    price: destcity_city_data.price,
                                    service_type_id: citytype._id
                                });
                                CitytoCity.save().then(() => {
                                }, (err) => {
                                    console.log(err)
                                });

                                if (index == req.body.destcity_array.length - 1)
                                {
                                    message = admin_messages.success_message_city_service_add;
                                    // res.redirect("/city_type");
                                    res.json({success: true, id: citytype._id});
                                }
                            })
                        } else
                        {
                            message = admin_messages.success_message_city_service_add;
                            res.json({success: true, id: citytype._id});
                            // res.redirect("/city_type");
                        }
                    }, (err) => {
                        console.log(err)
                    });
                

            });
        });
    });
}



exports.view_city_type_detail = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {

        var array = [];

        var query = {};
        query['_id'] = req.body.id;

        City_type.findOne(query).then((citytype_data) => {
            var query = {};
            query['_id'] = citytype_data.typeid;
            Type.findOne(query).then((type_data) => {
                var typename = type_data.typename;
                res.render('view_city_type_detail', {city_type_data: citytype_data, typename: typename, moment: moment});
            });
        });
    } else {
        res.redirect('/admin');
    }

};

exports.edit_city_type_form = function (req, res) {
    var id = req.body.id;
    if (typeof req.session.userid != "undefined") {
        // City_type.findById(id).then((city_type) => {
        
        var lookup = {
            $lookup:
            {
                from: "city_types",
                localField: "car_rental_ids",
                foreignField: "_id",
                as: "car_rental_list"
            }
        };
        var condition = {$match: {_id: {$eq: Schema(id) }}}
        City_type.aggregate([condition, lookup], function(error, city_type_list){

                var city_type = {};
                if(city_type_list.length>0){
                    city_type = city_type_list[0];
                }
                countryid = city_type.countryid;
                cityid = city_type.cityid;
                typeid = city_type.typeid;

                Country.findById(countryid).then((country) => {
                   
                        City.findById(cityid).then((city) => {
                            Type.findById(typeid).then((type) => {
                                
                                CityZone.find({'cityid': cityid}).then((city_zone) => { 

                                    var lookup2 = {
                                        $lookup:
                                        {
                                            from: "cityzones",
                                            localField: "from",
                                            foreignField: "_id",
                                            as: "from_detail"
                                        }
                                    };
                                    var unwind2 = {$unwind: "$from_detail"};
                                    var lookup3 = {
                                        $lookup:
                                        {
                                            from: "cityzones",
                                            localField: "to",
                                            foreignField: "_id",
                                            as: "to_detail"
                                        }
                                    };
                                    var unwind3 = {$unwind: "$to_detail"};
                                    var query1 = {$match: {'service_type_id': {$eq: city_type._id}}};
                                    ZoneValue.aggregate([query1, lookup2, unwind2, lookup3, unwind3]).then((zonevalue) => {
                                        res.render('add_city_type_form', {city_type_data: city_type, surge_hours: surge_hours, city_zone: city_zone,zonevalue: zonevalue,  country_data: country, city_data: city, type_data: type});
                                    }, (err) => {
                                        utils.error_response(err, res)
                                    });

                                });
                                
                            });
                        });
                    
                });
            
        });
    } else {
        res.redirect('/admin');
    }
}

exports.update_surge_time = function (req, res) {
    var surge_hours = []
    req.body.surge_hours.forEach(function(surge_hour_data){
        var day_time = [];
        if(surge_hour_data.day_time){
            day_time = surge_hour_data.day_time;
        }
        if(surge_hour_data.is_surge == 'false' || surge_hour_data.is_surge == false){
            surge_hour_data.is_surge = false;
        } else {
            surge_hour_data.is_surge = true;
        }
        surge_hours.push({day: surge_hour_data.day, day_time: day_time, is_surge: surge_hour_data.is_surge})
    })
    City_type.findByIdAndUpdate(req.body.id, {surge_hours: surge_hours}).then((citytype) => {
        res.json({success: true});
    });
}

exports.update_city_type_detail = function (req, res) {

    var id = req.body.id;
    if (req.body.surge_multiplier == '')
    {
        req.body.surge_multiplier = 1;
    }
    console.log(req.body)
    if (typeof req.session.userid != "undefined") {

        if(!req.body.zone_ids){
            req.body.zone_ids = [];
        }
        City_type.findByIdAndUpdate(id, req.body).then((citytype) => {
           
                City_type.findOne({_id: id}).then((citytype) => {
                    var city = citytype.cityid;
                    var country_id = citytype.countryid;
                    var typeid = citytype.typeid;

                    Type.findOne({_id: typeid}).then((type_detail) => {
                        var trip_service = new Trip_Service({
                            service_type_id: citytype._id,
                            city_id: city,
                            service_type_name: (type_detail.typename).trim(),
                            min_fare: citytype.min_fare,
                            provider_profit: citytype.provider_profit,
                            base_price_distance: citytype.base_price_distance,
                            base_price: citytype.base_price,
                            price_per_unit_distance: citytype.price_per_unit_distance,
                            waiting_time_start_after_minute: citytype.waiting_time_start_after_minute,
                            price_for_waiting_time: citytype.price_for_waiting_time,
                            price_for_total_time: citytype.price_for_total_time,
                            surge_multiplier: citytype.surge_multiplier,
                            is_car_rental_business: citytype.is_car_rental_business,
                            surge_start_hour: citytype.surge_start_hour,
                            surge_end_hour: citytype.surge_end_hour,
                            is_surge_hours: citytype.is_surge_hours,
                            tax: citytype.tax,
                            max_space: citytype.max_space,
                            cancellation_fee: citytype.cancellation_fee,
                            is_business: req.body.is_business,
                            user_miscellaneous_fee: citytype.user_miscellaneous_fee,
                            provider_miscellaneous_fee: citytype.provider_miscellaneous_fee,
                            user_tax: citytype.user_tax,
                            provider_tax: citytype.provider_tax

                        });
                        trip_service.save().then(() => {
                        });

                        Trip_Service.update({service_type_id: {$in: citytype.car_rental_ids}}, {provider_profit: citytype.provider_profit}, {multi: true}, function(error, trip_service_data){

                        })
                        City_type.update({_id: {$in: citytype.car_rental_ids}}, {provider_profit: citytype.provider_profit}, {multi: true}, function(error, city_type_data){

                        })
                    });

                    if (req.body.airport_array !== undefined)
                    {
                        req.body.airport_array.forEach(function (airport_data, index) {
                            if (airport_data.price === null || airport_data.price === '')
                            {
                                airport_data.price = 0;
                            }

                            Airport_to_City.findOneAndUpdate({city_id: city, airport_id: airport_data.id, service_type_id: id}, {price: airport_data.price}).then((airporttocity) => {
                                if (airporttocity == null)
                                {
                                    var AirporttoCity = new Airport_to_City({
                                        city_id: city,
                                        airport_id: airport_data.id,
                                        price: airport_data.price,
                                        service_type_id: id
                                    });
                                    AirporttoCity.save().then(() => {
                                    });
                                }
                            });
                        })
                    }

                    if(req.body.rich_area_surge){
                        req.body.rich_area_surge.forEach(function(rich_area_surge_data, index){

                            var zone_index = citytype.rich_area_surge.findIndex((x)=>(x.id).toString() == (rich_area_surge_data.id).toString());
                            if(zone_index == -1){
                                citytype.rich_area_surge.push({id: Schema(rich_area_surge_data.id), surge_multiplier: Number(rich_area_surge_data.surge_multiplier)})
                            } else {
                                citytype.rich_area_surge[zone_index].surge_multiplier = Number(rich_area_surge_data.surge_multiplier)
                            }
                            // update_city_zone_surge(rich_area_surge_data, id);
                        });
                        citytype.markModified('rich_area_surge');
                        citytype.save();
                    }

                    if (req.body.destcity_array !== undefined)
                    {
                        req.body.destcity_array.forEach(function (destcity_city_data, index) {
                            if (destcity_city_data.price === null || destcity_city_data.price === '')
                            {
                                destcity_city_data.price = 0;
                            }

                            City_to_City.findOneAndUpdate({city_id: city, destination_city_id: destcity_city_data.id, service_type_id: id}, {price: destcity_city_data.price}).then((citytocity) => {


                                if (citytocity == null)
                                {
                                    var CitytoCity = new City_to_City({
                                        city_id: city,
                                        destination_city_id: destcity_city_data.id,
                                        price: destcity_city_data.price,
                                        service_type_id: id
                                    });
                                    CitytoCity.save().then(() => {
                                    });
                                }
                                if (index == req.body.destcity_array.length - 1)
                                {
                                    message = admin_messages.success_message_city_service_update;
                                    res.json({success: true, id: citytype._id});
                                }
                            });
                        })
                    } else
                    {
                        message = admin_messages.success_message_city_service_add;
                        res.json({success: true, id: citytype._id});
                    }


                });
        });
    } else {
        res.redirect('/admin');
    }
};


exports.getcitytype = function (req, res, next) {


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

    var cityid_condition = {$match: {'cityname': {$eq: req.body.city}}};

    City_type.aggregate([cityid_condition, lookup, unwind]).then((type_available) => {
        res.json({service_type: type_available});
    });
};




exports.add_carrental_data = function (req, res, next) {

    var citytype = new City_type({
        typename: req.body.typename,
        base_price_distance: req.body.base_price_distance,
        base_price_time: req.body.base_price_time,
        base_price: req.body.base_price,
        price_per_unit_distance: req.body.price_per_unit_distance,
        price_for_total_time: req.body.price_for_total_time,
        is_business: req.body.is_business,
        provider_profit: req.body.provider_profit
    });

    citytype.save().then(()=>{
        var trip_service = new Trip_Service({
            service_type_id: citytype._id,
            typename: req.body.typename,
            base_price_distance: req.body.base_price_distance,
            base_price_time: req.body.base_price_time,
            base_price: req.body.base_price,
            price_per_unit_distance: req.body.price_per_unit_distance,
            price_for_total_time: req.body.price_for_total_time,
            provider_profit: req.body.provider_profit
        });

        trip_service.save().then(()=>{
            City_type.findOne({_id: req.body.city_type_id}, function(error, city_type_data){
                city_type_data.car_rental_ids.push(citytype._id);
                city_type_data.save();
                res.json({success: true, carrental_data: citytype});
            });
        });
        
    }, (error)=>{
        console.log(error)
    })
};

exports.update_carrental_data = function (req, res, next) {
    City_type.findOneAndUpdate({_id: req.body.id}, req.body, function(error, city_type_data){
        var trip_service = new Trip_Service({
            service_type_id: city_type_data._id,
            typename: req.body.typename,
            base_price_distance: req.body.base_price_distance,
            base_price_time: req.body.base_price_time,
            base_price: req.body.base_price,
            price_per_unit_distance: req.body.price_per_unit_distance,
            price_for_total_time: req.body.price_for_total_time
        });
        trip_service.save().then(()=>{
            res.json({success: true, carrental_data: city_type_data});
        });
    })
}

exports.delete_carrental_data = function (req, res, next) {
    City_type.findOneAndRemove({_id: req.body.id}, function(error, carrental_type_id){
        City_type.findOne({_id: req.body.city_type_id}, function(error, city_type_data){
            var index = city_type_data.car_rental_ids.indexOf(carrental_type_id._id)
            if(index != -1){
                city_type_data.car_rental_ids.splice(index, 1);
                city_type_data.save();
            }
            res.json({success: true});
        });
    })
}
