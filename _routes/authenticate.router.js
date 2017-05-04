var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

var messageService = require('../_services/message.service');
var msg = messageService.Message;
var msgRep = new messageService.Message();

var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();

var languageService = require('../_services/language.service');
var lnService = new languageService.Language();

var Owner = require('../_model/owner');
var Session = require('../_model/session');

router.use(function (req, res, next) {
	console.log('auth_router is connecting');

	try {
		var baseUrl = req.baseUrl;
		var language = baseUrl.substring(baseUrl.indexOf('/') + 1, baseUrl.lastIndexOf('/'));

		if (lnService.isValidLanguage(language)) {
			req.cookies['language'] = language;
			next();
		}
		else {
			return res.status(200).send(msgRep.msgData(false, msg.msg_language_not_support));
		}
	} catch (error) {
		return res.status(500).send(msgRep.msgData(false, msg.msg_failed));
	}
});

const hash_key = 'LULULUL';
const token_length = 64;

function hash(content) {
	const crypto = require('crypto');
	const hash = crypto.createHmac('sha256', hash_key)
		.update(content)
		.digest('hex');
	return hash;
}

function getToken() {
	var crypto = require('crypto');
	var token = crypto.randomBytes(token_length).toString('hex');
	return token;
}

router.route('/login').post((req, res) => {
	try {
		var username = req.body.username;
		var password = hash(req.body.password);

		Owner.findOne({ 'info.username': username }).select('_id info auth').exec((error, data) => {
			if (validate.isNullorEmpty(data)) {
				return res.status(200).send(msgRep.msgData(false, msg.msg_data_not_exist));
			} else {
				if (error) {
					return res.status(500).send(msgRep.msgData(false, msg.msg_failed));
				} else {
					if (data.auth.password != password) {
						return res.status(200).send(msgRep.msgData(false, msg.msg_invalid_password));
					} else {
						var session = new Session();
						session.auth.owner = data._id;
						session.auth.token = getToken();
						session.loginAt = new Date();
						session.status = true;

						session.save((error) => {
							if (error) {
								return res.status(500).send(msgRep.msgData(false, msg.msg_failed));
							} else {
								return res.status(200).json({
									status: true,
									message: msg.msg_success,
									data: {
										token: session.auth.token,
										owner: data.info
									}
								});
							}
						});
					}
				}
			}
		})
	} catch (error) {
		return res.status(500).send(msgRep.msgData(false, msg.msg_failed));
	}
});

router.route('/register').post((req, res) => {
	try {
		var owner = new Owner();
		owner.info.username = req.body.username;
		owner.info.email = req.body.email;
		owner.info.phone = req.body.phone;
		owner.info.image = req.body.image;
		owner.info.address.name = req.body.addressName;
		owner.info.address.coordinates.lat = req.body.lat;
		owner.info.address.coordinates.lng = req.body.lng;
		owner.info.gender = req.body.gender;
		owner.auth.password = hash(req.body.password);
		owner.history.createAt = new Date();
		owner.history.updateAt = new Date();
		owner.status = true;

		owner.info.address.location = {
			type: 'Point',
			coordinates: [req.body.lng, req.body.lat]
		}

		Owner.findOne({ 'info.username': req.body.username }).exec((error, data) => {
			if (validate.isNullorEmpty(data)) {
				owner.save((error, data) => {
					if (error) {
						console.log(error);
						return res.status(500).send(msgRep.msgData(false, msg.msg_failed));
					} else {
						var session = new Session();
						session.auth.owner = data._id;
						session.auth.token = getToken();
						session.loginAt = new Date();
						session.status = true;

						session.save((error) => {
							if (error) {
								return res.status(500).send(msgRep.msgData(false, msg.msg_failed));
							} else {
								return res.status(200).json({
									status: true,
									message: msg.msg_success,
									data: {
										token: session.auth.token,
										owner: data.info
									}
								});
							}
						});
					}
				});
			} else {
				return res.status(200).send(msgRep.msgData(false, msg.msg_data_exist));
			}
		})
	} catch (error) {
		return res.status(500).send(msgRep.msgData(false, msg.msg_failed));
	}
});

module.exports = router;
