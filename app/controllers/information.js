var Information = require('mongoose').model('Information');

exports.render = function (req, res) {
    res.render('terms', {
        title: 'EBER'
    });
};

exports.render = function (req, res) {
    res.render('development_company', {
        title: 'EBER'
    });
};


exports.list = function (req, res) {
    Information.find({}, function (err, informationPages) {
        if (err || informationPages.length == 0) {
            res.json({success: false, error_code: error_message.ERROR_CODE_NO_INFORMATION_PAGE_FOUND});
        } else {
            res.json({success: true, message: success_messages.MESSAGE_CODE_GET_ALL_INFORMATION_PAGES, informationPages: informationPages});
        }
    });

};


exports.page_detail = function (req, res) {
    Information.findOne({_id: req.body.page_id}, function (err, informationPage) {
        if (err || !informationPage) {
            res.json({success: false, error_code: error_message.ERROR_CODE_NO_INFORMATION_PAGE_FOUND});
        } else {
            res.json({success: true, message: success_messages.MESSAGE_CODE_GET_SELECTED_INFORMATION_PAGE, informationPage: informationPage});
        }
    });
};



