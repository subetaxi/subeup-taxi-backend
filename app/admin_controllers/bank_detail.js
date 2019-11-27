var bank_detail = require('mongoose').model('bank_detail');
var Provider = require('mongoose').model('Provider');
var Partner = require('mongoose').model('Partner');
//// ADD BANK DETAIL USING POST SERVICE ///// 
var console = require('../controllers/console');
var utils = require('../controllers/utils');
exports.partner_bank_detail = function (req, res, next) {

    if (typeof req.session.partner != 'undefined') {
        utils.check_request_params_for_web(req.body, [], function (response) {
            if (response.success) {
                bank_detail.findOne({bank_holder_type: 4, bank_holder_id: req.session.partner._id}).then((bank_details) => {
                    if (!bank_details)
                    {
                        res.render('partner_add_bank_detail', {partners: req.session.partner});
                        delete message;
                    } else
                    {
                        res.render('partner_bank_detail', {detail: bank_details, partners: req.session.partner});
                        delete message;
                    }
                });
            } else {
            res.json(response);
            }
        });
    } else
    {
        res.redirect('/partner_login');
    }

};

exports.partner_provider_bank_detail = function (req, res, next) {


    var id = req.body.id;
    if (typeof req.session.partner != 'undefined') {
        utils.check_request_params_for_web(req.body, [], function (response) {
            if (response.success) {
                bank_detail.findOne({bank_holder_type: 11, bank_holder_id: id}).then((bank_details) => {

                    if (!bank_details)
                    {
                        res.render('partner_provider_bank_detail', {id: id, detail: ''});
                        delete message;
                    } else
                    {
                        res.render('partner_provider_bank_detail', {detail: bank_details, id: id});
                        delete message;
                    }

                });
            } else {
            res.json(response);
            }
        });
    } else
    {
        res.redirect('/partner_login');
    }

};



exports.admin_provider_bank_detail = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        utils.check_request_params_for_web(req.body, [], function (response) {
            if (response.success) {
                var id = req.body.id;
                Provider.findOne({_id: id}).then((provider) => {
                    if (!provider)
                    {
                        res.render('provider_bank_detail', {id: id, detail: ''});
                        delete message;
                    } else
                    {
                        res.render('provider_bank_detail', {detail: provider, id: id});
                        delete message;
                    }
                });
            } else {
                res.json(response);
            }
        });
    } else {
        res.redirect('/admin');
    }
};

exports.admin_partner_bank_detail = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        utils.check_request_params_for_web(req.body, [], function (response) {
            if (response.success) {
                var id = req.body.id;
                Partner.findOne({_id: id}).then((partner) => {
                    if (!partner)
                    {
                        res.render('admin_partner_bank_detail', {id: id, detail: ''});
                        delete message;
                    } else
                    {
                        res.render('admin_partner_bank_detail', {detail: partner, id: id});
                        delete message;
                    }
                });
            } else {
                res.json(response);
            }
        });
        
    } else {
        res.redirect('/admin');
    }
};

exports.admin_dispatcher_bank_detail = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        utils.check_request_params_for_web(req.body, [], function (response) {
            if (response.success) {
                var id = req.body.id;
                bank_detail.findOne({bank_holder_type: 2, bank_holder_id: id}).then((bank_details) => {
                    if (!bank_details)
                    {
                        res.render('admin_dispatcher_bank_detail', {id: id, detail: ''});
                        delete message;
                    } else
                    {
                        res.render('admin_dispatcher_bank_detail', {detail: bank_details, id: id});
                        delete message;
                    }
                });
            } else {
                res.json(response);
            }
        });
    } else {
        res.redirect('/admin');
    }
};

exports.admin_corporate_bank_detail = function (req, res, next) {

    if (typeof req.session.userid != 'undefined') {
        utils.check_request_params_for_web(req.body, [], function (response) {
            if (response.success) {
                var id = req.body.id;
                bank_detail.findOne({bank_holder_type: 2, bank_holder_id: id}).then((bank_details) => {
                    if (!bank_details)
                    {
                        res.render('admin_corporate_bank_detail', {id: id, detail: ''});
                        delete message;
                    } else
                    {
                        res.render('admin_corporate_bank_detail', {detail: bank_details, id: id});
                        delete message;
                    }
                });
            } else {
                res.json(response);
            }
        });
    } else {
        res.redirect('/admin');
    }
};


exports.dispatcher_bank_detail = function (req, res, next) {

    if (typeof req.session.dispatcher != 'undefined') {
        utils.check_request_params_for_web(req.body, [], function (response) {
            if (response.success) {
                bank_detail.findOne({bank_holder_type: 2, bank_holder_id: req.session.dispatcher._id}).then((bank_details) => {

                    if (!bank_details)
                    {
                        res.render('dispatcher_add_bank_detail', {dispatchers: req.session.dispatcher});
                        delete message;
                    } else
                    {
                        res.render('dispatcher_bank_detail', {detail: bank_details,dispatchers: req.session.dispatcher});
                        delete message;
                    }

                });
            } else {
                res.json(response);
            }
        });
    } else
    {
        res.redirect('/dispatcher_login');
    }

};

exports.provider_bank_detail = function (req, res, next) {

    if (typeof req.session.provider != 'undefined') {
        utils.check_request_params_for_web(req.body, [], function (response) {
            if (response.success) {
                if(req.session.provider.is_document_uploaded == 1){

                    bank_detail.findOne({bank_holder_type: 11, bank_holder_id: req.session.provider._id}).then((bank_details) => {
                        if (!bank_details)
                        {
                            res.render('provider_add_bank_detail', {provider: req.session.provider});
                            delete message;
                        } else
                        {
                            res.render('provider_add_bank_detail', {detail: bank_details ,provider: req.session.provider});
                            delete message;
                        }
                    });
                }
                else
                {
                    res.redirect('/provider_document_panel');
                }
            } else {
                res.json(response);
            }
        });
    } else
    {
        res.redirect('/provider_login');
    }

};



exports.add_bank_detail = function (req, res, next) {
    utils.check_request_params_for_web(req.body, [], function (response) {
        if (response.success) {
            var bank_detail_count = 1;
            bank_detail.findOne({}, function(error, detail_count){

                if (detail_count) {
                    bank_detail_count = detail_count.unique_id + 1;
                }

                var bankdetail = new bank_detail({
                    bank_holder_type: req.body.bank_holder_type,
                    bank_holder_id: req.body.bank_holder_id,
                    unique_id: bank_detail_count,
                    bank_name: req.body.bank_name,
                    bank_branch: req.body.bank_branch,
                    bank_beneficiary_address: req.body.bank_beneficiary_address,
                    bank_account_number: req.body.bank_account_number,
                    bank_account_holder_name: (req.body.bank_account_holder_name).trim(),
                    bank_swift_code: req.body.bank_swift_code,
                    bank_unique_code: req.body.bank_unique_code,
                    is_updated: 0
                });

                bankdetail.save().then((bank_detail) => {
                    message = admin_messages.success_message_bank_detail_add;
                    res.redirect(req.body.type);
                }, (err) => {
                    console.log(err);
                });

            }).sort({created_at: -1}).limit(1);
        } else {
            res.json(response);
        }
    });

};

exports.update_bank_detail = function (req, res, next) {

    utils.check_request_params_for_web(req.body, [], function (response) {
        if (response.success) {
            var id = req.body.id;
            bank_detail.findByIdAndUpdate(id, req.body, function (err, bankdetail) {

                bankdetail.is_updated = 1;
                bankdetail.save().then((bank_detail) => {
                    message = admin_messages.success_message_bank_detail_update;
                    res.redirect(req.body.type);
                }, (err) => {
                    console.log(err);
                });
            });
        } else {
            res.json(response);
        }
    });

};




