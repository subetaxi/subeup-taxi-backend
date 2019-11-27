var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var SmsdetailSchema = new Schema({
    smsUniqueId: Number,
    smsUniqueTitle: {type: String, default: ""},
    smsContent: {type: String, default: ""}
});
var Smsdetail = mongoose.model('sms_detail', SmsdetailSchema);
module.exports = Smsdetail;

