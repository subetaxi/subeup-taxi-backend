var requests = require('../admin_controllers/request');
var providers = require('../admin_controllers/provider');
var provider_earning = require('../admin_controllers/provider_earning');


module.exports = function (app) {

    app.route('/today_requests').get(requests.list);
    app.route('/requests').get(requests.list);

    app.route('/trip_refund_amount').post(requests.trip_refund_amount);
    app.route('/genetare_request_excel').post(requests.genetare_request_excel);

    app.route('/today_requests').post(requests.list);
    app.route('/requests').post(requests.list);

    app.route('/trip_map').post(requests.trip_map);
    app.route('/request_sort').post(requests.list);
    app.route('/request_search').post(requests.list);
    app.route('/trip_invoice').post(provider_earning.statement_provider_earning);

    app.route('/requsest_status_ajax').post(requests.requsest_status_ajax);
    app.route('/chat_history').post(requests.chat_history);


};



