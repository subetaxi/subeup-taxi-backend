var utils = require('./utils');
var EmergencyContactDetail = require('mongoose').model('emergency_contact_detail');
var User = require('mongoose').model('User');
var console = require('./console');
var utils = require('./utils');

//// ADD EMERGENCY CONTACT USING POST SERVICE 
exports.add_emergency_contact = function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'},{name: 'phone', type: 'string'},
        {name: 'name', type: 'string'}], function (response) {
        if (response.success) {
            EmergencyContactDetail.find({user_id: req.body.user_id}).then((emergencyContactDetail) => {

                if (emergencyContactDetail.length >= 5) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_EMERGENCY_CONTACT_LIMIT_OVER});

                } else {
                    EmergencyContactDetail.findOne({
                        user_id: req.body.user_id,
                        phone: req.body.phone
                    }).then((emergency_contact) => {
                        if (emergency_contact) {
                            res.json({success: false, error_code: error_message.ERROR_CODE_EMERGENCY_CONTACT_ALREADY_ADDED});
                        } else {
                            var emergencyContactDetail = new EmergencyContactDetail({
                                user_id: req.body.user_id,
                                name: req.body.name,
                                phone: req.body.phone,
                                is_always_share_ride_detail: req.body.is_always_share_ride_detail

                            });
                            emergencyContactDetail.save().then(() => {
                                res.json({
                                    success: true,
                                    message: success_messages.MESSAGE_CODE_EMERGENCY_CONTACT_ADD_SUCESSFULLY,
                                    emergency_contact_data: emergencyContactDetail

                                });
                            });
                        }
                    })
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


//// UPDATE EMERGENCY CONTACT USING POST SERVICE ///// 
exports.update_emergency_contact = function (req, res) {

    utils.check_request_params(req.body, [{name: 'emergency_contact_detail_id', type: 'string'}], function (response) {
        if (response.success) {
            EmergencyContactDetail.findOneAndUpdate({_id: req.body.emergency_contact_detail_id}, req.body, {new: true}).then((emergency_contact) => {
                if (emergency_contact) {
                    res.json({
                        success: true,
                        message: success_messages.MESSAGE_CODE_EMERGENCY_CONTACT_UPDATE_SUCESSFULLY,
                        emergency_contact_data: emergency_contact
                    });
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_UPDATE_EMERGENCY_CONTACT_FAILED});
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


// delete_emergency_contact  api
exports.delete_emergency_contact = function (req, res) {

    utils.check_request_params(req.body, [{name: 'emergency_contact_detail_id', type: 'string'}], function (response) {
        if (response.success) {
            EmergencyContactDetail.remove({_id: req.body.emergency_contact_detail_id}).then(() => {
                
                    res.json({success: true, message: success_messages.MESSAGE_CODE_EMERGENCY_CONTACT_DELETE_SUCESSFULLY});
                
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


////  GET LIST  ///////

exports.get_emergency_contact_list = function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            EmergencyContactDetail.find({user_id: req.body.user_id}).then((emergency_contact_data) => {
                if (emergency_contact_data.length === 0) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_NO_EMERGENCY_CONTACT_FOUND}); // 
                } else {
                    res.json({
                        success: true,
                        message: success_messages.MESSAGE_CODE_GET_EMERGENCY_CONTACT_LIST_SUCCESSFULLY,
                        emergency_contact_data: emergency_contact_data
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

/////// SEND SMS TO EMERGENCY CONTACT /////

exports.send_sms_to_emergency_contact = function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            var map = req.body.map;
            EmergencyContactDetail.find({user_id: req.body.user_id}).then((emergency_contact_datas) => {

                if (emergency_contact_datas.length === 0) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_NO_EMERGENCY_CONTACT_FOUND}); // 
                } else {

                    User.findOne({_id: req.body.user_id}).then((user) => {

                        emergency_contact_datas.forEach(function (emergency_contact_data) {

                            var phoneWithCode = emergency_contact_data.phone;

                            utils.sendSmsToEmergencyContact(phoneWithCode, 8, user.first_name + " " + user.last_name, map);

                        });

                        res.json({
                            success: true,
                            message: success_messages.MESSAGE_CODE_SEND_SMS_TO_EMERGENCY_CONTACT_SUCCESSFULLY
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