var Message = (function () {
    //[<>]
    Message.msg_success = "SUCCESS";
    Message.msg_failed = "FAILED";
    Message.msg_required = "REQUIRED";
    Message.msg_data_exist = "DATA_EXIST";
    Message.msg_data_not_exist = "DATA_NOT_EXIST";
    Message.msg_language_not_support = "LANGUAGE_NOT_SUPPORT";

    //[Username]
    Message.msg_username_exist = "Username already exists";
    Message.msg_username_notExist = "Username is not exists";
    Message.msg_username_invalid = "Invalid Username";

    //[Email]
    Message.msg_email_exist = "Email already exists";
    Message.msg_email_invalid = "Invalid Email";

    //[Passwod]
    Message.msg_invalid_password = "Invalid Password";

    //[Name]
    Message.msg_name_invalid = "Invalid Name";

    //[Role]
    Message.msg_role_invalid = "Invalid Role";

    //[Account]
    Message.msg_account_notExist = "ACCOUNT_NOT_EXIST";

    //[Course]
    Message.msg_course_exist = "Course already exists";

    //[Staff]
    Message.msg_teacher_exist = "TEACHER_EXIST";

    function Message() { }

    Message.prototype.msgData = (status, msg, data) => {
        return JSON.stringify({
            status: status,
            message: msg,
            data: data
        });
    }

    Message.prototype.msgFailedOut = (status, msg, key) => {
        return JSON.stringify({
            status: status,
            message: msg
        })
    }

    return Message;
}());

exports.Message = Message;
