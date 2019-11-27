var languages = require('../admin_controllers/languages');

module.exports = function (app) {
    app.route('/languages').get(languages.languages);
    app.route('/languages').post(languages.languages);
    app.route('/add_languages').post(languages.add_languages);
    app.route('/add_languages_detail').post(languages.add_languages_detail);
    app.route('/edit_languages').post(languages.edit_languages);
    app.route('/update_languages_detail').post(languages.update_languages_detail);
   
};