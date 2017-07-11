var Term = require('../_model/term');

var Test = (function () {
    function Test() { }

    Test.prototype.test = (message, callback) => {
        Term.find({}).exec((error, data) => {
            callback(null, message);
        })
    }



    return Test;
}());

exports.Test = Test;
