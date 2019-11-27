var utils = require('./utils');
require('./constant');
var Card = require('mongoose').model('Card');
var console = require('./console');
var utils = require('./utils');

exports.pay_payment_on_selected_payment_gateway = function (payment_gateway_type, user_id, charges, currency_code, response) {

    if (payment_gateway_type == Number(constant_json.PAYMENT_BY_STRIPE)) {

        Card.findOne({user_id: user_id, is_default: 1}).then((card) => {

            if (card) {

                var customer_id = card.customer_id;
                var stripe = require("stripe")(setting_detail.stripe_secret_key);
                var amount = Math.round(charges * 100);
                var charge = stripe.charges.create({
                    amount: amount, /// amount in cents, again
                    currency: currency_code,
                    customer: customer_id
                }, function (err, charge) {
                    if (charge) {
                        var payment_transaction = {
                            transaction_type: "stripe",
                            transaction_info: {
                                id: charge.id,
                                balance_transaction: charge.balance_transaction,
                                source: {
                                    id: charge.source.id
                                }
                            }
                        }

                        response({success: true, payment_transaction: payment_transaction, charges: amount});

                    } else {
                        response({
                            success: false,
                            payment_error: err.type,
                            payment_error_message: utils.paymentError(err)
                        });
                    }

                });
            } else {
                response({
                    success: false,
                    payment_error: "NO CARD",
                    payment_error_message: "Without card payment not charge"
                });
            }
        });
    }
};




