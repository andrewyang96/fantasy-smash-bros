var express = require('express');
var router = express.Router();

var fs = require('fs');

/* GET home page. */
router.get('/', function (req, res) {
	res.render('index', { title: 'Fantasy Smash Bros' });
});

router.get('/about', function (req, res) {
	res.send({message: "About page not implemented yet."});
});

router.get('/contribute', function (req, res) {
	res.send({message: "Contribute page not implemented yet."});
});

router.get('/terms', function (req, res) {
	res.send({message: "Terms page not implemented yet."});
});

router.get('/contact', function (req, res) {
	res.send({message: "Contact page not implemented yet."});
});

router.get('/flairs', function (req, res) {
	fs.readFile("./data/flairs.json", function (err, data) {
		if (err) throw err;
		var json = JSON.parse(data);
		res.send(json);
	});
});

module.exports = router;
