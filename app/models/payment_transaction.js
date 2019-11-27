var mongoose = require('mongoose'),
        mongoosePaginate = require('mongoose-paginate'),
        Schema = mongoose.Schema;
var mongoosePages = require('mongoose-pages');
var autoIncrement = require('mongoose-auto-increment');

var Payment_Transaction = new Schema({
    stripe_public_key: {type: String, default: ''},
    stripe_secret_key: {type: String, default: ''},
    amount: {type: Number, default: 0},
    currency_code: {type: String, default: ''},
    is_schedule_payment: {type: Boolean, default: true},
    is_payment_paid: {type: Boolean, default: false},
    no_of_failed_transaction: {type: Number, default: 0},
    max_no_of_transaction: {type: Number, default: 0},
    transaction_detail: {type: Array, default: []},
    card_detail: {type: Array, default: []},
    last_payment_date: {type: Date},
    is_stop_system: {type: Boolean, default: false},
    type_detail: {type: Array, default: []},
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
},{
//     usePushEach: true 
// }, {
    strict: true,
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
})


module.exports = mongoose.model('Payment_Transaction', Payment_Transaction);