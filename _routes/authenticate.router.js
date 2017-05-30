var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

var messageService = require('../_services/message.service');
// var mess = messageService.Message;
var msg = new messageService.Message();

var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();

var languageService = require('../_services/language.service');
var lnService = new languageService.Language();

var Owner = require('../_model/owner');
var Session = require('../_model/session');
var Maid = require('../_model/maid');

var cloudinary = require('cloudinary');

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

router.use(multipartMiddleware);

router.use(function (req, res, next) {
	try {
		// console.log(mess.msg_success);
		console.log(req.cookies);

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
// const hash_key = 'HBBSolution';
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
				return msg.msgReturn(res, 4, {});
			} else {
				if (error) {
					return msg.msgReturn(res, 3, {});
				} else {
					if (data.auth.password != password) {
						return msg.msgReturn(res, 5, {});
					} else {
						Session.findOne({ 'auth.userId': data._id }).exec((error, result) => {
							if (error) {
								return msg.msgReturn(res, 3, {});
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
											return msg.msgReturn(res, 3, {});
										} else {
											let dt = {
												token: newToken,
												user: {
													_id: data._id,
													info: data.info
												}
											}
											return msg.msgReturn(res, 0, dt);

											// return res.status(200).json({
											// 	status: true,
											// 	message: mess.msg_success,
											// 	data: {
											// 		token: newToken,
											// 		user: {
											// 			_id: data._id,
											// 			info: data.info
											// 		}
											// 	}
											// });
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
											let dt = {
												token: newToken,
												user: {
													_id: data._id,
													info: data.info
												}
											}
											return msg.msgReturn(res, 0, dt);
											// return res.status(200).json({
											// 	status: true,
											// 	message: mess.msg_success,
											// 	data: {
											// 		token: newToken,
											// 		user: {
											// 			_id: data._id,
											// 			info: data.info
											// 		}
											// 	}
											// });
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
		console.log(error);
		console.log(error.message);
		return msg.msgReturn(res, 3, {});
	}
});

router.route('/register').post((req, res) => {
	try {
		var owner = new Owner();

		owner.info = {
			username: req.body.username || "",
			email: req.body.email || "",
			phone: req.body.phone || "",
			name: req.body.name || "",
			age: req.body.age || 18,
			address: {
				name: req.body.addressName || "",
				coordinates: {
					lat: req.body.lat || 0,
					lng: req.body.lng || 0
				}
			},
			gender: req.body.gender || 0,
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
				if (!req.files.image) {
					owner.info['image'] = "";
					owner.save((error, data) => {
						if (error) {
							return msg.msgReturn(res, 3);
						} else {
							var session = new Session();
							session.auth.userId = data._id;
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
											user: {
												_id: data._id,
												info: data.info
											}
										}
									});
								}
							});
						}
					});
				} else {
					cloudinary.uploader.upload(
						req.files.image.path,
						function (result) {
							owner.info['image'] = result.url;
							owner.save((error, data) => {
								console.log(result);
								if (error) {
									return msg.msgReturn(res, 3);
								} else {
									var session = new Session();
									session.auth.userId = data._id;
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
													user: {
														_id: data._id,
														info: data.info
													}
												}
											});
										}
									});
								}
							});
						}
					)
				}
			} else {
				return msg.msgReturn(res, 2, {});
			}
		})
	} catch (error) {
		console.log(error);
		return msg.msgReturn(res, 3);
	}
});

router.route('/check').get((req, res) => {
	try {
		let username = req.query.username;
		Owner.findOne({ 'info.username': username }).exec((error, data) => {
			if (error) {
				return msg.msgReturn(res, 3);
			} else {
				if (validate.isNullorEmpty(data)) {
					return msg.msgReturn(res, 4);
				} else {
					return msg.msgReturn(res, 2);
				}
			}
		});
	} catch (error) {
		return msg.msgReturn(res, 3);
	}
});

/** PUT - Update Owner's Information
 * info {
 *      type: PUT
 *      url: /update
 *      name: Update Owner's Information
 *      description: Update one owner's information
 * }
 * 
 * params {
 *      null
 * }
 * 
 * body {
 *      id: owner_ID
 *      username: String
 *      email: String
 *      phone: String
 *      image: String
 *      addressName: String
 *      lat: Number
 *      lng: Number
 *      gender: Number
 * }
 */
router.route('/update').put((req, res) => {
	try {
		if (req.headers.hbbgvauth) {
			let token = req.headers.hbbgvauth;
			Session.findOne({ 'auth.token': token }).exec((error, data) => {
				if (error) {
					return msg.msgReturn(res, 3);
				} else {
					if (validate.isNullorEmpty(data)) {
						return msg.msgReturn(res, 14);
					} else {
						// req.cookies['userId'] = data.auth.userId;
						var owner = new Owner();
						var id = data.auth.userId;

						owner.info = {
							username: req.body.username || "",
							email: req.body.email || "",
							phone: req.body.phone || "",
							name: req.body.name || "",
							age: req.body.age || 18,
							address: {
								name: req.body.addressName || "",
								coordinates: {
									lat: req.body.lat || 0,
									lng: req.body.lng || 0
								}
							},
							gender: req.body.gender || 0
						}

						owner.location = {
							type: 'Point',
							coordinates: [req.body.lng || 0, req.body.lat || 0]
						}

						Owner.findOne({ _id: id }).exec((error, data) => {
							if (error) {
								return msg.msgReturn(res, 3);
							} else {
								if (validate.isNullorEmpty(data)) {
									return msg.msgReturn(res, 4);
								} else {
									if (!req.files.image) {
										owner.info['image'] = req.body.image || "";
										Owner.findOneAndUpdate(
											{
												_id: id,
												status: true
											},
											{
												$set: {
													info: owner.info,
													location: owner.location,
													'history.updateAt': new Date()
												}
											},
											{
												upsert: true
											},
											(error, result) => {
												if (error) return msg.msgReturn(res, 3);
												return msg.msgReturn(res, 0);
											}
										);
									} else {
										cloudinary.uploader.upload(
											req.files.image.path,
											function (result) {
												owner.info['image'] = result.url;
												Owner.findOneAndUpdate(
													{
														_id: id,
														status: true
													},
													{
														$set: {
															info: owner.info,
															location: owner.location,
															'history.updateAt': new Date()
														}
													},
													{
														upsert: true
													},
													(error, result) => {
														if (error) return msg.msgReturn(res, 3);
														return msg.msgReturn(res, 0);
													}
												);
											});
									}
								}
							}
						});
					}
				}
			});
		} else {
			return msg.msgReturn(res, 14);
		}
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
													user: {
														_id: data._id,
														info: data.info
													}
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
													user: {
														_id: data._id,
														info: data.info
													}
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
		console.log(error);
		return msg.msgReturn(res, 3);
	}
});

/** POST - Create Maid's Information
 * info {
 *      type: POST
 *      url: /create
 *      name: Create Maid's Information
 *      description: Create one Maid's information
 * }
 * 
 * params {
 *      null
 * }
 * 
 * body {
 *      username: String
 *      email: String
 *      phone: String
 *      image: String
 *      addressName: String
 *      lat: Number
 *      lng: Number
 *      gender: Number
 * }
 */
router.route('/maid/register').post((req, res) => {
	try {
		var maid = new Maid();

		maid.info = {
			username: req.body.username || "",
			email: req.body.email || "",
			phone: req.body.phone || "",
			name: req.body.name || "",
			age: req.body.age || 18,
			address: {
				name: req.body.addressName || "",
				coordinates: {
					lat: req.body.lat || 0,
					lng: req.body.lng || 0
				}
			},
			gender: req.body.gender || 0,
		};

		// maid.evaluation_point = 0;

		maid.work_info = {
			evaluation_point: 0,
			price: 0
		};

		maid.auth = {
			password: hash(req.body.password),
			device_token: req.body.device_token
		};

		maid.history = {
			createAt: new Date(),
			updateAt: new Date()
		};

		maid.status = true;

		maid.location = {
			type: 'Point',
			coordinates: [req.body.lng, req.body.lat]
		};

		Maid.findOne({ 'info.username': req.body.username }).exec((error, data) => {
			if (error) {
				return msg.msgReturn(res, 3);
			} else {
				if (validate.isNullorEmpty(data)) {
					if (!req.files.image) {
						maid.info['image'] = req.body.image || "";
						maid.save((error) => {
							if (error) return msg.msgReturn(res, 3);
							return msg.msgReturn(res, 0);
						});
					} else {
						cloudinary.uploader.upload(
							req.files.image.path,
							function (result) {
								maid.info['image'] = result.url;
								maid.save((error) => {
									if (error) return msg.msgReturn(res, 3);
									return msg.msgReturn(res, 0);
								});
							});
					}
				} else {
					return msg.msgReturn(res, 2);
				}
			}
		});
	} catch (error) {
		console.log(error);
		return msg.msgReturn(res, 3);
	}
});

/** PUT - Update Maid's Information
 * info {
 *      type: PUT
 *      url: /update
 *      name: Update Maid's Information
 *      description: Update one Maid's information
 * }
 * 
 * params {
 *      null
 * }
 * 
 * body {
 *      id: Maid_ID
 *      username: String
 *      email: String
 *      phone: String
 *      image: String
 *      addressName: String
 *      lat: Number
 *      lng: Number
 *      gender: Number
 * }
 */
router.route('/maid/update').put((req, res) => {
	try {
		var id = req.body.id;

		var maid = new Maid();
		maid.info = {
			username: req.body.username || "",
			email: req.body.email || "",
			phone: req.body.phone || "",
			name: req.body.name || "",
			age: req.body.age || 18,
			address: {
				name: req.body.addressName || "",
				coordinates: {
					lat: req.body.lat || 0,
					lng: req.body.lng || 0
				}
			},
			gender: req.body.gender || 0,
		};

		maid.work_info = {
			ability: req.body.ability,
			price: 0
		};

		maid.location = {
			type: 'Point',
			coordinates: [req.body.lng, req.body.lat]
		};

		Maid.findOne({ _id: id }).exec((error, data) => {
			if (error) {
				return msg.msgReturn(res, 3);
			} else {
				if (validate.isNullorEmpty(data)) {
					return msg.msgReturn(res, 4);
				} else {
					if (!req.files.image) {
						maid.info['image'] = req.body.image || "";
						Maid.findOneAndUpdate(
							{
								_id: id,
								status: true
							},
							{
								$set: {
									info: maid.info,
									work_info: maid.work_info,
									location: maid.location,
									'history.updateAt': new Date()
								}
							},
							{
								upsert: true
							},
							(error, result) => {
								if (error) return msg.msgReturn(res, 3);
								return msg.msgReturn(res, 0);
							}
						);
					} else {
						cloudinary.uploader.upload(
							req.files.image.path,
							function (result) {
								maid.info['image'] = result.url;
								Maid.findOneAndUpdate(
									{
										_id: id,
										status: true
									},
									{
										$set: {
											info: maid.info,
											work_info: maid.work_info,
											location: maid.location,
											'history.updateAt': new Date()
										}
									},
									{
										upsert: true
									},
									(error, result) => {
										if (error) return msg.msgReturn(res, 3);
										return msg.msgReturn(res, 0);
									}
								);
							});
					}
				}
			}
		});
	} catch (error) {
		return msg.msgReturn(res, 3);
	}
});

module.exports = router;
