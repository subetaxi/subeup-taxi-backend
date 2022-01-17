setting_detail = {};
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
if (process.env.NODE_ENV == 'production') {
//     var cluster = require('cluster');
//     if (cluster.isMaster) {
//         // Count the machine's CPUs
//         var cpuCount = require('os').cpus().length;

//         // Create a worker for each CPU
//         for (var i = 0; i < cpuCount; i += 1) {
//             cluster.fork();
//         }

// // Code to run if we're in a worker process
//     } else {
//         init();
//     }
  init();
} else {
    init();
}



function init() {
    var port = 5000;
    var config = require('./config/config'),
    mongoose = require('./config/mongoose'),
    express = require('./config/express'),
    db = mongoose(),
    app = express();
    //app.listen(3000)

    config_json = require('config.json')('./admin_panel_string.json');
    admin_messages = require('config.json')('./admin_panel_message.json');
    constant_json = require('config.json')('./constants.json');
    push_messages = require('config.json')('./pushMessages.json');
    error_message = require('config.json')('./errorMessages.json');
    installation_setting_message = require('config.json')('./installation_settings_config.json');
    setting_message = require('config.json')('./settings.json');
    success_messages = require('config.json')('./successMessages.json');
    tooltip_json = require('config.json')('./tooltip.json');


    const http = require('http');
    const socketIO = require('socket.io');
    const server = http.Server(app);
    const port = process.env.PORT || 8080;

    server.listen(port + (process.env.NODE_APP_INSTANCE ? parseInt(process.env.NODE_APP_INSTANCE) : 0), () => {
  
      const io = socketIO(server);
      var redis = require('socket.io-redis');

      var Providers = require('./app/controllers/providers');
      var Trips = require('./app/controllers/trip');
      io.adapter(redis({ host: 'localhost', port: 6379 }));

      io.on('connection', socket => {

        socket.on('trip_detail_notify', function (data, ackFn) {
          var trip_id ="'"+data.trip_id+"'";
          io.emit(trip_id, {is_trip_updated: true, trip_id: trip_id});
        });

        socket.on('update_location', function (data, ackFn) {
          var trip_id ="'"+data.trip_id+"'";
          var provider_id ="'"+data.provider_id+"'";
          Providers.update_location_socket({body: data}, function(response){
            ackFn(response);
            if(data.trip_id && response.success){
              io.emit(trip_id , {is_trip_updated: false, trip_id: trip_id, "bearing": data.bearing, "location": response.providerLocation, "total_time": response.total_time, "total_distance": response.total_distance});
            } else {
              io.emit(provider_id , {"bearing": data.bearing, "location": response.providerLocation, provider_id: data.provider_id});
            }
          });
        });

      });
    });

    app.post('/check_language', function (req, res) {
        
      var cookieOptions = {
         httpOnly: true,
         expires:new Date(new Date().getTime()+86409000),
         maxAge:86409000
      }

      require('./app/controllers/constant');

      if(req.body.type == 'admin'){
        if(LANGUAGES.arebic == req.cookies.language){
            config_json = require('config.json')('./admin_panel_string _arabic.json');
            res.cookie('language', 'Arebic',cookieOptions); 
           res.json({success:true});
        }else{
           config_json = require('config.json')('./admin_panel_string.json');
            res.cookie('language', 'English',cookieOptions);
           res.json({success:true});
        }
      }else{
         config_json = require('config.json')('./admin_panel_string.json');
      }
        
    });


    app.post('/change_language', function (req, res) {
      require('./app/controllers/constant');

      var cookieOptions = {
       httpOnly: true,
        expires:new Date(new Date().getTime()+86409000),
        maxAge:86409000
      }

      if(LANGUAGES.arebic == req.body.language){
          config_json = require('config.json')('./admin_panel_string _arabic.json');
          res.cookie('language', 'Arebic',cookieOptions); 
          res.json({success:true});
      }else{
         config_json = require('config.json')('./admin_panel_string.json');
         res.cookie('language', 'English',cookieOptions);
        res.json({success:true});
      }
    });

    app.get('*', function (req, res) {
        res.render('errorPage');
    });

    var Settings = require('mongoose').model('Settings');
    Settings.findOne({}, function (error, setting) {
        setting_detail = setting
        console.log('Magic happens on port ' + port);
    });
    module.exports = app;
}



