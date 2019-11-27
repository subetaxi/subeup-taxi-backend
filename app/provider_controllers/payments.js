var User = require('mongoose').model('User');
var crypto = require('crypto');
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
var Card = require('mongoose').model('Card');
var console = require('../controllers/console');
var utils = require('../controllers/utils');

exports.provider_payments = function (req, res, next) {
    if (typeof req.session.provider != "undefined")
    {
        Card.find({user_id: req.session.provider._id, is_default: 1}).then((card) => { 
            Provider.findOne({_id: req.session.provider._id}).then((provider_detail) => { 
                Card.find({user_id: req.session.provider._id, is_default: 0}).then((cards) => { 
                    
                   
                    res.render("provider_payments", {Selected_card: card, provider_detail: provider_detail, provider_id: req.session.provider._id, Other_card: cards, stripe_public_key: setting_detail.stripe_publishable_key});
                    delete message;
                });
            });
        });
    } else
    {
        res.redirect('/login');
    }

}

exports.check_card = function (req, res) {
    Card.find({user_id: req.body.user_id}).then((card) => { 
        if (card.length == 0) {
            res.json({success: false});
        } else {
            res.json({success: true});
        }
    });
}

exports.card_type = function (req, res) {
    if (typeof req.session.provider != "undefined")
    {
        var Card_number = req.body.Card_number;
        Card_number = Card_number.replace(/ /g, '')
        var creditCardType = require('credit-card-type');
        var visaCards = creditCardType(Card_number);
        res.json(visaCards[0]);
    } else
    {
        res.redirect('/login');
    }
}

exports.add_card = function (req, res) {
    if (typeof req.session.provider != "undefined")
    {
        Provider.findOne({_id: req.session.provider._id}).then((user) => { 

            
            var stripe_secret_key = setting_detail.stripe_secret_key;
            var email = user.email;
            var stripe = require("stripe")(stripe_secret_key);
            var payment_token = req.body.payment_token;
            var customer = stripe.customers.create({
                description: user.email,
                        source: payment_token // obtained with Stripe.js

                    }, function (err, customer) {
                        if (!customer) {
                            res.json({success: false, error_code: error_message.ERROR_CODE_FOR_ENTER_VALID_PAYMENT_TOKEN});
                        } else {

                            Card.find({user_id: req.session.provider._id}).then((card_data) => { 
                             

                                var customer_id = customer.id;
                                var card = new Card({
                                    payment_id: req.body.payment_id,
                                    user_id: req.session.provider._id,
                                    token: req.body.token,
                                    last_four: req.body.last_four,
                                    type: req.body.type,
                                    payment_token: payment_token,
                                    card_type: req.body.card_type,
                                    customer_id: customer_id
                                });
                                if (card_data.length > 0) {
                                    card.is_default = constant_json.NO;
                                } else {
                                    card.is_default = constant_json.YES;
                                }
                                card.save().then(() => { 
                                    message = admin_messages.success_message_add_card;
                                    res.redirect('/provider_payments');
                                }, (err) => {
                                    utils.error_response(err, res)
                                });
                                
                            });
                        }

                    });
            
        });
    } else
    {
        res.redirect('/login');
    }
};



exports.delete_card = function (req, res) {

    if (typeof req.session.provider != "undefined")
    {
        Card.remove({_id: req.body.card_id, user_id: req.session.provider._id}).then(() => { 
            if (req.body.is_default == 1)
            {
                Card.findOneAndUpdate({user_id: req.session.provider._id}, {is_default: constant_json.YES}, function (err, card) {

                })
            }
            res.json({success: true});
            
        });

    } else
    {
        res.redirect('/login');
    }
};

exports.card_selection = function (req, res) {
    if (typeof req.session.provider != "undefined")
    {
        Card.findOneAndUpdate({_id: req.body.card_id, user_id: req.session.provider._id}, {is_default: constant_json.YES}).then((card) => { 

            Card.findOneAndUpdate({_id: {$nin: req.body.card_id}, user_id: req.session.provider._id, is_default: constant_json.YES}, {is_default: constant_json.NO}).then((card) => { 
                
                res.json({success: true});
            });

        });
    } else
    {
        res.redirect('/login');
    }
};


exports.provider_add_wallet_amount = function (req, res, next) {
 
    var type = Number(req.body.type);
    
    Provider.findOne({_id: req.session.provider._id}).then((detail) => { 
        var payment_id = Number(constant_json.PAYMENT_BY_STRIPE);
        try {
            payment_id = req.body.payment_id;
        } catch (error) {
            console.error(err);
        }

        switch (payment_id) {
            case Number(constant_json.PAYMENT_BY_STRIPE):
            break;
            case Number(constant_json.PAYMENT_BY_PAYPAL):
            break;
        }
        var stripe_secret_key = setting_detail.stripe_secret_key;

        var stripe = require("stripe")(stripe_secret_key);
        var wallet = utils.precisionRoundTwo(Number(req.body.wallet));
        Card.findOne({_id: req.body.card_id, user_id: req.session.provider._id, $or: [{type: type}, {type: {$exists: false}}]}).then((card) => { 
            if(card){
                
                var customer_id = card.customer_id;
                var charge = stripe.charges.create({
                            amount: wallet * 100, // amount in cents, again
                            currency: detail.wallet_currency_code,
                            customer: customer_id
                        }, function (err, charge) {
                            if (charge) {
                                var total_wallet_amount = utils.addWalletHistory(type, detail.unique_id, detail._id, detail.country_id, detail.wallet_currency_code, detail.wallet_currency_code,
                                    1, wallet, detail.wallet, constant_json.ADD_WALLET_AMOUNT, constant_json.ADDED_BY_CARD, "Card : " + card.last_four)

                                detail.wallet = total_wallet_amount;

                                detail.save().then(() => { 
                                    message = "Wallet Amount Added Sucessfully.";
                                    res.redirect('/provider_payments');
                                }, (err) => {
                                    utils.error_response(err, res)
                                });
                            } else {
                               message = "Add wallet Failed";
                               res.redirect('/provider_payments');
                           }
                       });
            }else
            {
                message = "Please Add Card First";
                res.redirect('/provider_payments');
            }
            
        });
        //}
    });
};


//exports.provider_add_wallet_amount = function (req, res, next) {
//    console.log("provider_add_wallet_amount ----");
//    if (typeof req.session.provider != 'undefined') {
//        Provider.findById(req.session.provider._id, function (err, user_data) {
//            if (user_data)
//            {
//                
//                var wallet = utils.precisionRoundTwo(Number(req.body.wallet));
//                var total_wallet_amount = utils.addWalletHistory(process.env.PROVIDER_UNIQUE_NUMBER, user_data.unique_id, user_data._id, user_data.country_id, user_data.wallet_currency_code, user_data.wallet_currency_code,
//                        1, wallet, user_data.wallet, process.env.ADD_WALLET_AMOUNT, process.env.ADDED_BY_ADMIN, "By Admin")
//
//                user_data.wallet = total_wallet_amount;
//                user_data.save();
//                res.redirect('/provider_payments');
//            } else
//            {
//                
//                res.redirect('/login');
//            }
//        })
//    } else
//    {
//        res.redirect('/login');
//    }
//};