var MessageStatus = (function () {
    MessageStatus.SUCCESS = 0;
    MessageStatus.FAILED = 1;
    MessageStatus.DUPLICATED = 2;
    MessageStatus.EXCEPTION_FAILED = 3;
    MessageStatus.DATA_NOT_EXIST = 4;
    MessageStatus.INVALID_PASSWORD = 5;
    MessageStatus.LANGUAGE_NOT_SUPPORT = 6;
    MessageStatus.TASK_UPDATE_FAILED = 7; //Task had picked by maid, can't update
    MessageStatus.TASK_OUT_OF_LIMIT = 8; //Out of limit tasks
    MessageStatus.TIME_NOT_VALID = 9;
    MessageStatus.SCHEDULE_DUPLICATED = 10; //User had task in same time
    MessageStatus.CHECK_IN_EXIST = 11; //User had checked in
    MessageStatus.CHECK_OUT_EXIST = 12; //User had checked out 
    MessageStatus.NOT_CHECK_IN = 13; //User need check in first 
    MessageStatus.UNAUTHORIZED = 14;
    MessageStatus.DELETE_DENY = 15;
    MessageStatus.RESERVE_EXIST = 16; //User had reserved in this task
    MessageStatus.PUSH_NOTIFY_FAILED = 17;
    MessageStatus.PAYMENT_FAILED = 18;
    MessageStatus.FACE_IDENTICAL_FAILED = 19;

    function MessageStatus() { }

    return MessageStatus;
}());

exports.MessageStatus = MessageStatus;
