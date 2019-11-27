var config = require('./config');
var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var cons = require('consolidate');
var session = require("express-session");
var moment = require('moment');
var twilio = require('twilio');
var nodemailer = require('nodemailer');
var dotenv = require('dotenv');
var path = require("path");
var compression = require('compression');
var async = require("async");
var cookieParser = require('cookie-parser')
var app = express();

function parallel(middlewares) {
    return function (req, res, next) {
        async.each(middlewares, function (mw, cb) {
            mw(req, res, cb);
        }, next);
    };
}

module.exports = function () {

    if (process.env.NODE_ENV == 'development') {
        ///// FOR SESSION SET /////
        app.use(session({resave: true, saveUninitialized: true, secret: 'SOMERANDOMSECRETHERE', maxAge: '1h'}));

    } else if (process.env.NODE_ENV == 'production') {
        var RedisStore = require('connect-redis')(session);
        var redis = require("redis");
        var client = redis.createClient();

        ///// FOR SESSION SET /////
        app.use(session({resave: true, saveUninitialized: true, secret: 'SOMERANDOMSECRETHERE', maxAge: '1h', store: new RedisStore({host: 'localhost', port: 6379, client: client, ttl: 1440})}));
    }

    app.use(parallel([
        express.static('./public', {maxAge: '1y'}),
        express.static('./data', {maxAge: '1d'}),
        compression(),
        bodyParser.json({limit: '50mb'}),
        bodyParser.urlencoded({limit: "50mb",extended: true, parameterLimit: 1000000}),
        multer({dest: __dirname + '/data/'}).any()
    ]));

    app.use(cookieParser());
    // app.use(i18n.init);
    ///////////////////////////

    ///// FOR E-mail ANd SMS purpose //////
    //dotenv.config({path: 'installation_settings_config.env', silent: true});
    // dotenv.config({path: 'admin_panel_string.env', silent: true});
    // dotenv.config({path: 'tooltip.env', silent: true});
    //dotenv.config({path: 'settings.env', silent: true});
    // dotenv.config({path: 'partner_panel_string.env', silent: true});
    // dotenv.config({path: 'constants.env', silent: true});
    // dotenv.config({path: 'pushMessages.env', silent: true});
    // dotenv.config({path: 'errorMessages.env', silent: true});
    // dotenv.config({path: 'successMessages.env', silent: true});
    // dotenv.config({path: 'admin_panel_message.env', silent: true});
    //////////////////////////////
    
    
    app.set('views', ['./app/views', './app/views/new_design_user','./app/views/user', './app/views/provider','./app/views/partner','./app/views/new_design_dispatcher','./app/views/dispatcher', './app/views/corporate']);///This line defines where our HTML files are placed so that Server can locate and render them ! Easy enough.
    app.engine('html', require('ejs').renderFile, cons.swig);
    app.set('view engine', 'html');//This line set the view engine or simply presentation factor to EJS which is responsible for HTML rendering.

    require('../app/routes/admin')(app);
    require('../app/routes/country')(app);
    require('../app/routes/city')(app);
    require('../app/routes/citytype')(app);
    require('../app/routes/users')(app);
    require('../app/routes/providers')(app);
    require('../app/routes/trip')(app);
    require('../app/routes/card')(app);
    require('../app/routes/scheduledtrip')(app);
    require('../app/routes/providerdocument')(app);
    require('../app/routes/userdocument')(app);
    require('../app/routes/emergency_contact_detail')(app);
    require('../app/routes/cron')(app);
    require('../app/routes/provider_earning')(app);
    require('../app/routes/bank_detail')(app);
    require('../app/routes/wallet_history')(app);


    // Start 14 March
    require('../app/routes/provider_analytics')(app);
    // End 14 March


    //////////////// ADMIN ROUTES ///////////////////
    require('../app/admin_routes/sms_detail')(app);
    require('../app/admin_routes/email_detail')(app);
    require('../app/admin_routes/admin')(app);
    require('../app/admin_routes/city')(app);
    require('../app/admin_routes/city_service_types')(app);
    require('../app/admin_routes/country')(app);
    require('../app/admin_routes/dashboard')(app);
    require('../app/admin_routes/corporate')(app);
    require('../app/admin_routes/dispatcher')(app);
    require('../app/admin_routes/documents')(app);
    require('../app/admin_routes/information')(app);
    require('../app/admin_routes/map_view')(app);
    require('../app/admin_routes/partner')(app);
    require('../app/admin_routes/promo_code')(app);
    require('../app/admin_routes/provider')(app);
    require('../app/admin_routes/request')(app);
    require('../app/admin_routes/reviews')(app);
    require('../app/admin_routes/schedule')(app);
    require('../app/admin_routes/service_type')(app);
    require('../app/admin_routes/settings')(app);
    require('../app/admin_routes/user')(app);
    require('../app/admin_routes/payment_transaction')(app);

    // Start 14 March
    require('../app/admin_routes/trip_earning')(app);
    require('../app/admin_routes/daily_earning')(app);
    // End 14 March

    // Start 16 March
    require('../app/admin_routes/weekly_earning')(app);
    // End 16 March

    // Start 20 March
    require('../app/admin_routes/admin_partner_weekly_earning')(app);
    
    // partner panel //
    require('../app/admin_routes/partner_earning')(app);
    // End 20 March

    require('../app/admin_routes/provider_earning')(app);
    require('../app/admin_routes/provider_daily_earning')(app);
    require('../app/admin_routes/provider_weekly_earning')(app);
   
    require('../app/admin_routes/pending_payments')(app);
    require('../app/admin_routes/bank_detail')(app);
    require('../app/admin_routes/send_mass_notification')(app);
    require('../app/admin_routes/hotel')(app);
    require('../app/admin_routes/send_mass_sms')(app);

    // Start 6 March
    require('../app/admin_routes/wallet_history')(app);
    require('../app/admin_routes/languages')(app);
    require('../app/admin_routes/transaction_history')(app);
     require('../app/admin_routes/partner_payments')(app);
    // End 6 March

    require('../app/user_routes/user')(app);
    require('../app/user_routes/trip')(app);
    require('../app/user_routes/payments')(app);
    require('../app/user_routes/new_design')(app);

    require('../app/provider_routes/provider')(app);
    require('../app/provider_routes/trip')(app);
    require('../app/provider_routes/payments')(app);


    require('../app/corporate_routes/corporate')(app);
    require('../app/corporate_routes/corporate_payments')(app);
    return app;
};