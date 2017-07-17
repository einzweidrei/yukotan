var Message = (function() {
    Message.SUCCESS = "SUCCESS";
    Message.FAILED = "FAILED";
    Message.DUPLICATED = "DUPLICATED";
    Message.msg_required = "REQUIRED";
    Message.DATA_NOT_EXIST = "DATA_NOT_EXIST";
    Message.LANGUAGE_NOT_SUPPORT = "LANGUAGE_NOT_SUPPORT";
    Message.INVALID_PASSWORD = "INVALID_PASSWORD";
    Message.TASK_UPDATE_FAILED = "TASK_UPDATE_FAILED"; //Task had picked by maid, can't update
    Message.TASK_OUT_OF_LIMIT = "TASK_OUT_OF_LIMIT"; //Out of limit tasks
    Message.TIME_NOT_VALID = "TIME_NOT_VALID";
    Message.SCHEDULE_DUPLICATED = "SCHEDULE_DUPLICATED "; //User had task in same time
    Message.CHECK_IN_EXIST = "CHECK_IN_EXIST"; //User had checked in
    Message.CHECK_OUT_EXIST = "CHECK_OUT_EXIST"; //User had checked out 
    Message.NOT_CHECK_IN = "NOT_CHECK_IN"; //User need check in first 
    Message.UNAUTHORIZED = "UNAUTHORIZED";
    Message.DELETE_DENY = "DELETE_DENY";
    Message.RESERVE_EXIST = "RESERVE_EXIST"; //User had reserved in this task
    Message.PUSH_NOTIFY_FAILED = "PUSH_NOTIFY_FAILED";
    Message.PAYMENT_FAILED = "WALLET_NOT_ENOUGH";
    Message.FACE_IDENTICAL_FAILED = "FACE_IDENTICAL_FAILED";
    Message.INVALID_KEY = "INVALID_KEY";

    function Message() {}

    Message.prototype.msgData = (status, msg, data) => {
        return JSON.stringify({
            status: status,
            message: msg,
            data: data
        });
    }

    Message.prototype.msgReturn = (res, status, data) => {
        if (!data) data = [];
        switch (status) {
            case 0:
                return res.status(200).send(Message.prototype.msgData(true, Message.SUCCESS, data));
            case 1:
                return res.status(200).send(Message.prototype.msgData(false, Message.FAILED, data));
            case 2:
                return res.status(200).send(Message.prototype.msgData(false, Message.DUPLICATED, data));
            case 3:
                return res.status(500).send(Message.prototype.msgData(false, Message.FAILED, data));
            case 4:
                return res.status(200).send(Message.prototype.msgData(false, Message.DATA_NOT_EXIST, data));
            case 5:
                return res.status(200).send(Message.prototype.msgData(false, Message.INVALID_PASSWORD, data));
            case 6:
                return res.status(200).send(Message.prototype.msgData(false, Message.LANGUAGE_NOT_SUPPORT, data));
            case 7:
                return res.status(200).send(Message.prototype.msgData(false, Message.TASK_UPDATE_FAILED, data));
            case 8:
                return res.status(200).send(Message.prototype.msgData(false, Message.TASK_OUT_OF_LIMIT, data));
            case 9:
                return res.status(200).send(Message.prototype.msgData(false, Message.TIME_NOT_VALID, data));
            case 10:
                return res.status(200).send(Message.prototype.msgData(false, Message.SCHEDULE_DUPLICATED, data));
            case 11:
                return res.status(200).send(Message.prototype.msgData(false, Message.CHECK_IN_EXIST, data));
            case 12:
                return res.status(200).send(Message.prototype.msgData(false, Message.CHECK_OUT_EXIST, data));
            case 13:
                return res.status(200).send(Message.prototype.msgData(false, Message.NOT_CHECK_IN, data));
            case 14:
                return res.status(401).send(Message.prototype.msgData(false, Message.UNAUTHORIZED, data));
            case 15:
                return res.status(200).send(Message.prototype.msgData(false, Message.DELETE_DENY, data));
            case 16:
                return res.status(200).send(Message.prototype.msgData(false, Message.RESERVE_EXIST, data));
            case 17:
                return res.status(200).send(Message.prototype.msgData(true, Message.PUSH_NOTIFY_FAILED, data));
            case 18:
                return res.status(200).send(Message.prototype.msgData(false, Message.PAYMENT_FAILED, data));
            case 19:
                return res.status(200).send(Message.prototype.msgData(false, Message.FACE_IDENTICAL_FAILED, data));
            case 20:
                return res.status(200).send(Message.prototype.msgData(false, Message.INVALID_KEY, data));
            default:
                break;
        }
    }

    return Message;
}());

exports.Message = Message;