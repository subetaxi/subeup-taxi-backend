var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var adminschema = new Schema({
	username: {type: String, default: ""},
	password: {type: String, default: ""},
	email: {type: String, default: ""},
	token:{type: String, default: ""},
	type: {type: Number, default: 0},
	url_array: {type: Array, default: []},
	created_at: { type: Date, default: Date.now },
	updated_at: { type: Date, default: Date.now }
});
adminschema.index({email: 1}, {background: true});

module.exports = mongoose.model('admin',adminschema);



