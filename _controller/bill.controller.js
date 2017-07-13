var mBill = require('../_model/bill');
var as = require('../_services/app.service');
var AppService = new as.App();
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var Bill = (function () {
    function Bill() { }

    Bill.prototype.aggregate = (aggregateQuery, callback) => {
        mBill.aggregate(aggregateQuery, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            return callback(null, data);
        });
    };

    Bill.prototype.save = (owner, maid, taskId, price, period, callback) => {
        var bill = new mBill();
        bill.owner = owner;
        bill.maid = maid;
        bill.task = taskId;
        bill.isSolved = false;
        bill.date = new Date();
        bill.createAt = new Date();
        bill.method = 1;
        bill.status = true;
        bill.price = price;
        bill.period = period;

        bill.save((error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else return callback(null, data);
        });
    };

    return Bill;
}());

exports.Bill = Bill;
