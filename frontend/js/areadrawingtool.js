var isAreaChanged=false;
var selectedAreaIndex=-1;
function setDrawingManager() {
	area=[];
	drawingManager = new google.maps.drawing.DrawingManager({
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [
        google.maps.drawing.OverlayType.CIRCLE
      ]
    },
    circleOptions: {
      fillColor: '#ffff00',
      fillOpacity: 0.4,
      strokeWeight: 5,
      clickable: true,
      editable: true,
      zIndex: 1
    },
	rectangleOptions: {
		clickable: true,
		editable: true,
		zIndex:1
	}
  });
  drawingManager.setMap(map);
  google.maps.event.addListener(drawingManager, 'overlaycomplete', function(event) {
	if (event.type == google.maps.drawing.OverlayType.CIRCLE) {
		handleCircle(event.overlay);
	}
	});
	getAreas();
}

function getAreas() {
	$.ajax({
		type: "GET",
		url: "http://trackingsystem-mielientiev.rhcloud.com/api/area/circle",
		async: true,
		accepts:"application/json",
		success: function (data) {
				
				
				for(var i=0;i<data.length;i++) {
					var circleOptions= {
					fillColor: '#00ff00',
					fillOpacity: 0.4,
					strokeWeight: 5,
					clickable: false,
					editable: false,
					center:new google.maps.LatLng(data[i].latitude,data[i].longitude),
					radius:data[i].radius*1000
					}
					area.push(new google.maps.Circle(circleOptions));
					area[i].setMap(map);
				}
			}
		});
}

function handleCircle(circle) {
	area.push(circle);
	selectedAreaIndex=area.length-1;
	captureCircleStats(circle);
	isAreaChanged=true;
	hideDrawingManager();
	google.maps.event.addListener(area[selectedAreaIndex], 'center_changed',function(){circleShape.center=area[selectedAreaIndex].getCenter();});
	google.maps.event.addListener(area[selectedAreaIndex], 'radius_changed',function(){circleShape.radius=area[selectedAreaIndex].getRadius();});
}

function captureCircleStats(circle) {
	circleShape.center=circle.getCenter();
	circleShape.radius=circle.getRadius();
}

function hideDrawingManager() {
	drawingManager.setOptions({
		drawingControl: false,
		drawingMode: null
	});
}

function showDrawingManager() {
	drawingManager.setOptions({
		drawingControl: true
	});
}

function clearArea() {
	if(isAreaChanged&&selectedAreaIndex==area.length-1)
	{
		area.pop().setMap(null);
		isAreaChanged=false;
		selectedAreaIndex=-1;
		showDrawingManager();
	}
}

function applyArea() {
	if(isAreaChanged) {
		var dataJson = {"radius":circleShape.radius/1000, "longitude":circleShape.center.lng(), "latitude":circleShape.center.lat()};
		$.ajax({
		type: "POST",
		url: "http://trackingsystem-mielientiev.rhcloud.com/api/area/circle",
		data: JSON.stringify(dataJson),
		async: true,
		contentType: "application/json; charset=UTF-8",
		success: function (data) {
			isAreaChanged=false;
			
			area[selectedAreaIndex].setOptions({
				fillColor: '#00ff00',
				clickable: false,
				editable: false
			});
			selectedAreaIndex=-1;
		}});

	}
}

