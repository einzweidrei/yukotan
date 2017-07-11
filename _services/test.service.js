var Term = require('../_model/term');

var Test = (function () {
    function Test() { }

    Test.prototype.test = (callback) => {
        Term.find({}).exec((error, data) => {
            callback(null, data);
        })
    }

    return Test;
}());

exports.Test = Test;
