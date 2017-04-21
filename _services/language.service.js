var Language = (function () {
    function Language() { }

    Language.prototype.isValidLanguage = (language) => {
        if (!language) {
            return false;
        } else {
            if (language !== null) {
                if (language == 'en' || language == 'vi') {
                    return true;
                }
            }
            return false;
        }
    }

    return Language;
}());

exports.Language = Language;
