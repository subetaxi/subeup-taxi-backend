var utils = require('../controllers/utils');
var admin = require('mongoose').model('admin');
var randomstring = require("randomstring");
var Settings = require('mongoose').model('Settings');
var Payment_Transaction = require('mongoose').model('Payment_Transaction');
var mongoose = require('mongoose');
var Schema = mongoose.Types.ObjectId;

exports.add_card = function (req, res) {

	Payment_Transaction.findOne({}, function(error, payment_transaction_detail){
        console.log(req.body)
		var stripe = require("stripe")(payment_transaction_detail.stripe_secret_key);
        var payment_token = req.body.payment_token;
        stripe.customers.create({
            source: req.body.payment_token // obtained with Stripe.js
        }, function (err, customer) {
            console.log(customer)
        	if (!customer) {
                res.json({success: false, error_code: error_message.ERROR_CODE_FOR_ENTER_VALID_PAYMENT_TOKEN});
            } else {
            	var json = {
            		_id: new Schema(),
                    last_four: req.body.last_four,
                    payment_token: req.body.payment_token,
                    card_type: req.body.card_type,
                    customer_id: customer.id
            	}
            	payment_transaction_detail.card_detail.push(json);
            	payment_transaction_detail.save(function(error){
                    res.redirect('/payment_pending')
                });
            }
        });

	});
}

exports.delete_card = function (req, res) {

	Payment_Transaction.findOne({}, function(error, payment_transaction_detail){
		var index = payment_transaction_detail.card_detail.findIndex((x)=>(x._id).toString() == req.body.card_id);
		if(index != -1){
			payment_transaction_detail.card_detail.splice(index, 1);
		}
		payment_transaction_detail.save(function(error){
            res.json({success: true});
        });
	});
}

exports.payment_pending = function (req, res) {
	Payment_Transaction.findOne({}, function(error, payment_transaction_detail){
        if(payment_transaction_detail){
            if(payment_transaction_detail.is_stop_system){
    		    res.render('payment_pending', {payment_transaction_detail: payment_transaction_detail});
            } else {
                res.redirect('/admin')
            }
        } else {
            var payment_transaction_detail = new Payment_Transaction({
                "stripe_public_key" : "pk_test_KtNyVyDoeogN5KDs9UzWMt5W",
                "stripe_secret_key" : "sk_test_raNORnPmKIHYorwC2P16n0Z2",
                "amount" : 500,
                "currency_code" : "USD",
                "is_schedule_payment" : false,
                "is_payment_paid" : true,
                "no_of_failed_transaction" : 0,
                "max_no_of_transaction" : 3,
                "transaction_detail" : [],
                "card_detail" : [],
                "is_stop_system" : false,
                "type_detail" : [],
                "last_payment_date": null
            });
            payment_transaction_detail.save(function(error){
                exports.payment_pending(req, res);
            })
        }
	})
}