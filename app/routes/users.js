var users = require('../../app/controllers/users'); // include user controller ////
var User = require('mongoose').model('User'); // include user model ////
var trip = require('../../app/controllers/trip'); // include trip controller ////
var providers = require('../../app/controllers/providers'); // include Provider 
var citytype = require('../controllers/citytype');
var Citytype = require('mongoose').model('city_type'); // include Citytype model 

module.exports = function (app) {
    app.route('/check_user_registered').post(users.check_user_registered);
    app.route('/get_otp').post(users.get_otp);
    app.route('/update_password').post(users.update_password);
    
    app.route('/verification').post(users.verification);
    app.route('/userregister').post(users.user_register);
    app.route('/userupdate').post(users.user_update);
    app.route('/userslogin').post(users.user_login);
    app.route('/add_wallet_amount').post(users.add_wallet_amount);
    app.route('/change_user_wallet_status').post(users.change_user_wallet_status);
    app.route('/logout').post(users.logout);
    app.route('/apply_referral_code').post(users.apply_referral_code);
    app.route('/getuserdetail').post(users.get_user_detail);
    
    //app.route('/getnearbyprovider').post(users.getnearbyprovider);
    app.route('/getfareestimate').post(users.getfareestimate);
    app.route('/apply_promo_code').post(users.apply_promo_code);
    app.route('/remove_promo_code').post(users.remove_promo_code);
    app.route('/updateuserdevicetoken').post(users.update_device_token);
    app.route('/get_user_referal_credit').post(users.get_user_referal_credit);
    app.route('/forgotpassword').post(users.forgotpassword);

    app.route('/get_user_setting_detail').post(users.get_user_setting_detail);
    app.route('/get_user_privacy_policy').get(users.get_user_privacy_policy);
    app.route('/get_user_terms_and_condition').get(users.get_user_terms_and_condition);
    
    app.route('/set_home_address').post(users.set_home_address);
    app.route('/get_home_address').post(users.get_home_address);

    app.route('/user_accept_reject_corporate_request').post(users.user_accept_reject_corporate_request);
    app.route('/user_reject_corporate_request').post(users.user_reject_corporate_request);

    /* ELLUMINATI - AD 13 May 2019  for add, remove and get favourite driver */
    app.route('/add_favourite_driver').post(users.add_favourite_driver);
    app.route('/get_favourite_driver').post(users.get_favourite_driver);
    app.route('/remove_favourite_driver').post(users.remove_favourite_driver);
    app.route('/get_all_driver_list').post(users.get_all_driver_list);
    /*  end */

};





