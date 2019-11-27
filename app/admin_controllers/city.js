    var utils = require('../controllers/utils');
    var Settings = require('mongoose').model('Settings');
    var Country = require('mongoose').model('Country');
    var City = require('mongoose').model('City');
    var ZoneValue = require('mongoose').model('ZoneValue');
    var moment = require('moment');
    var CityZone = require('mongoose').model('CityZone');
    var RedZoneArea = require('mongoose').model('RedZoneArea');
    var Airport = require('mongoose').model('Airport');
    var tj = require('togeojson');
    var fs = require('fs');
    var DOMParser = require('xmldom').DOMParser;
    var array = [];
    var excelbuilder = require('msexcel-builder');
    var fs = require("fs");
    var console = require('../controllers/console');
    var mongoose = require('mongoose');
    var Schema = mongoose.Types.ObjectId;
    var City_to_City = require('mongoose').model('City_to_City');
    var Airport_to_City = require('mongoose').model('Airport_to_City');

    exports.all_city = function (req, res) {

        var query = {};
        query['cityLatLong'] = {$ne: [0, 0]};
        if (typeof req.session.userid != 'undefined') {
            City.count(query).then((city_counts) => { 
                var url = "https://maps.googleapis.com/maps/api/js?key=" + setting_detail.web_app_google_key + "&libraries=places"
                if (city_counts != 0) {
                    City.find(query).then((cities) => { 
                        res.render('all_city_list', {detail: cities, map_url: url});
                    });
                } else {

                    res.render('all_city_list', {detail: array, map_url: url});
                }
            });
        } else {
            res.redirect('/admin');
        }
    };

    exports.fetch_all_city = function (req, res) {
        var query = {};
        query['cityLatLong'] = {$ne: [0, 0]};
        if (typeof req.session.userid != 'undefined') {
            City.count(query).then((city_count) => { 
                if (city_count != 0) {
                    City.find(query).then((cities) => { 
                        res.json(cities);
                    });
                } else {
                    res.json('');
                }
            });
        } else {
            res.redirect('/admin');
        }
    };

    exports.city = function (req, res) {
        if (typeof req.session.userid != 'undefined') {
            var j = 1;
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
                search_item = 'cityname';
                search_value = '';
                sort_order = 1;
                sort_field = 'unique_id';
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
            value = search_value;
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');


            var search = {"$match": {}};
            if(search_item == 'cityname'){
                var query1 = {};
                var query2 = {};
                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['full_cityname'] = {$regex: new RegExp(value, 'i')};
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

            City.aggregate([lookup, unwind, search, filter, count]).then((array) => {
                if (!array || array.length == 0)
                {
                    array = [];
                    res.render('city', {detail: array, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment});
                    delete message;
                } else
                {
                    var pages = Math.ceil(array[0].total / number_of_rec);
                    City.aggregate([lookup, unwind, search, filter, sort, skip, limit]).then((array) => {

                        res.render('city', {detail: array, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment});
                        delete message;
                    });
                }
            });
        } else {
            res.redirect('/admin');
        }
    };

    exports.genetare_city_excel = function (req, res) {
        if (typeof req.session.userid != 'undefined') {
            var j = 1;
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
                search_item = 'cityname';
                search_value = '';
                sort_order = 1;
                sort_field = 'unique_id';
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
            value = search_value;
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');


            var search = {"$match": {}};
            search["$match"][search_item] = {$regex: new RegExp(value, 'i')}

            var filter = {"$match": {}};
            filter["$match"]['created_at'] = {$gte: start_date, $lt: end_date};

            var sort = {"$sort": {}};
            sort["$sort"][sort_field] = parseInt(sort_order);

            var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

            var skip = {};
            skip["$skip"] = page * number_of_rec;

            var limit = {};
            limit["$limit"] = number_of_rec;

            City.aggregate([lookup, unwind, search, filter, sort]).then((array) => {

                var date = new Date()
                var time = date.getTime()
                var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_city.xlsx');

                var sheet1 = workbook.createSheet('sheet1', 6, array.length + 1);

                sheet1.set(1, 1, config_json.title_country);
                sheet1.set(2, 1, config_json.title_city);
                sheet1.set(3, 1, config_json.title_city_code);
                sheet1.set(4, 1, config_json.title_bussiness);


                array.forEach(function (data, index) {

                    sheet1.set(1, index + 2, data.country_detail.countryname);
                    sheet1.set(2, index + 2, data.cityname);
                    sheet1.set(3, index + 2, data.citycode);
                    if (data.isBusiness == 1) {
                        sheet1.set(4, index + 2, config_json.title_on);
                    } else {
                        sheet1.set(4, index + 2, config_json.title_off);
                    }


                    if (index == array.length - 1) {
                        workbook.save(function (err) {
                            if (err)
                            {
                                workbook.cancel();
                            } else {
                                var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_city.xlsx"
                                res.json(url);
                                setTimeout(function () {
                                    fs.unlink('data/xlsheet/' + time + '_city.xlsx', function (err, file) {
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

    exports.updatezonevalueajax = function (req, res) {
        var id = req.body.id;
        ZoneValue.findOne({_id: id}).then((zone_value) => {
            zone_value.amount = req.body.amount;
            zone_value.save();
            res.json({success: true});
        }, (err) => {
            utils.error_response(err, res)
        });
    }
    exports.deletezonevalueajax = function (req, res) {
        var id = req.body.id;
        ZoneValue.remove({_id: id}).then((success) => {
            if (success.result.ok) {
                res.json({success: true});
            } else {
                res.json({success: false});
            }
        });
    }
    exports.zonevalueajax = function (req, res) {
        var zone1 = req.body.zone1;
        var zone2 = req.body.zone2;
        var amount = req.body.amount;

        ZoneValue.findOne({service_type_id: req.body.id, $or: [{from: zone1, to: zone2}, {from: zone2, to: zone1}]}).then((zone) => {
            if (zone)
            {
                res.json({success: false, message: admin_messages.error_zone_already_added});
            } else
            {
                var zone_value = ZoneValue({
                    cityid: req.body.cityid,
                    service_type_id: req.body.id,
                    from: zone1,
                    to: zone2,
                    amount: amount
                });
                zone_value.save().then((zone) => {
                    res.json({success: true, zone_value: zone_value});
                }, (err) => {
                    utils.error_response(err, res)
                });
            }
        });

    }
    exports.add_city_form = function (req, res) {

        if (typeof req.session.userid != "undefined") {

            var utils = require('../controllers/utils');
            var types = utils.PAYMENT_TYPES();
            Country.find({}).then((country) => { 

                var url = "https://maps.googleapis.com/maps/api/js?key=" + setting_detail.web_app_google_key + "&libraries=places,drawing"
                res.render('add_city_form', {country_data: country, payment_gateway: types, map_url: url});

            });
        } else {
            res.redirect('/admin');
        }
    };

    exports.update_city_zone = function (req, res) {
        if (typeof req.session.userid != 'undefined') {
         
            City.findOne({_id: req.body.city_id}, function(error, city){
                var index = 0;
                if(req.body.deleted_zone && req.body.deleted_zone.length>0){
                    req.body.deleted_zone.forEach(function(zone_data){
                        CityZone.findOneAndRemove({_id: zone_data}, function(error, zone){
                            ZoneValue.remove({$or: [{from: zone_data},{to: zone_data}]}, function(error, removed_zone_value){

                            })
                        })
                    })
                }

                if(req.body.zone_array && req.body.zone_array.length>0){
                    req.body.zone_array.forEach(function(zone_data){
                        if(zone_data._id){
                            CityZone.findOneAndUpdate({_id: zone_data._id}, zone_data, function(error, city_zone){
                                index++;
                                if(index==req.body.zone_array.length){
                                    res.json({success: true});
                                }
                            })
                        } else {
                            var city_zone = new CityZone({
                                cityid: city._id,
                                cityname: city.cityname,
                                title: zone_data.title,
                                kmlzone: zone_data.kmlzone,
                                styleUrl: zone_data.styleUrl,
                                styleHash: zone_data.styleHash,
                                description: zone_data.description,
                                stroke: zone_data.stroke,
                                stroke_opacity: 1,
                                stroke_width: 1.2,
                                fill: zone_data.fill,
                                fill_opacity: 0.30196078431372547,
                            });
                            city_zone.save().then(() => {
                                index++;
                                if(index==req.body.zone_array.length){
                                    res.json({success: true});
                                }
                            }, (err) => {
                                console.log(err)
                            });
                        }
                    })
                } else {
                    res.json({success: true});
                }
            })
        } else {
            res.redirect('/admin');
        }
    };

    exports.update_city_red_zone = function (req, res) {
        if (typeof req.session.userid != 'undefined') {
         
            City.findOne({_id: req.body.city_id}, function(error, city){
                var index = 0;
                if(req.body.deleted_red_zone && req.body.deleted_red_zone.length>0){
                    req.body.deleted_red_zone.forEach(function(red_zone_data){
                        RedZoneArea.findOneAndRemove({_id: red_zone_data}, function(error, zone){
                            
                        })
                    })
                }

                if(req.body.red_zone_array && req.body.red_zone_array.length>0){
                    req.body.red_zone_array.forEach(function(red_zone_data){
                        if(red_zone_data._id){
                            RedZoneArea.findOneAndUpdate({_id: red_zone_data._id}, red_zone_data, function(error, city_zone){
                                index++;
                                if(index==req.body.red_zone_array.length){
                                    res.json({success: true});
                                }
                            })
                        } else {
                            var city_red_zone = new RedZoneArea({
                                cityid: city._id,
                                cityname: city.cityname,
                                title: red_zone_data.title,
                                kmlzone: red_zone_data.kmlzone,
                                styleUrl: red_zone_data.styleUrl,
                                styleHash: red_zone_data.styleHash,
                                description: red_zone_data.description,
                                stroke: red_zone_data.stroke,
                                stroke_opacity: 1,
                                stroke_width: 1.2,
                                fill: red_zone_data.fill,
                                fill_opacity: 0.30196078431372547,
                            });
                            city_red_zone.save().then(() => {
                                index++;
                                if(index==req.body.red_zone_array.length){
                                    res.json({success: true});
                                }
                            }, (err) => {
                                console.log(err)
                            });
                        }
                    })
                } else {
                    res.json({success: true});
                }
            })
        } else {
            res.redirect('/admin');
        }
    };

    exports.update_airport = function (req, res) {
        if (typeof req.session.userid != 'undefined') {
         
            City.findOne({_id: req.body.city_id}, function(error, city){
                var index = 0;
                if(req.body.deleted_airport && req.body.deleted_airport.length>0){
                    req.body.deleted_airport.forEach(function(airport_data){
                        Airport.findOneAndRemove({_id: airport_data}, function(error, airport){
                            Airport_to_City.remove({airport_id: airport_data}, function(error, removed_airport_value){

                            })
                        })
                    })
                }
                console.log(req.body)
                if(req.body.airport_array && req.body.airport_array.length>0){
                    req.body.airport_array.forEach(function(airport_data){
                        if(airport_data._id){
                            Airport.findOneAndUpdate({_id: airport_data._id}, airport_data, function(error, city_airport){
                                index++;
                                if(index==req.body.airport_array.length){
                                    res.json({success: true});
                                }
                            })
                        } else {
                            var city_airport = new Airport({
                                city_id: city._id,
                                title: airport_data.title,
                                kmlzone: airport_data.kmlzone,
                                styleUrl: airport_data.styleUrl,
                                styleHash: airport_data.styleHash,
                                description: airport_data.description,
                                stroke: airport_data.stroke,
                                stroke_opacity: 1,
                                stroke_width: 1.2,
                                fill: airport_data.fill,
                                fill_opacity: 0.30196078431372547,
                            });
                            city_airport.save().then(() => {
                                index++;
                                if(index==req.body.airport_array.length){
                                    res.json({success: true});
                                }
                            }, (err) => {
                                console.log(err)
                            });
                        }
                    })
                } else {
                    res.json({success: true});
                }
            })
        } else {
            res.redirect('/admin');
        }
    };


    exports.edit_city_form = function (req, res) {
        if (typeof req.session.userid != 'undefined') {

            var utils = require('../controllers/utils');
            var types = utils.PAYMENT_TYPES();
            
            //City.findById({ '_id': id }, function (err, data, next) {
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

                var query = {$match: {'_id': {$eq: Schema(req.body.id)}}};

                City.aggregate([query, lookup, unwind]).then((array) => {
                    City.find({'countryid': array[0].countryid, '_id': {$in: array[0].destination_city}}).then((dest_city_list) => {

                        var dest = array[0].destination_city;
                        if (dest != undefined) {
                            dest.push(Schema(req.body.id))
                        }
                        City.find({'countryid': array[0].countryid, '_id': {$nin: dest}}).then((city_list) => { 
                            CityZone.find({'cityid': array[0]._id}).then((city_zone) => { 
                                RedZoneArea.find({'cityid': array[0]._id}).then((red_zone_area) => { 
                                    Airport.find({'city_id': array[0]._id}).then((airport) => { 
                                        var query1 = {$match: {'cityid': {$eq: Schema(req.body.id)}}};
                                        var url = "https://maps.googleapis.com/maps/api/js?key=" + setting_detail.web_app_google_key + "&libraries=places,drawing"
                                    console.log(red_zone_area)
                                        res.render('add_city_form', {detail: array, red_zone_area: red_zone_area, airport: airport, map_url: url, city_zone: city_zone,  moment: moment, city_list: city_list, payment_gateway: types, dest_city_list: dest_city_list});
                                        
                                    });
                                });
                            });
                        });
                    });
                });

            } else {
                res.redirect('/admin');
            }
        };

        exports.add_city_detail = function (req, res) {
            var city_locations = req.body.city_locations;
            city_locations = city_locations.split(',');
            var array = [];
            var location_array = [];
            city_locations.forEach(function (location, index) {
                location_array.push(Number(location))
                if(index%2!==0){
                    array.push(location_array);
                    location_array = [];
                }
            })
            Country.findOne({_id: req.body.countryid}, function (err, c_data) {
                var countryname = (c_data.countryname).trim();
                var add_city = new City({
                    countryid: req.body.countryid,
                    city_locations: array,
                    countryname: countryname,
                    cityname: (req.body.full_cityname).trim(),
                    full_cityname: (req.body.cityname).trim(),
                    citycode: req.body.citycode,
                unit: req.body.unit, /////// unit 1= km , unit 0=miles
                is_payment_mode_cash: req.body.is_payment_mode_cash, //// 1=on , 0 = off
                is_payment_mode_card: req.body.is_payment_mode_card, //// 1=on , 0 = off
                isPromoApplyForCash: req.body.isPromoApplyForCash, //// 1=on , 0 = off
                isPromoApplyForCard: req.body.isPromoApplyForCard, //// 1=on , 0 = off
                cityRadius: req.body.cityRadius,
                cityLatLong: [req.body.latitude, req.body.longitude],
                payment_gateway: req.body.payment_gateway,
                isBusiness: req.body.isBusiness, //// 1=on , 0 = off
                airport_business: req.body.airport_business,
                is_use_city_boundary: req.body.is_use_city_boundary,
                // Start 6 March //
                provider_min_wallet_amount_set_for_received_cash_request: req.body.provider_min_wallet_amount_set_for_received_cash_request,
                is_check_provider_wallet_amount_for_received_cash_request: req.body.is_check_provider_wallet_amount_for_received_cash_request,
                is_provider_earning_set_in_wallet_on_cash_payment: req.body.is_provider_earning_set_in_wallet_on_cash_payment,
                is_provider_earning_set_in_wallet_on_other_payment: req.body.is_provider_earning_set_in_wallet_on_other_payment,
                is_ask_user_for_fixed_fare: req.body.is_ask_user_for_fixed_fare,
                // End 6 March //

                city_business: req.body.city_business,
                zone_business: req.body.zone_business,
                timezone: req.body.timezone,
                destination_city: req.body.destination_city
            });

                add_city.save().then(() => { 

                    message = admin_messages.success_message_city_add;
                    res.redirect('/city');

                    // var number_files = req.files.length;
                    // if ((req.files != null || req.files != 'undefined') && number_files != 0) {
                    //     var files = req.files;
                    //     var file_number = files.length;

                    //     var kml = new DOMParser().parseFromString(fs.readFileSync(files[0].path, 'utf8'));
                    //     var converted = tj.kml(kml);
                    //     var convertedWithStyles = tj.kml(kml, {styles: true});
                    //     var size = convertedWithStyles.features.length;
                    //     var i = 0;
                    //     var file_number = convertedWithStyles.features.length;
                    //     convertedWithStyles.features.forEach(function (kmldata) {

                    //         if (kmldata.geometry.type == 'Polygon') {

                    //             var city_zone = new CityZone({
                    //                 cityid: city.id,
                    //                 cityname: city.cityname,
                    //                 title: kmldata.properties.name,
                    //                 kmlzone: kmldata.geometry.coordinates[0],
                    //                 styleUrl: kmldata.properties.styleUrl,
                    //                 styleHash: kmldata.properties.styleHash,
                    //                 description: kmldata.properties.description,
                    //                 stroke: kmldata.properties.stroke,
                    //                 stroke_opacity: 1,
                    //                 stroke_width: 1.2,
                    //                 fill: kmldata.properties.fill,
                    //                 fill_opacity: 0.30196078431372547,
                    //             });
                    //             city_zone.save().then(() => { 

                    //                 i++;
                    //                 if (file_number == i) {

                    //                     var airport_length = req.body.airport.length;
                    //                     if (airport_length !== 0)
                    //                     {
                    //                         req.body.airport.forEach(function (airport, index) {
                    //                             var airportLatLong = [airport.latitude, airport.longitude]
                    //                             var airport = Airport({
                    //                                 city_id: add_city._id,
                    //                                 name: airport.name,
                    //                                 radius: airport.radius,
                    //                                 airportLatLong: airportLatLong
                    //                             });
                    //                             airport.save().then(() => { 
                    //                             }, (err) => {
                    //                                 console.log(err)
                    //                             });
                    //                             if (index == airport_length - 1)
                    //                             {
                    //                                 message = admin_messages.success_message_city_add;
                    //                                 res.redirect('/city');
                    //                             }

                    //                         })
                    //                     } else
                    //                     {
                    //                         message = admin_messages.success_message_city_add;
                    //                         res.redirect('/city');
                    //                     }
                    //                 }
                    //             }, (err) => {
                    //                 utils.error_response(err, res)
                    //             });
                    //         }
                    //     });

                    // } else {

                    //     var airport_length = req.body.airport.length;
                    //     if (airport_length !== 0)
                    //     {
                    //         req.body.airport.forEach(function (airport, index) {
                    //             var airportLatLong = [airport.latitude, airport.longitude]
                    //             var airport = Airport({
                    //                 city_id: add_city._id,
                    //                 name: airport.name,
                    //                 radius: airport.radius,
                    //                 airportLatLong: airportLatLong
                    //             });
                    //             airport.save().then(() => { 
                    //             }, (err) => {
                    //                 console.log(err)
                    //             });
                    //             if (index == req.body.airport.length - 1)
                    //             {
                    //                 message = admin_messages.success_message_city_add;
                    //                 res.redirect('/city');
                    //             }

                    //         })
                    //     } else
                    //     {
                    //         message = admin_messages.success_message_city_add;
                    //         res.redirect('/city');
                    //     }

                    // }
                }, (err) => {
                    utils.error_response(err, res)

                });

});
};

exports.get_city_airport_list = function (req, res) {

    Country.findById(req.body.country_id).then((country_data) => {

        Airport.find({city_id: req.body.city_id}).then((airport) => {
            res.json({airport_list: airport, country_code: country_data.countrycode})
        });
    });
}

exports.update_city_detail = function (req, res) {
    var city_locations = req.body.city_locations;
    city_locations = city_locations.split(',');
    var array = [];
    var location_array = [];
    city_locations.forEach(function (location, index) {
        location_array.push(Number(location))
        if(index%2!==0){
            array.push(location_array);
            location_array = [];
        }
    })
    req.body.city_locations = array;
    var id = req.body.id;
    if (req.body.payment_gateway == undefined) {
        req.body.payment_gateway = [];
    }

    if (req.body.airport != undefined)
    {
        req.body.airport.forEach(function (airport, index) {

            var airportLatLong = [airport.latitude, airport.longitude]
            if (airport.airport_id == undefined)
            {
                var airport = Airport({
                    city_id: req.body.id,
                    name: airport.name,
                    radius: airport.radius,
                    airportLatLong: airportLatLong
                });
                airport.save().then(() => { 

                }, (err) => {
                    console.log(err)
                });
            } else
            {
                Airport.findByIdAndUpdate(airport.airport_id, {name: airport.name, radius: airport.radius, airportLatLong: airportLatLong}).then((updated_airport) => {

                })
            }
        })
    }

    var destination_city = req.body.destination_city;
    if (destination_city != undefined)
    {
        destination_city = destination_city.toString()
        destination_city = destination_city.split(",");
        City.findById(id).then((city) => {
            city.destination_city = [];
            destination_city.forEach(function (desti_city, index) {

                var mongoose = require('mongoose');
                var Schema = mongoose.Types.ObjectId;
                city.destination_city.push(Schema(desti_city));

                if (index == destination_city.length - 1)
                {
                    req.body.destination_city = city.destination_city;
                    City.findByIdAndUpdate(id, req.body).then((city) => {

                        
                            message = admin_messages.success_message_city_update;
                            res.redirect('/city');
                    });
                }
            })
        })
    } else
    {
        req.body['destination_city'] = []
        City.findByIdAndUpdate(id, req.body).then((city) => {
                message = admin_messages.success_message_city_update;
                res.redirect('/city');
        });
    }
};

exports.fetch_destination_city_list = function (req, res) {
    var cityid = req.body.cityid;
    City.findById(cityid).then((city_detail) => {
        Airport.find({city_id: cityid}).then((airport_list) => {
            City.find({'_id': {$in: city_detail.destination_city}, isBusiness: constant_json.YES}).then((dest_city_list) => { 
                res.json({city_detail: city_detail, dest_city_list: dest_city_list, airport_list: airport_list})
            });
        })
    })
}

exports.fetch_destination_city_value = function (req, res) {
    City_to_City.find({'city_id': req.body.cityid, service_type_id: req.body.service_type_id}).then((city_to_city_list) => {
        res.json({city_to_city_list: city_to_city_list})
    })
}

exports.fetch_airport_value = function (req, res) {
    Airport_to_City.find({'city_id': req.body.cityid, service_type_id: req.body.service_type_id}).then((airporty_to_city_list) => {
        res.json({airporty_to_city_list: airporty_to_city_list})
    })
}


exports.check_city_available = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        var cityname = req.body.cityname;
        var query = {};
        query['full_cityname'] = cityname;
        query['countryid'] = req.body.countryid;
        City.count(query).then((city_list) => {
            if (city_list) {
                res.json(1);
            } else {
                res.json(0);
            }
        });
    } else {
        res.redirect('/admin');
    }
};

exports.autocomplete_cityname = function (req, res, next) {
    Country.findById(req.body.country).then((country_data) => {
        City.find({'countryid': req.body.country}).then((city_data) => {
            res.json({city_data: city_data, country_code: country_data.countrycode});
        })
    });

};

exports.fetch_city_list = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {

        var City = require('mongoose').model('City');
        var Country = require('mongoose').model('Country');


        if (typeof req.body.countryname != 'undefined') {
            var countryname = req.body.countryname.replace(/'/g, "");
            query = {};
            query['countryname'] = countryname;

            Country.findOne(query).then((country) => {
                var id = country.id;
                query = {};
                query['countryid'] = id;
                query['isBusiness'] = 1;

                City.find(query).then((city_list) => {
                    res.json(city_list);
                });
            });
        } else {

            var countryid = req.body.countryid.replace(/'/g, "");
            query = {};
            query['countryid'] = countryid;
            query['isBusiness'] = 1;

            City.find(query).then((city_list) => {
                res.json(city_list);
            });
        }
    } else {
        res.redirect('/admin');
    }
};