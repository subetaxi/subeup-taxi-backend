var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var emailSchema = new Schema({
    emailUniqueId: Number,
    emailUniqueTitle: {type: String, default: ""},
    emailTitle: {type: String, default: ""},
    emailContent:{type: String, default: ""},
    emailAdminInfo:{type: String, default: ""}

});

var Email = mongoose.model('email_detail', emailSchema);
module.exports = Email;

