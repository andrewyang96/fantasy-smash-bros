var express = require('express');
var router = express.Router();

var fs = require('fs');
var config = require('../config');
var request = require('request');
var Firebase = require('firebase');

var ref = new Firebase("https://fantasy-smash-bros.firebaseio.com/");
var refGames = ref.child("games");
var refUsers = ref.child("users");

// Authenticate with Firebase secret
ref.authWithCustomToken(config.firebaseSecret, function () {
	console.log("Successfully authenticated server with secret token");
});

// JS Extensions
String.prototype.format = function () {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{' + i + '\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

Array.prototype.forEachDone = function(fn, scope, lastfn) {
    for(var i = 0, c = 0, len = this.length; i < len; i++) {
        fn.call(scope, this[i], i, this, function() { // fn should be set up as fn(num, i, arr, done)
            ++c === len && lastfn();
        });
    }
};

// TODO: refactor so that this variable won't be necessary.
var games = ["ssb64", "ssbm", "ssbb", "ssb4"];

var paginate = function (list, limit, from) {
	// Returns a paginated object.
	if (list.length == 0) {
		return {
			data: [],
			pagination: {
				currPage: 0,
				totalPages: 0,
				from: 0,
				limit: limit,
				total: 0
			}
		};
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
	var totalPages = Math.ceil(list.length / limit);
	return {
		data: data,
		pagination: {
			currPage: currPage,
			totalPages: totalPages,
			from: from,
			limit: limit,
			total: list.length
		}
	};
};

var getPopularity = function (game, smasherID, absolute, callback) {
	// TODO: implement event
	var gameRef = refGames.child(game);
	gameRef.child("freqs").child(smasherID).once("value", function (snapshot) {
		var absPop = Object().keys(snapshot.val()).length;
		if (absolute) {
			callback(absPop);
		} else {
			gameRef.child("participants").once("value", function (snapshot) {
				var numParticipants = Object().keys(snapshot.val()).length;
				callback(absPop / numParticipants);
			});
		}
	});
};

var uidExists = function (uid, callback) {
	refUsers.child(uid).once("value", function (snapshot) {
		callback(snapshot != null);
	});
};

var isMatch = function (smasherObj, searchQuery) {
	if (!searchQuery) return true;
	// TODO: customize searchable fields
	var regexp = new RegExp(searchQuery, "i");
	var handleMatch = smasherObj.handle.match(regexp);
	return Boolean(handleMatch);
}

var recaptcha = function (req, res, callback) {
	var grRes = req.body["g-recaptcha-response"];
	var url = "https://www.google.com/recaptcha/api/siteverify?secret=" + config.recaptchaSecret + "&response=" + grRes + "&remoteip=" + req.connection.remoteAddress;
	request.post(url, function (err, httpResponse, body) {
		if (err) {
			res.status(400).send("Error in recaptcha: " + err);
		} else {
			callback(body);
		}
	});
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
	recaptcha(req, res, function (response) {
		response = JSON.parse(response);
		if (response.success) {
			var params = req.body;
			// Check if all necessary params are there
			if (params.agree && params["g-recaptcha-response"]) {
				if (params.email && params.username && params.password && params.flair) {
					ref.createUser({
						email: params.email,
						password: params.password
					}, function (error, userData) {
						if (error) {
							switch(error.code) {
								case "EMAIL_TAKEN":
									res.status(500).send("The email " + params.email + " has already been taken.");
									break;
								case "INVALID_EMAIL":
									res.status(500).send("The email " + params.email + " is not a valid email");
									break;
								default:
									res.status(500).send("Error creating user account: " + error);
							}
						} else {
							var uid = userData.uid;
							refUsers.child(uid).set({
								email: params.email,
								username: params.username,
								flair: params.flair
							}, function () {
								console.log("Created user: " + params.email + " with uid: " + params.uid);
								res.redirect('/login');
							});							
						}
					});
				}
			} else {
				res.status(400).send("POST request must include agree checkbox and recaptcha response. Press the ack button to try again.");
			}
		} else {
			var errorCodes = response["error-codes"];
			console.log(response);
			res.status(400).send("User registration failed. Press the back button to try again. Error codes: " + errorCodes);
		}
	});
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
	if (games.indexOf(req.params.game) == -1) {
		res.status(400).send("Game param " + req.params.game + " is not valid.");
	} else if (!req.query.choices) {
		res.status(400).send("Choices querystring must be specified");
	} else if (typeof req.query.choices === "object" && req.query.choices.length > 6) {
		res.status(400).send("Choices cannot exceed length of 6.");
	} else {
		// TODO: check auth
		res.send("Selected: " + req.query.choices);
	}
});

router.get('/play/:game/select/:uid', function (req, res) {
	// Gets the Smashers that this player has selected.
	if (games.indexOf(req.params.game) == -1) {
		res.status(400).send("Game param " + req.params.game + " is not valid.");
	} else {
		uidExists(req.params.uid, function (exists) {
			if (!exists) {
				res.status(400).send("uid " + req.params.uid + " doesn't exist.");
			} else {
				refGames.child(req.params.game).child("choices").child(req.params.uid).once("value", function (snapshot) {
					var choices = Object.keys(snapshot.val());
					// TODO: Convert list of choices to player Objs
				});
			}
		});
	}
});

router.get('/play/:game/popularity', function (req, res) {
	// Gets the entire list for popularity.
	// If smasher querystring(s) are provided, gets the specified smasher IDs.
	// If absolute querystring exists, get absolute popularity.
	if (games.indexOf(req.params.game) == -1) {
		res.status(400).send("Game param " + req.params.game + " is not valid.");
	} else {
		if (req.query.smasher) {
			// TODO: If querystring is provided
		} else {
			// TODO: Get all popularities
		}
	}
});

router.get('/play/:game/popularity/:smasher', function (req, res) {
	// Gets the popularity for a specified Smasher.
	// If absolute querystring exists, get absolute popularity.
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
	// Must include sortType and sortOrder. searchQuery is optional.
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
					if (isMatch(smashers[smasherID], req.query.searchQuery)) {
						filtered.push(smashers[smasherID]);
					}
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
// TODO: Copy scoring.js?

module.exports = router;
