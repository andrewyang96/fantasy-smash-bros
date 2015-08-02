var express = require('express');
var router = express.Router();

var fs = require('fs');
var firebase = require('firebase');

router.get('/', function (req, res) {
	res.send({ message: "The API works! :)" });
});

router.get('/flairs', function (req, res) {
	fs.readFile("./data/flairs.json", function (err, data) {
		if (err) throw err;
		var json = JSON.parse(data);
		res.send(json);
	});
});

module.exports = router;
