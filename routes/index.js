var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
	res.render('index', { title: "Fantasy Smash Bros" });
});

router.get('/flairs', function (req, res) {
	res.render('flairs', { title: "Fantasy Smash Bros Flairs" });
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

module.exports = router;
