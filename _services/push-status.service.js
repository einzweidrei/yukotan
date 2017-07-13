var PushStatus = (function () {
    PushStatus.DELETE = 1;
    PushStatus.CANCEL = 0;
    PushStatus.SUBMIT = 8;
    PushStatus.CHECK_OUT = 5;

    function PushStatus() { }

    return PushStatus;
}());

exports.PushStatus = PushStatus;
