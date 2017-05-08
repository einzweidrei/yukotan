var Message = (function () {
    //[<>]
    Message.msg_success = "SUCCESS";
    Message.msg_failed = "FAILED";
    Message.msg_duplicated = "DUPLICATED";
    Message.msg_required = "REQUIRED";
    Message.msg_data_exist = "DATA_EXIST";
    Message.msg_data_not_exist = "Sorry! Data is not exist.";
    Message.msg_language_not_support = "LANGUAGE_NOT_SUPPORT";
    Message.TASK_UPDATE_FAILED = "Sorry! Your task is picking up by some maid, your request was denied."
    Message.TASK_OUT_OF_LIMIT = "Sorry! Your tasks recently is full, your request was denied.";
    Message.TIME_NOT_VALID = "Sorry! Your time or hour is not valid, your request was denied.";
    Message.SCHEDULE_DUPLICATED = "Sorry! You had reserved some task in this time, your request was denied.";
    Message.CHECK_IN_EXIST = "Sorry! You had checked in this task, your request was denied.";
    Message.CHECK_OUT_EXIST = "Sorry! You had checked in this task, your request was denied.";
    Message.NOT_CHECK_IN = "Sorry! You need to check in this task first, your request was denied.";

    function Message() { }

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
                return res.status(200).send(Message.prototype.msgData(true, Message.msg_success, data));
            case 1:
                return res.status(200).send(Message.prototype.msgData(false, Message.msg_failed, data));
            case 2:
                return res.status(200).send(Message.prototype.msgData(false, Message.msg_duplicated, data));
            case 3:
                return res.status(500).send(Message.prototype.msgData(false, Message.msg_failed, data));
            case 4:
                return res.status(200).send(Message.prototype.msgData(false, Message.msg_data_not_exist, data));
            case 5:
                return res.status(200).send(Message.prototype.msgData(false, Message.msg_invalid_password, data));
            case 6:
                return res.status(200).send(Message.prototype.msgData(false, Message.msg_language_not_support, data));
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
            default:
                break;
        }
    }

    return Message;
}());

exports.Message = Message;
