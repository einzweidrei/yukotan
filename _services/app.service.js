const crypto = require('crypto');
const randomstring = require("randomstring");
const Work = require('../_model/work');
const Package = require('../_model/package');
const Process = require('../_model/process');
const AppInfo = require('../_model/app-info');
const Term = require('../_model/term');

const hash_key = 'LULULUL';
const token_length = 64;
const azure_key = 'b1726597dcc74171abf38be836846977';
const task_limit = 10;

var App = (function () {
    function App() { }

    App.prototype.setLanguage = (language) => {
        Package.setDefaultLanguage(language);
        Work.setDefaultLanguage(language);
        Process.setDefaultLanguage(language);
        AppInfo.setDefaultLanguage(language);
        Term.setDefaultLanguage(language);
    };

    App.prototype.remakeId = (id) => {
        while (id.length < 24) {
            id += '0';
        };
        return id;
    };

    App.prototype.getTaskLimit = () => {
        return task_limit;
    };

    App.prototype.getAppLanguage = (baseUrl) => {
        var language = baseUrl.substring(baseUrl.indexOf('/') + 1, baseUrl.lastIndexOf('/'));
        return language;
    };

    App.prototype.getWebLanguage = (baseUrl) => {
        var language = baseUrl.substring(baseUrl.indexOf('/admin/') + 7, baseUrl.lastIndexOf('/'));
        return language;
    };

    App.prototype.randomString = (number) => {
        const string = randomstring.generate(number);
        return string;
    };

    App.prototype.hashString = (content) => {
        if (!content) content = ''
        const hash = crypto.createHmac('sha256', hash_key)
            .update(content)
            .digest('hex');
        return hash;
    };

    App.prototype.getToken = () => {
        const first = crypto.randomBytes(8).toString('hex');
        const second = crypto.randomBytes(token_length).toString('hex');
        const token = first + ':' + second;
        return token;
    };

    App.prototype.getVerifyToken = () => {
        const token = randomstring.generate(5) + ':' + randomstring.generate(20);
        return token;
    };

    App.prototype.getAzureKey = () => {
        return azure_key;
    };

    App.prototype.getContJson = (status, data) => {
        var temp = {
            status: status,
            data: data
        };
        return temp;
    };

    App.prototype.countPrice = (time, maidPrice) => {
        var price = 0;
        var hours = time.getUTCHours();
        var minutes = time.getUTCMinutes();

        if (hours == 0) {
            price = maidPrice;
        } else {
            if (minutes >= 0 && minutes < 15) {
                price = maidPrice * hours + maidPrice / 4;
            } else if (minutes >= 15 && minutes < 30) {
                price = maidPrice * hours + maidPrice / 2;
            } else if (minutes >= 30 && minutes < 45) {
                price = maidPrice * hours + maidPrice * (3 / 4);
            } else {
                price = maidPrice * (hours + 1);
            }
        }

        return price;
    };

    App.prototype.getPerm = (account, owner, maid, task, bill, giftcode, work, aboutus, report, contact) => {
        var perm = [];
        perm.push({ name: 'Account', isActivated: account });
        perm.push({ name: 'Owner', isActivated: owner });
        perm.push({ name: 'Maid', isActivated: maid });
        perm.push({ name: 'Task', isActivated: task });
        perm.push({ name: 'Bill', isActivated: bill });
        perm.push({ name: 'GiftCode', isActivated: giftcode });
        perm.push({ name: 'Work', isActivated: work });
        perm.push({ name: 'AboutUs', isActivated: aboutus });
        perm.push({ name: 'Report', isActivated: report });
        perm.push({ name: 'Contact', isActivated: contact });

        return perm;
    };

    return App;
}());

exports.App = App;