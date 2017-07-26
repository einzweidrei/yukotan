var PushStatus = (function () {
    PushStatus.DELETE = 1;
    PushStatus.CANCEL = 0;
    PushStatus.SUBMIT = 8;
    PushStatus.CHECK_OUT = 5;
    PushStatus.SEND_REQUEST = 6;
    PushStatus.ACCEPT_REQUEST = 2;
    PushStatus.DENY_REQUEST = 13;
    PushStatus.PAY_DIRECTLY = 9;
    PushStatus.CONFIRM_DIRECT = 10;
    PushStatus.CANCEL_DIRECT = 11;

    function PushStatus() { }

    return PushStatus;
}());

exports.PushStatus = PushStatus;