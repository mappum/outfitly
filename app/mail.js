var nodemailer = require('nodemailer'),
	config = require(__dirname + '/../config.js');

var smtp = nodemailer.createTransport("SMTP", config.mail.smtp);

module.exports = {
	send: config.mail.enabled ? smtp.sendMail : function(){}
};
