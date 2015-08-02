var express = require('express');
var router = express.Router();

var fs = require('fs');

/* GET home page. */
router.get('/', function (req, res) {
	res.render('index', { title: 'Fantasy Smash Bros' });
});

router.get('/flairs', function (req, res) {
	fs.readFile("./data/flairs.json", function (err, data) {
		if (err) throw err;
		var json = JSON.parse(data);
		res.send(json);
	});
});

module.exports = router;
