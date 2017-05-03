var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

var messageService = require('../_services/message.service');
var msg = new messageService.Message();

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
			return msg.msgReturn(res, 6);
		}
	} catch (error) {
		return msg.msgReturn(res, 3);
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
		var username = req.body.username || "";
		var password = hash(req.body.password) || "";

		Owner.findOne({ 'info.username': username }).select('_id info auth').exec((error, data) => {
			if (validate.isNullorEmpty(data)) {
				return msg.msgReturn(res, 3);
			} else {
				if (error) {
					return msg.msgReturn(res, 3);
				} else {
					if (data.auth.password != password) {
						return msg.msgReturn(res, 5);
					} else {
						Session.findOne({ 'auth.userId': data._id }).exec((error, result) => {
							if (error) {
								return msg.msgReturn(res, 3);
							} else {
								var newToken = getToken();

								if (validate.isNullorEmpty(result)) {
									var session = new Session();
									session.auth.owner = data._id;
									session.auth.token = newToken;
									session.loginAt = new Date();
									session.status = true;

									session.save((error) => {
										if (error) {
											return msg.msgReturn(res, 3);
										} else {
											return res.status(200).json({
												status: true,
												message: msg.msg_success,
												data: {
													token: newToken,
													user: data.info
												}
											});
										}
									});
								} else {
									Session.findOneAndUpdate(
										{
											'auth.userId': data._id,
											status: true
										},
										{
											$set:
											{
												'auth.token': newToken,
												loginAt: new Date()
											}
										},
										{
											upsert: true
										},
										(error, result) => {
											return res.status(200).json({
												status: true,
												message: msg.msg_success,
												data: {
													token: newToken,
													user: data.info
												}
											});
										}
									)
								}
							}
						});
					}
				}
			}
		});
	} catch (error) {
		return msg.msgReturn(res, 3);
	}
});

router.route('/maid/login').post((req, res) => {
	try {
		var username = req.body.username || "";
		var password = hash(req.body.password) || "";

		Maid.findOne({ 'info.username': username }).select('_id info auth').exec((error, data) => {
			if (validate.isNullorEmpty(data)) {
				return msg.msgReturn(res, 3);
			} else {
				if (error) {
					return msg.msgReturn(res, 3);
				} else {
					if (data.auth.password != password) {
						return msg.msgReturn(res, 5);
					} else {
						Session.findOne({ 'auth.userId': data._id }).exec((error, result) => {
							if (error) {
								return msg.msgReturn(res, 3);
							} else {
								var newToken = getToken();

								if (validate.isNullorEmpty(result)) {
									var session = new Session();
									session.auth.userId = data._id;
									session.auth.token = newToken;
									session.loginAt = new Date();
									session.status = true;

									session.save((error) => {
										if (error) {
											return msg.msgReturn(res, 3);
										} else {
											return res.status(200).json({
												status: true,
												message: msg.msg_success,
												data: {
													token: newToken,
													user: data.info
												}
											});
										}
									});
								} else {
									Session.findOneAndUpdate(
										{
											'auth.userId': data._id,
											status: true
										},
										{
											$set:
											{
												'auth.token': newToken,
												loginAt: new Date()
											}
										},
										{
											upsert: true
										},
										(error, result) => {
											return res.status(200).json({
												status: true,
												message: msg.msg_success,
												data: {
													token: newToken,
													user: data.info
												}
											});
										}
									)
								}
							}
						});
					}
				}
			}
		});
	} catch (error) {
		return msg.msgReturn(res, 3);
	}
});

router.route('/register').post((req, res) => {
	try {
		var owner = new Owner();
		owner.info = {
			username: req.body.username,
			email: req.body.email,
			phone: req.body.phone,
			image: req.body.image,
			address: {
				name: req.body.addressName,
				coordinates: {
					lat: req.body.lat,
					lng: req.body.lng
				}
			},
			gender: req.body.gender,
		};

		owner.evaluation_point = 2.5;

		owner.wallet = 0;

		owner.auth = {
			password: hash(req.body.password),
			device_token: req.body.device_token
		};

		owner.history = {
			createAt: new Date(),
			updateAt: new Date()
		};

		owner.status = true;

		owner.location = {
			type: 'Point',
			coordinates: [req.body.lng, req.body.lat]
		};

		Owner.findOne({ 'info.username': req.body.username }).exec((error, data) => {
			if (validate.isNullorEmpty(data)) {
				owner.save((error, data) => {
					if (error) {
						return msg.msgReturn(res, 3);
					} else {
						var session = new Session();
						session.auth.owner = data._id;
						session.auth.token = getToken();
						session.loginAt = new Date();
						session.status = true;

						session.save((error) => {
							if (error) {
								return msg.msgReturn(res, 3);
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
				return msg.msgReturn(res, 2);
			}
		})
	} catch (error) {
		return msg.msgReturn(res, 3);
	}
});

module.exports = router;
