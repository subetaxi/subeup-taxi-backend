var scheduledtrip = require('../../app/controllers/scheduledtrip');

module.exports = function (app) {
    app.route('/createfuturetrip').post(scheduledtrip.createfuturetrip);
    app.route('/getfuturetrip').post(scheduledtrip.getfuturetrip);
    app.route('/cancelscheduledtrip').post(scheduledtrip.cancelScheduledtrip);
};



