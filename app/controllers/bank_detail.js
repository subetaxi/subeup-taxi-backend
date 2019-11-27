var bank_detail = require('mongoose').model('bank_detail');
var Provider = require('mongoose').model('Provider');
var utils = require('./utils');
var fs = require("fs");
var Settings = require('mongoose').model('Settings');
var Country = require('mongoose').model('Country');
var console = require('./console');

//// ADD BANK DETAIL USING POST SERVICE 
// exports.add_bank_detail = function (req, res) {
//     console.log(req.body)
//     utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'},{name: 'account_holder_name', type: 'string'},{name: 'account_holder_type', type: 'string'},
//         {name: 'password', type: 'string'},{name: 'routing_number', type: 'string'},
//         {name: 'dob', type: 'string'},{name: 'personal_id_number', type: 'string'},{name: 'account_number', type: 'string'}], function (response) {
//         if (response.success) {

//             var social_id = req.body.social_unique_id;
//             var encrypted_password = req.body.password;
//             encrypted_password = utils.encryptPassword(encrypted_password);

//             Provider.findOne({_id: req.body.provider_id}).then((provider) => {

//                 if (provider) {
//                     if (social_id == undefined || social_id == null || social_id == "") {
//                         social_id = null;
//                     }
//                     if (social_id == null && encrypted_password != "" && encrypted_password != provider.password) {
//                         res.json({
//                             success: false,
//                             error_code: error_message.ERROR_CODE_YOUR_PASSWORD_IS_NOT_MATCH_WITH_OLD_PASSWORD
//                         });
//                     } else if (social_id != null && provider.social_unique_id != social_id) {
//                         res.json({success: false, error_code: 100});
//                     } else {
//                         if (req.body.web == 1) {
//                             if (req.files != null || req.files != 'undefined') {
//                                 var image_name = provider._id + utils.tokenGenerator(10);
//                                 var url = utils.getImageFolderPath(req, 10) + image_name + '.jpg';
//                                 provider.stripe_doc = url;
//                                 utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 10);
//                                 provider.save().then(() => {
//                                 }, (err) => {
//                                     console.log(err);
//                                 });

//                             }
//                         }

//                         Country.findOne({"countryname": provider.country}).then((country_detail) => {

//                             if (!country_detail) {
//                                 res.json({
//                                     success: false,
//                                     error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_ADD_BANK_DETAIL_PLEASE_RETRY
//                                 });
//                             } else {
//                                 if (req.body.web == 1) {
//                                     if (req.files != null || req.files != 'undefined') {
//                                         var image_name = provider._id + utils.tokenGenerator(10);
//                                         var url = utils.getImageFolderPath(req, 10) + image_name + '.jpg';
//                                         provider.stripe_doc = url;
//                                         utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 10);
//                                         provider.save().then(() => {
//                                         }, (err) => {
//                                             console.log(err);
//                                         });

//                                     }
//                                 }
//                                 var stripe = require("stripe")(setting_detail.stripe_secret_key);
//                                 stripe.tokens.create({
//                                     bank_account: {
//                                         country: "US", // country_detail.alpha2
//                                         currency: "USD",
//                                         account_holder_name: req.body.account_holder_name,
//                                         account_holder_type: req.body.account_holder_type,
//                                         routing_number: req.body.routing_number,
//                                         account_number: req.body.account_number
//                                     }
//                                 }, function (err, token) {
//                                     if (err) {
//                                         var err = err;
//                                         res.json({
//                                             success: false,
//                                             stripe_error: err.message,
//                                             error_code: error_message.ERROR_CODE_FOR_ACCOUNT_DETAIL_NOT_VALID
//                                         });
//                                     } else {

//                                         if (req.body.web == 1) {
//                                             var pictureData_buffer = fs.readFileSync("'https://www.goingatob.com/stripedoc/5a7e7ad20893421e40dde4c0zF3Bs6G48W.jpg");

//                                         } else {
//                                             var pictureData = req.body.document;
//                                             var pictureData_buffer = new Buffer(pictureData, 'base64');

//                                         }
//                                         stripe.fileUploads.create({
//                                             file: {
//                                                 data: pictureData_buffer,
//                                                 name: "document.jpg",
//                                                 type: "application/octet-stream",
//                                             },
//                                             purpose: "identity_document",
//                                         }, function (err, fileUpload) {
//                                             var err = err;
//                                             if (err || !fileUpload) {
//                                                 res.json({
//                                                     success: false,
//                                                     stripe_error: err.message,
//                                                     error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_ADD_STRIPE_DOCUMENT
//                                                 });
//                                             } else {
//                                                 var dob = req.body.dob
//                                                 dob = dob.split('-');
//                                                 stripe.accounts.create({
//                                                     type: 'custom',
//                                                     country: "US", // country_detail.alpha2
//                                                     email: provider.email,
//                                                     requested_capabilities: ['card_payments']
//                                                     // legal_entity: {
//                                                     //     first_name: provider.first_name,
//                                                     //     last_name: provider.last_name,
//                                                     //     personal_id_number: req.body.personal_id_number,
//                                                     //     business_name: req.body.business_name,
//                                                     //     business_tax_id: provider.tax_id,
//                                                     //     dob: {
//                                                     //         day: dob[0],
//                                                     //         month: dob[1],
//                                                     //         year: dob[2]
//                                                     //     },
//                                                     //     type: req.body.account_holder_type,
//                                                     //     address: {
//                                                     //         city: provider.city,
//                                                     //         country: provider.country,
//                                                     //         line1: provider.address,
//                                                     //         line2: provider.address
//                                                     //     },
//                                                     //     verification: {
//                                                     //         document: fileUpload.id
//                                                     //     }
//                                                     // }
//                                                 }, function (err, account) {
//                                                     var err = err;
//                                                     if (err || !account) {
//                                                         res.json({
//                                                             success: false,
//                                                             stripe_error: err.message,
//                                                             error_code: error_message.ERROR_CODE_FOR_ACCOUNT_DETAIL_NOT_VALID
//                                                         });
//                                                     } else {
//                                                         stripe.accounts.createExternalAccount(
//                                                             account.id,
//                                                             {
//                                                                 external_account: token.id,
//                                                                 default_for_currency: true
//                                                             },
//                                                             function (err, bank_account) {
//                                                                 var err = err;
//                                                                 if (err || !bank_account) {
//                                                                     res.json({
//                                                                         success: false,
//                                                                         stripe_error: err.message,
//                                                                         error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_ADD_BANK_DETAIL_PLEASE_RETRY
//                                                                     });

//                                                                 } else {
//                                                                     provider.account_id = account.id;
//                                                                     provider.bank_id = bank_account.id;
//                                                                     provider.save();
//                                                                     stripe.accounts.update(
//                                                                         account.id,
//                                                                         {
//                                                                             tos_acceptance: {
//                                                                                 date: Math.floor(Date.now() / 1000),
//                                                                                 ip: req.connection.remoteAddress // Assumes you're not using a proxy
//                                                                             }
//                                                                         }, function (err, update_bank_account) {

//                                                                             if (err || !update_bank_account) {
//                                                                                 var err = err;
//                                                                                 res.json({
//                                                                                     success: false,
//                                                                                     stripe_error: err.message,
//                                                                                     error_code: error_message.ERROR_CODE_FOR_PROVIDER_BANK_DETAIL_ARE_NOT_VERIFIED
//                                                                                 });
//                                                                             } else {
//                                                                                 res.json({
//                                                                                     success: true,
//                                                                                     message: error_message.MESSAGE_CODE_FOR_PROVIDER_BANK_DETAIL_ADDED_SUCCESSFULLY
//                                                                                 });
//                                                                             }
//                                                                         });
//                                                                 }
//                                                             }
//                                                         );
//                                                     }

//                                                 });
//                                             }
//                                         });
//                                     }

//                                 });
//                             }
//                         });

//                     }

//                 } else {

//                     res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});

//                 }
//             });
//         } else {
//             res.json({
//                 success: false,
//                 error_code: response.error_code,
//                 error_description: response.error_description
//             });
//         }
//     });

// };

exports.add_bank_detail = function (req, res) {
    console.log(req.body)
    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'},{name: 'account_holder_name', type: 'string'},{name: 'account_holder_type', type: 'string'},
        {name: 'password', type: 'string'},{name: 'routing_number', type: 'string'},
        {name: 'dob', type: 'string'},{name: 'personal_id_number', type: 'string'},{name: 'account_number', type: 'string'}], function (response) {
        if (response.success) {

            var social_id = req.body.social_unique_id;
            var encrypted_password = req.body.password;
            encrypted_password = utils.encryptPassword(encrypted_password);

            Provider.findOne({_id: req.body.provider_id}).then((provider) => {
                if (provider) {
                    if (social_id == undefined || social_id == null || social_id == "") {
                        social_id = null;
                    }
                    if (social_id == null && encrypted_password != "" && encrypted_password != provider.password) {
                        res.json({
                            success: false,
                            error_code: error_message.ERROR_CODE_YOUR_PASSWORD_IS_NOT_MATCH_WITH_OLD_PASSWORD
                        });
                    } else if (social_id != null && provider.social_unique_id != social_id) {
                        res.json({success: false, error_code: 100});
                    } else {
                        if (req.body.web == 1) {
                            if (req.files != null || req.files != 'undefined') {
                                var image_name = provider._id + utils.tokenGenerator(10);
                                var url = utils.getImageFolderPath(req, 10) + image_name + '.jpg';
                                provider.stripe_doc = url;
                                utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 10);
                                provider.save().then(() => {
                                }, (err) => {
                                    console.log(err);
                                });

                            }
                        }

                        Country.findOne({"countryname": provider.country}).then((country_detail) => {

                            if (!country_detail) {
                                res.json({
                                    success: false,
                                    error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_ADD_BANK_DETAIL_PLEASE_RETRY
                                });
                            } else {
                                if (req.body.web == 1) {
                                    if (req.files != null || req.files != 'undefined') {
                                        var image_name = provider._id + utils.tokenGenerator(10);
                                        var url = utils.getImageFolderPath(req, 10) + image_name + '.jpg';
                                        provider.stripe_doc = url;
                                        utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 10);
                                        provider.save().then(() => {
                                        }, (err) => {
                                            console.log(err);
                                        });

                                    }
                                }
                                var stripe = require("stripe")(setting_detail.stripe_secret_key);
                                stripe.tokens.create({
                                    bank_account: {
                                        country: "US", // country_detail.alpha2
                                        currency: "USD",
                                        account_holder_name: req.body.account_holder_name,
                                        account_holder_type: req.body.account_holder_type,
                                        routing_number: req.body.routing_number,
                                        account_number: req.body.account_number
                                    }
                                }, function (err, token) {
                                    if (err) {
                                        var err = err;
                                        res.json({
                                            success: false,
                                            stripe_error: err.message,
                                            error_code: error_message.ERROR_CODE_FOR_ACCOUNT_DETAIL_NOT_VALID
                                        });
                                    } else {

                                        if (req.body.web == 1) {
                                            var pictureData_buffer = fs.readFileSync("'https://www.goingatob.com/stripedoc/5a7e7ad20893421e40dde4c0zF3Bs6G48W.jpg");

                                        } else {
                                            var pictureData = req.body.document;
                                            var pictureData_buffer = new Buffer(pictureData, 'base64');
                                            // var pictureData_buffer = fs.readFileSync(req.files[0].path);

                                        }
                                        stripe.fileUploads.create({
                                            file: {
                                                data: pictureData_buffer,
                                                name: "document.jpg",
                                                type: "application/octet-stream",
                                            },
                                            purpose: "identity_document",
                                        }, function (err, fileUpload) {
                                            var err = err;
                                            if (err || !fileUpload) {
                                                res.json({
                                                    success: false,
                                                    stripe_error: err.message,
                                                    error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_ADD_STRIPE_DOCUMENT
                                                });
                                            } else {
                                                var dob = req.body.dob;
                                                dob = dob.split('-');
                                                // console.log(req.body);   
                                                var phone_number = provider.country_phone_code + provider.phone ;
                                                                                                                                
                                                stripe.accounts.create({
                                                    type: 'custom',
                                                    country: "US", // country_detail.alpha2
                                                    email: provider.email,
                                                    requested_capabilities: ['card_payments'],
                                                    business_type : req.body.account_holder_type,
                                                    business_profile: {
                                                        mcc: "1520",
                                                        name: null,
                                                        product_description: "We sell courier/transportation services to passengers, and we charge once the job is complete",
                                                        support_email: provider.email,
                                                        support_phone: phone_number
                                                    },
                                                    individual: {
                                                        first_name: provider.first_name,
                                                        last_name: provider.last_name,
                                                        email: provider.email,
                                                        ssn_last_4: req.body.personal_id_number,
                                                        phone : phone_number,
                                                        gender: req.body.gender,
                                                        dob: {
                                                            day: dob[0],
                                                            month: dob[1],
                                                            year: dob[2]
                                                        },
                                                        address: {
                                                            city: provider.city,
                                                            country: "US",
                                                            line1: req.body.address,
                                                            line2:req.body.address,
                                                            postal_code: req.body.postal_code,
                                                            state: req.body.state,
                                                        },
                                                        verification: {
                                                            document : {
                                                                back : fileUpload.id
                                                                // front : fileUpload.id
                                                            }
                                                        }
                                                    }
                                                }, function (err, account) {
                                                    var err = err;
                                                    if (err || !account) {
                                                        res.json({
                                                            success: false,
                                                            stripe_error: err.message,
                                                            error_code: error_message.ERROR_CODE_FOR_ACCOUNT_DETAIL_NOT_VALID
                                                        });
                                                    } else {
                                                        stripe.accounts.createExternalAccount(
                                                            account.id,
                                                            {
                                                                external_account: token.id,
                                                                default_for_currency: true
                                                            },
                                                            function (err, bank_account) {
                                                                var err = err;
                                                                if (err || !bank_account) {
                                                                    res.json({
                                                                        success: false,
                                                                        stripe_error: err.message,
                                                                        error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_ADD_BANK_DETAIL_PLEASE_RETRY
                                                                    });

                                                                } else {
                                                                    provider.account_id = account.id;
                                                                    provider.bank_id = bank_account.id;
                                                                    provider.save();
                                                                    stripe.accounts.update(
                                                                        account.id,
                                                                        {
                                                                            tos_acceptance: {
                                                                                date: Math.floor(Date.now() / 1000),
                                                                                ip: req.connection.remoteAddress // Assumes you're not using a proxy
                                                                            }
                                                                        }, function (err, update_bank_account) {

                                                                            if (err || !update_bank_account) {
                                                                                var err = err;
                                                                                res.json({
                                                                                    success: false,
                                                                                    stripe_error: err.message,
                                                                                    error_code: error_message.ERROR_CODE_FOR_PROVIDER_BANK_DETAIL_ARE_NOT_VERIFIED
                                                                                });
                                                                            } else {
                                                                                res.json({
                                                                                    success: true,
                                                                                    message: error_message.MESSAGE_CODE_FOR_PROVIDER_BANK_DETAIL_ADDED_SUCCESSFULLY
                                                                                });
                                                                            }
                                                                        });
                                                                }
                                                            }
                                                        );
                                                    }
                                                });
                                            }
                                        });
                                    }

                                });
                            }
                        });

                    }

                } else {
                    console.log("------1010101------");
                    res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});

                }
            });
        } else {
            console.log("------121212------");
            res.json({
                success: false,
                error_code: response.error_code,
                error_description: response.error_description
            });
        }
    });

};

exports.add_bank_detail_web = function (req, res) {

    utils.check_request_params(req.body, [{name: 'provider_id', type: 'string'},{name: 'account_holder_name', type: 'string'},{name: 'account_holder_type', type: 'string'},
        {name: 'password', type: 'string'},{name: 'social_unique_id', type: 'string'},{name: 'routing_number', type: 'string'},
        {name: 'dob', type: 'string'},{name: 'personal_id_number', type: 'string'},{name: 'business_name', type: 'string'},
        {name: 'account_holder_type', type: 'string'},{name: 'account_number', type: 'string'}], function (response) {
        if (response.success) {
            var crypto = require('crypto');
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {

                if (provider) {
                    if (req.body.web == 1) {
                        if (req.files != null || req.files != 'undefined') {
                            var image_name = provider._id + utils.tokenGenerator(10);
                            var url = utils.getImageFolderPath(req, 10) + image_name + '.jpg';
                            provider.stripe_doc = url;
                            utils.saveImageFromBrowserStripe(req.files[0].path, image_name + '.jpg', 10, function (response) {
                                if (response) {
                                    provider.save().then(() => {
                                    }, (err) => {
                                        console.log(err);
                                    });
                                }
                            });
                        }
                    }

                    function stripedoc() {
                        var password = req.body.password;
                        var hash = crypto.createHash('md5').update(password).digest('hex');

                        if (provider.password !== hash) {
                            res.json({
                                success: false,
                                error_code: error_message.ERROR_CODE_YOUR_PASSWORD_IS_NOT_MATCH_WITH_OLD_PASSWORD
                            });

                        } else {
                            Country.findOne({"countryname": provider.country}).then((country_detail) => {

                                if (!country_detail) {
                                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_ADD_BANK_DETAIL_PLEASE_RETRY
                                    });
                                } else {
                                    Settings.findOne({}, function (err, setting_data) {
                                        var stripe = require("stripe")(setting_data.stripe_secret_key);
                                        // var stripe = require("stripe")('sk_test_raNORnPmKIHYorwC2P16n0Z2');

                                        stripe.tokens.create({
                                            bank_account: {
                                                country: "US", // country_detail.alpha2
                                                currency: "USD",
                                                account_holder_name: req.body.account_holder_name,
                                                account_holder_type: req.body.account_holder_type,
                                                routing_number: req.body.routing_number,
                                                account_number: req.body.account_number
                                            }
                                        }, function (err, token) {

                                            if (req.body.web == 1) {
                                                var path = require("path");
                                                var pictureData_buffer = fs.readFileSync(path.join(__dirname, '../../data/' + provider.stripe_doc));

                                            } else {
                                                var pictureData = req.body.document;
                                                var pictureData_buffer = new Buffer(pictureData, 'base64');
                                            }
                                            stripe.fileUploads.create({
                                                file: {
                                                    data: pictureData_buffer,
                                                    name: "document.jpg",
                                                    type: "application/octet-stream",
                                                },
                                                purpose: "identity_document",
                                            }, function (err, fileUpload) {
                                                var err = err;

                                                if (err || !fileUpload) {
                                                    res.json({
                                                        success: false,
                                                        stripe_error: err.message,
                                                        error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_ADD_STRIPE_DOCUMENT
                                                    });
                                                } else {
                                                    var dob = req.body.dob
                                                    dob = dob.split('-');
                                                    stripe.accounts.create({
                                                        type: 'custom',
                                                        country: "US",
                                                        email: provider.email,
                                                        legal_entity: {
                                                            first_name: provider.first_name,
                                                            last_name: provider.last_name,
                                                            personal_id_number: req.body.personal_id_number,
                                                            business_name: req.body.business_name,
                                                            business_tax_id: provider.tax_id,
                                                            dob: {
                                                                day: dob[0],
                                                                month: dob[1],
                                                                year: dob[2]
                                                            },
                                                            type: req.body.account_holder_type,
                                                            address: {
                                                                city: provider.city,
                                                                country: provider.counrty,
                                                                line1: provider.line1,
                                                                line2: provider.line2
                                                            },
                                                            verification: {
                                                                document: fileUpload.id
                                                            }
                                                        }
                                                    }, function (err, account) {
                                                        var err = err;

                                                        if (err || !account) {
                                                            res.json({
                                                                success: false,
                                                                stripe_error: err.message,
                                                                error_code: error_message.ERROR_CODE_FOR_ACCOUNT_DETAIL_NOT_VALID
                                                            });
                                                        } else {

                                                            stripe.accounts.createExternalAccount(
                                                                account.id,
                                                                {
                                                                    external_account: token.id,
                                                                    default_for_currency: true
                                                                },
                                                                function (err, bank_account) {
                                                                    var err = err;

                                                                    if (err || !bank_account) {
                                                                        res.json({
                                                                            success: false,
                                                                            stripe_error: err.message,
                                                                            error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_ADD_BANK_DETAIL_PLEASE_RETRY
                                                                        });
                                                                    } else {
                                                                        provider.account_id = account.id;
                                                                        provider.bank_id = bank_account.id;
                                                                        provider.save().then(() => {
                                                                        }, (err) => {
                                                                            console.log(err);
                                                                        });

                                                                        stripe.accounts.update(
                                                                            account.id,
                                                                            {
                                                                                tos_acceptance: {
                                                                                    date: Math.floor(Date.now() / 1000),
                                                                                    ip: req.connection.remoteAddress // Assumes you're not using a proxy
                                                                                }
                                                                            }, function (err, update_bank_account) {

                                                                                if (err || !update_bank_account) {
                                                                                    var err = err;

                                                                                    res.json({
                                                                                        success: false,
                                                                                        stripe_error: err.message,
                                                                                        error_code: error_message.ERROR_CODE_FOR_PROVIDER_BANK_DETAIL_ARE_NOT_VERIFIED
                                                                                    });
                                                                                } else {
                                                                                    message = "Bank Detail Added Successfully";
                                                                                    res.redirect('/provider_payments');
                                                                                }
                                                                            });
                                                                    }
                                                                }
                                                            );
                                                        }
                                                        // asynchronously called
                                                    });
                                                }
                                            });

                                            // asynchronously called
                                        });
                                    });
                                }
                            });
                        }

                    }
                    ;

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

exports.get_bank_detail = function (req, res) {

    utils.check_request_params(req.body, [], function (response) {
        if (response.success) {
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {

                if (provider) {
                    if (req.body.token != null && provider.token != req.body.token) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
                    } else {
                        var stripe = require("stripe")(setting_detail.stripe_secret_key);
                        stripe.accounts.retrieveExternalAccount(
                            provider.account_id,
                            provider.bank_id,
                            function (err, external_account) {
                                var err = err;

                                if (err || !external_account) {
                                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_GET_BANK_DETAIL,
                                        stripe_error: err.message
                                    });
                                } else {

                                    res.json({
                                        success: true,
                                        message: success_messages.MESSAGE_CODE_FOR_PROVIDER_BANK_DETAIL_GET_SUCCESSFULLY,
                                        bankdetails: {
                                            account_number: external_account.last4,
                                            routing_number: external_account.routing_number,
                                            account_holder_name: external_account.account_holder_name,
                                            account_holder_type: external_account.account_holder_type,
                                        }
                                    });
                                }
                            }
                        );
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

exports.delete_bank_detail = function (req, res) {

    utils.check_request_params(req.body, [], function (response) {
        if (response.success) {
            var social_id = req.body.social_unique_id;
            var encrypted_password = req.body.password;
            encrypted_password = utils.encryptPassword(encrypted_password);
            Provider.findOne({_id: req.body.provider_id}).then((provider) => {

                if (provider) {
                    if (social_id == undefined || social_id == null || social_id == "") {
                        social_id = null;
                    }
                    if (social_id == null && encrypted_password != "" && encrypted_password != provider.password) {
                        res.json({
                            success: false,
                            error_code: error_message.ERROR_CODE_YOUR_PASSWORD_IS_NOT_MATCH_WITH_OLD_PASSWORD
                        });
                    } else if (social_id != null && provider.social_unique_id != social_id) {
                        res.json({success: false, error_code: 100});
                    } else {
                        var stripe = require("stripe")(setting_detail.stripe_secret_key);

                        stripe.accounts.del(provider.account_id, function (err, test) {
                            var err = err;
                            if (err || !test) {
                                res.json({
                                    success: false,
                                    stripe_error: err.message,
                                    error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_DELETED_BANK_DETAIL_PLEASE_RETRY
                                });
                            } else {
                                provider.account_id = "";
                                provider.bank_id = "";
                                provider.save().then(() => {
                                    res.json({
                                        success: true,
                                        message: success_messages.MESSAGE_CODE_FOR_PROVIDER_BANK_DETAIL_DELETED_SUCCESSFULLY
                                    });
                                }, (err) => {
                                    console.log(err);
                                    res.json({
                                        success: false,
                                        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
                                    });
                                });
                            }

                        })
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


exports.add_bank_detail_new_old = function (req, res) {
    
    Provider.findOne({_id: req.body.provider_id}).then((provider) => {
        if (provider) {
            if (req.body.web == 1) {
                if (req.files != null || req.files != 'undefined') {
                    var image_name = provider._id + utils.tokenGenerator(10);
                    var url = utils.getImageFolderPath(req, 10) + image_name + '.jpg';
                    provider.stripe_doc = url;
                    utils.saveImageFromBrowser(req.files[0].path, image_name + '.jpg', 10);
                    provider.save().then(() => {
                    }, (err) => {
                        console.log(err);
                    });

                }
            }
            if (req.body.token != null && provider.token != req.body.token) {
                res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_TOKEN});
            } else {
                var password = req.body.password;
                var encrypt_password = utils.encryptPassword(password);

                if (provider.password !== encrypt_password) {
                    res.json({
                        success: false,
                        error_code: error_message.ERROR_CODE_YOUR_PASSWORD_IS_NOT_MATCH_WITH_OLD_PASSWORD
                    });

                } else {

                    Country.findOne({"countryname": provider.country}).then((country_detail) => {

                        if (err || !country_detail) {
                            res.json({
                                success: false,
                                error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_ADD_BANK_DETAIL_PLEASE_RETRY
                            });
                        } else {

                            var stripe = require("stripe")(setting_detail.stripe_secret_key);
                            stripe.tokens.create({
                                bank_account: {
                                    country: "US", // country_detail.alpha2
                                    currency: "USD",
                                    account_holder_name: req.body.account_holder_name,
                                    account_holder_type: req.body.account_holder_type,
                                    routing_number: req.body.routing_number,
                                    account_number: req.body.account_number
                                }
                            }, function (err, token) {
                                if (err) {
                                    var err = err;
                                    res.json({
                                        success: false,
                                        stripe_error: err.message,
                                        error_code: error_message.ERROR_CODE_FOR_ACCOUNT_DETAIL_NOT_VALID
                                    });
                                } else {

                                    if (req.body.web == 1) {
                                        var pictureData_buffer = fs.readFileSync("'https://www.goingatob.com/stripedoc/5a7e7ad20893421e40dde4c0zF3Bs6G48W.jpg");

                                    } else {
                                        var pictureData = req.body.document;
                                        var pictureData_buffer = new Buffer(pictureData, 'base64');

                                    }
                                    stripe.fileUploads.create({
                                        file: {
                                            data: pictureData_buffer,
                                            name: "document.jpg",
                                            type: "application/octet-stream",
                                        },
                                        purpose: "identity_document",
                                    }, function (err, fileUpload) {
                                        var err = err;
                                        if (err || !fileUpload) {
                                            res.json({
                                                success: false,
                                                stripe_error: err.message,
                                                error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_ADD_STRIPE_DOCUMENT
                                            });
                                        } else {
                                            var dob = req.body.dob
                                            dob = dob.split('-');
                                            stripe.accounts.create({
                                                type: 'custom',
                                                country: "US", // country_detail.alpha2
                                                email: provider.email,
                                                legal_entity: {
                                                    first_name: provider.first_name,
                                                    last_name: provider.last_name,
                                                    personal_id_number: req.body.personal_id_number,
                                                    business_name: req.body.business_name,
                                                    business_tax_id: provider.tax_id,
                                                    dob: {
                                                        day: dob[0],
                                                        month: dob[1],
                                                        year: dob[2]
                                                    },
                                                    type: req.body.account_holder_type,
                                                    address: {
                                                        city: provider.city,
                                                        country: provider.counrty,
                                                        line1: provider.address,
                                                        line2: provider.address
                                                    },
                                                    verification: {
                                                        document: fileUpload.id
                                                    }
                                                }
                                            }, function (err, account) {
                                                var err = err;
                                                if (err || !account) {
                                                    res.json({
                                                        success: false,
                                                        stripe_error: err.message,
                                                        error_code: error_message.ERROR_CODE_FOR_ACCOUNT_DETAIL_NOT_VALID
                                                    });
                                                } else {
                                                    stripe.accounts.createExternalAccount(
                                                        account.id,
                                                        {
                                                            external_account: token.id,
                                                            default_for_currency: true
                                                        },
                                                        function (err, bank_account) {
                                                            var err = err;
                                                            if (err || !bank_account) {
                                                                res.json({
                                                                    success: false,
                                                                    stripe_error: err.message,
                                                                    error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_ADD_BANK_DETAIL_PLEASE_RETRY
                                                                });

                                                            } else {
                                                                provider.account_id = account.id;
                                                                provider.bank_id = bank_account.id;
                                                                provider.save();
                                                                stripe.accounts.update(
                                                                    account.id,
                                                                    {
                                                                        tos_acceptance: {
                                                                            date: Math.floor(Date.now() / 1000),
                                                                            ip: req.connection.remoteAddress // Assumes you're not using a proxy
                                                                        }
                                                                    }, function (err, update_bank_account) {

                                                                        if (err || !update_bank_account) {
                                                                            var err = err;
                                                                            res.json({
                                                                                success: false,
                                                                                stripe_error: err.message,
                                                                                error_code: error_message.ERROR_CODE_FOR_PROVIDER_BANK_DETAIL_ARE_NOT_VERIFIED
                                                                            });
                                                                        } else {
                                                                            res.json({
                                                                                success: true,
                                                                                message: success_messages.MESSAGE_CODE_FOR_PROVIDER_BANK_DETAIL_ADDED_SUCCESSFULLY
                                                                            });
                                                                        }
                                                                    });
                                                            }
                                                        }
                                                    );
                                                }

                                            });
                                        }
                                    });
                                }

                            });
                        }
                    });
                }
            }
        } else {
            res.json({success: false, error_code: error_message.ERROR_CODE_PROVIDER_DETAIL_NOT_FOUND});
        }
    });
};
//// ADD BANK DETAIL USING POST SERVICE 
exports.add_bank_detail_old = function (req, res) {
    var bank_detail_count = 1;
    bank_detail.findOne({}, function (err, detail_count) {

        if (detail_count) {
            bank_detail_count = detail_count.unique_id + 1;
        }
        var bankdetail = new bank_detail({
            bank_holder_type: req.body.bank_holder_type,
            bank_holder_id: req.body.bank_holder_id,
            unique_id: bank_detail_count,
            bank_name: req.body.bank_name,
            bank_branch: req.body.bank_branch,
            bank_account_number: req.body.bank_account_number,
            bank_account_holder_name: req.body.bank_account_holder_name,
            bank_beneficiary_address: req.body.bank_beneficiary_address,
            bank_unique_code: req.body.bank_unique_code,
            bank_swift_code: req.body.bank_swift_code,
            is_updated: 0
        });

        if (req.body.bank_holder_type == Number(constant_json.PROVIDER_UNIQUE_NUMBER)) {
            Provider.findOne({_id: req.body.bank_holder_id}, function (err, provider) {
                if (provider) {
                    var crypto = require('crypto');
                    var password = req.body.password;
                    var hash = crypto.createHash('md5').update(password).digest('hex');
                    if (provider.password !== hash) {
                        res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_PASSWORD});
                    } else {
                        bankdetail.save(function (err) {
                            if (err) {
                                res.json({
                                    success: false,
                                    error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_ADD_BANK_DETAIL_PLEASE_RETRY
                                }); //
                            } else {
                                res.json({
                                    success: true,
                                    message: success_messages.MESSAGE_CODE_FOR_PROVIDER_BANK_DETAIL_ADDED_SUCCESSFULLY,
                                    bankdetail: bankdetail
                                });

                            }

                        });

                    }

                } else {
                    res.json({success: false, error_code: error_message.ERROR_CODE_NOT_GET_YOUR_DETAIL});

                }

            });

        } else {
            res.json({success: false, error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_ADD_BANK_DETAIL_PLEASE_RETRY});
        }

    }).sort({_id: -1}).limit(1);
};


//////////// UPDATE BANK DETAIL
exports.update_bank_detail_old = function (req, res) {
    var id = req.body._id;
    if (req.body.bank_holder_type == Number(constant_json.PROVIDER_UNIQUE_NUMBER)) {
        Provider.findOne({_id: req.body.bank_holder_id}, function (err, provider) {
            if (provider) {
                var crypto = require('crypto');
                var password = req.body.password;
                var hash = crypto.createHash('md5').update(password).digest('hex');

                if (provider.password !== hash) {
                    res.json({success: false, error_code: error_message.ERROR_CODE_INVALID_PASSWORD});
                } else {
                    bank_detail.findOneAndUpdate({_id: id}, req.body, {new: true}, function (error, bankdetail) {
                        bankdetail.is_updated = 1;
                        bankdetail.save(function (err) {
                            if (err) {
                                res.json({
                                    success: false,
                                    error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_UPDATE_BANK_DETAIL_PLEASE_RETRY
                                });
                            } else {
                                res.json({
                                    success: true,
                                    message: success_messages.MESSAGE_CODE_FOR_PROVIDER_BANK_DETAIL_UPDATED_SUCCESSFULLY
                                });
                            }
                        });

                    });
                }

            } else {
                res.json({
                    success: false,
                    error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_UPDATE_BANK_DETAIL_PLEASE_RETRY
                });

            }

        });
    } else {
        res.json({success: false, error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_UPDATE_BANK_DETAIL_PLEASE_RETRY});

    }
};

/////// GET BANK DETAIL 
exports.get_bank_detail_old = function (req, res) {
    bank_detail.findOne({
        bank_holder_type: req.body.bank_holder_type,
        bank_holder_id: req.body.bank_holder_id
    }, function (err, bankdetails) {
        if (err || !bankdetails) {
            res.json({success: false, error_code: error_message.ERROR_CODE_FOR_PROBLEM_IN_GET_BANK_DETAIL});
        } else {
            res.json({
                success: true,
                message: success_messages.MESSAGE_CODE_FOR_PROVIDER_BANK_DETAIL_GET_SUCCESSFULLY,
                bankdetails: bankdetails
            });
        }
    });
};