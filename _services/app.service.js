const crypto = require('crypto');

const hash_key = 'LULULUL';
const token_length = 64;
const subs_key = 'b1726597dcc74171abf38be836846977'

var App = (function () {
    function App() { }

    App.prototype.hashString = (content) => {
        if (!content) content = ''
        const hash = crypto.createHmac('sha256', hash_key)
            .update(content)
            .digest('hex');
        return hash;
    }

    App.prototype.getToken = () => {
        const token = crypto.randomBytes(token_length).toString('hex');
        return token;
    }

    App.prototype.getAzureKey = () => {
        return subs_key;
    }

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
    }

    return App;
}());

exports.App = App;
