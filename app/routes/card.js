var card = require('../../app/controllers/card'); // include card controller ////
var Card = require('mongoose').model('Card'); // include Card model ////


module.exports = function (app) {

    app.route('/addcard').post(card.add_card);
    app.route('/delete_card').post(card.delete_card);
    app.route('/cards').post(card.card_list);
    app.route('/card_selection').post(card.card_selection);
    app.route('/card_deselect').post(card.card_deselect);
    app.route('/userchangepaymenttype').post(card.change_paymenttype);
};





