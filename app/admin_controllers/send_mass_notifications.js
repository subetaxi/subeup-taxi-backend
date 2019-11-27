var User = require('mongoose').model('User');
var Trip = require('mongoose').model('Trip');
var Provider = require('mongoose').model('Provider');
var Country = require('mongoose').model('Country');
var utils = require('../controllers/utils');
var console = require('../controllers/console');
var City = require('mongoose').model('City');
var Type = require('mongoose').model('Type');
var Providers = require('mongoose').model('Provider');
var utils = require('../controllers/utils');

exports.sms_notification = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        Country.find({}).then((country) => { 
            User.find({}).then((user_detail) => { 
                res.render('send_mass_notification', {country: country, user_detail: user_detail});
                delete message;
            });
        })
    } else {
        res.redirect('/admin');
    }
};

exports.fetch_user_list = function (req, res) {
    var country = req.body.country;
    var query = {};
    if (country != 'all') {
        query['country'] = country;
    }
    if (typeof req.session.userid != 'undefined') {
        User.find(query).then((user_detail) => { 
                res.json({user_detail: user_detail});
        });
    } else {
        res.redirect('/admin');
    }
};


exports.send_mass_notification = function (req, res) {
    var b = req.body.mass_notification_list.map(function(item) {
        return parseInt(item, 10);
    });
    var i = 1;
    var array_android =[];
    var array_ios =[];
    var array =[];
   // for (var index in req.body.mass_notification_list) {
            if (req.body.type == 'user') {
                var device_type = { $match : { 'device_type' : "android" } };
                var condition = { $match : { 'unique_id' : { $in: b } } };
                var device_token = { $match : { 'device_token' : { $ne: '' } } };
                User.aggregate([condition , device_type , device_token, {$project:{a:'$device_token'}},
                                                {$unwind:'$a'},
                                            {$group:{_id:'a', device_token:{$addToSet:'$a'}}}]).then((user_list) => { 
                        
                        if(user_list.length == 0)
                        {

                            var device_type = { $match : { 'device_type' : "ios" } };
                            User.aggregate([condition, device_type , device_token, {$project:{a:'$device_token'}},
                                                            {$unwind:'$a'},
                                                        {$group:{_id:'a', device_token:{$addToSet:'$a'}}}]).then((user_list) => { 
                                        
                                        if(user_list.length == 0)
                                        {
                                             res.redirect('/send_mass_notification');
                                        }
                                        else
                                        {
                                           
                                            var split_val = 10;
                                            array_ios = user_list[0].device_token
                                            var size = Math.ceil(array_ios.length/split_val);

                                            for (i = 0; i <= size-1; i++) {
                                                if(i==size-1)
                                                {
                                                    array = array_ios.slice(i*split_val , array_ios.length) 
                                                    utils.sendMassPushNotification(constant_json.USER_UNIQUE_NUMBER, 'ios', array, req.body.message, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                                    res.redirect('/send_mass_notification');
                                                } else {
                                                    array = array_ios.slice(i*split_val , i*split_val + split_val) 
                                                    utils.sendMassPushNotification(constant_json.USER_UNIQUE_NUMBER, 'ios', array, req.body.message, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                                }
                                            }
                                        }  
                            }, (err) => {
                                console.log(err);
                            })   
                        } 
                        else
                        {
                            var split_val = 50;
                            array_android = user_list[0].device_token
                            
                            var size = Math.ceil(array_android.length/split_val);
                            for (i = 0; i <= size-1; i++) {
                                if(i==size-1)
                                {
                                    array = array_android.slice(i*split_val , array_android.length) 
                                 
                                    utils.sendMassPushNotification(constant_json.USER_UNIQUE_NUMBER, 'android', array, req.body.message, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);

                                    var device_type = { $match : { 'device_type' : "ios" } };
                                    User.aggregate([condition, device_type , device_token, {$project:{a:'$device_token'}},
                                                                    {$unwind:'$a'},
                                                                {$group:{_id:'a', device_token:{$addToSet:'$a'}}}]).then((user_list) => { 
                                                
                                                if(user_list.length == 0)
                                                {
                                                     res.redirect('/send_mass_notification');
                                                }
                                                else
                                                {
                                                    var split_val = 10;
                                                    array_ios = user_list[0].device_token
                                                    var size = Math.ceil(array_ios.length/split_val);

                                                    for (i = 0; i <= size-1; i++) {
                                                        if(i==size-1)
                                                        {
                                                            array = array_ios.slice(i*split_val , array_ios.length) 
                                                            utils.sendMassPushNotification(constant_json.USER_UNIQUE_NUMBER, 'ios', array, req.body.message, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                                            res.redirect('/send_mass_notification');
                                                        } else {
                                                            array = array_ios.slice(i*split_val , i*split_val + split_val) 
                                                            utils.sendMassPushNotification(constant_json.USER_UNIQUE_NUMBER, 'ios', array, req.body.message, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                                        }
                                                    }
                                                }
                                    }, (err) => {
                                        console.log(err);
                                    })     
                                } else {
                                    array = array_android.slice(i*split_val , i*split_val + split_val) 
                                 
                                    utils.sendMassPushNotification(constant_json.USER_UNIQUE_NUMBER, 'android', array, req.body.message, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                }
                            }  
                        }
                }, (err) => {
                    console.log(err);
                })
            } 
            else {

                var device_type = { $match : { 'device_type' : "android" } };
                var condition = { $match : { 'unique_id' : { $in: b } } };
                var device_token = { $match : { 'device_token' : { $ne: '' } } };
                Provider.aggregate([condition , device_type , device_token, {$project:{a:'$device_token'}},
                                                {$unwind:'$a'},
                                            {$group:{_id:'a', device_token:{$addToSet:'$a'}}}]).then((provider_list) => { 
                            
                            
                            if(provider_list.length == 0)
                            {
                                var device_type = { $match : { 'device_type' : "ios" } };
                                Provider.aggregate([condition, device_type , device_token, {$project:{a:'$device_token'}},
                                                                {$unwind:'$a'},
                                                            {$group:{_id:'a', device_token:{$addToSet:'$a'}}}]).then((provider_list) => { 
                                            
                                        if(provider_list.length == 0)
                                        {
                                            res.redirect('/send_mass_notification');
                                        }  
                                        else
                                        {
                                            var split_val = 10;
                                            array_ios = provider_list[0].device_token
                                            var size = Math.ceil(array_ios.length/split_val);

                                            for (i = 0; i <= size-1; i++) {
                                                if(i==size-1)
                                                {
                                                    array = array_ios.slice(i*split_val , array_ios.length) 
                                                    utils.sendMassPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, 'ios', array, req.body.message, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                                    res.redirect('/send_mass_notification');
                                                } else {
                                                    array = array_ios.slice(i*split_val , i*split_val + split_val) 
                                                    utils.sendMassPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, 'ios', array, req.body.message, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                                }
                                            }
                                        } 
                                }, (err) => {
                                    console.log(err);
                                })     
                            }  
                            else
                            {
                                
                                var split_val = 50;
                                array_android = provider_list[0].device_token
                                
                                var size = Math.ceil(array_android.length/split_val);
                             
                                for (i = 0; i <= size-1; i++) {
                                    if(i==size-1)
                                    {
                                        array = array_android.slice(i*split_val , array_android.length) 
                                        utils.sendMassPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, 'android', array, req.body.message, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);

                                        var device_type = { $match : { 'device_type' : "ios" } };
                                        Provider.aggregate([condition, device_type , device_token, {$project:{a:'$device_token'}},
                                                                        {$unwind:'$a'},
                                                                    {$group:{_id:'a', device_token:{$addToSet:'$a'}}}]).then((provider_list) => { 
                                                    
                                                if(provider_list.length == 0)
                                                {
                                                    res.redirect('/send_mass_notification');
                                                }  
                                                else
                                                {
                                                    var split_val = 10;
                                                    array_ios = provider_list[0].device_token
                                                    var size = Math.ceil(array_ios.length/split_val);

                                                    for (i = 0; i <= size-1; i++) {
                                                        if(i==size-1)
                                                        {
                                                            array = array_ios.slice(i*split_val , array_ios.length) 
                                                            utils.sendMassPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, 'ios', array, req.body.message, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                                            res.redirect('/send_mass_notification');
                                                        } else {
                                                            array = array_ios.slice(i*split_val , i*split_val + split_val) 
                                                            utils.sendMassPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, 'ios', array, req.body.message, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                                        }
                                                    }
                                                } 
                                        }, (err) => {
                                            console.log(err);
                                        })     
                                    } else {
                                        array = array_android.slice(i*split_val , i*split_val + split_val) 
                                        utils.sendMassPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, 'android', array, req.body.message, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                    }
                                } 
                            }
                }, (err) => {
                    console.log(err);
                })
            }
    //}

};

exports.send_mass_notification_old = function (req, res) {

    var i = 1;
    for (var index in req.body.payment_gateway) {
        if (req.body.payment_gateway[index] != 'all') {
            if (req.body.type == 'user') {
                if (i == req.body.payment_gateway.length - 1) {
                    User.findById(req.body.payment_gateway[index], function (err, user_detail) {

                        var device_token = user_detail.device_token;
                        var device_type = user_detail.device_type;
                        utils.sendPushNotification(constant_json.USER_UNIQUE_NUMBER, device_type, device_token, req.body.message, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);

                    });
                    res.redirect('/send_mass_notification');
                } else {

                    i++;

                    User.findById(req.body.payment_gateway[index], function (err, user_detail) {

                        var device_token = user_detail.device_token;
                        var device_type = user_detail.device_type;
                        utils.sendPushNotification(constant_json.USER_UNIQUE_NUMBER, device_type, device_token, req.body.message, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);

                    });
                }

            } else {


                if (i == req.body.payment_gateway.length - 1) {
                    Provider.findById(req.body.payment_gateway[index], function (err, provider_detail) {

                        var device_token = provider_detail.device_token;
                        var device_type = provider_detail.device_type;
                        utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, device_type, device_token, req.body.message, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);

                    });
                    res.redirect('/send_mass_notification');
                } else {
                    i++;
                    Provider.findById(req.body.payment_gateway[index], function (err, provider_detail) {

                        var device_token = provider_detail.device_token;
                        var device_type = provider_detail.device_type;
                        utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, device_type, device_token, req.body.message, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);

                    });
                }
            }
        }
    }

};

exports.fetch_providers_list = function (req, res) {
    var country = req.body.country;

    var query = {};
    if (country != 'all') {
        query['country'] = country;
    }

    if (typeof req.session.userid != 'undefined') {

        Provider.find(query).then((provider_detail) => { 
                res.json({provider_detail: provider_detail});
            
        });


    } else {
        res.redirect('/admin');
    }
};