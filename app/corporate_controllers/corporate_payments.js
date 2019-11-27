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
var Corporate = require('mongoose').model('Corporate');
var console = require('../controllers/console');
var fs = require("fs");
var Wallet_history = require('mongoose').model('Wallet_history');

exports.corporate_payments = function (req, res, next) {
    if (typeof req.session.corporate != "undefined")
    {
        Card.find({user_id: req.session.corporate._id, is_default: 1}).then((card) => {
            Corporate.findOne({_id: req.session.corporate._id}).then((corporate_detail) => {
                Card.find({user_id: req.session.corporate._id, is_default: 0}).then((cards) => {

                    Wallet_history.find({user_id: req.session.corporate._id}, function (err, wallet_history) {
                        res.render("corporate_payments", {Selected_card: card,Other_card: cards, detail: wallet_history, moment: moment,timezone_for_display_date: setting_detail.timezone_for_display_date,  corporate_detail: corporate_detail, corporate_id: req.session.corporate._id,  stripe_public_key: setting_detail.stripe_publishable_key});
                        delete message;
                    });
                });
            });
        });
    } else
    {
        res.redirect('/corporate_login');
    }

};

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
    if (typeof req.session.corporate != "undefined")
    {
        var Card_number = req.body.Card_number;
        Card_number = Card_number.replace(/ /g, '')
        var creditCardType = require('credit-card-type');
        var visaCards = creditCardType(Card_number);
        res.json(visaCards[0]);
    } else
    {
        res.redirect('/corporate_login');
    }
}

exports.add_card = function (req, res) {
    if (typeof req.session.corporate != "undefined")
    {
        Corporate.findOne({_id: req.session.corporate._id}).then((corporate) => {
            var stripe_secret_key = setting_detail.stripe_secret_key;
            var stripe = require("stripe")(stripe_secret_key);
            var payment_token = req.body.payment_token;
            var customer = stripe.customers.create({
                description: corporate.email,
                source: payment_token // obtained with Stripe.js
            }, function (err, customer) {
                if (!customer) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_FOR_ENTER_VALID_PAYMENT_TOKEN});
                } else {

                    Card.find({user_id: req.session.corporate._id}).then((card_data) => {

                        var customer_id = customer.id;
                        var card = new Card({
                            payment_id: req.body.payment_id,
                            user_id: req.session.corporate._id,
                            type: req.body.type,
                            token: req.body.token,
                            last_four: req.body.last_four,
                            payment_token: payment_token,
                            card_type: req.body.card_type,
                            customer_id: customer_id
                        });
                        if (card_data.length > 0) {
                            card.is_default = constant_json.NO;
                            card.save();
                        } else {
                            card.is_default = constant_json.YES;
                            card.save();
                        }
                        card.save().then(() => {
                            message = admin_messages.success_message_add_card;
                            res.redirect('/corporate_payments');
                        });

                    });
                }
            });
                
        });
    } else
    {
        res.redirect('/corporate_login');
    }
};

exports.delete_card = function (req, res) {
    if (typeof req.session.corporate != "undefined")
    {
        Card.remove({_id: req.body.card_id, user_id: req.session.corporate._id}).then((card) => {
            
            if (req.body.is_default == 1)
            {
                Card.findOneAndUpdate({user_id: req.session.corporate._id}, {is_default: constant_json.YES}).then((card) => {

                })
            }
            res.json({success: true});
               
        });

    } else
    {
        res.redirect('/corporate_login');
    }
};

exports.card_selection = function (req, res) {
    if (typeof req.session.corporate != "undefined")
    {
        Card.findOneAndUpdate({_id: req.body.card_id, user_id: req.session.corporate._id}, {is_default: constant_json.YES}).then((card) => {

            Card.findOneAndUpdate({_id: {$nin: req.body.card_id}, user_id: req.session.corporate._id, is_default: constant_json.YES}, {is_default: constant_json.NO}).then((card) => {
                    res.json({success: true});
            });

        });
    } else
    {
        res.redirect('/corporate_login');
    }
};

exports.corporate_add_wallet_amount = function (req, res, next) {
    var type = Number(req.body.type);
    Corporate.findOne({_id: req.session.corporate._id}, function (err, detail) {
        var payment_id = req.body.payment_id;
        
        switch (payment_id) {
            case Number(constant_json.PAYMENT_BY_STRIPE):
                break;
            case Number(constant_json.PAYMENT_BY_PAYPAL):
                break;
        }

        var stripe_secret_key = setting_detail.stripe_secret_key;

        var stripe = require("stripe")(stripe_secret_key);
        var wallet = utils.precisionRoundTwo(Number(req.body.wallet));
        Card.findOne({_id: req.body.card_id, user_id: req.session.corporate._id, $or: [{type: type}, {type: {$exists: false}}]}).then((card) => { 
            if(card){
                var customer_id = card.customer_id;
                var charge = stripe.charges.create({
                    amount: wallet * 100, // amount in cents, again
                    currency: detail.wallet_currency_code,
                    customer: customer_id
                }, function (err, charge) {
                    console.log(err)
                    if (charge) {
                        var total_wallet_amount = utils.addWalletHistory(type, detail.unique_id, detail._id, detail.country_id, detail.wallet_currency_code, detail.wallet_currency_code,
                                1, wallet, detail.wallet, constant_json.ADD_WALLET_AMOUNT, constant_json.ADDED_BY_CARD, "Card : " + card.last_four)

                        detail.wallet = total_wallet_amount;
                        detail.save().then(() => { 
                            message = "Wallet Amount Added Sucessfully.";
                            res.redirect('/corporate_payments');
                        }, (err) => {
                            utils.error_response(err, res)
                            message = "Add wallet Failed";
                            res.redirect('/corporate_payments');
                        });
                    } else {
                        message = "Add wallet Failed";
                        res.redirect('/corporate_payments');
                    }
                });
            }else
            {
                message = "Please Add Card First";
                res.redirect('/corporate_payments');
            }
            
        });
    });
};



exports.add_bank_detail_corporate = function (req, res) {
    
    Corporate.findOne({_id: req.body.corporates_id}).then((corporate) => { 
        if (corporate)
        {
            if (req.body.web == 1) {
                if (req.files != null || req.files != 'undefined') {
                    var image_name = corporate._id + utils.tokenGenerator(10);
                    var url = utils.getImageFolderPath(req, 10) + image_name + '.jpg';
                    corporate.stripe_doc = url;
                    utils.saveImageFromBrowserStripe(req.files[0].path, image_name + '.jpg', 10, function (response) {

                        if (response) {
                            corporate.save().then(() => { 
                                    stripedoc();
                            }, (err) => {
                                    console.log(err);
                            });
                        }
                    });
                }
            }
            function stripedoc() {

                if (req.body.token != null && corporate.token != req.body.token) {

                    res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                } else
                {
                    var password = req.body.password;
                    var encrypt_password = utils.encryptPassword(password);

                    if (corporate.password !== encrypt_password)
                    {
                        res.json({success: false, error_code: error_message.ERROR_CODE_YOUR_PASSWORD_IS_NOT_MATCH_WITH_OLD_PASSWORD});
                    } else
                    {
                        Country.findOne({"_id": corporate.country_id}).then((country_detail) => { 

                            if (!country_detail)
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
                                    if(err){
                                        res.json({success: false, error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_ADD_BANK_DETAIL_PLEASE_RETRY});
                                    } else {
                                        if (req.body.web == 1) {
                                            var path = require("path");
                                            var pictureData_buffer = fs.readFileSync(path.join(__dirname, '../../data/' + corporate.stripe_doc));
                                            
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
                                                    email: corporate.email,
                                                    legal_entity: {
                                                        first_name: corporate.name,
                                                        last_name: '',
                                                        personal_id_number: req.body.personal_id_number,
                                                        business_name: req.body.business_name,
                                                        business_tax_id: corporate.tax_id,
                                                        dob: {
                                                            day: dob[0],
                                                            month: dob[1],
                                                            year: dob[2]
                                                        },
                                                        type: req.body.account_holder_type,
                                                        address: {
                                                            city: corporate.city,
                                                            country: "US",
                                                            line1: corporate.line1,
                                                            line2: corporate.line2
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
                                                                        corporate.account_id = account.id;
                                                                        corporate.bank_id = bank_account.id;
                                                                        corporate.save().then((admins) => { 
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
                                    }
                                    
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

exports.get_bank_detail_corporate = function (req, res) {

    Corporate.findOne({_id: req.body.corporate_id}).then((corporate) => { 
        if (corporate)
        {
            if (req.body.token != null && corporate.token != req.body.token) {
                res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
            } else
            {
                console.log(corporate.account_id)
                console.log(corporate.bank_id)
                var stripe = require("stripe")(setting_detail.stripe_secret_key);
                stripe.accounts.retrieveExternalAccount(
                    corporate.account_id,
                    corporate.bank_id,
                    function (err, external_account) {
                        var err = err;
                        console.log(external_account)
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

exports.delete_bank_detail_corporate = function (req, res) {

    Corporate.findOne({_id: req.body.corporate_id}).then((corporate) => { 

        if (corporate)
        {
            if (req.body.token != null && corporate.token != req.body.token) {
                res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
            } else
            {
                var stripe = require("stripe")(setting_detail.stripe_secret_key);
                stripe.accounts.del(corporate.account_id, function (err, test) {
                    var err = err;
                    if (err || !test)
                    {
                        res.json({success: false, stripe_error: err.message, error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_DELETED_BANK_DETAIL_PLEASE_RETRY});
                    } else
                    {
                        corporate.account_id = "";
                        corporate.bank_id = "";
                        corporate.save().then(() => { 
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


exports.corporate_wallet_history = function (req, res, next) {
    if (typeof req.session.corporate != 'undefined') {
      
        Wallet_history.find({user_id: req.session.corporate._id}, function (err, wallet_history) {
            Corporate.findOne({_id: req.session.corporate._id}, function (err, corporate_detail) {
                res.render('corporate_wallet_history', {'detail': wallet_history, corporate_detail: corporate_detail, timezone_for_display_date: setting_detail.timezone_for_display_date, 'moment': moment});

            });
        });

    } else {
        res.redirect('/corporate_profile');
    }
};