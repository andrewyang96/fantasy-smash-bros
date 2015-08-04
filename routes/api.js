var express = require('express');
var router = express.Router();

var fs = require('fs');
var Firebase = require('firebase');

var ref = new Firebase("https://fantasy-smash-bros.firebaseio.com/");

// TODO: refactor so that this variable won't be necessary.
var games = ["ssb64", "ssbm", "ssbb", "ssb4"];

var paginate = function (list, limit, from) {
	// Returns a paginated object.
	if (list.length == 0) {
		return { data: [] };
	}
	if (!limit) limit = 10;
	if (!from || from < 0) {
		from = 0;
	} else {
		// Idiot-proof things
		if (from >= list.length) from = list.length - 1;
		from -= (from % limit);
	}
	var data = list.slice(from, from+limit);
	var currPage = (from / limit) + 1;
	var numPages = Math.ceil(list.length / limit);
	return {
		data: data,
		pagination: {
			currPage: currPage,
			numPages: numPages,
			from: from,
			limit: limit,
			total: list.length
		}
	};
};

var sortFuncs = [
	function (a, b) {
		// Handle sort
		if (a.handle < b.handle) {
			return -1;
		} else if (a.handle > b.handle) {
			return 1;
		} else {
			return 0;
		}
	},
	function (a, b, popData) {
		// Popularity sort
		// popData is an obj of smasherID: <Number> pairs
		var ap = popData[a];
		var bp = popData[b];
		if (ap < bp) {
			return -1;
		} else if (ap > bp) {
			return 1;
		} else {
			return 0;
		}
	}
];

router.get('/', function (req, res) {
	res.send({ message: "The API works! :)" });
});

router.get('/flairs', function (req, res) {
	fs.readFile("./data/flairs.json", function (err, data) {
		if (err) throw err;
		var json = JSON.parse(data);
		if (req.query.xeditable) {
			// Refactor json into array of objects that have value and text attrs
			var newJSON = [];
			Object.keys(json).forEach(function (cls) {
				var title = json[cls].title;
				newJSON.push({
					value: cls,
					text: title
				});
			});
			res.send(newJSON);
		} else {
			res.send(json);
		}
	});
});

/* Users methods */

router.post('/users', function (req, res) {
	// Register a new User
	res.send(req.params);
});

router.put('/users/:uid', function (req, res) {
	// Update user
});

router.get('/users/:uid', function (req, res) {
	// Get user info
});

/* Main game methods */
// TODO: Upgrade to support multiple events

router.put('/play/:game/select/:uid', function (req, res) {
	// Selects these Smashers. Limit 6.
});

router.get('/play/:game/select/:uid', function (req, res) {
	// Gets the Smashers that this player has selected.
});

router.get('/play/:game/popularity', function (req, res) {
	// Gets the entire list for popularity.
	// If params are provided, gets the specified smasher IDs.
});

/* Search methods */
// TODO: Upgrade to support multiple events

router.get('/play/:game/players', function (req, res) {
	// Returns an object.
	if (games.indexOf(req.params.game) == -1) {
		res.status(400).send("Game param " + req.params.game + " is not valid.");
	} else {
		fs.readFile("./data/ssc2015/players.json", function (err, data) {
			if (err) throw err;
			var smashers = JSON.parse(data);
			fs.readFile("./data/ssc2015/" + req.params.game + ".json", function (err, data) {
				if (err) throw err;
				var smasherIDs = JSON.parse(data);
				var filtered = {};
				smasherIDs.forEach(function (smasherID) {
					filtered[smasherID] = smashers[smasherID];
				});
				res.send(filtered);
			});
		});
	}
});

router.get('/play/:game/search', function (req, res) {
	// Must include search query and sort method and order.
	// Returns a paginated object.
	if (req.query.sortType != 0 && req.query.sortType != 1) { // TODO: extend sortType to any number of sortTypes
		res.status(400).send("Search call must include valid sortType query (0 or 1).");
	} else if (req.query.sortOrder != 1 && req.query.sortOrder != -1) {
		res.status(400).send("Search call must include valid sortOrder query (1 or -1).");
	} else if (games.indexOf(req.params.game) == -1) {
		res.status(400).send("Game param " + req.params.game + " is not valid.");
	} else {
		fs.readFile("./data/ssc2015/players.json", function (err, data) {
			if (err) throw err;
			var smashers = JSON.parse(data);
			fs.readFile("./data/ssc2015/" + req.params.game + ".json", function (err, data) {
				if (err) throw err;
				var smasherIDs = JSON.parse(data);
				var filtered = [];
				smasherIDs.forEach(function (smasherID) {
					filtered.push(smashers[smasherID]);
				});
				// Sort filtered list
				filtered.sort(function (a, b) {
					// TODO: fetch popularity data if applicable
					return sortFuncs[req.query.sortType](a, b) * req.query.sortOrder;
				});
				// Finally paginate the list
				var paginated = paginate(filtered, 10, req.query.from);
				res.send(paginated);
			});
		});
	}
});

/* Scoring methods */

module.exports = router;
