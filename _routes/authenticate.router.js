var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

var messageService = require('../_services/message.service');
var msg = messageService.Message;
var msgRep = new messageService.Message();

var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();

var Owner = require('../_model/owner');
var Session = require('../_model/session');

router.use(function (req, res, next) {
	console.log('auth_router is connecting');
	next();
});

const hash_key = 'HBBSolution';
const token_length = 128;

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

router.route('/register').post((req, res) => {
	var owner = new Owner();
	owner.info.username = req.body.username;
	owner.info.password = hash(req.body.password);
	owner.info.email = req.body.email;
	owner.info.phone = req.body.phone;
	owner.info.image = req.body.image;
	owner.info.address.name = req.body.addressName;
	owner.info.address.coordinates.lat = req.body.lat;
	owner.info.address.coordinates.lng = req.body.lng;
	owner.info.gender = req.body.gender;
	owner.history.createAt = new Date();
	owner.history.updateAt = new Date();
	owner.status = true;

	owner.info.address.location = {
		type: 'Point',
		coordinates: [req.body.lng, req.body.lat]
	}

	Owner.findOne({ 'info.username': req.body.username }).exec((error, data) => {
		if (validate.isNullorEmpty(data)) {
			owner.save((error) => {
				if (error) {
					return res.status(500).send(msgRep.msgData(false, msg.msg_failed));
				} else {
					return res.status(200).send(msgRep.msgData(true, msg.msg_success));
				}
			});
		} else {
			return res.status(200).send(msgRep.msgData(false, msg.msg_data_exist));
		}
	})
});

module.exports = router;