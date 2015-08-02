$(document).ready(function () {
	var absurd = Absurd();
	$.getJSON("/flairs", function (data) {
		absurd.add(data).compile(function (err, css) {
			if (err) throw err;
			$('<style type="text/css"></style>').appendTo("head").html(css);
		});
	});
});