var Provider_Document = require('mongoose').model('Provider_Document');
var Provider = require('mongoose').model('Provider');
var utils = require('./utils');
var console = require('./console');
//////////////// GET PROVIDER DOCUMENT /////////////
var utils = require('./utils');
exports.getproviderdocument = function (req, res) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {

                        Provider_Document.find({provider_id: req.body.provider_id}).then((providerdocument) => {

                            if (providerdocument.length == 0) {
                                res.json({success: false, error_code: error_message.ERROR_CODE_DOCUMENT_NOT_FOUND});
                            } else {
                                res.json({
                                    success: true,
                                    message: success_messages.MESSAGE_CODE_FOR_PROVIDER_GET_DOCUMENT_LIST_SUCCESSFULLY,
                                    providerdocument: providerdocument
                                });

                            }

                        });
                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});

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


// upload  document image
exports.uploaddocument = function (req, res) {

    utils.check_request_params(req.body, [{name: 'document_id', type: 'string'},{name: 'provider_id', type: 'string'}], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider_detail) => {
                if (provider_detail) {
                    if (req.body.token != null && provider_detail.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        Provider_Document.findOne({
                            _id: req.body.document_id,
                            provider_id: req.body.provider_id
                        }).then((providerdocument) => {
                            if (providerdocument) {
                                var pictureData = req.body.pictureData;
                                if (pictureData != "" && pictureData != undefined) {

                                    utils.deleteImageFromFolder(providerdocument.document_picture, 3);
                                    var image_name = providerdocument._id + utils.tokenGenerator(4);
                                    var url = utils.getImageFolderPath(req, 3) + image_name + '.jpg';
                                    providerdocument.document_picture = url;
                                    utils.saveImageAndGetURL(image_name + '.jpg', req, res, 3);
                                }

                                if (req.files != undefined && req.files.length > 0) {
                                    utils.deleteImageFromFolder(providerdocument.document_picture, 3);
                                    var image_name = providerdocument._id + utils.tokenGenerator(4);
                                    var url = utils.getImageFolderPath(req, 3) + image_name + '.jpg';
                                    providerdocument.document_picture = url;

                                    utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 3);

                                }

                                providerdocument.is_uploaded = 1;
                                providerdocument.unique_code = req.body.unique_code;
                                providerdocument.expired_date = req.body.expired_date;
                                providerdocument.is_document_expired = false;
                                providerdocument.save().then(() => {
                                    Provider_Document.find({
                                        provider_id: req.body.provider_id,
                                        option: 1,
                                        is_uploaded: 0
                                    }).then((document_list) => {

                                        Provider_Document.find({
                                            provider_id: req.body.provider_id,
                                            option: 1,
                                            is_document_expired: true
                                        }).then((expired_document_list) => {

                                            if (expired_document_list.length == 0) {
                                                provider_detail.is_documents_expired = false;
                                            } else {
                                                provider_detail.is_documents_expired = true;
                                            }
                                            if (document_list.length == 0) {
                                                provider_detail.is_document_uploaded = 1;
                                            } else {
                                                provider_detail.is_document_uploaded = 0;
                                            }

                                            provider_detail.save().then(() => {
                                                res.json({
                                                    success: true,
                                                    message: success_messages.MESSAGE_CODE_USER_DOCUMENT_IMAGE_UPLOAD_SUCCESSFULLY,
                                                    document_picture: providerdocument.document_picture,
                                                    unique_code: providerdocument.unique_code,
                                                    expired_date: providerdocument.expired_date,
                                                    is_uploaded: providerdocument.is_uploaded,
                                                    is_document_uploaded: provider_detail.is_document_uploaded,
                                                    is_documents_expired: provider_detail.is_documents_expired
                                                });

                                            });
                                        });
                                    });
                                }, (err) => {
                                    console.log(err);
                                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                                });

                            } else {
                                res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DOCUMENT_LIST_NOT_FOUND});

                            }

                        });
                    }
                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});

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