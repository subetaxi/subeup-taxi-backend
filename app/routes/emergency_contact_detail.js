var emergencyContactDetail = require('../../app/controllers/emergency_contact_details');
var EmergencyContactDetail = require('mongoose').model('emergency_contact_detail');

module.exports = function (app) {
    app.route('/add_emergency_contact').post(emergencyContactDetail.add_emergency_contact);
    
    app.route('/update_emergency_contact').post(emergencyContactDetail.update_emergency_contact);
    app.route('/delete_emergency_contact').post(emergencyContactDetail.delete_emergency_contact);
    
    app.route('/get_emergency_contact_list').post(emergencyContactDetail.get_emergency_contact_list);
    app.route('/send_sms_to_emergency_contact').post(emergencyContactDetail.send_sms_to_emergency_contact);
};





