var documents = require('../admin_controllers/documents');
var Documents = require('mongoose').model('Document');

module.exports = function(app) {
	
app.route('/documents').get(documents.list);
app.route('/documents').post(documents.list);
/////////////////// FOR ADD DOCUMENT //////////////////////

app.route('/generate_document_excel').post(documents.generate_document_excel);

app.route('/add_document_form').post(documents.add_document_form);
app.route('/add_document_detail').post(documents.add_document_detail);

///////////////////////////////////////////////////////////

///////////////// FOR DOCUMENT UPDATE ////////////////////

app.route('/edit_document_form').post(documents.edit_document_form);
app.route('/update_document_detail').post(documents.update_document_detail);

//////////////////////////////////////////////////////////
}