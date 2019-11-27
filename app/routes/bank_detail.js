var bankdetail = require('../../app/controllers/bank_detail');
var bank_detail = require('mongoose').model('bank_detail');


module.exports = function (app) {
    app.route('/add_bank_detail').post(bankdetail.add_bank_detail);
    app.route('/delete_bank_detail').post(bankdetail.delete_bank_detail);
    app.route('/get_bank_detail').post(bankdetail.get_bank_detail);
    app.route('/add_bank_detail_web').post(bankdetail.add_bank_detail_web);

};





