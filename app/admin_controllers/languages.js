var utils = require('../controllers/utils');
var Language = require('mongoose').model('language');
 var array = [];
 var console = require('../controllers/console');
///// languages /////
exports.languages = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        Language.count({}).then((languagecount) => {
            if (languagecount == 0) {
                res.render('languages', {'detail': array});
            } else {
                Language.find({}).then((languagelist) => {
                    res.render('languages', {'detail': languagelist});
                    delete message;
                });
            }
        });
    } else {
        res.redirect('/admin');
    }
};


///// add_languages form ///// 
exports.add_languages = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        res.render("add_languages");
        delete message;
    } else {
        res.redirect('/admin');
    }
};



///// add_languages_detail /////
exports.add_languages_detail = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        var language = new Language({
            name: (req.body.name).trim(),
            code: (req.body.code).trim()
        });
        language.save().then(() => { 
            message = admin_messages.success_message_add_language;
            res.redirect('/languages');
        }, (err) => {
            console.log(err);
        });

    } else {
        res.redirect('/admin');
    }
};


///// edit_languages form /////
exports.edit_languages = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        Language.findById(req.body.id).then((languagedata) => {
            res.render('add_languages', {'data': languagedata});
            delete message;
        });

    } else {
        res.redirect('/admin');
    }
};


///// update_languages_detail /////
exports.update_languages_detail = function (req, res) {
    if (typeof req.session.userid != 'undefined') {
        var data = req.body;
        Language.findByIdAndUpdate(req.body.id, data).then((data) => {
            message = admin_messages.success_message_update;
            res.redirect("/languages");
        });
    } else {
        res.redirect('/admin');
    }
};


