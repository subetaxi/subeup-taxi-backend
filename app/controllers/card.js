var utils = require('./utils');
var Card = require('mongoose').model('Card');
var User = require('mongoose').model('User');
var Trip = require('mongoose').model('Trip');
var Country = require('mongoose').model('Country');
var Provider = require('mongoose').model('Provider');
var Settings = require('mongoose').model('Settings');
var utils = require('./utils');
var myTrips = require('./trip');
//// ADD CARD USING POST SERVICE ///// 
exports.add_card = function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'},{name: 'payment_token', type: 'string'},
        {name: 'token', type: 'string'},{name: 'last_four', type: 'string'},
        {name: 'card_type', type: 'string'}], function (response) {
        if (response.success) {
            var type = Number(req.body.type);
            switch (type) {
                case Number(constant_json.USER_UNIQUE_NUMBER):
                type = Number(constant_json.USER_UNIQUE_NUMBER);
                Table = User;
                break;
                case Number(constant_json.PROVIDER_UNIQUE_NUMBER):
                type = Number(constant_json.PROVIDER_UNIQUE_NUMBER);
                Table = Provider;
                break;
                default:
                type = Number(constant_json.USER_UNIQUE_NUMBER);
                Table = User;
                break;
            }

            Table.findOne({_id: req.body.user_id}).then((detail) => { 

                
                    var stripe_secret_key = setting_detail.stripe_secret_key;
                    var email = detail.email;
                    var stripe = require("stripe")(stripe_secret_key);
                    var payment_token = req.body.payment_token;
                    var customer = stripe.customers.create({
                        description: detail.email,
                        source: payment_token // obtained with Stripe.js

                    }, function (err, customer) {
                        if (!customer) {
                            res.json({success: false, error_code: error_message.ERROR_CODE_FOR_ENTER_VALID_PAYMENT_TOKEN});
                        } else {

                            Card.find({user_id: req.body.user_id, $or :  [{type: type}, { type: {$exists: false} }]}).then((card_data) => { 

                                var customer_id = customer.id;
                                var card = new Card({
                                    payment_id: req.body.payment_id,
                                    user_id: req.body.user_id,
                                    token: req.body.token,
                                    last_four: req.body.last_four,
                                    payment_token: req.body.payment_token,
                                    card_type: req.body.card_type,
                                    customer_id: customer_id,
                                    type: type,
                                    is_default: constant_json.YES
                                });
                                if (card_data.length > 0) {
                                    Card.findOneAndUpdate({user_id: req.body.user_id, $or :  [{type: type}, { type: {$exists: false} }], is_default: constant_json.YES}, {is_default: constant_json.NO}).then((card_data) => { 

                                    });
                                }
                                card.save().then(() => { 
                                    res.json({
                                        success: true,
                                        message: success_messages.MESSAGE_CODE_YOUR_CARD_ADDED_SUCCESSFULLY,
                                        _id: card._id,
                                        customer_id: customer_id,
                                        payment_token: card.payment_token,
                                        user_id: card.user_id,
                                        last_four: card.last_four,
                                        card_type: card.card_type,
                                        is_default: card.is_default,
                                        payment_id: card.payment_id,
                                        type: card.type

                                    });
                                }, (err) => {
                                    console.log(err)
                                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                                });

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
//// LIST OF INDIVIDUAL USER  CARD SERVICE ////
exports.card_list = function (req, res) {
    
    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            var type = Number(req.body.type);
            switch (type) {
                case Number(constant_json.USER_UNIQUE_NUMBER):
                type = Number(constant_json.USER_UNIQUE_NUMBER);
                Table = User;
                break;
                case Number(constant_json.PROVIDER_UNIQUE_NUMBER):
                type = Number(constant_json.PROVIDER_UNIQUE_NUMBER);
                Table = Provider;
                break;
                default:
                type = Number(constant_json.USER_UNIQUE_NUMBER);
                Table = User;
                break;
            }

            Table.findOne({_id: req.body.user_id}).then((detail) => { 
                if (!detail) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_FOR_PORBLEM_IN_FETCHIN_CARD}); // 
                } else {

                    var query = {};
                    
                    query = {$or:[{user_id: req.body.user_id, type: type},{user_id: req.body.user_id, type: {$exists: false}}]};
                    
                    Card.find(query).then((card) => { 
                        var PAYMENT_TYPES = utils.PAYMENT_TYPES();
                        var wallet = 0;
                        var wallet_currency_code = "";
                        var is_use_wallet = false;
                        try {
                            wallet = detail.wallet;
                            wallet_currency_code = detail.wallet_currency_code;
                            is_use_wallet = detail.is_use_wallet;
                        } catch (error) {
                            console.error(error);

                        }
                        if (type == Number(constant_json.USER_UNIQUE_NUMBER)) {
                            res.json({
                                success: true,
                                message: success_messages.MESSAGE_CODE_GET_ALL_CARD_SUCCESSFULLY,
                                wallet: wallet,
                                wallet_currency_code: wallet_currency_code,
                                is_use_wallet: is_use_wallet,
                                payment_gateway: PAYMENT_TYPES,
                                card: card
                            });
                        } else
                        {
                            res.json({
                                success: true,
                                message: success_messages.MESSAGE_CODE_GET_ALL_CARD_SUCCESSFULLY,
                                wallet: wallet,
                                wallet_currency_code: wallet_currency_code,
                                payment_gateway: PAYMENT_TYPES,
                                card: card
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


exports.delete_card = function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'},{name: 'card_id', type: 'string'},
        {name: 'token', type: 'string'}], function (response) {
        if (response.success) {
            var type = Number(req.body.type);
            switch (type) {
                case Number(constant_json.USER_UNIQUE_NUMBER):
                type = Number(constant_json.USER_UNIQUE_NUMBER);
                Table = User;
                break;
                case Number(constant_json.PROVIDER_UNIQUE_NUMBER):
                type = Number(constant_json.PROVIDER_UNIQUE_NUMBER);
                Table = Provider;
                break;
                default:
                type = Number(constant_json.USER_UNIQUE_NUMBER);
                Table = User;
                break;
            }
            Table.findOne({_id: req.body.user_id}).then((detail) => { 
                if (detail) {
                    if (req.body.token !== null && detail.token !== req.body.token)
                    {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else
                    {
                        if (type == Number(constant_json.USER_UNIQUE_NUMBER)) {
                            var query = {$or:[{_id :detail.current_trip_id ,payment_mode:Number(constant_json.PAYMENT_MODE_CARD)},{user_id: detail._id, is_pending_payments: 1 }]};
                            
                            Trip.find(query).then((trips) => { 

                                if (trips.length > 0) {
                                    res.json({success: false, error_code: error_message.ERROR_CODE_YOUR_TRIP_PAYMENT_IS_PENDING});
                                } else {
                                    Card.remove({_id: req.body.card_id, $or :  [{type: type}, { type: {$exists: false} }], user_id: req.body.user_id}).then(() => { 
                                        
                                            res.json({success: true, message: success_messages.MESSAGE_CODE_YOUR_CARD_DELETED_SUCCESSFULLY});
                                        
                                    });
                                }
                            });
                        } else
                        {
                            Card.remove({_id: req.body.card_id, $or :  [{type: type}, { type: {$exists: false} }], user_id: req.body.user_id}).then(() => { 
                                
                                    res.json({success: true, message: success_messages.MESSAGE_CODE_YOUR_CARD_DELETED_SUCCESSFULLY});
                                
                            });
                        }
                    }
                } else
                {
                    res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});
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


////////////// CARD SELECTION  //////////////
exports.card_selection = function (req, res) {

    utils.check_request_params(req.body, [{name: 'card_id', type: 'string'}], function (response) {
        if (response.success) {
            var type = Number(req.body.type);
            switch (type) {
                case Number(constant_json.USER_UNIQUE_NUMBER):
                type = Number(constant_json.USER_UNIQUE_NUMBER);
                break;
                case Number(constant_json.PROVIDER_UNIQUE_NUMBER):
                type = Number(constant_json.PROVIDER_UNIQUE_NUMBER);
                break;
                default:
                type = Number(constant_json.USER_UNIQUE_NUMBER);
                break;
            }

            Card.findOne({_id: req.body.card_id, $or :  [{type: type}, { type: {$exists: false} }], user_id: req.body.user_id}).then((card) => { 

                if (!card) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_CARD_NOT_FOUND});
                } else {
                    card.is_default = constant_json.YES;
                    card.save().then(() => { 

                        Card.findOneAndUpdate({_id: {$nin: req.body.card_id}, $or :  [{type: type}, { type: {$exists: false} }], user_id: req.body.user_id, is_default: constant_json.YES}, {is_default: constant_json.NO}).then((card) => { 
                            
                            
                            res.json({success: true, message: success_messages.MESSAGE_CODE_YOUR_GET_YOUR_SELECTED_CARD, card: card});
                            
                        });
                    }, (err) => {
                        console.log(err)
                        res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
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
////////////// CARD DE SELECTION  //////////////
exports.card_deselect = function (req, res) {

    utils.check_request_params(req.body, [{name: 'card_id', type: 'string'}], function (response) {
        if (response.success) {
            Card.findOne({_id: req.body.card_id, user_id: req.body.user_id}).then((card) => { 

                if (!card) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_CARD_NOT_FOUND});
                } else {

                    card.is_default = constant_json.NO;
                    card.save().then(() => { 
                        res.json({
                            success: true, message: success_messages.MESSAGE_CODE_YOUR_CARD_DESELECTED, card: card
                        });
                    }, (err) => {
                        console.log(err)
                        res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
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

/////////////// USER CHANGE PAYMENT TYPE  
exports.change_paymenttype = function (req, res) {

    utils.check_request_params(req.body, [{name: 'trip_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}).then((user) => { 
                if (user)
                {
                    if (req.body.token != null && user.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else
                    {
                        var payment_type = req.body.payment_type;
                        var trip_id = req.body.trip_id;
                        if (payment_type == Number(constant_json.PAYMENT_MODE_CARD)) {
                            Trip.findOne({_id: req.body.trip_id}).then((trip) => { 
                                var user_id = trip.user_id;
                                if(trip.trip_type == constant_json.TRIP_TYPE_CORPORATE){
                                    user_id = trip.user_type_id;
                                }
                                Card.find({user_id: user_id}).then((card) => { 

                                    if (card.length == 0) {
                                        res.json({success: false, error_code: error_message.ERROR_CODE_ADD_CREDIT_CARD_FIRST});
                                    } else {


                                            trip.payment_mode = req.body.payment_type;
                                            trip.save();
                                            Provider.findOne({_id: trip.confirmed_provider}).then((provider) => { 

                                                var device_token = provider.device_token;
                                                var device_type = provider.device_type;
                                                utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_PAYMENT_MODE_CARD, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                                myTrips.trip_detail_notify(res, trip._id);
                                                res.json({success: true, message: success_messages.MESSAGE_CODE_YOUR_PAYMEMT_MODE_CHANGE_SUCCESSFULLY});
                                            });
                                    }
                                });

                            });
                        } else {
                            Trip.findOne({_id: req.body.trip_id}).then((trip) => { 
                                trip.payment_mode = req.body.payment_type;
                                trip.save();
                                Provider.findOne({_id: trip.confirmed_provider}).then((provider) => { 
                                    var device_token = provider.device_token;
                                    var device_type = provider.device_type;
                                    utils.sendPushNotification(constant_json.PROVIDER_UNIQUE_NUMBER, device_type, device_token, push_messages.PUSH_CODE_FOR_PAYMENT_MODE_CASH, constant_json.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                    myTrips.trip_detail_notify(res, trip._id);
                                    res.json({success: true, message: success_messages.MESSAGE_CODE_YOUR_PAYMEMT_MODE_CHANGE_SUCCESSFULLY});
                                });
                            });
                        }
                    }
                } else
                {
                    res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});
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