var utils = require('./utils');
require('./constant');
var Card = require('mongoose').model('Card');
var Citytype = require('mongoose').model('city_type');
var moment = require('moment');
var moment_timezone = require('moment-timezone');
var nodemailer = require('nodemailer');
var fs = require("fs");
var twilio = require('twilio');
var SmsDetail = require('mongoose').model('sms_detail');
var Settings = require('mongoose').model('Settings');
var Wallet_history = require('mongoose').model('Wallet_history');
var Document = require('mongoose').model('Document');
var User_Document = require('mongoose').model('User_Document');
var Provider_Document = require('mongoose').model('Provider_Document');
var Transfer_History = require('mongoose').model('transfer_history');
var AWS = require('aws-sdk');
var console = require('./console');
config_json = require('config.json')('./../admin_panel_string.json');
constant_json = require('config.json')('./../constants.json');
var Provider = require('mongoose').model('Provider');

exports.debug_log = function(key, value){
    var is_debug = true;
    if(is_debug){
        console.log(key+":"+ value)
    }
}

exports.error_response = function(err, res){
    console.log(err);
    res.json({
        success: false,
        error_code: error_message.ERROR_CODE_SOMETHING_WENT_WRONG
    });
}

exports.check_request_params = function (request_data_body, params_array, response) {
  var missing_param = '';
  var is_missing = false;
  var invalid_param = '';
  var is_invalid_param = false;
  if(request_data_body){
      params_array.forEach(function (param) {
        if(request_data_body[param.name] == undefined){
          missing_param = param.name;
          is_missing = true;
        } else {
          if(typeof request_data_body[param.name] !== param.type){
            is_invalid_param = true;
            invalid_param = param.name;
          }
        }
      });

      if(is_missing){
        response({success: false, error_code:  error_message.ERROR_CODE_PARAMETER_MISSING , error_description: missing_param+' parameter missing'});
      } else if(is_invalid_param){
        response({success: false, error_code:  error_message.ERROR_CODE_PARAMETER_INVALID, error_description: invalid_param+' parameter invalid'});
      }
      else {
        response({success: true});
      }
    }
      else {
        response({success: true});
      }
}

exports.check_request_params_for_web = function (request_data_body, params_array, response) {
  var missing_param = '';
  var is_missing = false;
  var invalid_param = '';
  var is_invalid_param = false;
  if(request_data_body){
      params_array.forEach(function (param) {
        if(request_data_body[param.name] == undefined){
          missing_param = param.name;
          is_missing = true;
        } else {
          if(typeof request_data_body[param.name] !== param.type){
            is_invalid_param = true;
            invalid_param = param.name;
          }
        }
      });

      if(is_missing){
        response({success: false, error_code:  error_message.PARAMETER_MISSING , error_description: missing_param+' parameter missing'});
      } else if(is_invalid_param){
        response({success: false, error_code:  error_message.PARAMETER_INVALID, error_description: invalid_param+' parameter invalid'});
      }
      else {
        response({success: true});
      }
  }
      else {
        response({success: true});
      }
}

exports.sendMassSMS = function (to, msg) {
    Settings.findOne({}, function (err, setting) {
        if (setting)
        {

            var twilio_account_sid = setting.twilio_account_sid;
            var twilio_auth_token = setting.twilio_auth_token;
            var twilio_number = setting.twilio_number;

            const twilio = require('twilio')(
                    twilio_account_sid,
                    twilio_auth_token
                    );
            const msg = 'test!';

            const numbers = ["+919278333185"];


            Promise.all(numbers.map(number => {
                    return twilio.messages.create({
                          to: number,
                          from: twilio_number,
                          body: msg
                    });
              })
                    ).then(messages => {
                    console.log('Messages sent!');
              }).catch(err => console.error(err));

//            if (twilio_account_sid != "" && twilio_auth_token != "" && twilio_number != "")
//            {
//                var client = new twilio.RestClient(twilio_account_sid, twilio_auth_token);
//
//                client.messages.create({
//                    body: msg,
//                    to: to, // Text this number
//                    from: twilio_number // From a valid Twilio number
//                }, function (err, message) {
//                    if (err) {
//                        console.error(err);
//                    } else {
//                        console.log("here send sms ... ... ...");
//                    }
//                });
//            }
        }
    });
};


exports.sendSMS = function (to, msg) {
    Settings.findOne({}, function (err, setting) {
        if (setting)
        {

            var twilio_account_sid = setting.twilio_account_sid;
            var twilio_auth_token = setting.twilio_auth_token;
            var twilio_number = setting.twilio_number;
            if (twilio_account_sid != "" && twilio_auth_token != "" && twilio_number != "")
            {
                var client = new twilio.RestClient(twilio_account_sid, twilio_auth_token);

                client.messages.create({
                    body: msg,
                    to: to, // Text this number
                    from: twilio_number // From a valid Twilio number
                }, function (err, message) {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log("here send sms ... ... ...");
                    }
                });

                /*var client = twilio(twilio_account_sid, twilio_auth_token, twilio_number);
                 
                 try {
                 client.sendMessage({
                 to: to,
                 from: twilio_number,
                 body: msg
                 });
                 console.log("send sms ... ... ...");
                 
                 } catch (error) {
                 console.error(error);
                 }*/
            }
        }
    });
}

exports.sendSmsForOTPVerificationAndForgotPassword = function (phoneWithCode, smsID, extraParam) {
    SmsDetail.findOne({smsUniqueId: smsID}, function (err, sms_data) {
        var smsContent = sms_data.smsContent;
        if (smsID == 1 || smsID == 2 || smsID == 3) {
            smsContent = smsContent.replace("XXXXXX", extraParam);
        } else if (smsID == 7) {
            smsContent = smsContent.replace("%USERNAME%", extraParam[0]).replace("%PROVIDERNAME%", extraParam[1]).replace("%PICKUPADD%", extraParam[2]).replace("%DESTINATIONADD%", extraParam[3]);
        }

        utils.sendSMS(phoneWithCode, smsContent);
    });
};

exports.sendOtherSMS = function (phoneWithCode, smsID, extraParam) {
    SmsDetail.findOne({smsUniqueId: smsID}, function (err, sms_data) {
        utils.sendSMS(phoneWithCode, sms_data.smsContent);
    });
};

///////////////// SEND SMS TO EMERGENCY  CONTACT///////
exports.sendSmsToEmergencyContact = function (phoneWithCode, smsID, extraParam, url) {
    SmsDetail.findOne({smsUniqueId: smsID}, function (err, sms_data) {
        var smsContent = sms_data.smsContent;
        if (smsID == 8) {
            smsContent = smsContent.replace("%USERNAME%", extraParam);
            smsContent = smsContent + url;
        }

        utils.sendSMS(phoneWithCode, smsContent);
    });
};


/////////////////////////////////////////////////////

exports.mail_notification = function (to, sub, text, html) {
    console.log("--mail notification-")
    try {
        Settings.findOne({}, function (err, setting) {

            var email = setting.email;
            var password = setting.password;
            var smtp_configuration = {}
            console.log(email)
            console.log(password)
            console.log(setting.domain)
            console.log(to)
            if(setting.domain == 'gmail'){
                smtp_configuration = {
                    service: 'gmail',
                    auth: {
                        user: email, // Your email id
                        pass: password // Your password
                    }
                }
            } else {
                var secure = false;
                if(setting.smtp_port == 465){
                    secure = true;
                }

                smtp_configuration = {
                    host: setting.smtp_host,
                    port: setting.smtp_port,
                    secure: secure, 
                    auth: {
                        user: email, 
                        pass: password 
                    }
                }
            }
            var transporter = nodemailer.createTransport(smtp_configuration);
            var mailOptions = {
                from: email,
                to: to,
                subject: sub,
                text: text,
                html: html
            }
            console.log("html")
            console.log(html)
            transporter.sendMail(mailOptions, function (error, info) {
                console.log(error)
                console.log(info)
                if (error) {
                    console.error(error);
                } else {

                    console.log(info.response);
                };
            });
        });

    } catch (error) {
        console.error(error);
    }
};

////////////// TOKEN GENERATE ////////
exports.tokenGenerator = function (length) {

    if (typeof length == "undefined")
        length = 32;
    var token = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++)
        token += possible.charAt(Math.floor(Math.random() * possible.length));
    return token;

};

exports.generatorRandomChar = function (length) {

    if (typeof length == "undefined")
        length = 2;
    var token = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (var i = 0; i < length; i++)
        token += possible.charAt(Math.floor(Math.random() * possible.length));
    return token;
};




////////FOR Distance
exports.getDistanceFromTwoLocation = function (fromLocation, toLocation) {

    var lat1 = fromLocation[0];
    var lat2 = toLocation[0];
    var lon1 = fromLocation[1];
    var lon2 = toLocation[1];

    ///////  TOTAL DISTANCE ////

    var R = 6371; // km (change this constant to get miles)
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

///////////// FOR IOS CERTIFICATE //////

exports.getIosCertiFolderName = function (id) {
    switch (id) {
        case 1:// ios_push
            return 'ios_push/';

        default:
            break;
    }
};

exports.saveIosCertiFolderPath = function (id) {
    return './app/' + utils.getIosCertiFolderName(id);
};

exports.saveIosCertiFromBrowser = function (local_image_path, image_name, id) {
    var bf = new Buffer(100000);
    var file_new_path = utils.saveIosCertiFolderPath(id) + image_name;

    // start 31 march 
    fs.readFile(local_image_path, function (err, data) {
        fs.writeFile(file_new_path, data, 'binary', function (err) {
            if (err) {
            } else {
                fs.unlink(local_image_path);
                response = {
                    message: 'File uploaded successfully'
                };
            }
        });
    });
    // end 31 march 

//    fs.readFile(local_image_path, bf, 0, function (err, data) {
//        fs.writeFile(file_new_path, data, function (err) {
//            if (err) {
//            } else {
//                response = {
//                    message: 'File uploaded successfully'
//                };
//            }
//        });
//    });
};
/////////////////////////////////

var FOLDER_NAMES = ['user_profile', 'provider_profile', 'provider_document', 'service_type_images', 'service_type_map_pin_images',
    'partner_profile', 'partner_document'];

exports.FOLDER_NAMES = function (err) {
    return FOLDER_NAMES;
};

exports.getImageFolderName = function (id) {
    switch (id) {
        case 1: // user
            return 'user_profile/';
        case 2: // provider
            return 'provider_profile/';
        case 3: // provider
            return 'provider_document/';
        case 4: // provider
            return 'service_type_images/';
        case 5: // provider
            return 'service_type_map_pin_images/';
        case 6: //  web_images
            return 'web_images/';
        case 7: // partner
            return 'partner_profile/';
        case 8: // partner
            return 'partner_document/';
        case 9: // partner
            return 'user_document/';
        default:
            break;
    }
};

exports.getImageFolderPath = function (req, id) {
    //// return req.protocol + '://' + req.get('host') + utils.getImageFolderName(id);
    return utils.getImageFolderName(id);
};

exports.saveImageFolderPath = function (id) {

    if(setting_detail.is_use_aws_bucket){
        return utils.getImageFolderName(id);
    } else {
        return './data/' + utils.getImageFolderName(id);
    }
};

exports.saveImageFromBrowser = function (local_image_path, image_name, id) {
    var bf = new Buffer(100000);
    var file_new_path = utils.saveImageFolderPath(id) + image_name;

    if(setting_detail.is_use_aws_bucket) {
        AWS.config.update({accessKeyId: setting_detail.access_key_id, secretAccessKey: setting_detail.secret_key_id});
        fs.readFile(local_image_path, function (err, data) {
            var s3 = new AWS.S3();
            var base64data = new Buffer(data, 'binary');
            s3.putObject({
                Bucket: setting_detail.aws_bucket_name,
                Key: file_new_path,
                Body: base64data,
                ACL: 'public-read'
            }, function (resp, data) {
                // fs.unlink(local_image_path);
            });
        });
    } else {
        fs.readFile(local_image_path, function (err, data) {
            fs.writeFile(file_new_path, data, 'binary', function (err) {
                if (err) {
                } else {
                    // fs.unlink(local_image_path);
                    response = {
                        message: 'File uploaded successfully'
                    };
                }
            });
        });
    }
};


exports.saveImageAndGetURL = function (imageID, req, res, id) {
    var pictureData = req.body.pictureData;
    function decodeBase64Image(dataString) {
        res.pictureData = new Buffer(pictureData, 'base64');
        return res;
    }
    var urlSavePicture = utils.saveImageFolderPath(id);
    urlSavePicture = urlSavePicture + imageID + '.jpg';
    var imageBuffer = decodeBase64Image(pictureData);

    if(setting_detail.is_use_aws_bucket) {

        AWS.config.update({accessKeyId: setting_detail.access_key_id, secretAccessKey: setting_detail.secret_key_id});

        var s3 = new AWS.S3();
        s3.putObject({
            Bucket: setting_detail.aws_bucket_name,
            Key: urlSavePicture,
            Body: imageBuffer,
            ACL: 'public-read'
        }, function (resp, data) {
            fs.unlink(local_image_path);
        });

    } else {
        fs.writeFile(urlSavePicture, imageBuffer.pictureData, function (err) {
            // fs.unlink(imageID);
        });
    }

};

exports.deleteImageFromFolder = function (old_img_path, id) {


    if (old_img_path != "" || old_img_path != null) {
        var old_file_name = old_img_path.split('/');

        var fs = require('fs');
        var bf = new Buffer(100000);
        var http = require('http');

        var old_file_path = utils.saveImageFolderPath(id) + old_file_name[1];

        if(setting_detail.is_use_aws_bucket){
            AWS.config.update({accessKeyId: setting_detail.access_key_id, secretAccessKey: setting_detail.secret_key_id});
            var s3 = new AWS.S3();
            s3.deleteObject({
                Bucket: setting_detail.aws_bucket_name,
                Key: old_file_path
            },function (err,data){})
        } else {
            fs.unlink(old_file_path, function (err, file) {
                if (err) {
                    console.error(err);
                } else {
                    console.log('successfully remove image');
                }
            });
        }
    }

};



/// PAYMENT

exports.paymentCharge = function (userID, total, countryCurrency, paymentGateway) {
    var res = [0, "No Error", "No Message"];
    Card.findOne({user_id: userID, is_default: 1}, function (err, card) {
        if (!card) {
            Card.find({user_id: userID}, function (err, card) {
                if (err) {
                    res[0] = 0;
                    res[1] = err;
                    res[2] = utils.paymentError(err);

                    return res;
                } else {
                    card.foreach(function name(cardDetail) {
                        res = utils.paymentChargeFromCard(cardDetail, total, countryCurrency);
                        if (res[0] == 1) {

                            return res;
                        }
                    });
                }
            });
        } else if (card) {

            return utils.paymentChargeFromCard(card, total, countryCurrency);
        }
    });

};

exports.paymentChargeFromCard = function (card, total, countryCurrency) {
    var stripe = require("stripe")(constant_json.STRIPE_SECRET_KEY);
    var res = [0, "No Error", "No Message"];

    var charge = stripe.charges.create({
        amount: total * 100, //// amount in cents, again
        currency: countryCurrency,
        customer: card.customer_id

    }, function (err, charge) {
        if (charge) {
            res[0] = 1;
        } else {
            res[0] = 0;
            res[1] = err.type;
            res[2] = utils.paymentError(err);
        }

        return res;
    });
};


exports.getTimeDifferenceInDay = function (endDate, startDate) {

    var difference = 0;
    var startDateFormat = moment(startDate, constant_json.DATE_FORMAT);
    var endDateFormat = moment(endDate, constant_json.DATE_FORMAT);
    difference = endDateFormat.diff(startDateFormat, 'days')
    difference = (difference.toFixed(2));

    return difference;
};

// OTHER
exports.getTimeDifferenceInSecond = function (endDate, startDate) {

    var difference = 0;
    var startDateFormat = moment(startDate, constant_json.DATE_FORMAT);
    var endDateFormat = moment(endDate, constant_json.DATE_FORMAT);
    difference = endDateFormat.diff(startDateFormat, 'seconds')
    difference = (difference.toFixed(2));

    return difference;
};

exports.getTimeDifferenceInMinute = function (endDate, startDate) {

    var difference = 0;
    var startDateFormat = moment(startDate, constant_json.DATE_FORMAT);
    var endDateFormat = moment(endDate, constant_json.DATE_FORMAT);
    difference = endDateFormat.diff(startDateFormat, 'minutes')
    difference = (difference.toFixed(2));

    return difference;
};

exports.paymentError = function (err) {

    switch (err.type) {
        case 'StripeCardError':
            // A declined card error
            return "Your card's expiration year is invalid.";
        case 'RateLimitError':
            return "Too many requests made to the API too quickly";

        case 'StripeInvalidRequestError':
            return "Invalid parameters were supplied to Stripe's API";

        case 'StripeAPIError':
            return "An error occurred internally with Stripe's API";

        case 'StripeConnectionError':
            return "Some kind of error occurred during the HTTPS communication";

        case 'StripeAuthenticationError':
            return "You probably used an incorrect API key";

        default:
            return "Handle any other types of unexpected errors";
    }

};
exports.sendMassPushNotification = function (app_type, device_type, device_token, messageCode, soundFileName) {

    if (device_type == constant_json.PUSH_DEVICE_TYPE_ANDROID) {
        Settings.findOne({}, function (err, setting_data) {
            var android_provider_app_gcm_key = setting_data.android_provider_app_gcm_key;
            var android_user_app_gcm_key = setting_data.android_user_app_gcm_key;

            var gcm = require('node-gcm');
            var message = new gcm.Message();
            message.addData('message', messageCode);

            var regTokens = device_token;
            var sender_key;

            if (app_type == constant_json.PROVIDER_UNIQUE_NUMBER) {

                sender_key = android_provider_app_gcm_key;
            } else {
                sender_key = android_user_app_gcm_key;
            }

            /// Set up the sender with you API key
            var sender = new gcm.Sender(sender_key);
            /// Now the sender can be used to send messages
            try {
                sender.send(message, {registrationTokens: regTokens}, function (err, response) {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log(response);
                    }
                });
                sender.sendNoRetry(message, {topic: '/topics/global'}, function (err, response) {

                    if (err) {
                        console.error(err);
                    } else {
                        console.log(response);
                    }
                });
            } catch (error) {

                //throw error
                console.error(error);
            }

        });

    }

    ///////////// IOS PUSH NOTIFICATION ///////////
    if (device_type == constant_json.PUSH_DEVICE_TYPE_IOS) {
        if (device_token == "" || device_token == null) {
            console.log("IOS PUSH NOTIFICATION NOT SENT");
        } else {
            var apn = require("apn")
            var path = require('path');
            var apnError = function (err) {
                //throw err;
                console.log(err);
                console.log("IOS PUSH NOTIFICATION NOT SENT");
            }

            var cert_file_name;
            var ios_key_name;
            var ios_passphrase;

            Settings.findOne({}, function (err, setting) {
                var provider_passphrase = setting.provider_passphrase;
                var user_passphrase = setting.user_passphrase;

                if (app_type == constant_json.PROVIDER_UNIQUE_NUMBER) {
                    cert_file_name = constant_json.IOS_PROVIDER_CERT_FILE_NAME;
                    ios_key_name = constant_json.IOS_PROVIDER_KEY_FILE_NAME;
                    ios_passphrase = provider_passphrase;
                } else {
                    cert_file_name = constant_json.IOS_USER_CERT_FILE_NAME;
                    ios_key_name = constant_json.IOS_USER_KEY_FILE_NAME;
                    ios_passphrase = user_passphrase;
                }


                cert_file_name = path.join(constant_json.PUSH_CERTIFICATE_PATH, cert_file_name);
                ios_key_name = path.join(constant_json.PUSH_CERTIFICATE_PATH, ios_key_name);



                try
                {

                    var ios_certificate_mode = setting.ios_certificate_mode;
                    if (ios_certificate_mode == "production")
                    {
                        gateway = "gateway.push.apple.com";

                    } else
                    {
                        gateway = "gateway.sandbox.push.apple.com";
                    }
                    var options = {
                        cert: cert_file_name,
                        key: ios_key_name,
                        "passphrase": ios_passphrase,
                        "gateway": gateway,
                        "port": 2195,
                        "enhanced": true,
                        "cacheLength": 5
                    };
                    options.errorCallback = apnError;
                    var apnConnection = new apn.Connection(options);
                    var myDevice = new apn.Device(device_token[0]);
                    var note = new apn.Notification();
                    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                    note.badge = 1;
                    note.sound = soundFileName;
                    note.alert = {"loc-key": messageCode, "id": messageCode};
                    note.payload = {'messageFrom': 'Caroline'};
                    apnConnection.pushNotification(note, device_token);
                    //});
                } catch (err)
                {
                    //throw err;
                    console.log(err);
                    console.log("IOS PUSH NOTIFICATION NOT SENT");
                }

            });

        }
    }


};

exports.sendPushNotification = function (app_type, device_type, device_token, messageCode, soundFileName, extraParam) {

    if (device_type == constant_json.PUSH_DEVICE_TYPE_ANDROID) {
        Settings.findOne({}, function (err, setting_data) {
            var android_provider_app_gcm_key = setting_data.android_provider_app_gcm_key;
            var android_user_app_gcm_key = setting_data.android_user_app_gcm_key;
            console.log("ANDROID PUSH NOTIFICATION");
            var gcm = require('node-gcm');
            var message = new gcm.Message({
                priority: 'high',
            });
            message.addData('message', messageCode);
            if(extraParam){
                message.addData('extraParam', extraParam);
            }
            var regTokens = [device_token];
            var sender_key;

            if (app_type == constant_json.PROVIDER_UNIQUE_NUMBER) {

                sender_key = android_provider_app_gcm_key;
            } else {
                sender_key = android_user_app_gcm_key;
            }

            /// Set up the sender with you API key
            var sender = new gcm.Sender(sender_key);
            /// Now the sender can be used to send messages
            try {
                sender.send(message, {registrationTokens: regTokens}, function (err, response) {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log(response)
                    }
                });
                sender.sendNoRetry(message, {topic: '/topics/global'}, function (err, response) {

                    if (err)
                        console.error(err);
                    else
                    {
                        console.log(response)
                        
                    }
                });
            } catch (error) {
                //throw error;
                console.error(error);
            }

        });

    }

    ///////////// IOS PUSH NOTIFICATION ///////////
    if (device_type == constant_json.PUSH_DEVICE_TYPE_IOS) {
        if (device_token == "" || device_token == null) {
            console.log("IOS PUSH NOTIFICATION NOT SENT");
        } else {
            console.log("IOS PUSH NOTIFICATION");
            var apn = require("apn")
            var path = require('path');
            var apnError = function (err) {
                //throw err;
                console.log(err);
                console.log("IOS PUSH NOTIFICATION NOT SENT");
            }

            var cert_file_name;
            var ios_key_name;
            var ios_passphrase;

            Settings.findOne({}, function (err, setting) {
                var provider_passphrase = setting.provider_passphrase;
                var user_passphrase = setting.user_passphrase;

                if (app_type == constant_json.PROVIDER_UNIQUE_NUMBER) {
                    cert_file_name = constant_json.IOS_PROVIDER_CERT_FILE_NAME;
                    ios_key_name = constant_json.IOS_PROVIDER_KEY_FILE_NAME;
                    ios_passphrase = provider_passphrase;
                } else {
                    cert_file_name = constant_json.IOS_USER_CERT_FILE_NAME;
                    ios_key_name = constant_json.IOS_USER_KEY_FILE_NAME;
                    ios_passphrase = user_passphrase;
                }

                cert_file_name = path.join(constant_json.PUSH_CERTIFICATE_PATH, cert_file_name);
                ios_key_name = path.join(constant_json.PUSH_CERTIFICATE_PATH, ios_key_name);

                try
                {

                    var ios_certificate_mode = setting.ios_certificate_mode;
                    if (ios_certificate_mode == "production")
                    {
                        gateway = "gateway.push.apple.com";
                        console.log("gateway : " + gateway);

                    } else
                    {
                        gateway = "gateway.sandbox.push.apple.com";
                        console.log("gateway : " + gateway);
                    }
                    var options = {
                        cert: cert_file_name,
                        key: ios_key_name,
                        "passphrase": ios_passphrase,
                        "gateway": gateway,
                        "port": 2195,
                        "enhanced": true,
                        "cacheLength": 5
                    };
                    options.errorCallback = apnError;
                    var apnConnection = new apn.Connection(options);
                    var myDevice = new apn.Device(device_token);
                    var note = new apn.Notification();
                    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                    note.badge = 1;
                    note.sound = soundFileName;
                    if(extraParam){
                        note.alert = {"loc-key": messageCode, "id": messageCode, extraParam: extraParam};
                    } else {
                        note.alert = {"loc-key": messageCode, "id": messageCode};
                    }
                    note.payload = {'messageFrom': 'Caroline'};
                    apnConnection.pushNotification(note, myDevice);
                    //});
                } catch (err)
                {
                    //throw err;
                    console.log(err);
                    console.log("IOS PUSH NOTIFICATION NOT SENT");
                }

            });

        }
    }


};

var City_type = require('mongoose').model('city_type');
var Country = require('mongoose').model('Country');
var Trip = require('mongoose').model('Trip');
exports.updateNewTable = function () {
    Country.find({}, function (err, countries) {
        countries.forEach(function (country) {
            if (country.countrytimezone == "" && country.countrytimezone == undefined) {

                country.countrytimezone = country.country_all_timezone[0];
                country.save();
            }
        })
    });
}

var USER_TYPES = [
    {id: 0, name: "Normal"},
    {id: 1, name: "Corporate"},
    {id: 2, name: "Dispatcher"}
];

var PROVIDER_TYPES = [
    {id: 0, name: "Normal"},
    {id: 1, name: "Partner"}
];


// var TRIP_TYPES = [
//     {id: 0, name: config_json.TRIP_TYPE_NORMAL_STRING},
//     {id: 1, name: config_json.TRIP_TYPE_VISITOR_STRING}

// ];


var PAYMENT_TYPES = [
    {id: 10, name: "Stripe"}
    // { id: Number(process.env.PAYMENT_BY_PAYPAL), name: process.env.PAYMENT_BY_PAYPAL_STRING },
    //{ id: Number(process.env.PAYMENT_BY_BITCOIN), name: process.env.PAYMENT_BY_BITCOIN_STRING }

];










exports.USER_TYPES = function (err) {
    return USER_TYPES;
}

exports.PROVIDER_TYPES = function (err) {
    return PROVIDER_TYPES;
}

// exports.TRIP_TYPES = function (err) {
//     // console.log(trip_type_name);
//     return trip_types;
// }

exports.PAYMENT_TYPES = function (err) {
    return PAYMENT_TYPES;
}





/////////////////////////////////////////

var GoogleMapsAPI = require('googlemaps');
var request = require('request');


exports.getSmoothPath = function (main_path_location, response) {

    var size = main_path_location.length;
    var main_gap = 100;
    var new_result = '';

    if (size > 2) {

        if (size > main_gap) {
            var pre_point = main_path_location[0];
            var result = [];
            result.push(pre_point);
            var point = [];

            var start_index = 5;
            var end_index = size - start_index;

            for (var i = 0; i < size; i++) {
                point = main_path_location[i];

                if (i < start_index || i > end_index) {
                    result.push(point);
                } else if (utils.getDistanceFromTwoLocation(point, pre_point) > 0.01) {
                    pre_point = main_path_location[i];
                    result.push(point);
                }
            }

            size = result.length;

            var gap = (size / main_gap);
            var gap2 = Math.ceil(gap);
            var gap1 = Math.floor(gap);
            var x = (gap - gap1) * main_gap;
            var k = 0;

            for (var i = 0; i < size; ) {

                new_result = new_result + result[i][0] + "," + result[i][1] + "|";
                if (k <= x) {
                    // console.log(k + " " + gap2)
                    i = i + gap2;
                } else {
                    // console.log(k + " " + gap1)
                    i = i + gap1;
                }
                k++;
            }
            new_result = new_result.substring(0, new_result.length - 1);
            response(new_result);

            // return new_result
        } else if (size > 2) {
            for (var i = 0; i < size; i++) {
                new_result = new_result + main_path_location[i][0] + "," + main_path_location[i][1] + "|";
            }
            new_result = new_result.substring(0, new_result.length - 1);
            response(new_result);
        } else {
            response(new_result);
        }

    } else {
        response('');
    }
};

exports.bendAndSnap = function (points_in_string, location_length, bendAndSnapresponse) {

    var request = require('request');
    var base_url = "https://roads.googleapis.com/v1/snapToRoads?";

    if (points_in_string !== '' && location_length > 2)
    {
        Settings.findOne({}, function (err, setting_detail) {
            var google_key = setting_detail.road_api_google_key;
            if (google_key !== '' && google_key !== null && google_key !== undefined) {

                var path_cord = "path=" + points_in_string;
                var url = base_url + path_cord + "&interpolate=true&key=" + google_key;

                request(url, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        utils.processSnapToRoadResponse(body, function (finalRoadCoordinates) {

                            var cord_size = finalRoadCoordinates.length;
                            var temp_array = [];
                            var distance = 0;
                            var d = 0;
                            for (var i = 0; i < cord_size; i++) {
                                if (i != 0) {
                                    d = utils.getDistanceFromTwoLocation(finalRoadCoordinates[i - 1], finalRoadCoordinates[i]);
                                }
                                distance = +distance + +d;
                                temp_array.push(finalRoadCoordinates[i]);
                                if (i == cord_size - 1) {
                                    bendAndSnapresponse({temp_array: temp_array, distance: distance})

                                }
                            }
                        });
                    } else {
                        bendAndSnapresponse(null)
                    }
                });
            } else {
                bendAndSnapresponse(null)
            }
        })
    } else {
        bendAndSnapresponse(null)
    }
};

exports.processSnapToRoadResponse = function (data, SnapRoadResponse) {
    var finalRoadCoordinates = [];
    var snappedPoints = [];
    try {
        snappedPoints = (JSON.parse(data)).snappedPoints;
        var size = snappedPoints.length;
        for (var i = 0; i < size; i++) {

            finalRoadCoordinates.push([snappedPoints[i].location.latitude, snappedPoints[i].location.longitude]);

            if (i == size - 1) {
                SnapRoadResponse(finalRoadCoordinates)
            }
        }
    } catch (exception) {
        snappedPoints = [];
        SnapRoadResponse(snappedPoints)
    }

};


exports.precisionRoundTwo = function (number) {
    return utils.precisionRound(number, 2);
};

exports.precisionRound = function (number, precision) {
    var factor = Math.pow(10, precision);
    return Math.round(number * factor) / factor;
};



// add_wallet_history
exports.addWalletHistory = function (user_type, user_unique_id, user_id, country_id, from_currency_code, to_currency_code,
        current_rate, from_amount, wallet_amount, wallet_status, wallet_comment_id, wallet_description) {
    var wallet_payment_in_user_currency = 0;
    var total_wallet_amount = 0;

    if (wallet_status % 2 == 0)
    {
        wallet_payment_in_user_currency = utils.precisionRoundTwo(from_amount / current_rate);

        total_wallet_amount = wallet_amount - wallet_payment_in_user_currency;
    } else
    {
        current_rate = 1 / current_rate;
        wallet_payment_in_user_currency = utils.precisionRoundTwo(from_amount * current_rate);

        total_wallet_amount = +wallet_amount + +wallet_payment_in_user_currency;

    }
    total_wallet_amount = utils.precisionRoundTwo(total_wallet_amount);


    var wallet_data = new Wallet_history({
        user_type: user_type,
        user_unique_id: user_unique_id,
        user_id: user_id,
        country_id: country_id,

        from_currency_code: from_currency_code,
        from_amount: from_amount,
        to_currency_code: to_currency_code,
        current_rate: utils.precisionRound(current_rate, 4),

        wallet_amount: wallet_amount,
        added_wallet: wallet_payment_in_user_currency,
        total_wallet_amount: total_wallet_amount,
        wallet_status: wallet_status,
        wallet_comment_id: wallet_comment_id,
        wallet_description: wallet_description
    });

    wallet_data.save();
    return total_wallet_amount;
};



exports.get_date_in_city_timezone = function (date, timezone) {
//    console.log("*   *   *   *   *   *");

    var convert_date = new Date(date);
    var zone_time_diff = moment_timezone.tz.zone(timezone).utcOffset(moment_timezone.utc());

    convert_date.setMinutes(convert_date.getMinutes() + zone_time_diff);
    convert_date = new Date(convert_date);
    return convert_date;
};



exports.get_date_in_utc_from_city_date = function (date, timezone) { // use when you convert date to UTC time zone
    var convert_date = new Date(date);
    var zone_time_diff = moment_timezone.tz.zone(timezone).utcOffset(moment_timezone.utc());
    convert_date.setMinutes(convert_date.getMinutes() + zone_time_diff);
    convert_date = new Date(convert_date);
    return convert_date;
};

exports.get_date_now_at_city = function (date, timezone) { // use when you convert date now to city timezone
    var convert_date = new Date(date);
    var zone_time_diff = moment_timezone.tz.zone(timezone).utcOffset(moment_timezone.utc());
    zone_time_diff = -1 * zone_time_diff;
    convert_date.setMinutes(convert_date.getMinutes() + zone_time_diff);
    convert_date = new Date(convert_date);
    return convert_date;
};




exports.set_google_road_api_locations = function (tripLocation) {
    Settings.findOne({}, function (err, setting_detail) {

        var google_key = setting_detail.road_api_google_key;
        if (google_key !== '' && google_key !== null && google_key !== undefined) {

            var index = tripLocation.index_for_that_covered_path_in_google;
            var startTripToEndTripLocations = tripLocation.startTripToEndTripLocations;
            var size = startTripToEndTripLocations.length;
            var gap = 95;

            var end_index = (index + 1) * gap; // 95 , 190 , 285
            var start_index = end_index - gap - 1; // -1 , 94  , 189
            if (start_index < 0) {
                start_index = 0;
            }

            if (size >= end_index) {
                var new_result = "";

                for (; start_index < end_index; start_index++) {
                    new_result = new_result + startTripToEndTripLocations[start_index][0] + "," + startTripToEndTripLocations[start_index][1] + "|";
                }
                new_result = new_result.substring(0, new_result.length - 1);

                utils.bendAndSnap(new_result, gap, function (response) {
                    if (response) {
                        utils.save_google_path_locations(tripLocation, response, gap);
                    } else {
                        // utils.set_google_road_api_locations(tripLocation);
                    }
                });
            }
        }
    });
};

exports.save_google_path_locations = function (tripLocation, response, gap) {
    var index = tripLocation.index_for_that_covered_path_in_google;
    var google_start_trip_to_end_trip_locations = tripLocation.google_start_trip_to_end_trip_locations;
    google_start_trip_to_end_trip_locations = google_start_trip_to_end_trip_locations.concat(response.temp_array);
    tripLocation.google_start_trip_to_end_trip_locations = google_start_trip_to_end_trip_locations;
    tripLocation.google_total_distance = +tripLocation.google_total_distance + +response.distance;
    index++;
    tripLocation.index_for_that_covered_path_in_google = index;
    tripLocation.save(function (err) {
        if (err) {
            utils.save_google_path_locations(tripLocation, response, gap);
        } else {
            var end_index = (index + 1) * gap;
            if (tripLocation.startTripToEndTripLocations.length >= end_index) {
                utils.set_google_road_api_locations(tripLocation);
            }
        }
    });
};


exports.getCurrencyConvertRate = function (from_amount, from_currency, to_currency, return_data) {

    var request = require('request');
    if (from_currency == to_currency)
    {
        return_data({success: true, current_rate: 1});
        return;
    }
    var base_url = "http://free.currencyconverterapi.com/api/v5/convert?";
    var tag = from_currency + "_" + to_currency;
    var url = base_url + "q=" + tag + "&compact=y&apiKey=sample-key-do-not-use";

    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            try {
                var json_obj = JSON.parse(body);
                var value = json_obj[tag]["val"];
                if (from_amount != 1) {
                    value = value * from_amount;
                }
                return_data({success: true, current_rate: utils.precisionRound(Number(value), 4)});
            } catch (err) {
                return_data({success: true, current_rate: 1});
            }

        } else {
            return_data({success: false});

        }
    });
};


exports.insert_documets_for_new_users = function (user, document_for, country_id, response) {

    Document.find({countryid: country_id, type: document_for}, function (err, document) {
        var is_document_uploaded = 1;
        var document_size = document.length;

        if (document_size !== 0) {
            var count = 0;
            for (var i = 0; i < document_size; i++) {
                if (document[i].option == 1) {
                    is_document_uploaded = 0;
                }
            }

            document.forEach(function (entry) {
                var userdocument = new User_Document({
                    user_id: user._id,
                    document_id: entry._id,
                    name: entry.title,
                    option: entry.option,
                    document_picture: "",
                    unique_code: "",
                    expired_date: null,
                    is_unique_code: entry.is_unique_code,
                    is_expired_date: entry.is_expired_date,
                    is_uploaded: 0
                });
                userdocument.save(function (err) {
                    if (err) {
                        throw err;
                    }
                });
            });
        }
        user.is_document_uploaded = is_document_uploaded;
        user.save();
        response({is_document_uploaded: is_document_uploaded})

    });
};

exports.insert_documets_for_new_providers = function (provider, document_for, country_id, response) {
    Document.find({countryid: country_id, type: document_for}, function (err, document) {
        var is_document_uploaded = 1;
        var document_size = document.length;
        if (document_size !== 0) {
            var count = 0;
            for (var i = 0; i < document_size; i++) {
                if (document[i].option == 1) {
                    is_document_uploaded = 0;
                }
            }
            document.forEach(function (entry) {
                var providerdocument = new Provider_Document({
                    provider_id: provider._id,
                    document_id: entry._id,
                    name: entry.title,
                    option: entry.option,
                    document_picture: "",
                    unique_code: "",
                    expired_date: null,
                    is_unique_code: entry.is_unique_code,
                    is_expired_date: entry.is_expired_date,
                    is_uploaded: 0
                });
                providerdocument.save(function (err) {
                });
            });
        }
        provider.is_document_uploaded = is_document_uploaded;
        provider.save();
        response({is_document_uploaded: is_document_uploaded})
    });
};


exports.saveImageFromBrowserStripe = function (local_image_path, image_name, id, response) {

    var bf = new Buffer(100000);
    var file_new_path = utils.saveImageFolderPath(id) + image_name;

    fs.readFile(local_image_path, function (err, data) {
        fs.writeFile(file_new_path, data, 'binary', function (err) {
            if (err) {
            } else {
                fs.unlink(local_image_path);
                var message = 'File uploaded successfully';
                // console.log(message);
                response(message);
            }
        });
    });
};

exports.pay_payment_for_selected_payment_gateway = function (user_type, user_id, payment_gateway_name, pay_amount, currency_code, return_data) {

    if (payment_gateway_name === PAYMENT_GATEWAY.stripe)
    {
        Card.findOne({user_type: user_type, user_id: user_id, is_default: true}, function (error, card) {
            if (card)
            {
                var stripe_key = setting_detail.stripe_secret_key;
                console.log("stripe_key :" + stripe_key);
                var stripe = require("stripe")(stripe_key);
                var customer_id = card.customer_id;
                var charge_amount = Math.ceil(pay_amount * 100);

                stripe.charges.create({
                    amount: charge_amount,
                    currency: currency_code,
                    customer: customer_id
                }, function (error, charge) {
                    console.log(error);
                    if (charge) {
                        var payment_response = {card_number: card.last_four};
                        return_data(payment_response);
                    } else {
                        return_data(null);
                    }
                });
            } else {
                return_data(null);
            }
        });
    } else {
        return_data(null);
    }
};




exports.encryptPassword = function (password) {
    var crypto = require('crypto');
    try {
        return  crypto.createHash('md5').update(password).digest('hex');
    } catch (error) {
        console.error(error);
    }

};



exports.generatePassword = function (length) {
    try {
        if (typeof length === "undefined")
            length = 6;
        var password = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < length; i++)
            password += possible.charAt(Math.floor(Math.random() * possible.length));
        return password;
    } catch (error) {
        console.error("error" + error);
    }
};


exports.generateOtp = function (length) {
    try {
        if (typeof length === "undefined")
            length = 32;
        var otpCode = "";
        var possible = "0123456789";
        for (var i = 0; i < length; i++)
            otpCode += possible.charAt(Math.floor(Math.random() * possible.length));
        return otpCode;
    } catch (error) {
        console.error(error);
    }

};

exports.add_transfered_history = function (type, type_id, country_id, amount, currency_code, transfer_status, transfer_id, transfered_by, error) {
    var transfer_history = new Transfer_History({
        user_type: type,
        user_id: type_id,
        country_id: country_id,
        amount: amount,
        currency_code: currency_code,
        transfer_status: transfer_status,
        transfer_id: transfer_id,
        transfered_by: transfered_by,
        error: error
    });
    transfer_history.save();
};


exports.stripe_auto_transfer = function (amount, account_id, currencycode, return_data) {

    var stripe_secret_key = setting_detail.stripe_secret_key;
    var stripe = require("stripe")(stripe_secret_key);
    if (amount > 0) {
        stripe.transfers.create({
            amount: Math.round(amount * 100),
            currency: currencycode,
            destination: account_id

        }, function (error, transfer) {
            if (error) {
                return_data({success: false, error: error});
            } else {
                return_data({success: true, transfer_id: transfer.id});
            }
        });
    }
};


exports.check_session_token = function (request_data_header, response) {
  var type = Number(request_data_header.type);
  var Table;
  switch (type) {
    case ADMIN_DATA_ID.ADMIN:
      type = ADMIN_DATA_ID.ADMIN;
      Table = Admin;
      break;
    case ADMIN_DATA_ID.USER:
      type = ADMIN_DATA_ID.USER;
      Table = User;
      break;
    default:
      type = ADMIN_DATA_ID.USER;
      Table = User;
      break;
  }
  Table.findOne({_id: request_data_header.id}, function (error, detail) {
    if(detail && detail.server_token == request_data_header.server_token){
      response({success: true, detail: detail});
    } else {
      if(detail){
        response({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN})
      } else {
        response({success: false, error_code: ERROR_CODE.DETAIL_NOT_FOUND})
      }
    }
  })
}

exports.remove_from_zone_queue = function(provider){
    Citytype.findOne({_id: provider.service_type}).then((city_type)=>{
        if(city_type && provider.in_zone_queue && provider.zone_queue_id){
            var index = city_type.total_provider_in_zone_queue.findIndex((x)=>(x.zone_queue_id).toString() == (provider.zone_queue_id).toString())
            if(index == -1){
                city_type.total_provider_in_zone_queue.push({zone_queue_id: provider.zone_queue_id, total_provider_in_zone_queue: 0})
            } else {
                city_type.total_provider_in_zone_queue[index].total_provider_in_zone_queue--;
                if(city_type.total_provider_in_zone_queue[index].total_provider_in_zone_queue < 0){
                    city_type.total_provider_in_zone_queue[index].total_provider_in_zone_queue = 0;
                }
            }
            city_type.markModified('total_provider_in_zone_queue');
            city_type.save();
            Provider.update({zone_queue_id: provider.zone_queue_id, zone_queue_no: {$gt: provider.zone_queue_no}, _id:{$ne: provider._id}} ,{'$inc': {zone_queue_no: -1}}, {multi: true}).then((providers)=>{
                provider.zone_queue_no = Math.max();
                provider.in_zone_queue = false;
                provider.zone_queue_id = null;
                provider.save();
            });
            
        }
    });
}

var Payment_Transaction = require('mongoose').model('Payment_Transaction');
var Type = require('mongoose').model('Type');
exports.payment_transaction = function(req, res){
    Payment_Transaction.findOne({}, function(error, payment_transaction_detail){
        if(payment_transaction_detail){
            if(payment_transaction_detail.is_schedule_payment){
                var months = 0;
                if(payment_transaction_detail.last_payment_date){
                    var current_date = new Date();
                    var last_payment_date = new Date(payment_transaction_detail.last_payment_date);
                    months = (current_date.getFullYear() - last_payment_date.getFullYear()) * 12;
                    months -= last_payment_date.getMonth() + 1;
                    months += current_date.getMonth();
                }
                if(!payment_transaction_detail.is_payment_paid || months>1){
                    var length = payment_transaction_detail.card_detail.length;
                    if(payment_transaction_detail.card_detail.length>0){
                        transaction(payment_transaction_detail, 0, res)
                    } else {
                        fail_transaction('Card Not Found', payment_transaction_detail, res)
                    }
                }
            }
        } else {
            var payment_transaction_detail = new Payment_Transaction({
                "stripe_public_key" : "pk_test_KtNyVyDoeogN5KDs9UzWMt5W",
                "stripe_secret_key" : "sk_test_raNORnPmKIHYorwC2P16n0Z2",
                "amount" : 500,
                "currency_code" : "USD",
                "is_schedule_payment" : false,
                "is_payment_paid" : true,
                "no_of_failed_transaction" : 0,
                "max_no_of_transaction" : 3,
                "transaction_detail" : [],
                "card_detail" : [],
                "is_stop_system" : false,
                "type_detail" : [],
                "last_payment_date": null
            });
            payment_transaction_detail.save(function(error){
                payment_transaction(req, res);
            })
        }
    })
}

function transaction(payment_transaction_detail , index, res){
    var card = payment_transaction_detail.card_detail[index];
    var stripe_key = payment_transaction_detail.stripe_secret_key;
    var stripe = require("stripe")(stripe_key);
    var customer_id = card.customer_id;
    var charge_amount = Math.ceil(payment_transaction_detail.amount * 100);

    stripe.charges.create({
        amount: charge_amount,
        currency: payment_transaction_detail.currency_code,
        customer: customer_id
    }, function (error, charge) {
        if (charge) {
            payment_transaction_detail.is_payment_paid = true;
            payment_transaction_detail.no_of_failed_transaction=0;
            payment_transaction_detail.transaction_detail.push({
                charge_id: charge.id,
                amount: payment_transaction_detail.amount,
                card: payment_transaction_detail.card_detail[index].last_four,
                customer_id: customer_id,
                date: new Date()
            });
            if(payment_transaction_detail.is_stop_system){
                payment_transaction_detail.is_stop_system = false;
                var type_detail = payment_transaction_detail.type_detail;
                type_detail.forEach(function(type_data){
                    if(type_data.is_business){
                        Type.findOneAndUpdate({_id: type_data.type_id}, {is_business: 1}, function(error, data){

                        })
                    }
                });
                payment_transaction_detail.type_detail = [];
            }
            payment_transaction_detail.last_payment_date = new Date();
            payment_transaction_detail.save(function(error){
                if(res){
                    res.redirect('payment_pending');
                }
            });
        } else {
            if(payment_transaction_detail.card_detail.length>index+1){
                transaction(payment_transaction_detail, index+1, res)
            } else {
                fail_transaction(error, payment_transaction_detail, res)
            }
        }
    });
 }

function fail_transaction(error, payment_transaction_detail, res){
    payment_transaction_detail.no_of_failed_transaction++;
    if(payment_transaction_detail.no_of_failed_transaction > payment_transaction_detail.max_no_of_transaction){

        if(!payment_transaction_detail.is_stop_system){
            var type_detail = [];
            Type.find({}, function(error, type){
                type.forEach(function(type_data, index){
                    type_detail.push({
                        type_id: type_data._id,
                        is_business: type_data.is_business
                    });
                });
                payment_transaction_detail.type_detail = type_detail;
                payment_transaction_detail.save();
                Type.update({}, {is_business: 0}, {multi: true}, function(error, type_detail){

                });
            });
        }
        payment_transaction_detail.is_stop_system = true;
    } else {
        payment_transaction_detail.is_stop_system = false;
        payment_transaction_detail.save();
    }
    if(res){
        res.redirect('payment_pending');
    }
}