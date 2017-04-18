var Validation = (function () {
    Validation.regUsername = /^[a-zA-Z0-9_.]{6,16}$/;
    Validation.regPassword = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,32}$/;
    Validation.regEmail = /^(([^<>#$%^&`~?\-_/()\[\]\\.,;:\s@"]+(\.[^<>#$%^&`~?\-_/()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    Validation.regName = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ ]+$/;

    function Validation() { }

    Validation.prototype.nameValidate = (data) => {
        if (data.match(Validation.regName)) return true;
        return false;
    }

    Validation.prototype.emailValidate = (data) => {
        if (data.match(Validation.regEmail)) return true;
        return false;
    }

    Validation.prototype.usernameValidate = (data) => {
        if (data.match(Validation.regUsername)) return true;
        return false;
    }

    Validation.prototype.passwordValidate = (data) => {
        if (data.match(Validation.regPassword)) return true;
        return false;
    };

    Validation.prototype.isNullorEmpty = (data) => {
        if (!data) {
            return true;
        } else {
            if (data !== null) {
                if (data.length === 0) return true;
                else return false;
            }
            return true;
        }
    };

    return Validation;
}());

exports.Validation = Validation;