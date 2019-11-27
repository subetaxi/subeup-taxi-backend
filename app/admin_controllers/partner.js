var utils = require('../controllers/utils');
var allemails = require('../controllers/emails');
var User = require('mongoose').model('User');
var Trip = require('mongoose').model('Trip');
var multer = require('multer');
var bodyparser = require('body-parser');
var cookieparser = require('cookie-parser');
var nodemailer = require('nodemailer');
var twilio = require('twilio');
var crypto = require('crypto');
var fs = require('fs');
var bf = new Buffer(100000);
var Document = require('mongoose').model('Document');
var moment = require('moment');
var Settings = require('mongoose').model('Settings');
var City = require('mongoose').model('City');
var Citytype = require('mongoose').model('city_type');
var Provider = require('mongoose').model('Provider');
var Partner = require('mongoose').model('Partner');
var Type = require('mongoose').model('Type');
var Country = require('mongoose').model('Country');
var Settings = require('mongoose').model('Settings');
var Provider_Document = require('mongoose').model('Provider_Document');
var PartnerWeeklyEarning = require('mongoose').model('partner_weekly_earning');
var excelbuilder = require('msexcel-builder');
var fs = require("fs");
var Partner_Vehicle_Document = require('mongoose').model('Partner_Vehicle_Document');
var myPartners = require('./partner');
var mongoose = require('mongoose');
var Schema = mongoose.Types.ObjectId;
var Wallet_history = require('mongoose').model('Wallet_history');
var console = require('../controllers/console');

exports.register = function (req, res) {
    if (typeof req.session.partner == 'undefined') {
        Country.find({isBusiness: constant_json.YES}).then((country) => { 
            var is_public_demo = setting_detail.is_public_demo;
            res.render("partner_register", {is_public_demo: is_public_demo, country: country});
            delete message;
        });
    } else {
        res.redirect('/partner_providers');
        delete message;
    }
};


exports.partner_create = function (req, res, next) {
    if (typeof req.session.partner == 'undefined') {
        Partner.findOne({email: ((req.body.email).trim()).toLowerCase()}).then((response) => { 

            if (response) {
                message = admin_messages.error_message_email_already_used;
                res.redirect('/partner_register');
            } else {
                Partner.findOne({phone: req.body.phone}).then((response) => { 
                    if (response) {
                        message = admin_messages.error_message_mobile_no_already_used;
                        res.redirect('/partner_register');
                    } else {
                        var password = req.body.password;
                        var hash = crypto.createHash('md5').update(password).digest('hex');

                        function randomValueHex(Len) {
                            return crypto.randomBytes(Math.ceil(Len / 2)).
                                    toString('hex').
                                    slice(0, Len);
                        }
                        var referral_code = randomValueHex(6);

                        function TokenGenerator(length) {
                            if (typeof length == "undefined")
                                length = 32
                            var token = "";
                            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                            for (var i = 0; i < length; i++)
                                token += possible.charAt(Math.floor(Math.random() * possible.length));
                            return token;
                        }

                        var first_name = req.body.first_name;
                        first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);

                        var last_name = req.body.last_name;
                        last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);

                        var partner_company_name = req.body.partner_company_name;
                        partner_company_name = partner_company_name.charAt(0).toUpperCase() + partner_company_name.slice(1);

                        var token = TokenGenerator(32);

                        var code = req.body.country_phone_code;
                        var code_name = code.split(' ');
                        var country_code = code_name[0];
                        var country_name = "";

                        for (i = 1; i <= (code_name.length) - 1; i++) {

                            country_name = country_name + " " + code_name[i];
                        }

                        country_name = country_name.substr(1);

                        var partnercount = 1;

                        Partner.count({}, function(error, partner_count){

                            if (partner_count) {
                                partnercount = partner_count + 1;
                            }

                            var partner = new Partner({
                                unique_id: partnercount,
                                first_name: first_name,
                                last_name: last_name,
                                email: ((req.body.email).trim()).toLowerCase(),
                                country_phone_code: country_code,
                                phone: req.body.phone,
                                password: hash,
                                address: req.body.address,
                                city: req.body.city,
                                country_id: req.body.country_id,
                                city_id: req.body.city_id,
                                wallet_currency_code: req.body.wallet_currency_code,
                                country: country_name,
                                partner_company_name: partner_company_name,
                                is_approved: 0,
                                wallet: 0,
                                token: token,
                                referral_code: referral_code
                            });

                            var array = [];
                            var file_list_size = 0;
                            var files_details = req.files;
                            if (files_details != null || files_details != 'undefined') {
                                file_list_size = files_details.length;

                                var file_data;
                                var file_id;
                                var file_name = "";

                                for (i = 0; i < file_list_size; i++) {

                                    file_data = files_details[i];
                                    file_id = file_data.fieldname;
                                    file_name = '';
                                    file_data_path = "";
                                    proof = "";

                                    if (file_id == 'idproof') {
                                        var image_name = partner._id + utils.tokenGenerator(5);
                                        var url = utils.getImageFolderPath(req, 8) + image_name + '.jpg';
                                        proof = url;
                                        array['proof'] = proof;
                                        utils.saveImageFromBrowser(req.files[i].path, image_name + '.jpg', 8);
                                    }
                                }
                            }

                            var pictureData = req.body.pictureData;
                            if (pictureData.length != "") {
                                var image_name = partner._id + utils.tokenGenerator(4);
                                var url = utils.getImageFolderPath(req, 8) + image_name + '.jpg';
                                partner.picture = url;
                                //utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 2);
                                pictureData = pictureData.split(',')
                                pictureData = pictureData[1]
                                req.body.pictureData = pictureData;
                                utils.saveImageAndGetURL(image_name + '.jpg', req, res, 8);
                            }

                            if (array.proof == undefined) {
                                partner.government_id_proof = "";
                            } else {
                                partner.government_id_proof = array.proof;
                            }

                            partner.save().then(() => { 
                                var email_notification = setting_detail.email_notification;
                                if (email_notification == true) {
                                    allemails.sendPartnerRegisterEmail(req, partner, partner.first_name + " " + partner.last_name);
                                }
                                message = admin_messages.success_message_registration;
                                res.redirect('/partner_login');
                            }, (err) => {
                                utils.error_response(err, res)
                            });
                        });
                    }
                });
            }

        });
    } else {
        res.redirect('/partner_providers');
    }

};

exports.city_list = function (req, res) {

    City.find({countryname: req.body.countryname, isBusiness: constant_json.YES}, function (err, data) {
        res.json(data);
    });

};

exports.login = function (req, res) {
    if (typeof req.session.partner == 'undefined') {
        res.render('partner_login');
        delete message;
    } else {
        res.redirect('/partner_providers');
        delete message;
    }
};

exports.partner_login = function (req, res, next) {
    if (typeof req.session.partner == 'undefined') {
        var crypto = require('crypto');
        var password = req.body.password;
        var hash = crypto.createHash('md5').update(password).digest('hex');
        // for remove case sencitive 
        var email = req.body.email;
        Partner.findOne({email: email}).then((partner) => { 
            if (!partner) {
                message = admin_messages.error_message_email_not_registered;
                res.redirect("/partner_login");
            } else {
                if (partner.password == hash) {
                    if (partner.is_approved == 1) {
                        req.session.partner = partner;

                        ////////////  token generate /////
                        function TokenGenerator(length) {
                            if (typeof length == "undefined")
                                length = 32
                            var token = "";
                            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                            for (var i = 0; i < length; i++)
                                token += possible.charAt(Math.floor(Math.random() * possible.length));
                            return token;
                        }

                        var token = TokenGenerator(32);

                        partner.token = token;

                        partner.device_token = req.body.device_token;
                        partner.save().then(() => { 
                                message = admin_messages.success_message_login;
                                res.redirect('/partner_providers');
                        }, (err) => {
                            utils.error_response(err, res)
                        });
                    } else {
                        message = admin_messages.error_message_admin_not_approved
                        res.redirect("partner_login");;
                    }
                } else {
                    message = admin_messages.error_message_password_wrong;
                    res.redirect('/partner_login');
                }
            }
        });
    } else {
        res.redirect('/partner_providers');
        delete message;
    }
};

exports.header = function (req, res) {
    if (typeof req.session.partner != "undefined") {
        res.render("partner_header");
    } else {
        res.redirect('/partner_login');
    }
};


exports.profile = function (req, res) {
    if (typeof req.session.partner != "undefined") {
        callingCountries = require('country-data').callingCountries;
        Partner.findById(req.session.partner._id).then((response) => { 

            Country.findOne({countryname: response.country}).then((countrydata) => { 
                    var is_public_demo = setting_detail.is_public_demo;
                    req.session.partner = response;

                    res.render("partner_profile", {country: callingCountries.all, phone_number_min_length: countrydata.phone_number_min_length, phone_number_length: countrydata.phone_number_length, is_public_demo: is_public_demo, login1: response});
                    delete message;
            });
        });
    } else {
        res.redirect('/partner_login');
    }
};

exports.edit_profile = function (req, res) {
    if (typeof req.session.partner != "undefined") {

        var id = req.body.id
        Partner.findOne({phone: req.body.phone, _id: {$ne: id}}).then((user) => { 
            if (user)
            {
                message = admin_messages.error_message_mobile_no_already_used;
                res.redirect('/profiles')
            } else
            {
                Partner.findById(id).then((partner_detail) => { 
                    var crypto = require('crypto');
                    var password = req.body.password;
                    var hash = crypto.createHash('md5').update(password).digest('hex');
                    if (partner_detail.password == hash) {
                        delete req.body.password;
                        var picture = req.body.pictureData;

                        if (picture != "") {
                            utils.deleteImageFromFolder(partner_detail.picture, 7);
                            var image_name = partner_detail._id + utils.tokenGenerator(4);

                            picture = picture.split(',')
                            picture = picture[1]
                            var url = utils.getImageFolderPath(req, 7) + image_name + '.jpg';

                            req.body.pictureData = picture;
                            req.body.picture = url;
                            utils.saveImageAndGetURL(image_name, req, res, 7);

                            if (req.files.length > 0) {
                                utils.deleteImageFromFolder(partner_detail.government_id_proof, 8);
                                var image_name = partner_detail._id + utils.tokenGenerator(5);
                                var url = utils.getImageFolderPath(req, 8) + image_name + '.jpg';
                                req.body.government_id_proof = url;
                                utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 8);
                                Partner.findByIdAndUpdate(id, req.body, {new : true}).then((user) => { 

                                    req.session.partner = user;
                                    message = admin_messages.success_message_profile_update;
                                    res.redirect('profile');
                                });
                            } else {
                                Partner.findByIdAndUpdate(id, req.body, {new : true}).then((user) => { 

                                    req.session.partner = user;
                                    message = admin_messages.success_message_profile_update;
                                    res.redirect('profile');
                                });
                            }
                        } else if (req.files.length > 0) {

                            utils.deleteImageFromFolder(partner_detail.government_id_proof, 8);
                            var image_name = partner_detail._id + utils.tokenGenerator(5);
                            var url = utils.getImageFolderPath(req, 8) + image_name + '.jpg';
                            req.body.government_id_proof = url;
                            utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 8);
                            Partner.findByIdAndUpdate(id, req.body, {new : true}).then((user) => { 

                                req.session.partner = user;
                                message = admin_messages.success_message_profile_update;
                                res.redirect('profile');
                            });
                        } else
                        {
                            Partner.findByIdAndUpdate(id, req.body, {new : true}).then((user) => { 

                                req.session.partner = user;
                                message = admin_messages.success_message_profile_update;
                                res.redirect('profile');
                            });
                        }
                    } else {
                        message = admin_messages.error_message_current_password_wrong;
                        res.redirect('profile');
                    }
                })
            }
        });

    } else {
        res.redirect('/partner_login');
    }
};


exports.add = function (req, res, next) {
    if (typeof req.session.partner != 'undefined') {

        Country.findOne({countryname: req.session.partner.country}).then((country_detail) => { 

            City.find({countryid: country_detail._id, isBusiness: constant_json.YES}).then((citydata) => { 
                res.render("partner_provider_detail_edit", {citydata: citydata, country_phone_code: country_detail.countryphonecode, phone_number_min_length: country_detail.phone_number_min_length, phone_number_length: country_detail.phone_number_length});
                delete message;
            });
        });
    } else {
        res.redirect('/partner_login');
    }
}

exports.check_provider = function (req, res, next) {

    Provider.findOne({email: ((req.body.email).trim()).toLowerCase()}).then((provider) => { 

        if (provider) {
            res.json({success: false, message: admin_messages.error_message_email_already_used})
        } else {

            Provider.findOne({phone: req.body.phone}).then((provider) => { 
                if (provider) {
                    res.json({success: false, message: admin_messages.error_message_mobile_no_already_used})
                } else {
                    res.json({success: true});
                }
            });
        }
    });
}


exports.create_provider = function (req, res, next) {
    if (typeof req.session.partner != 'undefined') {
        City.findOne({cityname: req.body.city}).then((city) => { 
            var city_id = city._id;
            var password = req.body.password;
            var token = utils.tokenGenerator(32);
            var first_name = req.body.first_name;
            var last_name = req.body.last_name;
            var zipcode = "";
            var address = "";
            if (first_name != undefined) {
                first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
            }
            if (last_name != undefined) {
                last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);

            }

            if (zipcode != undefined)
            {
                zipcode = req.body.zipcode;
            }
            if (address != undefined)
            {
                address = (req.body.address).trim();
            }

            var referral_code = (utils.tokenGenerator(8)).toUpperCase();
            var provider = new Provider({
                first_name: first_name,
                last_name: last_name,
                country_phone_code: req.body.country_phone_code,
                email: ((req.body.email).trim()).toLowerCase(),
                phone: req.body.phone,
                password: utils.encryptPassword(password),
                service_type: null,
                referral_code: referral_code,
                car_model: req.body.car_model,
                car_number: req.body.car_number,
                device_token: "",
                device_type: "",
                bio: "",
                address: address,
                zipcode: zipcode,
                social_unique_id: "",
                login_by: "",
                device_timezone: "",
                providerLocation: [
                    0,
                    0
                ],
                city: req.body.city,
                cityid: city_id,
                country: req.session.partner.country,
                token: token,
                is_available: 1,
                is_document_uploaded: 0,
                is_active: 0,
                is_approved: 0,
                is_partner_approved_by_admin: 1,
                rate: 0,
                rate_count: 0,
                is_trip: [],
                admintypeid: null,
                wallet: 0,
                bearing: 0,
                picture: "",
                provider_type: Number(constant_json.PROVIDER_TYPE_PARTNER),
                provider_type_id: req.session.partner._id
            });


            if (req.files != undefined) {
                var image_name = provider._id + utils.tokenGenerator(4);
                var url = utils.getImageFolderPath(req, 2) + image_name + '.jpg';
                provider.picture = url;
                utils.saveImageFromBrowser(req.file.path, image_name + '.jpg', 2);

            }

            Country.findOne({countryname: provider.country}).then((country) => { 

                if (country) {
                    var country_id = country._id;
                    Document.find({countryid: country_id, type: 1}).then((document) => { 

                        var is_document_uploaded = 0;
                        var document_size = document.length;
                        if (document_size !== 0) {
                            var count = 0;
                            for (var i = 0; i < document_size; i++) {
                                if (document[i].option == 0) {
                                    count++;
                                } else {
                                    break;
                                }
                            }

                            if (count == document_size) {
                                is_document_uploaded = 1;
                            }


                            document.forEach(function (entry) {
                                var providerdocument = new Provider_Document({
                                    provider_id: provider._id,
                                    document_id: entry._id,
                                    name: entry.title,
                                    option: entry.option,
                                    document_picture: "",
                                    unique_code: entry.unique_code,
                                    expired_date: "",
                                    is_unique_code: entry.is_unique_code,
                                    is_expired_date: entry.is_expired_date,
                                    is_document_expired: false,
                                    is_uploaded: 0

                                });

                                provider.is_document_uploaded = is_document_uploaded;
                                provider.save().then(() => { 
                                }, (err) => {
                                    console.log(err);
                                });
                                providerdocument.save().then(() => {
                                }, (err) => {
                                    console.log(err);
                                });
                            });

                        } else {
                            is_document_uploaded = 1;
                            provider.is_document_uploaded = is_document_uploaded;
                            provider.save().then(() => { 
                            }, (err) => {
                                console.log(err);
                            });
                        }
                        provider.wallet_currency_code = country.currencycode;
                        provider.save().then(() => { 
                            
                                var email_notification = setting_detail.email_notification;
                                if (email_notification == true) {
                                    allemails.sendProviderRegisterEmail(req, provider);
                                }
                                message = "Provider Add Successfully"
                                res.json({success: true});
                        }, (err) => {
                                    utils.error_response(err, res)
                        });
                    });
                } else
                {
                    res.json({success: false});
                }

            });
        });


    } else {
        res.redirect('/partner_login');
    }
};


exports.edit = function (req, res, next) {
    if (typeof req.session.partner != 'undefined') {
        var id = req.body.id;
        Provider.findById(id).then((providers) => { 
            var city_type = providers.city;
            city_type_query = {};
            city_type_query['cityname'] = city_type;

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
            Country.findOne({"countryname": providers.country}).then((country_detail) => { 
                City.find({"countryname": providers.country, isBusiness: constant_json.YES}).then((city_list) => { 

                    var mongoose = require('mongoose');
                    var Schema = mongoose.Types.ObjectId;
                    var cityid_condition = {$match: {'cityid': {$eq: Schema(providers.cityid)}}};

                    Citytype.aggregate([cityid_condition, lookup, unwind]).then((type_available) => { 
                        var is_public_demo = setting_detail.is_public_demo;
                        res.render('partner_provider_detail_edit', {city_list: city_list, country_phone_code: country_detail.countryphonecode, phone_number_min_length: country_detail.phone_number_min_length, phone_number_length: country_detail.phone_number_length, is_public_demo: is_public_demo, data: providers, service_type: type_available, 'moment': moment});
                        delete message;
                    }, (err) => {
                                    utils.error_response(err, res)
                    });
                });
            });
            
        });
    } else {
        res.redirect('/partner_login');
    }
}

exports.update = function (req, res, next) {
    if (typeof req.session.partner != 'undefined') {
        var id = req.body.id;
        var first_name = req.body.first_name;
        req.body.first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);

        var last_name = req.body.last_name;
        req.body.last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);

        if(req.body.password){
            var crypto = require('crypto');
            var hash = crypto.createHash('md5').update(req.body.password).digest('hex');
            req.body.password = hash;
        }
        
        Citytype.findOne({_id: req.body.service_type}).then((citytype) => { 
            if (citytype)
            {
                req.body.admintypeid = citytype.typeid;
            } else
            {
                req.body.service_type = null;
                req.body.admintypeid = null;
            }
            City.findOne({cityname: req.body.city}).then((city) => { 
                if (city)
                {
                    req.body.cityid = city._id;
                }
                if (typeof req.file == 'undefined') {

                    Provider.findByIdAndUpdate(id, req.body).then((provider) => { 
                            res.redirect("/partner_providers");
                        
                    });
                } else {
                    var file_data_path = "";
                    var picture = req.files[0].originalname;
                    if (picture != "") {

                        utils.deleteImageFromFolder(response.picture, 2);
                        var image_name = id + utils.tokenGenerator(4);
                        var url = utils.getImageFolderPath(req, 2) + image_name + '.jpg';
                        req.body.picture = url;
                        utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 2);


                    }


                    Provider.findByIdAndUpdate(id, req.body).then((provider) => { 
                            res.redirect("/partner_providers");
                        
                    });
                }
            });
        });
    } else {
        res.redirect('/partner_login');
    }
}

exports.partner_provider_history = function (req, res, next) {
    if (typeof req.session.partner != 'undefined') {

        var array = [];
        var i = 0;

        if (req.body.page == undefined) {
            page = 0;
            next = 1;
            pre = 0;
        } else {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;
        }
        if (req.body.search_item == undefined) {
            search_item = 'user_detail.first_name';
            search_value = '';
            sort_order = -1;
            sort_field = 'unique_id';
            filter_start_date = '';
            filter_end_date = '';
        } else {
            search_item = req.body.search_item;
            search_value = req.body.search_value;
            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
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
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user_detail"
                    }
        };
        var unwind = {$unwind: "$user_detail"};

        var lookup1 = {
            $lookup:
                    {
                        from: "providers",
                        localField: "provider_id",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
        };

        var unwind1 = {$unwind: "$provider_detail"};

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        if (search_item == "user_detail.first_name") {
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};

                var search = {"$match": {$or: [query1, query2]}};
            } else {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};
                query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
                query4['user_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
                query6['user_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

                var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
            }
        } else {

            var search = {"$match": {search_item: {$regex: new RegExp(value, 'i')}}};
        }

        var filter = {"$match": {}};
        filter["$match"]['provider_trip_end_time'] = {$gte: start_date, $lt: end_date};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;

        var mongoose = require('mongoose');
        var Schema = mongoose.Types.ObjectId;
        var condition = {"$match": {'provider_id': {$eq: Schema(req.body.id)}}};

        Trip.aggregate([filter, condition, lookup, unwind, lookup1, unwind1, search, count]).then((array) => { 
            if (array.length == 0) {
                res.render('partner_providers_history', {detail: array, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment});
            } else {
                var pages = Math.ceil(array[0].total / number_of_rec);
                Trip.aggregate([filter, condition, lookup, unwind, lookup1, unwind1, search, sort, skip, limit]).then((array) => { 
                    res.render('partner_providers_history', {detail: array, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment});
                });
            }
        }, (err) => {
            utils.error_response(err, res)
        });
        
    } else {
        res.redirect('/partner_login');
    }

};

exports.partner_trip_map = function (req, res, next) {
    if (typeof req.session.partner == 'undefined') {
        res.redirect('/partneer_login');
    } else {
        var id = req.body.id;
        var user_name = req.body.u_name;
        var provider_name = req.body.pr_name;
        var query = {};
        query['tripID'] = id;

        var Trip_Location = require('mongoose').model('trip_location');

        Trip.findById(id).then((trips) => { 

            Trip_Location.findOne(query).then((locations) => { 
                var url = "https://maps.googleapis.com/maps/api/js?key=" + setting_detail.web_app_google_key + "&libraries=places&callback=initialize"
                if (!locations) {
                    res.render('partner_trip_map', {'data': trips, 'url': url, 'user_name': user_name, 'provider_name': provider_name, 'moment': moment});

                } else {
                    res.render('partner_trip_map', {'data': trips, 'url': url, 'trip_path_data': locations, 'user_name': user_name, 'provider_name': provider_name, 'moment': moment});
                }
            });
        });
    }
};

exports.documents = function (req, res, next) {
    if (typeof req.session.partner != 'undefined') {
        var id = req.body.id;
        var array = [];
        var i = 0;
        var j = 0;
        query = {};
        query['provider_id'] = id;
        Provider_Document.find(query).then((array) => { 
                res.render('partner_provider_documents', {detail: array, id: id});
            
        });
    } else {
        res.redirect('/partner_login');
    }
};

exports.partner_forgot_password = function (req, res, next) {

    if (typeof req.session.partner == 'undefined') {
        res.render('partner_forgot_password');
        delete message;
    } else {
        res.redirect('/partner_providers');
        delete message;
    }
}

exports.partner_forgot_password_email = function (req, res) {

    if (typeof req.session.partner == "undefined") {
        Partner.findOne({email: req.body.email}).then((response) => { 
            if (response) {
                function TokenGenerator(length) {
                    if (typeof length == "undefined")
                        length = 32
                    var token = "";
                    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                    for (var i = 0; i < length; i++)
                        token += possible.charAt(Math.floor(Math.random() * possible.length));
                    return token;
                }

                var token = TokenGenerator(32);
                var id = response.id;
                var link = req.protocol + '://' + req.get('host') + '/partner_newpassword?id=' + id + '&&token=' + token;


                var ejs = require('ejs');

                mail_notification(response.email, config_json.reset_password, link, '');


                Partner.findOneAndUpdate({_id: id}, {token: token}).then((response) => { 
                    
                        message = admin_messages.success_message_send_link;
                        res.redirect("/partner_login");
                    
                });

            } else {
                message = admin_messages.error_message_email_not_registered;
                res.redirect('/partner_forgot_password');
            }
        });
    } else {
        res.redirect('/partner_providers');
        delete message;
    }
}

exports.edit_psw = function (req, res) {
    if (typeof req.session.partner == 'undefined') {
        var id = req.query.id;
        var token = req.query.token;
        res.render('partner_new_password', {'id': id, 'token': token});
    } else {
        res.redirect('/partner_providers');
        delete message;
    }
}

exports.update_psw = function (req, res) {

    if (typeof req.session.partner == "undefined") {
        var query = {};
        query['_id'] = req.body.id;
        query['token'] = req.body.token;

        var password = req.body.password;
        var hash = crypto.createHash('md5').update(password).digest('hex');

        function TokenGenerator(length) {
            if (typeof length == "undefined")
                length = 32
            var token = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for (var i = 0; i < length; i++)
                token += possible.charAt(Math.floor(Math.random() * possible.length));
            return token;
        }
        var token = TokenGenerator(32);

        Partner.findOneAndUpdate(query, {password: hash, token: token}).then((response) => { 
            if (!response) {
                res.redirect('partner_forgot_password');
            } else {
                res.redirect('partner_login');
            }
        });
    } else {
        res.redirect('/partner_providers');
        delete message;
    }
}



exports.sign_out = function (req, res) {
    req.session.destroy(function (err, data) {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/partner_login');
        }
    });
}


///////////////////////////////////////////////////////////


// exports.mail_notification = function (to, sub, text, html) {

function mail_notification(to, sub, text, html) {
    try {

            email = setting_detail.email;
            password = setting_detail.password;
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: email, // Your email id
                    pass: password // Your password
                }
            });

            var mailOptions = {// sender address
                //from: from ,
                to: to, // list of receivers
                subject: sub, // Subject line
                text: text, //, /// plaintext body
                html: html

            }

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.error(error);
                } else {

                }
                ;
            });

    } catch (error) {
        console.error(error);

    }

}
;

/////////////////////////////////

Settings.findOne({}, function (err, setting) {
    if (setting)
    {
        var twilio_account_sid = setting.twilio_account_sid;
        var twilio_auth_token = setting.twilio_auth_token;
        var twilio_number = setting.twilio_number;


        if (twilio_account_sid != "" && twilio_auth_token != "" && twilio_number != "")
        {
            var client = twilio(twilio_account_sid, twilio_auth_token, twilio_number);
            exports.sendSMS = function (to, msg) {
                try {
                    client.sendMessage({
                        to: to,
                        from: twilio_number,
                        body: msg
                    });


                } catch (error) {
                    console.error(error);
                }
            };
        }
    }
});



exports.list = function (req, res, next) {

    if (typeof req.session.partner != "undefined") {
        var query = {};
        sort = {};
        array = [];
        var query1 = {};
        var query2 = {};
        var query3 = {};
        var query4 = {};
        var query5 = {};
        var query6 = {};

        query['provider_type_id'] = req.session.partner._id;
        if (req.body.search_item == undefined) {
            sort['_id'] = -1;

            search_item = 'first_name';
            search_value = '';
            sort_order = -1;
            sort_field = 'unique_id';
            filter_start_date = '';
            filter_end_date = '';

            var start_date = '';
            var end_state = '';
        } else {

            var field = req.body.sort_item[0];
            var order = req.body.sort_item[1];
            var item = req.body.search_item;
            var value = req.body.search_value;

            sort[field] = order;

            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
            search_item = item
            search_value = value;
            filter_start_date = req.body.start_date;
            filter_end_date = req.body.end_date;

            var start_date = req.body.start_date;
            var end_state = req.body.end_date;
        }
        if (start_date != '' || end_state != '') {
            if (start_date == '') {
                start_date = new Date(end_state);
                start_date = start_date - 1;
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else if (end_state == '') {
                end_date = new Date(start_date);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                start_date = new Date(start_date);
                start_date = start_date - 1;
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else {
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            }
        }

        if (item == 'first_name') {
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[''] = '';
                query4[''] = '';
                query5[''] = '';
                query6[''] = '';
            } else {
                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[item] = new RegExp(full_name[0], 'i');
                query4['last_name'] = new RegExp(full_name[0], 'i');
                query5[item] = new RegExp(full_name[1], 'i');
                query6['last_name'] = new RegExp(full_name[1], 'i');
            }
        } else {

            if (item != undefined) {
                query[item] = new RegExp(value, 'i');
            }
        }
        Provider.count({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query]}).then((provider_count) => { 

            if (provider_count != 0) {
                var provider_count = provider_count / 10;
                provider_count = Math.ceil(provider_count);

                if (req.body.page == undefined) {
                    page = 1;
                    next = parseInt(req.query.page) + 1;
                    pre = req.query.page - 1;

                    var options = {
                        sort: {unique_id: -1},
                        page: page,
                        limit: 10
                    };
                } else {
                    page = req.body.page;
                    next = parseInt(req.body.page) + 1;
                    pre = req.body.page - 1;

                    if (field == 'first_name') {
                        var options = {
                            sort: {first_name: order},
                            page: page,
                            limit: 10
                        };
                    } else if (field == 'Id') {
                        var options = {
                            sort: {unique_id: order},
                            page: page,
                            limit: 10
                        };
                    } else {
                        var options = {
                            sort: {email: order},
                            page: page,
                            limit: 10
                        };
                    }

                }

                Provider.paginate({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query]}, options).then((providers) => { 
                    if (providers.docs.length <= 0) {
                        res.render('partner_providers_list', {
                            detail: [], currentpage: providers.page, pages: providers.pages,
                            next: next, pre: pre, id: req.session.partner._id
                        });
                    } else {
                        var is_public_demo = setting_detail.is_public_demo;
                        var j = 1;
                        providers.docs.forEach(function (data) {
                            if (data.service_type == null) {
                                if (j == providers.docs.length) {
                                    data.service_type = null;
                                    res.render('partner_providers_list', {is_public_demo: is_public_demo,
                                        detail: providers.docs, currentpage: providers.page, pages: providers.pages,
                                        next: next, pre: pre, id: req.session.partner._id
                                    });
                                    delete message;
                                } else {
                                    data.service_type = null;
                                    j++;
                                }
                            } else {
                                Citytype.findOne({_id: data.service_type}).then((city_type_data) => { 

                                    Type.findOne({_id: city_type_data.typeid}).then((type_data) => { 

                                        if (j == providers.docs.length) {
                                            data.service_type_name = type_data.typename;
                                            res.render('partner_providers_list', {is_public_demo: is_public_demo,
                                                detail: providers.docs, currentpage: providers.page, pages: providers.pages,
                                                next: next, pre: pre, id: req.session.partner._id
                                            });
                                            delete message;
                                        } else {
                                            data.service_type_name = type_data.typename;
                                            j++;
                                        }
                                    });
                                });
                            }

                        });
                    }
                });
            } else {

                res.render('partner_providers_list', {
                    detail: array, currentpage: '', pages: '',
                    next: '', pre: '', id: req.session.partner._id
                });
                delete message;
            }
        });
    } else {
        res.redirect('/partner_login');
    }
}

exports.partner_list = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        var query = {};
        sort = {};
        array = [];
        var query1 = {};
        var query2 = {};
        var query3 = {};
        var query4 = {};
        var query5 = {};
        var query6 = {};
        if (req.body.page == undefined) {

            if (req.session.page != undefined) {
                var field = sort_field;
                var order = sort_order;
                var item = search_item;
                var value = search_value;

                var start_date = filter_start_date;
                var end_state = filter_end_date;

                sort[field] = order;
                req.body.page = req.session.page;
                delete req.session.page;
            } else {
                sort['_id'] = -1;

                search_item = 'first_name';
                search_value = '';
                sort_order = -1;
                sort_field = 'unique_id';
                filter_start_date = '';
                filter_end_date = '';

                var start_date = '';
                var end_state = '';
            }
        } else {

            var field = req.body.sort_item[0];
            var order = req.body.sort_item[1];
            var item = req.body.search_item;
            var value = req.body.search_value;

            sort[field] = order;

            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
            search_item = item
            search_value = value;
            filter_start_date = req.body.start_date;
            filter_end_date = req.body.end_date;

            var start_date = req.body.start_date;
            var end_state = req.body.end_date;

        }
        if (start_date != '' || end_state != '') {
            if (start_date == '') {
                start_date = new Date(end_state);
                start_date = start_date - 1;
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else if (end_state == '') {
                end_date = new Date(start_date);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                start_date = new Date(start_date);
                start_date = start_date - 1;
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else {
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            }
        }

        if (item == 'first_name') {
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[''] = '';
                query4[''] = '';
                query5[''] = '';
                query6[''] = '';
            } else {
                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[item] = new RegExp(full_name[0], 'i');
                query4['last_name'] = new RegExp(full_name[0], 'i');
                query5[item] = new RegExp(full_name[1], 'i');
                query6['last_name'] = new RegExp(full_name[1], 'i');
            }
        } else {

            if (item != undefined) {
                query[item] = new RegExp(value, 'i');
            }
        }
        Partner.count({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query]}).then((partnercount) => { 

            if (partnercount != 0) {
                if (req.body.page == undefined) {
                    page = 1;
                    next = 2;
                    pre = page - 1;

                    var options = {
                        sort: {unique_id: -1},
                        page: page,
                        limit: 10
                    };
                } else {
                    page = req.body.page;
                    next = parseInt(req.body.page) + 1;
                    pre = req.body.page - 1;

                    if (field == 'first_name') {
                        var options = {
                            sort: {first_name: order},
                            page: page,
                            limit: 10
                        };
                    } else if (field == 'unique_id') {
                        var options = {
                            sort: {unique_id: order},
                            page: page,
                            limit: 10
                        };
                    } else {
                        var options = {
                            sort: {email: order},
                            page: page,
                            limit: 10
                        };
                    }

                }

                Partner.paginate({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query]}, options).then((partnerlist) => { 

                    if (partnerlist.docs.length <= 0) {
                        res.render('partner_list', {detail: [], currentpage: partnerlist.page, pages: partnerlist.pages, next: next, pre: pre});
                        delete message;
                    } else {
                            var is_public_demo = setting_detail.is_public_demo;
                            res.render('partner_list', {is_public_demo: is_public_demo, detail: partnerlist.docs, currentpage: partnerlist.page, pages: partnerlist.pages, next: next, pre: pre});
                            delete message;
                    }

                });
            } else {
                res.render('partner_list', {
                    detail: array, currentpage: '', pages: '',
                    next: '', pre: ''
                });
                delete message;
            }
        });
    } else {
        res.redirect('/admin');
    }

};

// genetare_partner_excel
exports.genetare_partner_excel = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        var query = {};
        sort = {};
        array = [];
        var query1 = {};
        var query2 = {};
        var query3 = {};
        var query4 = {};
        var query5 = {};
        var query6 = {};
        if (req.body.page == undefined) {

            if (req.session.page != undefined) {
                var field = sort_field;
                var order = sort_order;
                var item = search_item;
                var value = search_value;

                var start_date = filter_start_date;
                var end_state = filter_end_date;

                sort[field] = order;
                req.body.page = req.session.page;
                delete req.session.page;
            } else {
                sort['_id'] = -1;

                search_item = 'first_name';
                search_value = '';
                sort_order = -1;
                sort_field = 'unique_id';
                filter_start_date = '';
                filter_end_date = '';

                var start_date = '';
                var end_state = '';
            }
        } else {

            var field = req.body.sort_item[0];
            var order = req.body.sort_item[1];
            var item = req.body.search_item;
            var value = req.body.search_value;

            sort[field] = order;

            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
            search_item = item
            search_value = value;
            filter_start_date = req.body.start_date;
            filter_end_date = req.body.end_date;

            var start_date = req.body.start_date;
            var end_state = req.body.end_date;

        }
        if (start_date != '' || end_state != '') {
            if (start_date == '') {
                start_date = new Date(end_state);
                start_date = start_date - 1;
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else if (end_state == '') {
                end_date = new Date(start_date);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                start_date = new Date(start_date);
                start_date = start_date - 1;
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else {
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            }
        }

        if (item == 'first_name') {
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[''] = '';
                query4[''] = '';
                query5[''] = '';
                query6[''] = '';
            } else {
                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[item] = new RegExp(full_name[0], 'i');
                query4['last_name'] = new RegExp(full_name[0], 'i');
                query5[item] = new RegExp(full_name[1], 'i');
                query6['last_name'] = new RegExp(full_name[1], 'i');
            }
        } else {

            if (item != undefined) {
                query[item] = new RegExp(value, 'i');
            }
        }



        Partner.find({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query]}).then((array) => { 

            var date = new Date()
            var time = date.getTime()
            var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_partner.xlsx');

            var sheet1 = workbook.createSheet('sheet1', 5, array.length + 1);
            sheet1.set(1, 1, "ID");
            sheet1.set(2, 1, "NAME");
            sheet1.set(3, 1, "EMAIL");
            sheet1.set(4, 1, "PHONE");
            sheet1.set(5, 1, "COUNTRY");

            var j =1;
            array.forEach(function (data, index) {
                sheet1.set(1, index + 2, data.unique_id);
                sheet1.set(2, index + 2, data.first_name + ' ' + data.last_name);

                sheet1.set(3, index + 2, data.email);
                sheet1.set(4, index + 2, data.country_phone_code + ' ' + data.phone);
                sheet1.set(5, index + 2, data.country);
                if (j == array.length) {
                    workbook.save(function (err) {
                        if (err)
                        {
                            workbook.cancel();
                        } else {
                            var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_partner.xlsx"
                            res.json(url);
                            setTimeout(function () {
                                fs.unlink('data/xlsheet/' + time + '_partner.xlsx', function (err, file) {
                                });
                            }, 10000)
                        }
                    });
                } else {
                    j++;
                }

            })

        }).sort(sort);
    } else {
        res.redirect('/admin');
    }

};


exports.partner_provider_list = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        var query = {};
        sort = {};
        array = [];
        var query1 = {};
        var query2 = {};
        var query3 = {};
        var query4 = {};
        var query5 = {};
        var query6 = {};
        query['provider_type_id'] = req.body.id;
        if (req.body.search_item == undefined) {
            sort['_id'] = -1;

            search_item = 'first_name';
            search_value = '';
            sort_order = -1;
            sort_field = 'Id';
            filter_start_date = '';
            filter_end_date = '';

            var start_date = '';
            var end_state = '';
        } else {

            var field = req.body.sort_item[0];
            var order = req.body.sort_item[1];
            var item = req.body.search_item;
            var value = req.body.search_value;

            sort[field] = order;

            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
            search_item = item
            search_value = value;
            filter_start_date = req.body.start_date;
            filter_end_date = req.body.end_date;

            var start_date = req.body.start_date;
            var end_state = req.body.end_date;
        }
        if (start_date != '' || end_state != '') {
            if (start_date == '') {
                start_date = new Date(end_state);
                start_date = start_date - 1;
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else if (end_state == '') {
                end_date = new Date(start_date);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                start_date = new Date(start_date);
                start_date = start_date - 1;
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else {
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            }
        }


        if (item == 'first_name') {
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[''] = '';
                query4[''] = '';
                query5[''] = '';
                query6[''] = '';
            } else {
                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[item] = new RegExp(full_name[0], 'i');
                query4['last_name'] = new RegExp(full_name[0], 'i');
                query5[item] = new RegExp(full_name[1], 'i');
                query6['last_name'] = new RegExp(full_name[1], 'i');
            }
        } else {

            if (item != undefined) {
                query[item] = new RegExp(value, 'i');
            }
        }
        Provider.count({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query]}).then((provider_count) => { 

            if (provider_count != 0) {
                var provider_count = provider_count / 10;
                provider_count = Math.ceil(provider_count);


                if (req.body.page == undefined) {
                    page = 1;
                    next = parseInt(req.query.page) + 1;
                    pre = req.query.page - 1;

                    var options = {
                        sort: {unique_id: -1},
                        page: page,
                        limit: 10
                    };
                } else {
                    page = req.body.page;
                    next = parseInt(req.body.page) + 1;
                    pre = req.body.page - 1;

                    if (field == 'first_name') {
                        var options = {
                            sort: {first_name: order},
                            page: page,
                            limit: 10
                        };
                    } else if (field == 'Id') {
                        var options = {
                            sort: {unique_id: order},
                            page: page,
                            limit: 10
                        };
                    } else {
                        var options = {
                            sort: {email: order},
                            page: page,
                            limit: 10
                        };
                    }

                }

                Provider.paginate({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query]}, options).then((providers) => { 
                    if (providers.docs.length <= 0) {
                        res.render('admin_partner_providers_list', {
                            id: req.body.id, detail: [], currentpage: providers.page, pages: providers.pages,
                            next: next, pre: pre
                        });
                    } else {
                        var is_public_demo = setting_detail.is_public_demo;
                        var j = 1;
                        providers.docs.forEach(function (data) {
                            if (data.service_type == null) {
                                if (j == providers.docs.length) {
                                    data.service_type_name = null;
                                    res.render('admin_partner_providers_list', {is_public_demo: is_public_demo,
                                        id: req.body.id, detail: providers.docs, currentpage: providers.page, pages: providers.pages,
                                        next: next, pre: pre
                                    });
                                } else {
                                    data.service_type_name = null;
                                    j++;
                                }
                            } else {
                                Citytype.findOne({_id: data.service_type}).then((city_type_data) => { 

                                    Type.findOne({_id: city_type_data.typeid}).then((type_data) => { 

                                        if (j == providers.docs.length) {
                                            data.service_type_name = type_data.typename;
                                            res.render('admin_partner_providers_list', {is_public_demo: is_public_demo,
                                                id: req.body.id, detail: providers.docs, currentpage: providers.page, pages: providers.pages,
                                                next: next, pre: pre
                                            });
                                            delete message;
                                        } else {
                                            data.service_type_name = type_data.typename;
                                            j++;
                                        }
                                    });
                                });
                            }
                        });
                    }
                });
            } else {

                res.render('admin_partner_providers_list', {
                    id: req.body.id, detail: array, currentpage: '', pages: '',
                    next: '', pre: ''
                });
                delete message;
            }
        });
    } else {
        res.redirect('/admin');
    }
};


exports.partner_is_approved = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        var id = req.body.id;
        var is_approved = req.body.is_approved;

        if (is_approved == 0) {
            var change = 1;
        } else {
            var change = 0;
        }

        Partner.findByIdAndUpdate(id, {is_approved: change}).then((partnerdata) => { 

            Provider.find({provider_type_id: id}).then((pro_data) => { 
                Provider.update({provider_type_id: id}, {is_partner_approved_by_admin: change}, {multi: true}).then((provider_data) => { 

                    // req.session.page = req.body.page;
                    if (is_approved == 0) {
                        var email_notification = setting_detail.email_notification;
                        if (email_notification == true) {
                            allemails.sendPartnerApprovedEmail(req, partnerdata);
                            pro_data.forEach(function (provider) {
                                if (provider.is_approved == 1) {
                                    allemails.sendProviderApprovedEmail(req, provider);
                                }
                            });
                        }
                        pro_data.forEach(function (provider) {
                            if (provider.is_approved == 1) {
                                utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, provider.device_type, provider.device_token, admin_message.PUSH_CODE_FOR_PROVIDER_APPROVED, admin_message.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                            }
                        });
                        message = admin_messages.success_message_partner_approved;
                        res.redirect("/partners");
                    } else {
                        allemails.sendPartnerDeclineEmail(req, partnerdata);
                        message = admin_messages.success_message_partner_declined;
                        pro_data.forEach(function (provider) {
                            if (provider.is_approved == 1) {
                                allemails.sendProviderDeclineEmail(req, provider);
                                utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, provider.device_type, provider.device_token, admin_message.PUSH_CODE_FOR_PROVIDER_DECLINED, admin_message.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                            }
                            provider.save().then(() => { 
                            }, (err) => {
                                    console.log(err);
                            });

                        });

                        res.redirect("/partners");
                    }
                });
            });
        });
    } else {
        res.redirect('/admin');
    }
};

exports.partner_is_approved_old = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {

        var id = req.body.id;
        var is_approved = req.body.is_approved;

        if (is_approved == 0) {
            var change = 1;
        } else {
            var change = 0;
        }

        Partner.findByIdAndUpdate(id, {is_approved: change}, function (err, partnerdata) {

            Provider.find({provider_type_id: id}, function (err, pro_data) {
                Provider.update({provider_type_id: id}, {is_partner_approved_by_admin: change}, function (err, provider_data) {

                    req.session.page = req.body.page;
                    if (is_approved == 0) {
                        Settings.findOne({}, function (err, settingData) {
                            var email_notification = settingData.email_notification;
                            if (email_notification == true) {
                                allemails.sendPartnerApprovedEmail(req, partnerdata);
                                pro_data.forEach(function (provider) {
                                    if (provider.is_approved == 1) {
                                        allemails.sendProviderApprovedEmail(req, provider);
                                    }
                                });
                            }
                            pro_data.forEach(function (provider) {
                                if (provider.is_approved == 1) {
                                    utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, provider.device_type, provider.device_token, admin_message.PUSH_CODE_FOR_PROVIDER_APPROVED, admin_message.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                }
                            });
                        });
                        message = admin_messages.success_message_partner_approved;
                        res.redirect("/partners");
                    } else {
                        allemails.sendPartnerDeclineEmail(req, partnerdata);
                        message = admin_messages.success_message_partner_declined;
                        pro_data.forEach(function (provider) {
                            if (provider.is_approved == 1) {
                                allemails.sendProviderDeclineEmail(req, provider);
                                utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, provider.device_type, provider.device_token, admin_message.PUSH_CODE_FOR_PROVIDER_DECLINED, admin_message.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                            }
                        });
                        res.redirect("/partners");
                    }
                });
            });
        });
    } else {
        res.redirect('/admin');
    }
};


exports.partner_detail = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        Partner.findById(req.body.id).then((partnerdata) => { 
       
            var is_public_demo = setting_detail.is_public_demo;
            res.render("partner_detail", {partnerdata: partnerdata, is_public_demo: is_public_demo});
           
        });
    } else {
        res.redirect('/admin');
    }
}

exports.partner_requests = function (req, res, next) {

    if (typeof req.session.partner != 'undefined') {
        var j = 1;
        var array = [];
        if (req.body.page == undefined) {
            page = 0;
            next = 1;
            pre = 0;
        } else {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;
        }

        if (req.body.search_item == undefined) {
            search_item = 'user_detail.first_name';
            search_value = '';
            sort_order = -1;
            sort_field = 'unique_id';
            filter_start_date = '';
            filter_end_date = '';

        } else {
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
            end_date = new Date(Date.now());
            var start_date = new Date(end_date.getTime() - (6 * 24 * 60 * 60 * 1000));
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
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
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user_detail"
                    }
        };
        var unwind = {$unwind: "$user_detail"};

        var lookup1 = {
            $lookup:
                    {
                        from: "providers",
                        localField: "confirmed_provider",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
        };

        var unwind1 = {$unwind: "$provider_detail"};

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');
        if (search_item == "user_detail.first_name") {
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};

                var search = {"$match": {$or: [query1, query2]}};
            } else {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};
                query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
                query4['user_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
                query6['user_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

                var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
            }
        } else if (search_item == "provider_detail.first_name") {
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['provider_detail.last_name'] = {$regex: new RegExp(value, 'i')};

                var search = {"$match": {$or: [query1, query2]}};
            } else {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['provider_detail.last_name'] = {$regex: new RegExp(value, 'i')};
                query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
                query4['provider_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
                query6['provider_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

                var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
            }
        } else {

            var search = {"$match": {search_item: {$regex: new RegExp(value, 'i')}}};
        }

        var partnerid = req.session.partner._id;
        var mongoose = require('mongoose');
        var Schema = mongoose.Types.ObjectId;
        var condition = {$match: {'provider_type_id': {$eq: Schema(partnerid)}}};

        query1['created_at'] = {$gte: start_date, $lt: end_date};
        var filter = {"$match": query1};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);

        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};

        var skip = {};
        skip["$skip"] = page * number_of_rec;

        var limit = {};
        limit["$limit"] = number_of_rec;

        var condition = {$match: {'provider_type_id': {$eq: Schema(req.session.partner._id)}}};

        Trip.aggregate([condition, lookup, unwind, lookup1, search, filter, count]).then((array) => { 
            if (!array || array.length == 0) {
                array = [];
                res.render('partner_request_list', {detail: array, 'current_page': 1, 'pages': 0, 'next': 1, 'pre': 0, moment: moment});
            } else {
                var pages = Math.ceil(array[0].total / number_of_rec);
                Trip.aggregate([condition, lookup, unwind, lookup1, search, filter, sort, skip, limit]).then((array) => { 

                    res.render('partner_request_list', {detail: array, 'current_page': page, 'pages': pages, 'next': next, 'pre': pre, moment: moment});
                });
            }
        }, (err) => {
                                    utils.error_response(err, res)
        });
    } else {
        res.redirect('/partner_login');
    }

};

/// add_partner_wallet_amount
exports.add_partner_wallet_amount = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {

        Partner.findOne({_id: req.body.user_id}).then((partner_data) => { 
            if (partner_data)
            {

                var wallet = utils.precisionRoundTwo(Number(req.body.wallet));
                var total_wallet_amount = utils.addWalletHistory(constant_json.PARTNER_UNIQUE_NUMBER, partner_data.unique_id, partner_data._id, partner_data.country_id, partner_data.wallet_currency_code, partner_data.wallet_currency_code,
                        1, wallet, partner_data.wallet, constant_json.ADD_WALLET_AMOUNT, constant_json.ADDED_BY_ADMIN, "By Admin")

                partner_data.wallet = total_wallet_amount;
                partner_data.save().then(() => { 
                   
                        res.json({success: true, wallet: partner_data.wallet, message: admin_messages.success_message_add_wallet});
                }, (err) => {
                                    utils.error_response(err, res)
                });

            } else
            {
                res.json({success: false, error_code: admin_messages.errpr_message_add_wallet_failed});
            }
        });
    } else
    {
        res.json({success: false, error_code: admin_messages.errpr_message_add_wallet_failed});
    }
};



exports.add_bank_detail_partner = function (req, res) {
    
    Partner.findOne({_id: req.body.partners_id}).then((partner) => { 
        if (partner)
        {
            if (req.body.web == 1) {
                if (req.files != null || req.files != 'undefined') {
                    var image_name = partner._id + utils.tokenGenerator(10);
                    var url = utils.getImageFolderPath(req, 10) + image_name + '.jpg';
                    partner.stripe_doc = url;
                    utils.saveImageFromBrowserStripe(req.files[0].path, image_name + '.jpg', 10, function (response) {

                        if (response) {
                            partner.save().then(() => { 
                                    stripedoc();
                            }, (err) => {
                                    console.log(err);
                            });
                        }
                    });
                }
            }
            function stripedoc() {

                if (req.body.token != null && partner.token != req.body.token) {

                    res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                } else
                {
                    var password = req.body.password;
                    var encrypt_password = utils.encryptPassword(password);

                    if (partner.password !== encrypt_password)
                    {
                        res.json({success: false, error_code: error_message.ERROR_CODE_YOUR_PASSWORD_IS_NOT_MATCH_WITH_OLD_PASSWORD});
                    } else
                    {
                        Country.findOne({"countryname": partner.country}).then((country_detail) => { 

                            if (country_detail)
                            {
                                res.json({success: false, error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_ADD_BANK_DETAIL_PLEASE_RETRY});
                            } else
                            {
                                var stripe = require("stripe")(setting_detail.stripe_secret_key);
                                stripe.tokens.create({
                                    bank_account: {
                                        country: "US", // country_detail.alpha2
                                        currency: "USD",
                                        account_holder_name: req.body.account_holder_name,
                                        account_holder_type: req.body.account_holder_type,
                                        routing_number: req.body.routing_number,
                                        account_number: req.body.account_number
                                    }
                                }, function (err, token) {
                                    
                                    if (req.body.web == 1) {
                                        var path = require("path");
                                        var pictureData_buffer = fs.readFileSync(path.join(__dirname, '../../data/' + partner.stripe_doc));
                                        
                                    } else {
                                        var pictureData = req.body.document;
                                        var pictureData_buffer = new Buffer(pictureData, 'base64');
                                    }
                                    stripe.fileUploads.create({
                                        file: {
                                            data: pictureData_buffer,
                                            name: "document.jpg",
                                            type: "application/octet-stream",
                                        },
                                        purpose: "identity_document",
                                    }, function (err, fileUpload) {
                                        var err = err;

                                        if (err || !fileUpload)
                                        {
                                            res.json({success: false, stripe_error: err.message, error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_ADD_STRIPE_DOCUMENT});
                                        } else
                                        {

                                            var dob = req.body.dob
                                            dob = dob.split('-');
                                            stripe.accounts.create({
                                                type: 'custom',
                                                country: "US", // country_detail.alpha2
                                                email: partner.email,
                                                legal_entity: {
                                                    first_name: partner.first_name,
                                                    last_name: partner.last_name,
                                                    personal_id_number: req.body.personal_id_number,
                                                    business_name: req.body.business_name,
                                                    business_tax_id: partner.tax_id,
                                                    dob: {
                                                        day: dob[0],
                                                        month: dob[1],
                                                        year: dob[2]
                                                    },
                                                    type: req.body.account_holder_type,
                                                    address: {
                                                        city: partner.city,
                                                        country: "US",
                                                        line1: partner.line1,
                                                        line2: partner.line2
                                                    },
                                                    verification: {
                                                        document: fileUpload.id
                                                    }
                                                }
                                            }, function (err, account) {
                                                var err = err;
                                                if (err || !account) {
                                                    res.json({success: false, stripe_error: err.message, error_code: error_message.ERROR_CODE_FOR_ACCOUNT_DETAIL_NOT_VALID});
                                                } else {

                                                    stripe.accounts.createExternalAccount(
                                                            account.id,
                                                            {external_account: token.id,
                                                                default_for_currency: true
                                                            },
                                                            function (err, bank_account) {
                                                                var err = err;
                                                                if (err || !bank_account)
                                                                {
                                                                    res.json({success: false, stripe_error: err.message, error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_ADD_BANK_DETAIL_PLEASE_RETRY});

                                                                } else
                                                                {
                                                                    partner.account_id = account.id;
                                                                    partner.bank_id = bank_account.id;
                                                                    partner.save().then((admins) => { 
                                                                    }, (err) => {
                                                                        console.log(err);
                                                                    });

                                                                    stripe.accounts.update(
                                                                            account.id,
                                                                            {
                                                                                tos_acceptance: {
                                                                                    date: Math.floor(Date.now() / 1000),
                                                                                    ip: req.connection.remoteAddress // Assumes you're not using a proxy
                                                                                }
                                                                            }, function (err, update_bank_account) {

                                                                        if (err || !update_bank_account) {
                                                                            var err = err;
                                                                            res.json({success: false, stripe_error: err.message, error_code: error_message.ERROR_CODE_FOR_PROVIDER_BANK_DETAIL_ARE_NOT_VERIFIED});
                                                                        } else {
                                                                            res.json({success: true, message: error_message.MESSAGE_CODE_FOR_PROVIDER_BANK_DETAIL_ADDED_SUCCESSFULLY});
                                                                        }
                                                                    });
                                                                }
                                                            }
                                                    );
                                                }
                                                // asynchronously called
                                            });
                                        }
                                    });
                                    
                                });
                            }
                        });
                    }
                }
            }
            ;

        } else
        {

            res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});
        }
    });
};

exports.get_bank_detail_partner = function (req, res) {

    Partner.findOne({_id: req.body.partner_id}).then((partner) => { 
        if (partner)
        {
            if (req.body.token != null && partner.token != req.body.token) {
                res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
            } else
            {
                var stripe = require("stripe")(setting_detail.stripe_secret_key);
                stripe.accounts.retrieveExternalAccount(
                    partner.account_id,
                    partner.bank_id,
                    function (err, external_account) {
                        var err = err;

                        if (err || !external_account)
                        {
                            res.json({success: false, stripe_error: err.message, error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_GET_BANK_DETAIL});
                        } else
                        {
                            res.json({success: true, message: error_message.MESSAGE_CODE_FOR_PROVIDER_BANK_DETAIL_GET_SUCCESSFULLY,
                                bankdetails: {
                                    account_number: external_account.last4,
                                    routing_number: external_account.routing_number,
                                    account_holder_name: external_account.account_holder_name,
                                    account_holder_type: external_account.account_holder_type,
                                }
                            });
                        }
                    }
                );
            }
        } else
        {
            res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});
        }
    });
};

exports.delete_bank_detail_partner = function (req, res) {

    Partner.findOne({_id: req.body.partner_id}).then((partner) => { 

        if (partner)
        {
            if (req.body.token != null && partner.token != req.body.token) {
                res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
            } else
            {
                var stripe = require("stripe")(setting_detail.stripe_secret_key);
                stripe.accounts.del(partner.account_id, function (err, test) {
                    var err = err;
                    if (err || !test)
                    {
                        res.json({success: false, stripe_error: err.message, error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_DELETED_BANK_DETAIL_PLEASE_RETRY});
                    } else
                    {
                        partner.account_id = "";
                        partner.bank_id = "";
                        partner.save().then(() => { 
                            res.json({success: true, message: success_messages.MESSAGE_CODE_FOR_PROVIDER_BANK_DETAIL_DELETED_SUCCESSFULLY});
                        }, (err) => {
                                    utils.error_response(err, res)
                        });
                    }

                })
            }
        } else
        {
            res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});
        }
    });
};

exports.partner_provider_documents_edit = function (req, res, next) {
    if (typeof req.session.partner != 'undefined') {
        Provider_Document.findById(req.body.id).then((provider_document) => { 
            
                res.render('partner_provider_documents_edit', {detail: provider_document, moment: moment});

            
        });
    } else {
        res.redirect('/partner_login');
    }
};

exports.partner_provider_documents_update = function (req, res, next) {
    if (typeof req.session.partner != 'undefined') {
        Provider_Document.findById(req.body.id).then((provider_document) => { 
            
            var id = provider_document.provider_id;

            provider_document.expired_date = req.body.expired_date;
            provider_document.unique_code = req.body.unique_code;
            provider_document.save().then(() => { 
            }, (err) => {
                                    console.log(err);
            });

            if (req.files.length > 0)
            {
                var image_name = provider_document.provider_id + utils.tokenGenerator(4);
                var url = utils.getImageFolderPath(req, 3) + image_name + '.jpg';
                utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 3);

                provider_document.document_picture = url;
                provider_document.is_uploaded = 1;
                provider_document.save().then(() => { 
                    req.url = '/proivder_documents';
                    req.body = {id: provider_document.provider_id}
                    exports.documents(req, res, next)
                }, (err) => {
                                    utils.error_response(err, res)
                });
            } else {
                req.url = '/proivder_documents';
                req.body = {id: provider_document.provider_id}
                exports.documents(req, res, next)
            }
        });
    } else {
        res.redirect('/partner_login');
    }
};

exports.partner_vehicle = function (req, res) {
    if (typeof req.session.partner != 'undefined') {
        var condition = {$match: {"_id": Schema(req.session.partner._id)}};
        var vunwind = {$unwind: "$vehicle_detail"};

        var lookup = {
            $lookup:
                    {
                        from: "types",
                        localField: "vehicle_detail.admin_type_id",
                        foreignField: "_id",
                        as: "type_detail"
                    }
        };
        var unwind = {$unwind: {
                path: "$type_detail",
                preserveNullAndEmptyArrays: true
            }
        };
        var group = {$group: {
                _id: null,
                "vehicle_detail": {$push: {
                        is_selected: "$vehicle_detail.is_selected",
                        passing_year: "$vehicle_detail.passing_year",
                        color: "$vehicle_detail.color",
                        model: "$vehicle_detail.model",
                        plate_no: "$vehicle_detail.plate_no",
                        name: "$vehicle_detail.name",
                        _id: "$vehicle_detail._id",
                        partner_id: "$_id",
                        type_image_url: '$type_detail.type_image_url',
                        typename: '$type_detail.typename',
                        accessibility: "$vehicle_detail.accessibility"

                    }}
            }
        }
        Partner.aggregate([condition, vunwind, lookup, unwind, group]).then((partner) => { 
            if (partner.length == 0) {
                res.render('partner_vehicle', {vehicle_list: []})
            } else {
                res.render('partner_vehicle', {vehicle_list: partner[0].vehicle_detail})
            }
            delete message;
        }, (err) => {
                                    utils.error_response(err, res)
        });
    } else {
        res.redirect('/partner_login');
    }
};


exports.partner_add_vehicle_details = function (req, res) {

    if (typeof req.session.partner != 'undefined') {
        Partner.findOne({_id: req.body.partner_id}).then((partner) => { 
            var is_selected = false;
            if (partner.vehicle_detail.length == 0) {
                is_selected = true;
            }
            var mongoose = require('mongoose');
            var ObjectId = mongoose.Types.ObjectId;
            var x = new ObjectId();
            var vehicel_json = {
                _id: x,
                name: req.body.name,
                plate_no: req.body.plate_no,
                model: req.body.model,
                color: req.body.color,
                passing_year: req.body.passing_year,
                accessibility: req.body.accessibility,
                service_type: null,
                admin_type_id: null,
                is_documents_expired: false,
                is_selected: is_selected,
                is_document_uploaded: false
            }
            

            var files = req.files;
            Country.findOne({countryname: partner.country}).then((country) => { 

                Document.find({countryid: country._id, type: 2}).then((document) => { 

                    if (document.length == 0) {
                        partner.is_vehicle_document_uploaded = true;
                        vehicel_json.is_document_uploaded = true;
                        partner.save();
                        message = admin_messages.success_add_vehicle_detail;
                        res.redirect('/partner_vehicle');
                    } else {
                        document.forEach(function (entry, index) {
                            var partnervehicledocument = new Partner_Vehicle_Document({
                                vehicle_id: x,
                                partner_id: partner._id,
                                document_id: entry._id,
                                name: entry.title,
                                option: entry.option,
                                document_picture: "",
                                unique_code: entry.unique_code,
                                expired_date: "",
                                is_unique_code: entry.is_unique_code,
                                is_expired_date: entry.is_expired_date,
                                is_document_expired: false,
                                is_uploaded: 0
                            });
                            partnervehicledocument.save().then(() => { 
                                if (index == document.length - 1) {
                                    message = admin_messages.success_add_vehicle_detail;
                                    res.redirect('/partner_vehicle');
                                }
                            }, (err) => {
                                    utils.error_response(err, res)
                            });
                        });
                    }

                    partner.vehicle_detail.push(vehicel_json);
                    partner.save().then(() => { 
                    }, (err) => {
                        console.log(err);
                    });
                    
                });
            });
        });
    } else {
        res.redirect('/partner_login');
    }
};


exports.partner_edit_vehicle_detail = function (req, res) {
    var vehicle_accesibility = VEHICLE_ACCESIBILITY;
    if (typeof req.session.partner != 'undefined') {
        Partner.findOne({_id: req.body.partner_id}).then((partner) => { 
            var index = partner.vehicle_detail.findIndex(x => (x._id).toString() == req.body.vehicle_id);
            Partner_Vehicle_Document.find({partner_id: req.body.partner_id, vehicle_id: req.body.vehicle_id}).then((partner_vehicle_document) => { 

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
                var cityid_condition = {$match: {'cityid': {$eq: Schema(partner.city_id)}}};

                Citytype.aggregate([cityid_condition, lookup, unwind]).then((type_available) => { 

                    res.render('add_partner_vehicle_detail', {partner_id: partner._id, vehicle_accesibility: vehicle_accesibility, type_available: type_available, partner_vehicle_document: partner_vehicle_document, vehicle_detail: partner.vehicle_detail[index]})
                    delete message;
                }, (err) => {
                                    utils.error_response(err, res)
                });

            })
        })

    } else {
        res.redirect('/partner_login');
    }
};


exports.partner_add_vehicle = function (req, res) {
    var vehicle_accesibility = VEHICLE_ACCESIBILITY;
    if (typeof req.session.partner != 'undefined') {
        res.render('add_partner_vehicle_detail', {partner_id: req.session.partner._id, vehicle_accesibility: vehicle_accesibility})
    } else {
        res.redirect('/partner_login');
    }
};


exports.update_vehicle_detail = function (req, res, next) {
    if (typeof req.session.partner != 'undefined') {
        Partner.findOne({_id: req.body.partner_id}).then((partner) => { 
            var index = partner.vehicle_detail.findIndex(x => (x._id).toString() == req.body.vehicle_id);

            partner.vehicle_detail[index].name = req.body.name;
            partner.vehicle_detail[index].plate_no = req.body.plate_no;
            partner.vehicle_detail[index].model = req.body.model;
            partner.vehicle_detail[index].color = req.body.color;
            partner.vehicle_detail[index].passing_year = req.body.passing_year;
            partner.vehicle_detail[index].accessibility = req.body.accessibility;


            Partner.findOneAndUpdate({_id: req.body.partner_id}, {vehicle_detail: partner.vehicle_detail}, {new : true}).then((partner) => { 

                message = admin_messages.success_update_vehicle_detail;
                res.redirect('/partner_vehicle');

            })
        });
    } else {
        res.redirect('/partner_login');
    }
};


exports.vehicle_document_list_for_partner = function (req, res) {
    if (typeof req.session.partner != 'undefined') {
        Partner_Vehicle_Document.find({partner_id: req.body.partner_id, vehicle_id: req.body.vehicle_id}).then((partner_vehicle_document) => { 

            res.render('vehicle_document_list_for_partner', {partner_id: req.body.partner_id, vehicle_id: req.body.vehicle_id, moment: moment, detail: partner_vehicle_document})
            delete message;
        });
    } else {
        res.redirect('/partner_login');
    }
};


exports.vehicle_documents_edit_for_partner = function (req, res) {
    if (typeof req.session.partner != 'undefined') {
        Partner_Vehicle_Document.findById(req.body.id).then((partner_document) => { 
            
                res.render('vehicle_documents_edit_for_partner', {detail: partner_document, moment: moment});
            
        });
    } else {
        res.redirect('/partner_login');
    }
};


exports.vehicle_documents_update_for_partner = function (req, res) {
    if (typeof req.session.partner != 'undefined') {
        Partner_Vehicle_Document.findById(req.body.id).then((partner_document) => { 
            
            var id = partner_document.partner_id;
            partner_document.expired_date = req.body.expired_date;
            partner_document.unique_code = req.body.unique_code;

            message = admin_messages.success_update_document;
            if (req.files.length > 0)
            {
                var image_name = partner_document.partner_id + utils.tokenGenerator(4);
                var url = utils.getImageFolderPath(req, 3) + image_name + '.jpg';
                utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 3);

                partner_document.document_picture = url;
                partner_document.is_uploaded = 1;
                partner_document.save().then(() => { 
                    req.body = {partner_id: partner_document.partner_id, vehicle_id: partner_document.vehicle_id}
                    myPartners.vehicle_document_list_for_partner(req, res);
                });
            } else {
                partner_document.save().then(() => { 
                    req.body = {partner_id: partner_document.partner_id, vehicle_id: partner_document.vehicle_id}
                    myPartners.vehicle_document_list_for_partner(req, res);

                });
            }
            
        });
    } else {
        res.redirect('/partner_login');
    }
};

///////////////////////////  ADMIN PANEL ////////////////////

exports.partner_vehicle_list = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        var condition = {$match: {"_id": Schema(req.body.partner_id)}};
        var vunwind = {$unwind: "$vehicle_detail"}

        var lookup = {
            $lookup:
                    {
                        from: "types",
                        localField: "vehicle_detail.admin_type_id",
                        foreignField: "_id",
                        as: "type_detail"
                    }
        };
        var unwind = {$unwind: {
                path: "$type_detail",
                preserveNullAndEmptyArrays: true
            }
        };
        var group = {$group: {
                _id: null,
                "vehicle_detail": {$push: {
                        is_selected: "$vehicle_detail.is_selected",
                        passing_year: "$vehicle_detail.passing_year",
                        color: "$vehicle_detail.color",
                        model: "$vehicle_detail.model",
                        plate_no: "$vehicle_detail.plate_no",
                        name: "$vehicle_detail.name",
                        accessibility: "$vehicle_detail.accessibility",
                        _id: "$vehicle_detail._id",
                        partner_id: "$_id",
                        type_image_url: '$type_detail.type_image_url',
                        typename: '$type_detail.typename'
                    }}
            }
        }
        Partner.aggregate([condition, vunwind, lookup, unwind, group]).then((partner) => { 
            if (partner.length == 0) {
                res.render('partner_vehicle_list', {vehicle_list: []})
            } else {
                res.render('partner_vehicle_list', {vehicle_list: partner[0].vehicle_detail})

            }
        }, (err) => {
                                    utils.error_response(err, res)
        })
    } else {
        res.redirect('/admin');
    }
};


exports.edit_partner_vehicle_detail = function (req, res) {
    var vehicle_accesibility = VEHICLE_ACCESIBILITY;

    if (typeof req.session.userid != 'undefined') {
        Partner.findOne({_id: req.body.partner_id}).then((partner) => { 
            var index = partner.vehicle_detail.findIndex(x => (x._id).toString() == req.body.vehicle_id);

            Partner_Vehicle_Document.find({partner_id: req.body.partner_id, vehicle_id: req.body.vehicle_id}).then((partner_vehicle_document) => { 

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
                var cityid_condition = {$match: {'cityid': {$eq: Schema(partner.city_id)}}};

                Type.find({is_business: 1}).then((type_available) => { 
                    res.render('edit_partner_vehicle_detail', {partner_id: req.body.partner_id, type_available: type_available, vehicle_accesibility: vehicle_accesibility, partner_vehicle_document: partner_vehicle_document, vehicle_detail: partner.vehicle_detail[index]})
                });

            })
        })

    } else {
        res.redirect('/admin');
    }
};

// update_partner_vehicle_detail //
exports.update_partner_vehicle_detail = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        Partner.findOne({_id: req.body.partner_id}).then((partner) => { 

            var index = partner.vehicle_detail.findIndex(x => (x._id).toString() == req.body.vehicle_id);
            partner.vehicle_detail[index].admin_type_id = Schema(req.body.service_type);
            partner.vehicle_detail[index].name = req.body.name;
            partner.vehicle_detail[index].plate_no = req.body.plate_no;
            partner.vehicle_detail[index].model = req.body.model;
            partner.vehicle_detail[index].color = req.body.color;
            partner.vehicle_detail[index].accessibility = req.body.accessibility;
            partner.vehicle_detail[index].passing_year = req.body.passing_year;

            Partner.findOneAndUpdate({_id: req.body.partner_id}, {vehicle_detail: partner.vehicle_detail}, {new : true}).then((partner) => { 
                myPartners.partner_vehicle_list(req, res);
            })
        });
    } else {
        res.redirect('/admin');
    }
};

/////// admin panel partner vehicle documents //
exports.vehicle_document_list_partner = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
      
        Partner_Vehicle_Document.find({partner_id: req.body.partner_id, vehicle_id: req.body.vehicle_id}).then((partner_vehicle_document) => { 
      
            res.render('partner_vehicle_document_list', {partner_id: req.body.partner_id, vehicle_id: req.body.vehicle_id, moment: moment, detail: partner_vehicle_document})

        });
    } else {
        res.redirect('/admin');
    }
};


exports.vehicle_documents_edit_partner = function (req, res) {

    if (typeof req.session.userid != 'undefined') {
        Partner_Vehicle_Document.findById(req.body.id).then((partner_vehicle_document) => { 
            
                res.render('admin_partner_vehicle_documents_edit', {detail: partner_vehicle_document, moment: moment});

        });
    } else {
        res.redirect('/admin');
    }
};

exports.vehicle_documents_update_partner = function (req, res) {
 
    if (typeof req.session.userid != 'undefined') {
        Partner_Vehicle_Document.findById(req.body.id).then((partner_vehicle_document) => { 
           
            var id = partner_vehicle_document.partner_id;
            partner_vehicle_document.expired_date = req.body.expired_date;
            partner_vehicle_document.unique_code = req.body.unique_code;

            if (req.files.length > 0)
            {
                var image_name = partner_vehicle_document.partner_id + utils.tokenGenerator(4);
                var url = utils.getImageFolderPath(req, 3) + image_name + '.jpg';
                utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 3);

                partner_vehicle_document.document_picture = url;
                partner_vehicle_document.is_uploaded = 1;
                partner_vehicle_document.save().then(() => { 
                    req.body = {partner_id: partner_vehicle_document.partner_id, vehicle_id: partner_vehicle_document.vehicle_id}
                    myPartners.vehicle_document_list_partner(req, res);
                });
            } else {
                partner_vehicle_document.save().then(() => { 
                    req.body = {partner_id: partner_vehicle_document.partner_id, vehicle_id: partner_vehicle_document.vehicle_id}
                    myPartners.vehicle_document_list_partner(req, res);
                });

            }
            
        });
    } else {
        res.redirect('/admin');
    }
};
exports.get_available_vehicle_list = function (req, res) {
    if (typeof req.session.partner != 'undefined') {
        Partner.findOne({_id: req.body.id}).then((partner) => { 
            if (partner) {
                Citytype.findOne({_id: req.body.service_type_id},function(error, city_type_detail){

                    var vehicle_array = [];
                    partner.vehicle_detail.forEach(function (vehicle) {
                        console.log(vehicle.admin_type_id + ' ' + vehicle.name)
                        if (vehicle.admin_type_id != null && vehicle.is_assigned !== true && (city_type_detail.typeid).toString() == (vehicle.admin_type_id).toString()) {
                            vehicle_array.push(vehicle)
                        }
                    })
                    res.json({success: true, vehicle_array: vehicle_array})
                })

            } else {
                res.json({success: false})
            }
        });
    } else {
        res.redirect('/partner_login');
    }
}

exports.assign_vehicle_to_provider = function (req, res) {
    if (typeof req.session.partner != 'undefined') {
        Partner.findOne({_id: req.body.id}).then((partner) => { 
            if (partner) {
                var index = partner.vehicle_detail.findIndex((x) => x._id == req.body.vehicle_id);
                var vehicle_detail = partner.vehicle_detail[index]
                Provider.findOne({_id: req.body.provider_id}).then((provider) => { 
                    vehicle_detail.service_type = Schema(req.body.service_type_id);
                    provider.vehicle_detail.push(vehicle_detail);
                    provider.service_type = req.body.service_type_id;
                    provider.admintypeid = vehicle_detail.admin_type_id;
                    provider.vehicle_detail[provider.vehicle_detail.length-1].is_selected = true;
                    provider.is_vehicle_document_uploaded = true;
                    provider.save();
                    partner.vehicle_detail[index].is_assigned = true;
                    partner.markModified('vehicle_detail');
                    partner.save().then(() => { 
                        res.json({success: true});
                    })
                })
            } else {
                res.json({success: false})
            }
        });
    } else {
        res.redirect('/partner_login');
    }
}

exports.remove_vehicle_from_provider = function (req, res) {
    if (typeof req.session.partner != 'undefined') {
        Partner.findOne({_id: req.body.id}).then((partner) => { 
            if (partner) {

                Provider.findOne({_id: req.body.provider_id}).then((provider) => { 
                    var vehicle_id;
                    provider.vehicle_detail.forEach(function (vehicle){
                        if(vehicle.is_selected){
                            vehicle_id = vehicle._id;
                        }
                    })
                    provider.vehicle_detail = [];
                    provider.service_type = [];
                    provider.admintypeid = null;
                    provider.is_vehicle_document_uploaded = false;
                    provider.save();

                    var vehicle_index = partner.vehicle_detail.findIndex(vehicle => (vehicle._id).toString() == vehicle_id);
                    partner.vehicle_detail[vehicle_index].is_assigned = false;
                    partner.vehicle_detail[vehicle_index].is_selected = false;
                    partner.markModified('vehicle_detail');
                    partner.save().then(() => { 
                        res.json({success: true});
                    })
                })
            } else {
                res.json({success: false})
            }
        });
    } else {
        res.redirect('/partner_login');
    }
}

//partner_wallet_history
exports.partner_wallet_history = function (req, res, next) {
    if (typeof req.session.partner != 'undefined') {
      
        Wallet_history.find({user_id: req.session.partner._id}, function (err, wallet_history) {
            Partner.findOne({_id: req.session.partner._id}, function (err, partner_detail) {
                res.render('partner_wallet_history', {'detail': wallet_history, partner_detail: partner_detail, timezone_for_display_date: setting_detail.timezone_for_display_date, 'moment': moment});

            });
        });

    } else {
        res.redirect('/profile');
    }
};


// genetare_partner_excel
exports.genetare_partner_excel = function (req, res, next) {
  
    if (typeof req.session.userid != 'undefined') {
        var query = {};
        sort = {};
        array = [];
        var query1 = {};
        var query2 = {};
        var query3 = {};
        var query4 = {};
        var query5 = {};
        var query6 = {};
        if (req.body.page == undefined) {

            if (req.session.page != undefined) {
                var field = sort_field;
                var order = sort_order;
                var item = search_item;
                var value = search_value;

                var start_date = filter_start_date;
                var end_state = filter_end_date;

                sort[field] = order;
                req.body.page = req.session.page;
                delete req.session.page;
            } else {
                sort['_id'] = -1;

                search_item = 'first_name';
                search_value = '';
                sort_order = -1;
                sort_field = 'unique_id';
                filter_start_date = '';
                filter_end_date = '';

                var start_date = '';
                var end_state = '';
            }
        } else {

            var field = req.body.sort_item[0];
            var order = req.body.sort_item[1];
            var item = req.body.search_item;
            var value = req.body.search_value;

            sort[field] = order;

            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
            search_item = item
            search_value = value;
            filter_start_date = req.body.start_date;
            filter_end_date = req.body.end_date;

            var start_date = req.body.start_date;
            var end_state = req.body.end_date;

        }
        if (start_date != '' || end_state != '') {
            if (start_date == '') {
                start_date = new Date(end_state);
                start_date = start_date - 1;
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else if (end_state == '') {
                end_date = new Date(start_date);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                start_date = new Date(start_date);
                start_date = start_date - 1;
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else {
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            }
        }

        if (item == 'first_name') {
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[''] = '';
                query4[''] = '';
                query5[''] = '';
                query6[''] = '';
            } else {
                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[item] = new RegExp(full_name[0], 'i');
                query4['last_name'] = new RegExp(full_name[0], 'i');
                query5[item] = new RegExp(full_name[1], 'i');
                query6['last_name'] = new RegExp(full_name[1], 'i');
            }
        } else {

            if (item != undefined) {
                query[item] = new RegExp(value, 'i');
            }
        }

        Partner.find({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query]}).then((array) => { 

            var date = new Date()
            var time = date.getTime()
            var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_partner_provider.xlsx');

            var sheet1 = workbook.createSheet('sheet1', 5, array.length + 1);
            sheet1.set(1, 1, "ID");
            sheet1.set(2, 1, "NAME");
            sheet1.set(3, 1, "EMAIL");
            sheet1.set(4, 1, "PHONE");
            sheet1.set(5, 1, "COUNTRY");

            var j =1;
            array.forEach(function (data, index) {
                sheet1.set(1, index + 2, data.unique_id);
                sheet1.set(2, index + 2, data.first_name + ' ' + data.last_name);

                sheet1.set(3, index + 2, data.email);
                sheet1.set(4, index + 2, data.country_phone_code + ' ' + data.phone);
                sheet1.set(5, index + 2, data.country);
                if (j == array.length) {
                    workbook.save(function (err) {
                        if (err)
                        {
                            workbook.cancel();
                        } else {
                            var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_partner_provider.xlsx"
                            res.json(url);
                            setTimeout(function () {
                                fs.unlink('data/xlsheet/' + time + '_partner_provider.xlsx', function (err, file) {
                                });
                            }, 10000)
                        }
                    });
                } else{
                    j++;
                }

            })

        })
    } else {
        res.redirect('/admin');
    }

};


// genetare_partner_provider_excel
exports.genetare_partner_provider_excel = function (req, res, next) {
    if (typeof req.session.userid != 'undefined') {
        var query = {};
        var provider_query = {};
        sort = {};
        array = [];
        var query1 = {};
        var query2 = {};
        var query3 = {};
        var query4 = {};
        var query5 = {};
        var query6 = {};

        var field = req.body.sort_item[0];
        var order = req.body.sort_item[1];
        var item = req.body.search_item;
        var value = req.body.search_value;

        sort_order = req.body.sort_item[1];
        sort_field = req.body.sort_item[0];
        search_item = item
        search_value = value;
        filter_start_date = req.body.start_date;
        filter_end_date = req.body.end_date;

        var start_date = req.body.start_date;
        var end_state = req.body.end_date;

        if (start_date != '' || end_state != '') {
            if (start_date == '') {
                start_date = new Date(end_state);
                start_date = start_date - 1;
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else if (end_state == '') {
                end_date = new Date(start_date);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                start_date = new Date(start_date);
                start_date = start_date - 1;
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else {
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            }
        }

        if (item == 'first_name') {
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[''] = '';
                query4[''] = '';
                query5[''] = '';
                query6[''] = '';
            } else {
                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[item] = new RegExp(full_name[0], 'i');
                query4['last_name'] = new RegExp(full_name[0], 'i');
                query5[item] = new RegExp(full_name[1], 'i');
                query6['last_name'] = new RegExp(full_name[1], 'i');
            }
        } else if (item == 'unique_id')
        {
            if (value !== "")
            {
                value = Number(value);
                query[item] = value

            }
        } else {

            if (item != undefined) {
                query[item] = new RegExp(value, 'i');
            }
        }

        var sort = {};
        sort[field] = order;

        var options = {
            sort: sort
        };
        provider_query['provider_type_id'] = req.body.id;
        
        
        Provider.find({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query,provider_query]}).then((providers) => { 

                var is_public_demo = setting_detail.is_public_demo;
                var timezone_for_display_date = setting_detail.timezone_for_display_date;

                var j = 1;
                providers.forEach(function (data) {

                    if (data.service_type == null) {
                        if (j == providers.length) {
                            data.service_type = null;
                            generate_excel(req, res, providers, timezone_for_display_date)
                        } else {
                            data.service_type = null;
                            j++;
                        }
                    } else {
                        Citytype.findOne({_id: data.service_type}).then((city_type_data) => { 

                            Type.findOne({_id: city_type_data.typeid}).then((type_data) => { 

                                if (j == providers.length) {
                                    data.service_type_name = type_data.typename;

                                    generate_excel(req, res, providers, timezone_for_display_date)
                                } else {
                                    data.service_type_name = type_data.typename;
                                    j++;
                                }
                            });
                        });
                    }

                });

        })


    } else {
        res.redirect('/admin');
    }
}

function generate_excel(req, res, array, timezone) {
    var date = new Date()
    var time = date.getTime()
    var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_partner_provider.xlsx');

    var sheet1 = workbook.createSheet('sheet1', 13, array.length + 1);
    sheet1.set(1, 1, config_json.title_id);
    sheet1.set(2, 1, config_json.title_name);
    sheet1.set(3, 1, config_json.title_email);
    sheet1.set(4, 1, config_json.title_phone);
    sheet1.set(5, 1, config_json.title_total_request);
    sheet1.set(6, 1, config_json.title_completed_request);
    sheet1.set(7, 1, config_json.title_cancelled_request);
    sheet1.set(8, 1, config_json.title_accepted_request);
    sheet1.set(9, 1, config_json.title_city);
    sheet1.set(10, 1, config_json.title_car);
    sheet1.set(11, 1, config_json.title_app_version);
    sheet1.set(12, 1, config_json.title_registered_date);

    array.forEach(function (data, index) {
        sheet1.set(1, index + 2, data.unique_id);
        sheet1.set(2, index + 2, data.first_name + ' ' + data.last_name);
        sheet1.set(3, index + 2, data.email);
        sheet1.set(4, index + 2, data.country_phone_code + data.phone);
        sheet1.set(5, index + 2, data.total_request);
        sheet1.set(6, index + 2, data.completed_request);
        sheet1.set(7, index + 2, data.cancelled_request);
        sheet1.set(8, index + 2, data.accepted_request);
        sheet1.set(9, index + 2, data.city);
        sheet1.set(10, index + 2, data.service_type_name);
        sheet1.set(11, index + 2, data.device_type + '-' + data.app_version);
        sheet1.set(12, index + 2, moment(data.created_at).tz(timezone).format("DD MMM 'YY") + ' ' + moment(data.created_at).tz(timezone).format("hh:mm a"));

        if (index == array.length - 1) {
            workbook.save(function (err) {
                if (err)
                {
                    workbook.cancel();
                } else {
                    var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_partner_provider.xlsx"
                    res.json(url);
                    setTimeout(function () {
                        fs.unlink('data/xlsheet/' + time + '_partner_provider.xlsx', function (err, file) {
                        });
                    }, 10000)
                }
            });
        }

    })
};

// partner_providers_excel
exports.partner_providers_excel = function (req, res, next) {

    if (typeof req.session.partner != 'undefined') {

        var query = {};
        sort = {};
        array = [];
        var query1 = {};
        var query2 = {};
        var query3 = {};
        var query4 = {};
        var query5 = {};
        var query6 = {};

        query['provider_type_id'] = req.session.partner._id;
        if (req.body.search_item == undefined) {
            sort['_id'] = -1;

            search_item = 'first_name';
            search_value = '';
            sort_order = -1;
            sort_field = 'unique_id';
            filter_start_date = '';
            filter_end_date = '';

            var start_date = '';
            var end_state = '';
        } else {

            var field = req.body.sort_item[0];
            var order = req.body.sort_item[1];
            var item = req.body.search_item;
            var value = req.body.search_value;

            sort[field] = order;

            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
            search_item = item
            search_value = value;
            filter_start_date = req.body.start_date;
            filter_end_date = req.body.end_date;

            var start_date = req.body.start_date;
            var end_state = req.body.end_date;
        }
        if (start_date != '' || end_state != '') {
            if (start_date == '') {
                start_date = new Date(end_state);
                start_date = start_date - 1;
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else if (end_state == '') {
                end_date = new Date(start_date);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                start_date = new Date(start_date);
                start_date = start_date - 1;
                query['created_at'] = {$gte: start_date, $lt: end_date};
            } else {
                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(end_state);
                end_date = end_date.setHours(11, 59, 59, 999);
                end_date = new Date(end_date);
                query['created_at'] = {$gte: start_date, $lt: end_date};
            }
        }

        if (item == 'first_name') {
            value = value.replace(/^\s+|\s+$/g, '');
            value = value.replace(/ +(?= )/g, '');

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[''] = '';
                query4[''] = '';
                query5[''] = '';
                query6[''] = '';
            } else {
                query1[item] = new RegExp(value, 'i');
                query2['last_name'] = new RegExp(value, 'i');
                query3[item] = new RegExp(full_name[0], 'i');
                query4['last_name'] = new RegExp(full_name[0], 'i');
                query5[item] = new RegExp(full_name[1], 'i');
                query6['last_name'] = new RegExp(full_name[1], 'i');
            }
        } else {

            if (item != undefined) {
                query[item] = new RegExp(value, 'i');
            }
        }

        var sort = {};
        sort[field] = order;

        var options = {
            sort: sort
        };
        Provider.find({$and: [{$or: [query1, query2, query3, query4, query5, query6]}, query]}).then((providers) => { 
    
                var is_public_demo = setting_detail.is_public_demo;
                var timezone_for_display_date = setting_detail.timezone_for_display_date;

                var j = 1;
                providers.forEach(function (data) {

                    if (data.service_type == null) {
                        if (j == providers.length) {
                            data.service_type = null;
                            partner_pro_generate_excel(req, res, providers, timezone_for_display_date)
                        } else {
                            data.service_type = null;
                            j++;
                        }
                    } else {
                        Citytype.findOne({_id: data.service_type}).then((city_type_data) => { 

                            Type.findOne({_id: city_type_data.typeid}).then((type_data) => { 

                                if (j == providers.length) {
                                    data.service_type_name = type_data.typename;

                                    partner_pro_generate_excel(req, res, providers, timezone_for_display_date)
                                } else {
                                    data.service_type_name = type_data.typename;
                                    j++;
                                }
                            });
                        });
                    }

                });

        })


    } else {
        res.redirect('/partner_login');
    }
}

function partner_pro_generate_excel(req, res, array, timezone) {

    var date = new Date()
    var time = date.getTime()
    var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_partner_providers.xlsx');

    var sheet1 = workbook.createSheet('sheet1', 13, array.length + 1);
    sheet1.set(1, 1, config_json.title_id);
    sheet1.set(2, 1, config_json.title_name);
    sheet1.set(3, 1, config_json.title_email);
    sheet1.set(4, 1, config_json.title_phone);
    sheet1.set(5, 1, config_json.title_total_request);
    sheet1.set(6, 1, config_json.title_completed_request);
    sheet1.set(7, 1, config_json.title_cancelled_request);
    sheet1.set(8, 1, config_json.title_accepted_request);
    sheet1.set(9, 1, config_json.title_city);
    sheet1.set(10, 1, config_json.title_car);
    sheet1.set(11, 1, config_json.title_app_version);
    sheet1.set(12, 1, config_json.title_registered_date);

    array.forEach(function (data, index) {
        sheet1.set(1, index + 2, data.unique_id);
        sheet1.set(2, index + 2, data.first_name + ' ' + data.last_name);
        sheet1.set(3, index + 2, data.email);
        sheet1.set(4, index + 2, data.country_phone_code + data.phone);
        sheet1.set(5, index + 2, data.total_request);
        sheet1.set(6, index + 2, data.completed_request);
        sheet1.set(7, index + 2, data.cancelled_request);
        sheet1.set(8, index + 2, data.accepted_request);
        sheet1.set(9, index + 2, data.city);
        sheet1.set(10, index + 2, data.service_type_name);
        sheet1.set(11, index + 2, data.device_type + '-' + data.app_version);
        sheet1.set(12, index + 2, moment(data.created_at).tz(timezone).format("DD MMM 'YY") + ' ' + moment(data.created_at).tz(timezone).format("hh:mm a"));

        if (index == array.length - 1) {
            workbook.save(function (err) {
                if (err)
                {
                    workbook.cancel();
                } else {
                    var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_partner_providers.xlsx"
                    res.json(url);
                    setTimeout(function () {
                        fs.unlink('data/xlsheet/' + time + '_partner_providers.xlsx', function (err, file) {
                        });
                    }, 10000)
                }
            });
        }

    })
}
;


// genetare_partner_request_excel
exports.genetare_partner_request_excel = function (req, res, next) {

    if (typeof req.session.partner != 'undefined') {
        var j = 1;
        var array = [];
        if (req.body.page == undefined) {
            page = 0;
            next = 1;
            pre = 0;
        } else {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;
        }

        if (req.body.search_item == undefined) {
            search_item = 'user_detail.first_name';
            search_value = '';
            sort_order = -1;
            sort_field = 'unique_id';
            filter_start_date = '';
            filter_end_date = '';

        } else {
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
            end_date = new Date(Date.now());
            var start_date = new Date(end_date.getTime() - (6 * 24 * 60 * 60 * 1000));
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
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
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user_detail"
                    }
        };
        var unwind = {$unwind: "$user_detail"};

        var lookup1 = {
            $lookup:
                    {
                        from: "providers",
                        localField: "confirmed_provider",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
        };

        var unwind1 = {$unwind: "$provider_detail"};

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');
        if (search_item == "user_detail.first_name") {
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};

                var search = {"$match": {$or: [query1, query2]}};
            } else {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};
                query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
                query4['user_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
                query6['user_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

                var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
            }
        } else if (search_item == "provider_detail.first_name") {
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['provider_detail.last_name'] = {$regex: new RegExp(value, 'i')};

                var search = {"$match": {$or: [query1, query2]}};
            } else {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['provider_detail.last_name'] = {$regex: new RegExp(value, 'i')};
                query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
                query4['provider_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
                query6['provider_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

                var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
            }
        } else {

            var search = {"$match": {search_item: {$regex: new RegExp(value, 'i')}}};
        }

       
        var mongoose = require('mongoose');
        var Schema = mongoose.Types.ObjectId;
       
        query1['created_at'] = {$gte: start_date, $lt: end_date};
        var filter = {"$match": query1};

        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);
        var condition = {$match: {'provider_type_id': {$eq: Schema(req.session.partner._id)}}};

        Trip.aggregate([condition, lookup, unwind, lookup1, search, filter, sort]).then((array) => { 

            var date = new Date()
            var time = date.getTime()
            var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_partner_request.xlsx');

            var sheet1 = workbook.createSheet('sheet1', 10, array.length + 1);

            sheet1.set(1, 1, config_json.title_id);
            sheet1.set(2, 1, config_json.title_user_id);
            sheet1.set(3, 1, config_json.title_user);
            sheet1.set(4, 1, config_json.title_provider_id);
            sheet1.set(5, 1, config_json.title_provider);
            sheet1.set(6, 1, config_json.title_date);
            sheet1.set(7, 1, config_json.title_status);
            sheet1.set(8, 1, config_json.title_amount);
            sheet1.set(9, 1, config_json.title_payment);
            sheet1.set(10, 1, config_json.title_payment_status);

            array.forEach(function (data, index) {

                sheet1.set(1, index + 2, data.unique_id);
                sheet1.set(2, index + 2, data.user_detail.unique_id);
                sheet1.set(3, index + 2, data.user_detail.first_name + ' ' + data.user_detail.last_name);
                if (data.provider_detail.length > 0) {
                    sheet1.set(4, index + 2, data.provider_detail[0].unique_id);
                    sheet1.set(5, index + 2, data.provider_detail[0].first_name + ' ' + data.provider_detail[0].last_name);
                }
                sheet1.set(6, index + 2, moment(data.created_at).format("DD MMM 'YY") + ' ' + moment(data.created_at).format("hh:mm a"));



                if (data.is_trip_cancelled == 1) {
                    if (data.is_trip_cancelled_by_provider == 1) {
                        sheet1.set(7, index + 2, config_json.title_total_cancelled_by_provider);

                    } else if (data.is_trip_cancelled_by_user == 1) {
                        sheet1.set(7, index + 2, config_json.title_total_cancelled_by_user);
                    } else {
                        sheet1.set(7, index + 2, config_json.title_total_cancelled);

                    }
                } else {

                    if (data.is_provider_status == 2) {
                        sheet1.set(7, index + 2, config_json.title_trip_status_coming);

                    } else if (data.is_provider_status == 4) {
                        sheet1.set(7, index + 2, config_json.title_trip_status_arrived);

                    } else if (data.is_provider_status == 6) {
                        sheet1.set(7, index + 2, config_json.title_trip_status_started);

                    } else if (data.is_provider_status == 9) {
                        sheet1.set(7, index + 2, config_json.title_trip_status_completed);

                    } else if (data.is_provider_status == 1 || data.is_provider_status == 0) {
                        if (data.is_provider_accepted == 1) {
                            sheet1.set(7, index + 2, config_json.title_trip_status_accepted);
                        } else {
                            sheet1.set(7, index + 2, config_json.title_trip_status_waiting);

                        }
                    }
                }


                sheet1.set(8, index + 2, data.total);

                if (data.payment_mode == 1) {
                    sheet1.set(9, index + 2, config_json.title_pay_by_cash);
                } else {
                    sheet1.set(9, index + 2, config_json.title_pay_by_card);
                }

                if (data.is_pending_payments == 1) {

                    sheet1.set(10, index + 2, config_json.title_pending);
                } else {

                    if (data.is_paid == 1) {
                        sheet1.set(10, index + 2, config_json.title_paid);
                    } else {
                        sheet1.set(10, index + 2, config_json.title_not_paid);
                    }
                }



                if (index == array.length - 1) {
                    workbook.save(function (err) {
                        if (err)
                        {
                            workbook.cancel();
                        } else {
                            var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_partner_request.xlsx"
                            res.json(url);
                            setTimeout(function () {
                                fs.unlink('data/xlsheet/' + time + '_partner_request.xlsx', function (err, file) {
                                });
                            }, 10000)
                        }
                    });
                }

            });
        }, (err) => {
                                    utils.error_response(err, res)

        });

    } else {
        res.redirect('/partner_login');
    }

};

// generate_partner_provider_history_excel
exports.generate_partner_provider_history_excel = function (req, res, next) {
    if (typeof req.session.partner != 'undefined') {
        
        var array = [];
        var i = 0;

        if (req.body.page == undefined) {
            page = 0;
            next = 1;
            pre = 0;
        } else {
            page = req.body.page;
            next = parseInt(req.body.page) + 1;
            pre = req.body.page - 1;
        }
        if (req.body.search_item == undefined) {
            search_item = 'user_detail.first_name';
            search_value = '';
            sort_order = -1;
            sort_field = 'unique_id';
            filter_start_date = '';
            filter_end_date = '';
        } else {
            search_item = req.body.search_item;
            search_value = req.body.search_value;
            sort_order = req.body.sort_item[1];
            sort_field = req.body.sort_item[0];
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
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user_detail"
                    }
        };
        var unwind = {$unwind: "$user_detail"};

        var lookup1 = {
            $lookup:
                    {
                        from: "providers",
                        localField: "provider_id",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
        };

        var unwind1 = {$unwind: "$provider_detail"};

        value = search_value;
        value = value.replace(/^\s+|\s+$/g, '');
        value = value.replace(/ +(?= )/g, '');

        if (search_item == "user_detail.first_name") {
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};

            var full_name = value.split(' ');
            if (typeof full_name[0] == 'undefined' || typeof full_name[1] == 'undefined') {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};

                var search = {"$match": {$or: [query1, query2]}};
            } else {

                query1[search_item] = {$regex: new RegExp(value, 'i')};
                query2['user_detail.last_name'] = {$regex: new RegExp(value, 'i')};
                query3[search_item] = {$regex: new RegExp(full_name[0], 'i')};
                query4['user_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query5[search_item] = {$regex: new RegExp(full_name[1], 'i')};
                query6['user_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};

                var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
            }
        } else {

            var search = {"$match": {search_item: {$regex: new RegExp(value, 'i')}}};
        }

        var filter = {"$match": {}};
        filter["$match"]['provider_trip_end_time'] = {$gte: start_date, $lt: end_date};

       
        var sort = {"$sort": {}};
        sort["$sort"][sort_field] = parseInt(sort_order);
        var partnerid = req.session.partner._id;
        var mongoose = require('mongoose');
        var Schema = mongoose.Types.ObjectId;
        var condition = {"$match": {'provider_type_id': {$eq: Schema(partnerid)}}};

        Trip.aggregate([condition,lookup, unwind, lookup1, search, filter, sort]).then((array) => { 

           
            var date = new Date()
            var time = date.getTime()
            var workbook = excelbuilder.createWorkbook('./data/xlsheet', time + '_partner_provider_history.xlsx');

            var sheet1 = workbook.createSheet('sheet1', 10, array.length + 1);

            sheet1.set(1, 1, config_json.title_id);
            sheet1.set(2, 1, config_json.title_user_id);
            sheet1.set(3, 1, config_json.title_user);
            sheet1.set(4, 1, config_json.title_provider_id);
            sheet1.set(5, 1, config_json.title_provider);
            sheet1.set(6, 1, config_json.title_date);
            sheet1.set(7, 1, config_json.title_status);
            sheet1.set(8, 1, config_json.title_amount);
            sheet1.set(9, 1, config_json.title_payment);
            sheet1.set(10, 1, config_json.title_payment_status);

            array.forEach(function (data, index) {
                sheet1.set(1, index + 2, data.unique_id);
                sheet1.set(2, index + 2, data.user_detail.unique_id);
                sheet1.set(3, index + 2, data.user_detail.first_name + ' ' + data.user_detail.last_name);
                if (data.provider_detail.length > 0) {
                    sheet1.set(4, index + 2, data.provider_detail[0].unique_id);
                    sheet1.set(5, index + 2, data.provider_detail[0].first_name + ' ' + data.provider_detail[0].last_name);
                }
                sheet1.set(6, index + 2, moment(data.created_at).format("DD MMM 'YY") + ' ' + moment(data.created_at).format("hh:mm a"));



                if (data.is_trip_cancelled == 1) {
                    if (data.is_trip_cancelled_by_provider == 1) {
                        sheet1.set(7, index + 2, config_json.title_total_cancelled_by_provider);

                    } else if (data.is_trip_cancelled_by_user == 1) {
                        sheet1.set(7, index + 2, config_json.title_total_cancelled_by_user);
                    } else {
                        sheet1.set(7, index + 2, config_json.title_total_cancelled);

                    }
                } else {

                    if (data.is_provider_status == 2) {
                        sheet1.set(7, index + 2, config_json.title_trip_status_coming);

                    } else if (data.is_provider_status == 4) {
                        sheet1.set(7, index + 2, config_json.title_trip_status_arrived);

                    } else if (data.is_provider_status == 6) {
                        sheet1.set(7, index + 2, config_json.title_trip_status_started);

                    } else if (data.is_provider_status == 9) {
                        sheet1.set(7, index + 2, config_json.title_trip_status_completed);

                    } else if (data.is_provider_status == 1 || data.is_provider_status == 0) {
                        if (data.is_provider_accepted == 1) {
                            sheet1.set(7, index + 2, config_json.title_trip_status_accepted);
                        } else {
                            sheet1.set(7, index + 2, config_json.title_trip_status_waiting);

                        }
                    }
                }

                sheet1.set(8, index + 2, data.total);

                if (data.payment_mode == 1) {
                    sheet1.set(9, index + 2, config_json.title_pay_by_cash);
                } else {
                    sheet1.set(9, index + 2, config_json.title_pay_by_card);
                }

                if (data.is_pending_payments == 1) {

                    sheet1.set(10, index + 2, config_json.title_pending);
                } else {

                    if (data.is_paid == 1) {
                        sheet1.set(10, index + 2, config_json.title_paid);
                    } else {
                        sheet1.set(10, index + 2, config_json.title_not_paid);
                    }
                }

                if (index == array.length - 1) {
                    workbook.save(function (err) {
                        if (err)
                        {
                            workbook.cancel();
                        } else {
                            var url = req.protocol + '://' + req.get('host') + "/xlsheet/" + time + "_partner_provider_history.xlsx"
                            res.json(url);
                            setTimeout(function () {
                                fs.unlink('data/xlsheet/' + time + '_partner_provider_history.xlsx', function (err, file) {
                                });
                            }, 10000)
                        }
                    });
                }

            })
        }, (err) => {
                                    utils.error_response(err, res)

        });

    } else {
        res.redirect('/partner_login');
    }

};