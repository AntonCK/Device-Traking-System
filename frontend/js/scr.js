var map;                    // Google map
var markers = [];           //
var userPositions = [];     //
var polyLines = [];         // Directions
var times = [];             // Time of every position
var infoWindows = [];       // Tip for every polyline
var userPath;               // User poly line
var turn = false;           // For date range
var road = false;           // For road snap
var indexing = false;       //
var directionsService = new google.maps.DirectionsService();
var directionsDisplay = new google.maps.DirectionsRenderer();
//
var area;
var circleShape = {};
var drawingManager;

function initialize() {
    var mapOptions = {
        zoom: 10,
        center: new google.maps.LatLng(50.00, 36.15)
    };
    circleShape.center = new google.maps.LatLng(50.00, 36.15);
    circleShape.radius = 0.0;
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    setDrawingManager();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    }
}
function showPosition(position) {
    var mapOptions = {
        zoom: 10,
        center: new google.maps.LatLng(position.coords.latitude, position.coords.longitude)
    };
    mapOptions.setMap(map);
}
google.maps.event.addDomListener(window, 'load', initialize);


$('#datepair').hide();
// Display device list
function displayDeviceList(serverResponse) {
    var field = "<form id=\"list_obj\" name=\"listO\"> <select id=\"list_elements\" name=\"selIt\">";
    if (serverResponse.length) {
        var i = 0;

        for (var j = 0; j < serverResponse.length; j++) {
            field += "<option value=\"" + serverResponse[j] + "\">" + i + "</option>";
            i++;
        }
        field += "</select><a class=\"but\" style=\"padding: 5px 20px; margin-left:10px;\" onclick=\"selectItem(listO.selIt.options[listO.selIt.selectedIndex].value)\">Show</a></form>";
    } else {
        field += "<option value=\"0\">No devices</option></select>";
    }
    $('.list').append(field);
}
// Draw marker
function drawMarker(longitude, latitude, positionNumber) {
    var currentLatLng = new google.maps.LatLng(latitude, longitude);
    var marker = new google.maps.Marker({
        position: currentLatLng,
        map: map,
        title: "Position: " + positionNumber,
        icon: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
    });
    markers.push(marker);
    userPositions.push(currentLatLng);
}
// On success get device position by ID
function getLocation(locationJSON) {
    if (locationJSON.length) {
        // Draw markers on every position
        for (var i = 0; i < locationJSON.length; i++) {
            drawMarker(locationJSON[i].longitude, locationJSON[i].latitude, locationJSON.length - i);
            times.push(locationJSON[i].time);
        }
        // Mark start position with green color
        markers[markers.length - 1].setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
        markers[markers.length - 1].setTitle("Starting position");
        // Mark Current position with red color
        markers[0].setIcon("http://maps.google.com/mapfiles/ms/icons/red-dot.png");
        markers[0].setTitle("Current position");
        // Focus current position
        map.setCenter(markers[0].getPosition());
        drawUserPath();
        if (indexing) {
            indexingMarkers();
        }
    }
}

// Indexing markers
function indexingMarkers() {
    for (var i = 0; i < markers.length; i++) {
        var infoContent = "<span style=\"color: red; font-size: xx-small\">" + (markers.length - i).toString() + "</span>";
        var infowindow = new google.maps.InfoWindow({
            content: infoContent
        });
        infowindow.open(map, markers[i]);
    }
}
// Clear all markers on the map
function clearMarkers() {
    if (markers)
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
    markers.length = 0;
}
// Road path
function roadPath() {
    directionsDisplay.setMap(map);
    var start = userPositions[userPositions.length - 1];
    var end = userPositions[0];
    var request = {
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.DRIVING
    };
    directionsService.route(request, function (result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(result);
        }
    });
}
// Connected user positions by lines
function drawUserPath() {
    if (road) {
        roadPath();
    } else {
        var lineSymbol = {
            path: google.maps.SymbolPath.FORWARD_OPEN_ARROW
        };
        var poly;
        var polyOptions = {
            strokeColor: '#486093',
            strokeOpacity: 1.0,
            strokeWeight: 3,
            icons: [{
                icon: lineSymbol,
                offset: '100%'
            }]
        };
        var infoWindowId = 0;
        // array of polylines
        for (var i = userPositions.length - 1; i > 0; i--) {
            var sec_num = times[i - 1] - times[i];
			sec_num /= 1000;
            var hours   = Math.floor(sec_num / 3600);
            var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
            var seconds = sec_num - (hours * 3600) - (minutes * 60);

            if (hours   < 10) {hours   = "0" + hours;}
            if (minutes < 10) {minutes = "0" + minutes;}
            if (seconds < 10) {seconds = "0" + seconds;}
            var time    = hours + ':'+minutes + ':' + Math.round(seconds);;

            var contentString =
                '<div id="content">' +
                '<div id="bodyContent">' +
                '<p>' +
                '<span style=\"color: red; \">' + time + ' time gone' + '</span>' +
                '</p>' +
                '</div>' +
                '</div>';

            infoWindows.push(new google.maps.InfoWindow({content: contentString}));
            poly = new google.maps.Polyline(polyOptions);
            poly.setMap(map);
            var path = poly.getPath();
            path.push(userPositions[i]);
            path.push(userPositions[i - 1]);
            polyLines.push(poly);
            infoWindowId++;
            polyLines[polyLines.length - 1].set("infoWindowId", infoWindowId);
            google.maps.event.addListener(poly, 'mouseover', function (event) {
                infoWindows[this.infoWindowId].setPosition(event.latLng);
                infoWindows[this.infoWindowId].open(map);
                // alert(this.infoWindowId);
            });
            google.maps.event.addListener(poly, 'mouseout', function () {
                infoWindows[this.infoWindowId].close();
            });
        }
    }
}
// Clear up lines
function clearUserPath() {
    if (userPath)
        userPath.setMap(null);
    userPositions = [];
    if (polyLines) {
        for (var i = 0; i < polyLines.length; i++) {
            polyLines[i].setMap(null);
        }
        polyLines = [];
    }
    if (directionsDisplay) {
        directionsDisplay.setMap(null);
    }
}
// On item select
function selectItem(deviceId) {
	var email = "?email=antoshka@d.com";
    // Claer previous markers
    clearMarkers();
    // Clear previous user path
    clearUserPath();
    if (turn) {
        var from = new Date($('#fromDate').val().toString() + " " + $('#fromTime').val().toString()).getTime() + "/";
        var to = new Date($('#toDate').val().toString() + " " + $('#toTime').val().toString()).getTime() + "/";
        $.get("http://trackingsystem-mielientiev.rhcloud.com/api/trackinfo/" + from + to + deviceId, getLocation);
    } else {
        $.get("http://trackingsystem-mielientiev.rhcloud.com/api/trackinfo/" + deviceId + email, getLocation);
    }
}
//
function refreshDateTimeFields() {
    var fullDate = new Date();
    var twoDigitMonth = ((fullDate.getMonth().length + 1) === 1) ? (fullDate.getMonth() + 1) : +(fullDate.getMonth() + 1);
    var currentDate = twoDigitMonth + "/" + fullDate.getDate() + "/" + fullDate.getFullYear();
    var currentTime;
    if (fullDate.getHours() > 12) {
        currentTime = fullDate.getHours() - 12 + ":";
        fullDate.getMinutes() < 10 ? currentTime += 0 + fullDate.getMinutes() : currentTime += fullDate.getMinutes();
        currentTime += " pm";
    }
    else {
        currentTime = fullDate.getHours() + ":";
        fullDate.getMinutes() < 10 ? currentTime += 0 + fullDate.getMinutes() : currentTime += fullDate.getMinutes();
        currentTime += " am";
    }

    $('#fromDate').val(currentDate);
    $('#toDate').val(currentDate);
    $('#fromTime').val(currentTime);
    $('#toTime').val(currentTime);
}
// When page is load ask server for device list
function pageIsLoaded() {
	var email = "?email=antoshka@d.com";
    $.get("http://trackingsystem-mielientiev.rhcloud.com/api/trackinfo/all" + email, displayDeviceList)
        .done(function () {
            $('#showDateRange').click(function () {
                if (!turn) {
                    $('#datepair').show();
                    refreshDateTimeFields();
                }
                else {
                    $('#datepair').hide();
                }
                turn = !turn;
            });
            $('#snapToTheRoad').click(function () {
                road = !road;
            });
            $('#indexing').click(function () {
                indexing = !indexing;
            });

            $('#datepair .time').timepicker({
                'scrollDefault': 'now',
                'showDuration': true,
                'timeFormat': 'g:i a'
            });

            $('#datepair .date').datepicker({
                'format': 'm/d/yyyy',
                'autoclose': true
            });

            // initialize datepair
            $('#datepair').datepair();

            // initialize time fields
            refreshDateTimeFields()
            $('#datepair').hide();
        })
        .fail(function () {
            alert("Error. No connection.");
        });
}
$(document).ready(pageIsLoaded);