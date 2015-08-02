function passwordMatch() {
    var password = $("#registration-view input[name=password]").val();
    var confirmPassword = $("#registration-view input[name=confirmPassword]").val();
    if (password != confirmPassword) {
        $("#registration-view input[name=confirmPassword]").get(0).setCustomValidity("Passwords must match.");
    } else {
        $("#registration-view input[name=confirmPassword]").get(0).setCustomValidity("");
    }
}

$(document).ready(function () {
    // Setup password validators
    $("#registration-view input[name=password]").get(0).onchange = passwordMatch;
    $("#registration-view input[name=confirmPassword]").get(0).onchange = passwordMatch;
    
    // Setup form transition listeners
    $("#btn-registration").click(function (event) {
        $("#signin-view").fadeOut(200, function () {
            $("#registration-view").fadeIn(200);
        });
    });
    $("#btn-cancel-registration").click(function (event) {
        $("#registration-view").fadeOut(200, function () {
            $("#signin-view").fadeIn(200);
        });
    });
    $("#btn-forgot-password").click(function (event) {
        $("#signin-view").fadeOut(200, function () {
            $("#forgot-password-view").fadeIn(200);
        });
    });
    $("#btn-cancel-forgot-password").click(function (event) {
        $("#forgot-password-view").fadeOut(200, function () {
            $("#signin-view").fadeIn(200);
        });
    });

    // Setup x-editable radiolist for flair selection
    $("#registrationFlair").editable({
        value: 1,
        showbuttons: "bottom",
        source: [
            {value: 1, text: "http://www.trash.net/~ffischer/admin/icons/deanJones/20x20/AlignCenter.gif"},
            {value: 2, text: "http://www.trash.net/~ffischer/admin/icons/deanJones/20x20/GreenFlag.gif"},
            {value: 3, text: "http://www.trash.net/~ffischer/admin/icons/deanJones/20x20/Computer.gif"},
            {value: 4, text: "http://www.trash.net/~ffischer/admin/icons/deanJones/20x20/CD.gif"},
            {value: 5, text: "http://www.trash.net/~ffischer/admin/icons/deanJones/20x20/Document.gif"},
            {value: 6, text: "http://www.trash.net/~ffischer/admin/icons/deanJones/20x20/LineGraph.gif"},
            {value: 7, text: "http://www.trash.net/~ffischer/admin/icons/deanJones/20x20/Envelope.gif"},
            {value: 8, text: "http://www.trash.net/~ffischer/admin/icons/deanJones/20x20/World.gif"},
            {value: 9, text: "http://www.trash.net/~ffischer/admin/icons/deanJones/20x20/Sheet.gif"},
            {value: 10,text:"http://www.trash.net/~ffischer/admin/icons/deanJones/20x20/Object.gif"},
            {value: 11,text:"http://www.trash.net/~ffischer/admin/icons/deanJones/20x20/Up.gif"},
            {value: 12,text:"http://www.trash.net/~ffischer/admin/icons/deanJones/20x20/YellowCircle.gif"},
            {value: 13,text:"http://www.trash.net/~ffischer/admin/icons/deanJones/20x20/TileCascade.gif"},
            {value: 14,text:"http://www.trash.net/~ffischer/admin/icons/deanJones/20x20/Save.gif"},
            {value: 15,text:"http://www.trash.net/~ffischer/admin/icons/deanJones/20x20/MagnifyPlus.gif"},
            {value: 16,text:"http://www.trash.net/~ffischer/admin/icons/deanJones/20x20/Inform.gif"}
        ], // Use AJAX String URL
        display: function (value, sourceData) {
            // Manipulate x-editable link to use image
            var selected = sourceData.filter(function (item) {return item.value == value})[0];
            var newHTML = '<img src="' + selected.text + '"/>';
            $(this).html(newHTML);
        }
    });
    
    // Manipulate x-editable popup to use image
    $("#registrationFlair").click(function () {
        var labels = $(".editable-radiolist label span");
        var labelsCount = labels.length;
        for (var i = 0; i < labelsCount; i++) {
            // TODO modify newHTML for loading sprites out of spritesheets
            var newHTML = '<img src="' + $(labels[i]).text() + '"/>';
            $(labels[i]).after(newHTML);
            $(labels[i]).css({"display": "none"});
        }
        // Set offset of x-editable popup to the selection offset
        var offset = $("#registrationFlair").offset();
        var popupHeight = $(".editable-popup").height() + 10;
        offset.top -= popupHeight;
        offset.left -= ($(".editable-popup > .arrow").position().left - 10);
        $(".editable-popup").offset(offset);
    });
    
    // Setup debug form submit
    $("#signin-view > form").submit(function (event) {
        event.preventDefault();
        console.log("Trying to sign in!");
        var email = $(this).find("input[name=email]").val();
        var password = $(this).find("input[name=password]").val();
        var rememberMe = $(this).find("input[name=rememberMe]").get(0).checked;
        console.log("Email Address:", email);
        console.log("Password:", password);
        console.log("Remember me:", rememberMe);
    });
    $("#registration-view > form").submit(function (event) {
        event.preventDefault();
        console.log("Registering new account!");
        var email = $(this).find("input[name=email]").val();
        var username = $(this).find("input[name=username]").val();
        var password = $(this).find("input[name=password]").val();
        console.log("Email Address:", email);
        console.log("Username:", username);
        console.log("Password:", password);
        console.log("Flair Value:", $(this).find("#registrationFlair").data().editable.value);
    });
    $("#forgot-password-view > form").submit(function (event) {
        event.preventDefault();
        console.log("Forgot password!");
        var email = $(this).find("input[name=email]").val();
        console.log("Email Address:", email);
    });
});