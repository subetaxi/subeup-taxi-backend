var User_Document = require('mongoose').model('User_Document');
var User = require('mongoose').model('User');
var utils = require('./utils');
var console = require('./console');
// get user document
var utils = require('./utils');
exports.userdocument_list = function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}).then((user) => {
                if (user) {
                    if (req.body.token != null && user.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {

                        User_Document.find({user_id: req.body.user_id}).then((userdocument) => {
                            if (userdocument.length == 0) {
                                res.json({success: false, error_code: error_message.ERROR_CODE_USER_DOCUMENT_LIST_NOT_FOUND});
                            } else {
                                res.json({
                                    success: true,
                                    message: success_messages.MESSAGE_CODE_USER_DOCUMENT_LIST_SUCCESSFULLY,
                                    userdocument: userdocument
                                });

                            }
                        });
                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});

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


// upload user document image
exports.uploaduserdocument = function (req, res) {

    utils.check_request_params(req.body, [{name: 'user_id', type: 'string'},{name: 'document_id', type: 'string'}], function (response) {
        if (response.success) {
            User.findOne({_id: req.body.user_id}).then((user) => {
                if (user) {
                    if (req.body.token != null && user.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {

                        User_Document.findOne({_id: req.body.document_id, user_id: req.body.user_id}).then((userdocument) => {
                            if (userdocument) {

                                var pictureData = req.body.pictureData;
                                if (pictureData != "" && pictureData != undefined) {

                                    utils.deleteImageFromFolder(userdocument.document_picture, 9);
                                    var image_name = userdocument._id + utils.tokenGenerator(4);
                                    var url = utils.getImageFolderPath(req, 9) + image_name + '.jpg';
                                    userdocument.document_picture = url;
                                    utils.saveImageAndGetURL(image_name, req, res, 9);
                                }

                                if (req.files != undefined && req.files.length > 0) {
                                    utils.deleteImageFromFolder(userdocument.document_picture, 9);
                                    var image_name = userdocument._id + utils.tokenGenerator(4);
                                    var url = utils.getImageFolderPath(req, 9) + image_name + '.jpg';
                                    userdocument.document_picture = url;

                                    utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 9);

                                }

                                userdocument.is_uploaded = 1;
                                userdocument.unique_code = req.body.unique_code;

                                userdocument.expired_date = req.body.expired_date;


                                userdocument.is_document_expired = false;
                                userdocument.save().then(() => {

                                    User.findOne({_id: req.body.user_id}).then((user_detail) => {
                                        if (user_detail) {
                                            User_Document.find({
                                                user_id: req.body.user_id,
                                                option: 1,
                                                is_uploaded: 0
                                            }).then((document_list) => {

                                                if (document_list.length == 0) {
                                                    user_detail.is_document_uploaded = 1;
                                                    user_detail.save().then(() => {
                                                        res.json({
                                                            success: true,
                                                            message: success_messages.MESSAGE_CODE_USER_DOCUMENT_IMAGE_UPLOAD_SUCCESSFULLY,
                                                            document_picture: userdocument.document_picture,
                                                            unique_code: userdocument.unique_code,
                                                            expired_date: userdocument.expired_date,
                                                            is_uploaded: userdocument.is_uploaded,
                                                            is_document_uploaded: user_detail.is_document_uploaded
                                                        });

                                                    }, (err) => {
                                                        console.log(err);
                                                        res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                                                    });


                                                } else {
                                                    user_detail.is_document_uploaded = 0;
                                                    user_detail.save(function (err) {
                                                        if (err) {
                                                            res.json({
                                                                success: false,
                                                                error_code: error_message.ERROR_CODE_YOUR_DOCUMENT_NOT_UPDATE
                                                            });

                                                        } else {
                                                            res.json({
                                                                success: true,
                                                                message: success_messages.MESSAGE_CODE_USER_DOCUMENT_IMAGE_UPLOAD_SUCCESSFULLY,
                                                                document_picture: userdocument.document_picture,
                                                                unique_code: userdocument.unique_code,
                                                                expired_date: userdocument.expired_date,
                                                                is_uploaded: userdocument.is_uploaded,
                                                                is_document_uploaded: user_detail.is_document_uploaded
                                                            });

                                                        }
                                                    });
                                                }
                                            });
                                        } else {

                                            res.json({
                                                success: false,
                                                error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND
                                            });

                                        }
                                    });
                                }, (err) => {
                                    console.log(err);
                                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                                });


                            } else {
                                res.json({success: false, error_code: error_message.ERROR_CODE_USER_DOCUMENT_LIST_NOT_FOUND});

                            }

                        });
                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_USER_DETAIL_NOT_FOUND});

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