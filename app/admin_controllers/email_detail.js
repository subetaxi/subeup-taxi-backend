var email_detail = require('mongoose').model('email_detail');
var utils = require('../controllers/utils');
exports.email = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {

        email_detail.find({}).then((email_data) => { 

            res.render('email', {email_data: email_data});
            delete message;
        });
    } else {
        res.redirect('/admin');
    }
};

exports.get_email_data = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        email_detail.findById(req.body.id).then((email_data) => { 
            res.json(email_data);
        });
    } else {
        res.redirect('/admin');
    }
};

exports.update_email_detail = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        delete req.body.emailUniqueTitle;

        email_detail.findByIdAndUpdate(req.body.id, req.body).then((email_data) => { 
            message = "Email Data Update Successfully";
            res.redirect('/email');
        });
    } else {
        res.redirect('/admin');
    }
};
