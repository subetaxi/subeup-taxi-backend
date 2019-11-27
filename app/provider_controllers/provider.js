var User = require('mongoose').model('User');
var crypto = require('crypto');
require('../controllers/constant');
var utils = require('../controllers/utils');
var allemails = require('../controllers/emails');
var moment = require('moment');
var nodemailer = require('nodemailer');
var Setting = require('mongoose').model('Settings');
var Provider = require('mongoose').model('Provider');
var Trip = require('mongoose').model('Trip');
var Trip_Service = require('mongoose').model('trip_service');
var Trip_Location = require('mongoose').model('trip_location');
var Country = require('mongoose').model('Country');
var City = require('mongoose').model('City');
var Provider_Document = require('mongoose').model('Provider_Document');
var Document = require('mongoose').model('Document');
var Utils = require('../controllers/utils');
var mongoose = require('mongoose');
var Schema = mongoose.Types.ObjectId;
var Provider_Vehicle_Document = require('mongoose').model('Provider_Vehicle_Document');
var Citytype = require('mongoose').model('city_type');
var myProviders = require('./provider');
var console = require('../controllers/console');
var utils = require('../controllers/utils');
exports.provider_register = function (req, res, next) {

    if (typeof req.session.provider == 'undefined') {
        res.redirect('/');
    } else {
        res.redirect('/provider_profiles');
        delete message;

    }
}

exports.provider_register_post = function (req, res, next) {
   
    if (typeof req.session.provider == 'undefined')
    {
        var email = req.body.email;
        if (email != "" && email != undefined) {
            email = ((email).trim()).toLowerCase();
        } else
        {
            email = "";
        }
        req.session.type = "provider";
        Provider.findOne({email:email}).then((provider) => { 

            if (provider) {
                message = admin_messages.error_message_email_already_used;
                
                res.redirect('/');

            } else {
                var code = req.body.country_phone_code;
                var code_name = code.split(' ');
                var country_code = code_name[0];
                var country_name = "";

                for (i = 1; i <= (code_name.length) - 1; i++) {

                    country_name = country_name + " " + code_name[i];
                }

                country_name = country_name.substr(1);
                Provider.findOne({phone: req.body.phone, country_phone_code: country_code}).then((provider) => { 
                    if (provider) {
                        message = admin_messages.error_message_mobile_no_already_used;
                        
                        res.redirect('/');
                    } else {
                        var cityid = req.body.city;
                        City.findById(cityid).then((city) => { 
                            var city = city.cityname;
                            var token = utils.tokenGenerator(32);


                            var first_name = req.body.first_name;
                            first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);

                            var last_name = req.body.last_name;
                            last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);

                            var provider = new Provider({
                                first_name: first_name,
                                last_name: last_name,
                                country_phone_code: country_code,
                                email: email,
                                
                                phone: req.body.phone,
                                service_type: null,
                                car_model: req.body.car_model,
                                car_number: req.body.car_number,
                                device_token: req.body.device_token,
                                device_type: req.body.device_type,
                                bio: req.body.bio,
                                address: req.body.address,
                                zipcode: req.body.zipcode,
                                social_unique_id: req.body.social_unique_id,
                                login_by: req.body.login_by,
                                device_timezone: req.body.device_timezone,
                                city: city,
                                cityid: cityid,
                                country: country_name,
                                social_unique_id: req.body.social_id,
                                token: token,
                                is_available: 1,
                                is_document_uploaded: 0,
                                is_partner_approved_by_admin: 1,
                                is_active: 0,
                                is_approved: 0,
                                rate: 0,
                                rate_count: 0,
                                is_trip: [],
                                admintypeid: null,
                                wallet: 0,
                                bearing: 0,
                                picture: "",
                                provider_type: Number(constant_json.PROVIDER_TYPE_NORMAL),
                                provider_type_id: null,
                                providerLocation: [0, 0],
                                providerPreviousLocation: [0, 0],
                                app_version: req.body.app_version

                            });


                            if (req.body.login_by == 'manual') {
                                var crypto = require('crypto');
                                var password = req.body.password;
                                var hash = crypto.createHash('md5').update(password).digest('hex');
                                provider.password = hash;
                            }
                                /////////// FOR IMAGE /////////

                                var pictureData = req.body.pictureData;
                                if (pictureData != "" && pictureData != undefined) {
                                    var image_name = provider._id + utils.tokenGenerator(4);
                                    var url = utils.getImageFolderPath(req, 2) + image_name + '.jpg';
                                    provider.picture = url;
                                    //utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 2);
                                    pictureData = pictureData.split(',')
                                    pictureData = pictureData[1]
                                    req.body.pictureData = pictureData;
                                    utils.saveImageAndGetURL(image_name, req, res, 2);
                                }


                                ///////////////////////////

                                Country.findOne({countryphonecode: country_code}).then((country) => { 

                                    if (country) {
                                        var country_id = country._id;

                                        Document.find({countryid: country_id, type: 1}).then((document) => { 
                                            //Document.find({country: country_id, type: 1, option:1}, function (err, mandetory_document) {
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


                                                        providerdocument.save().then(() => { 
                                                        }, (err) => {
                                                            console.log(err);
                                                        });
                                                    });

                                                } else {
                                                    is_document_uploaded = 1;
                                                }



                                                provider.is_document_uploaded = is_document_uploaded;
                                                provider.save().then(() => { 
                                                    var email_notification = setting_detail.email_notification;

                                                    if (email_notification == true) {
                                                        allemails.sendProviderRegisterEmail(req, provider, provider.first_name + " " + provider.last_name);
                                                    }

                                                    req.session.provider = provider;
                                                    res.redirect('/provider_document_panel');
                                                }, (err) => {
                                                    utils.error_response(err, res)
                                                });
                                                
                                            });
                                    }

                                });
});


}
});

}

});
}
}

exports.provider_login = function (req, res, next) {

    if (typeof req.session.provider == 'undefined') {
        res.redirect('/');
    } else {
        res.redirect('/provider_profiles');
    }

}

exports.forgot_password = function (req, res, next) {

    if (typeof req.session.provider == 'undefined') {
        res.redirect('/');
    } else {
        res.redirect('/provider_profiles');
    }
}

exports.forgot_psw_email = function (req, res, next) {
    if (typeof req.session.provider == 'undefined') {

        req.session.type = "provider";
        Provider.findOne({email: req.body.email}).then((response) => { 
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
                var link = req.protocol + '://' + req.get('host') + '/provider_newpassword?id=' + id + '&&token=' + token;


                var ejs = require('ejs');

                Utils.mail_notification(response.email, config_json.reset_password, link, '');


                Provider.findOneAndUpdate({_id: id}, {token: token}).then((response) => { 
                    
                    message = admin_messages.success_message_send_link;
                    res.redirect("/provider_login");
                    
                });

            } else {
                message = admin_messages.error_message_email_not_registered;
                res.redirect('/provider_forgot_password');
            }
        });
    } else {
        res.redirect('/provider_profiles');
    }
}

exports.edit_psw = function (req, res) {

    if (typeof req.session.provider == 'undefined') {
        var id = req.query.id;
        var token = req.query.token;
        res.render('provider_new_password', {'id': id, 'token': token});
        delete message;
    } else {
        res.redirect('/provider_profiles');
    }
};

exports.update_psw = function (req, res) {

    if (typeof req.session.provider == 'undefined') {


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

        Provider.findOneAndUpdate(query, {password: hash, token: token}).then((response) => { 

            if (!response) {
                message = admin_messages.error_message_token_expired;
                res.redirect('/provider_forgot_password');
            } else {
                message = admin_messages.success_message_password_update;
                res.redirect('/provider_login');
            }
        });
    } else {
        res.redirect('/provider_profiles');
    }
};

exports.provider_update_documentpanel = function (req, res, next) {

    if (typeof req.session.provider != 'undefined') {
        var pictureData = req.files;
        var j = 0;
        Provider.findOne({_id: req.session.provider._id}).then((provider_detail) => { 
            if (provider_detail) {

                if (pictureData.length > 0 && pictureData != "undefined")
                {
                    for (var i = 0; i < pictureData.length; i++)
                    {
                        Provider_Document.findOne({_id: req.files[i].fieldname, provider_id: req.session.provider._id}).then((providerdocument) => { 
                            if (providerdocument)
                            {

                                utils.deleteImageFromFolder(providerdocument.document_picture, 3);
                                var image_name = providerdocument._id + utils.tokenGenerator(4);
                                var url = utils.getImageFolderPath(req, 3) + image_name + '.jpg';
                                providerdocument.document_picture = url;
                                utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 3);


                                providerdocument.is_uploaded = 1;
                                providerdocument.unique_code = req.body.unique_code;
                                providerdocument.expired_date = req.body.expired_date;
                                providerdocument.is_document_expired = false;
                                providerdocument.save().then((response) => { 
                                }, (err) => {
                                    console.log(err);
                                });

                                j++;
                                if (j == pictureData.length)
                                {
                                    Provider_Document.find({provider_id: req.session.provider._id, option: 1, is_uploaded: 0}).then((document_list) => { 

                                        if (document_list.length == 0)
                                        {
                                            provider_detail.is_document_uploaded = 1;
                                            req.session.provider.is_document_uploaded = 1;
                                            provider_detail.save().then((response) => { 
                                            }, (err) => {
                                                console.log(err);
                                            });
                                            res.redirect('/provider_document_panel');


                                        } else
                                        {
                                            provider_detail.is_document_uploaded = 0;
                                            req.session.provider.is_document_uploaded = 0;
                                            provider_detail.save().then((response) => { 
                                            }, (err) => {
                                                console.log(err);
                                            });
                                            res.redirect('/provider_document_panel');

                                        }
                                    });
                                }


                            } else
                            {
                                res.redirect('/provider_document_panel');

                            }

                        });
                    }
                } else
                {
                    res.redirect('/provider_document_panel');
                }
            } else
            {

                res.redirect('/provider_document_panel');

            }
        });
    } else {
        res.redirect('/provider_login');
    }
}
exports.provider_document_panel = function (req, res, next) {
    if (typeof req.session.provider != 'undefined') {

        Provider_Document.find({provider_id: req.session.provider._id}).then((providerdocument) => { 

            res.render('provider_document_panel', {'data': providerdocument, 'moment': moment});

        });

    } else {
        res.redirect('/provider_profiles');
    }
}
exports.provider_login_post = function (req, res, next) {

    if (typeof req.session.provider == 'undefined') {

        req.session.type = "provider";
        ////// for remove case cencitive ///////
        var email = new RegExp(req.body.email, 'i');
        ////////////////////////////////////////

        Provider.findOne({email: email}).then((provider) => { 

            if (!provider) {
                message = admin_messages.error_message_email_not_registered;
                //res.redirect('/');
                res.render('driver-login-form');
            } else {

                var password = req.body.password;
                var hash = crypto.createHash('md5').update(password).digest('hex');
                if (provider.password != hash) {
                    message = admin_messages.error_message_password_wrong;
                    //res.redirect('/');
                    res.render('driver-login-form');
                } else {
                    if (provider.password != hash) {
                        message = admin_messages.error_message_user_not_approved;
                        //res.redirect('/');
                        res.render('driver-login-form');
                    } else {
                        req.session.provider = provider;
                        //providers=req.session.provider;
                        ////////////  token generate /////

                        message = admin_messages.success_message_login;
                        res.redirect('/provider_profiles');

                    }
                }
            }
        });
    } else {
        res.redirect('/provider_profiles');
    }
};

exports.provider_trip_map = function (req, res, next) {

    if (typeof req.session.provider == 'undefined') {

        res.redirect('/provider_login');
    } else {
        var id = req.body.id;
        var user_name = req.body.u_name;
        var provider_name = req.body.pr_name;
        var query = {};
        query['tripID'] = id;

        Trip.findById(id).then((trips) => { 

            Trip_Location.findOne(query).then((locations) => { 
                var url = "https://maps.googleapis.com/maps/api/js?key=" + setting_detail.web_app_google_key + "&libraries=places&callback=initialize"

                if (!locations) {
                    res.render('provider_trip_map', {'data': trips, 'url': url, 'user_name': user_name, 'provider_name': provider_name, 'moment': moment});

                } else {
                    res.render('provider_trip_map', {'data': trips, 'url': url, 'trip_path_data': locations, 'user_name': user_name, 'provider_name': provider_name, 'moment': moment});
                }
                
            });
            
        });

    }
}

exports.provider_profile = function (req, res) {
    if (typeof req.session.provider != "undefined") {

        if (req.session.provider.is_document_uploaded == 1) {
            callingCountries = require('country-data').callingCountries;
            Provider.findById(req.session.provider._id).then((response) => { 

                Country.findOne({countryname: response.country}).then((country_detail) => { 
                    var is_public_demo = setting_detail.is_public_demo;
                    partners = response;

                    res.render("provider_profile", {country: callingCountries.all, phone_number_min_length: country_detail.phone_number_min_length, phone_number_length: country_detail.phone_number_length, is_public_demo: is_public_demo, login1: response});
                    delete message;
                });
            });
        } else {
            res.redirect('/provider_document_panel');
        }
    } else {
        res.redirect('/provider_login');
    }
};

exports.provider_profile_update = function (req, res) {

    if (typeof req.session.provider != "undefined") {

        var id = req.body.id
        Provider.findOne({phone: req.body.phone, country_phone_code: req.body.country_phone_code, _id: {$ne: id}}).then((provider) => { 
            if (provider)
            {
                message = admin_messages.error_message_mobile_no_already_used;
                res.redirect('/provider_profiles')
            } else
            {
                Provider.findById(id).then((provider_detail) => { 

                    var password = req.body.old_password;
                    var hash = crypto.createHash('md5').update(password).digest('hex');
                    if (provider_detail.password == hash)
                    {
                        var picture = req.body.pictureData;
                        if (picture != "")
                        {
                            utils.deleteImageFromFolder(provider_detail.picture, 2);
                            var image_name = provider_detail._id + utils.tokenGenerator(4);
                            var url = utils.getImageFolderPath(req, 2) + image_name + '.jpg';
                            req.body.picture = url;
                            file_data_path = url;
                            //utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 1);
                            picture = picture.split(',')
                            picture = picture[1]
                            req.body.pictureData = picture;

                            utils.saveImageAndGetURL(image_name, req, res, 2);

                            Provider.findByIdAndUpdate(id, req.body, {new : true}, function (err, provider) {
                                message = admin_messages.success_message_profile_update;
                                req.session.provider = provider;
                                res.redirect('/provider_profiles')
                            });
                        } else
                        {
                            Provider.findByIdAndUpdate(id, req.body, {new : true}, function (err, provider) {
                                message = admin_messages.success_message_profile_update;
                                req.session.provider = provider;
                                res.redirect('/provider_profiles')
                            });
                        }



                    } else
                    {
                        message = admin_messages.error_message_password_wrong;
                        res.redirect('/provider_profiles')
                    }

                })
            }
        })
    } else {

        res.redirect('/provider_login');
    }
}


exports.provider_sign_out = function (req, res, next) {
    // req.session.destroy(function (err, data) {
    //        if (err) {
    //            console.error(err);
    //        } else {
        req.session.type = "provider";
        delete req.session.provider;
        res.redirect('/provider_login');
    //}
    //});
};



exports.provider_social_login_web = function (req, res, next) {

    Provider.findOne({social_unique_id: req.body.social_unique_id}).then((provider) => { 

        if (provider)
        {
            var token = utils.tokenGenerator(32);
            provider.token = token;

            provider.device_type = req.body.device_type;
            provider.login_by = req.body.login_by;

            var device_token = "";
            var device_type = "";
            if (provider.device_token != "" && provider.device_token != req.body.device_token) {
                device_token = provider.device_token;
                device_type = provider.device_type;
            }
            provider.save().then(() => { 

                if (device_token != "") {
                    utils.sendPushNotification(constant_json.USER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_USER_LOGIN_IN_OTHER_DEVICE, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                }
                req.session.provider = provider;
                message = admin_messages.success_message_login;
                
            }, (err) => {
                console.log(err);
            });
        } else
        {
            message = admin_messages.error_message_email_not_registered;
            res.json({success: false})
        }
    })
}

exports.provider_vehicle = function (req, res) {

    if (typeof req.session.provider != 'undefined') {


        var condition = {$match: {"_id": Schema(req.session.provider._id)}};
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
            _id: "$vehicle_detail._id",
            provider_id: "$_id",
            type_image_url: '$type_detail.type_image_url',
            typename: '$type_detail.typename',
            accessibility: "$vehicle_detail.accessibility"
            
        }}
    }
}
Provider.aggregate([condition, vunwind, lookup, unwind, group]).then((provider) => { 
    if (provider.length == 0) {
        res.render('provider_vehicle', {vehicle_list: []})
    } else {
        res.render('provider_vehicle', {vehicle_list: provider[0].vehicle_detail})
    }
    delete message;
}, (err) => {
    utils.error_response(err, res)
})
} else {
    res.redirect('/provider_login');
}
};


exports.edit_vehicle_detail = function (req, res) {
    var vehicle_accesibility = VEHICLE_ACCESIBILITY;
    if (typeof req.session.provider != 'undefined') {
        Provider.findOne({_id: req.body.provider_id}).then((provider) => { 

            var index = provider.vehicle_detail.findIndex(x => (x._id).toString() == req.body.vehicle_id);

            Provider_Vehicle_Document.find({provider_id: req.body.provider_id, vehicle_id: req.body.vehicle_id}).then((provider_vehicle_document) => { 

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

                var cityid_condition = {$match: {'cityid': {$eq: Schema(provider.cityid)}}};

                Citytype.aggregate([cityid_condition, lookup, unwind]).then((type_available) => { 

                    res.render('provider_edit_vehicle_detail', {provider_id: req.body.provider_id, vehicle_accesibility: vehicle_accesibility, type_available: type_available, provider_vehicle_document: provider_vehicle_document, vehicle_detail: provider.vehicle_detail[index]})
                    delete message;
                }, (err) => {
                    utils.error_response(err, res)
                });

            })
        })

    } else {
        res.redirect('/provider_login');
    }
};

exports.update_vehicle_detail = function (req, res, next) {

    if (typeof req.session.provider != 'undefined') {

        Provider.findOne({_id: req.body.provider_id}).then((provider) => { 

            var index = provider.vehicle_detail.findIndex(x => (x._id).toString() == req.body.vehicle_id);


            provider.vehicle_detail[index].name = req.body.name;
            provider.vehicle_detail[index].plate_no = req.body.plate_no;
            provider.vehicle_detail[index].model = req.body.model;
            provider.vehicle_detail[index].color = req.body.color;
            provider.vehicle_detail[index].passing_year = req.body.passing_year;
            provider.vehicle_detail[index].accessibility = req.body.accessibility;


            Provider.findOneAndUpdate({_id: req.body.provider_id}, {vehicle_detail: provider.vehicle_detail}, {new : true}).then((provider) => { 

                // res.redirect('/approved_providers')
                message = admin_messages.success_update_vehicle_detail;
                res.redirect('/provider_vehicle');

            })
        });
    } else {
        res.redirect('/provider_login');
    }
};

exports.provider_add_vehicle = function (req, res) {
    var vehicle_accesibility = VEHICLE_ACCESIBILITY;

    if (typeof req.session.provider != 'undefined') {
        res.render('provider_edit_vehicle_detail', {provider_id: req.session.provider._id, vehicle_accesibility: vehicle_accesibility})
    } else {
        res.redirect('/provider_login');
    }
};

exports.provider_add_vehicle_details = function (req, res) {

    if (typeof req.session.provider != 'undefined') {

        Provider.findOne({_id: req.body.provider_id}).then((provider) => { 

            var is_selected = false;
            if (provider.vehicle_detail.length == 0) {
                is_selected = true;
            }
            if (provider.vehicle_detail.length == 0) {
                provider.service_type = null;
                provider.admintypeid = null;
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
                is_selected: is_selected,
                is_document_uploaded: false
            }
            
            // provider.save().then(() => { 
            // }, (err) => {
            //     console.log(err);
            // });

            var files = req.files;
            Country.findOne({countryname: provider.country}).then((country) => { 

                Document.find({countryid: country._id, type: 2}).then((document) => { 

                    if (document.length == 0) {
                        provider.is_vehicle_document_uploaded = true;
                        vehicel_json.is_document_uploaded = true;
                        provider.vehicle_detail.push(vehicel_json);
                        provider.save();
                        message = admin_messages.success_add_vehicle_detail;
                        res.redirect('/provider_vehicle');
                    } else {

                        var is_document_uploaded = false;
                        var document_size = document.length;

                        var count = 0;
                        for (var i = 0; i < document_size; i++) {

                            if (document[i].option == 0) {
                                count++;
                            } else {
                                break;
                            }
                            if (count == document_size) {
                                is_document_uploaded = true;
                            }
                        }
                        vehicel_json.is_document_uploaded = is_document_uploaded;
                        provider.vehicle_detail.push(vehicel_json);
                        provider.save();
                        
                        document.forEach(function (entry, index) {
                            var providervehicledocument = new Provider_Vehicle_Document({

                                vehicle_id: x,
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
                            providervehicledocument.save().then(() => { 
                                if (index == document.length - 1) {
                                    message = admin_messages.success_add_vehicle_detail;
                                    res.redirect('/provider_vehicle');
                                }
                            }, (err) => {
                                utils.error_response(err, res)
                            });
                        });
                    }
                });
            });
        });
    } else {
        res.redirect('/provider_login');
    }
};


exports.vehicle_document_list = function (req, res) {

    if (typeof req.session.provider != 'undefined') {
        Provider_Vehicle_Document.find({provider_id: req.body.provider_id, vehicle_id: req.body.vehicle_id}).then((provider_vehicle_document) => { 

            res.render('provider_vehicle_document_list', {provider_id: req.body.provider_id, vehicle_id: req.body.vehicle_id, moment: moment, detail: provider_vehicle_document})
            delete message;
        });
    } else {
        res.redirect('/provider_login');
    }
};

exports.provider_vehicle_documents_edit = function (req, res) {

    if (typeof req.session.provider != 'undefined') {

        Provider_Vehicle_Document.findById(req.body.id).then((provider_document) => { 
            
            res.render('provider_vehicle_documents_edit', {detail: provider_document, moment: moment});
            delete message;
            
        });
    } else {
        res.redirect('/provider_login');
    }
};

exports.provider_vehicle_documents_update = function (req, res) {

    if (typeof req.session.provider != 'undefined') {
        Provider_Vehicle_Document.findById(req.body.id).then((provider_document) => { 
         
            var id = provider_document.provider_id;

            provider_document.expired_date = req.body.expired_date;
            provider_document.unique_code = req.body.unique_code;

            message = admin_messages.success_update_document;
            if (req.files.length > 0)
            {
                var image_name = provider_document.provider_id + utils.tokenGenerator(4);
                var url = utils.getImageFolderPath(req, 3) + image_name + '.jpg';
                utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 3);

                provider_document.document_picture = url;
                provider_document.is_uploaded = 1;
                provider_document.save().then(() => { 
                    req.body = {provider_id: provider_document.provider_id, vehicle_id: provider_document.vehicle_id}
                    myProviders.vehicle_document_list(req, res);
                }, (err) => {
                    utils.error_response(err, res)
                });
            } else {
                provider_document.save().then(() => { 
                    req.body = {provider_id: provider_document.provider_id, vehicle_id: provider_document.vehicle_id}
                    myProviders.vehicle_document_list(req, res);
                }, (err) => {
                    utils.error_response(err, res)

                });

            }
            
        });
    } else {
        res.redirect('/provider_login');
    }
}; 


exports.provider_documents_edit = function (req, res) {

    if (typeof req.session.provider != 'undefined') {

        Provider_Document.findById(req.body.id).then((provider_document) => { 
         
            res.render('provider_documents_edit', {detail: provider_document, moment: moment});
            delete message;
            
        });
    } else {
        res.redirect('/provider_login');
    }
};

exports.provider_documents_update = function (req, res) {

    if (typeof req.session.provider != 'undefined') {
        Provider_Document.findById(req.body.id).then((provider_document) => { 
         
            var id = provider_document.provider_id;

            provider_document.expired_date = req.body.expired_date;
            provider_document.unique_code = req.body.unique_code;

            message = admin_messages.success_update_document;
            if (req.files.length > 0)
            {
                var image_name = provider_document.provider_id + utils.tokenGenerator(4);
                var url = utils.getImageFolderPath(req, 3) + image_name + '.jpg';
                utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 3);

                provider_document.document_picture = url;
                provider_document.is_uploaded = 1;
                provider_document.save(function (err, save) {
                    res.redirect('/provider_document_panel');
                    delete message;
                }, (err) => {
                    utils.error_response(err, res)
                });
            } else {
                provider_document.save(function (err, save) {
                    res.redirect('/provider_document_panel');
                    delete message;
                }, (err) => {
                    utils.error_response(err, res)
                });

            }
            
        });
    } else {
        res.redirect('/provider_login');
    }
}; 