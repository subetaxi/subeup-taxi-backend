var userdocument = require('../../app/controllers/userdocument'); // include userdocument controller ////


module.exports = function (app) {

    app.route('/uploaduserdocument').post(userdocument.uploaduserdocument);
    app.route('/getuserdocument').post(userdocument.userdocument_list);
};





