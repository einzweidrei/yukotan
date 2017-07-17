var PushStatus = (function() {
    PushStatus.DELETE = 1;
    PushStatus.CANCEL = 0;
    PushStatus.SUBMIT = 8;
    PushStatus.CHECK_OUT = 5;
    PushStatus.SEND_REQUEST = 6;
    PushStatus.ACCEPT_REQUEST = 2;
    PushStatus.DENY_REQUEST = 13;

    function PushStatus() {}

    return PushStatus;
}());

exports.PushStatus = PushStatus;