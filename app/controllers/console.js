var winston = require('winston');
  require('winston-daily-rotate-file');

// const console = new winston.transports.Console();

var transport = new (winston.transports.DailyRotateFile)({
    filename: './log_files/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD-HH',
    maxSize: '100m'
});


const logger = winston.createLogger({
     transports: [
      transport
     ]
 });


exports.log = function (value) {
    if(setting_detail.is_debug_log){
        logger.info(value); 
        console.log(value)
    }
}

exports.error = function (value) {
    if(setting_detail.is_debug_log){
        // console.log(value);
        logger.error(value);
    }
}



