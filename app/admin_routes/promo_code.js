var promocode = require('../admin_controllers/promo_code');
module.exports = function (app) {

    app.route('/promotions').get(promocode.promotions);
    app.route('/promotions').post(promocode.promotions);
    
    app.route('/generate_promo_code_excel').post(promocode.generate_promo_code_excel);
    
    app.route('/promocodeedit').post(promocode.edit);
    app.route('/promocodeupdate').post(promocode.update);
    app.route('/add_promo_form').post(promocode.add_promo_form);
    app.route('/add_promocode').post(promocode.add_promocode);
    app.route('/promocodetoggelact').post(promocode.act);
    app.route('/check_valid_promocode').post(promocode.check_valid_promocode);

    app.route('/promo_used_info').post(promocode.promo_used_info);
    

};



