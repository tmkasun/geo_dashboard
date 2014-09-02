/**
 * Created by kbsoft on 8/13/14.
 */
var tempDebug;
var currentSpatialObjects = {};
var websocket = new WebSocket('ws://localhost:9764/outputwebsocket/DefaultWebsocketOutputAdaptor/geoDataEndPoint');

websocket.onopen = function () {
    $.UIkit.notify({
        message: 'You Are Connectedto Map Server!!',
        status: 'warning',
        timeout: 1000,
        pos: 'bottom-left'
    });
};


websocket.onmessage = function processMessage(message) {
    var geojsonFeature = $.parseJSON(message.data);
//    console.log(JSON.stringify(geojsonFeature));

//    console.log(tempDebug.heading);

    if (geojsonFeature.id in currentSpatialObjects) {
        exsitingObject = currentSpatialObjects[geojsonFeature.id];
        exsitingObject.update(geojsonFeature);
    }
    else {
        var receivedObject = new SpatialObject(geojsonFeature);
        currentSpatialObjects[receivedObject.id] = receivedObject;
        currentSpatialObjects[receivedObject.id].addTo(map);
        tempDebug = receivedObject;

    }

    return false;
    var jsonData = JSON.parse(message.data);
    var id = jsonData.event.payloadData.id;
    var lat = jsonData.event.payloadData.lat;
    var lon = jsonData.event.payloadData.longitude;
    var speed = jsonData.event.payloadData.speed;
    var speedFlag = jsonData.event.payloadData.speedFlag;
    var stationFlag = jsonData.event.payloadData.withinTime;
    var point = jsonData.event.payloadData.withinPoint;
    var res = point.split(",");
    bufferLat = res[1];
    bufferLon = res[0];


    var proximity1 = jsonData.event.payloadData.proximity;

    if (proximity1 != "false" && proximity1 != null) {
        var proxList = proximity1.split(",");
        var proximityFlag = proxList[0];
        proxCloseId = proxList[1];
    }

//    messagesTextArea.value += "ID : " + id + " Longtitute : " + lon
//        + " Latitude : " + lat + "\n";
//    var textarea = document.getElementById('messagesTextArea');
//    textarea.scrollTop = textarea.scrollHeight;

    mapUpdater(id, lat, lon, speed, speedFlag, stationFlag,
        proximityFlag);

}
var idList = [];
var markerLayer = new L.layerGroup();
var polylineLayer = new L.layerGroup();
var bufferLayer = new L.layerGroup();

//Marker Icon List Class
//var markers = L.Icon.extend({
//    options : {
//        iconSize : [ 41, 41 ],
//        shadowSize : [ 41, 41 ],
//        iconAnchor : [ 20, 40 ],
//        shadowAnchor : [ 10, 40 ],
//        popupAnchor : [ 0, -30 ]
//    }
//});
//
//var defIcon = L.Icon.Default.extend({
//    options : {
//        iconUrl : 'assets/img/markers/marker-icon.png'
//    }
//});
//var DefIcon = new defIcon();
//
//var pinkIcon = new markers({
//    iconUrl : 'assets/img/markers/pinkMarker.png'
//}), redIcon = new markers({
//    iconUrl : 'assets/img/markers/redMarker.png'
//}), greenIcon = new markers({
//    iconUrl : 'assets/img/markers/greenMarker.png'
//});

function mapUpdater(id, lat, lon, speed, speedFlag, stationedFlag, proximityFlag) {
    var markerCheck = false;
    var spdflg = document.getElementById("maxSpeed");
    var stationedMaxTime = document.getElementById("maxStationed");
    var proxi = document.getElementById("proximity");
    var len = null;
    var poly = null;
    var mark = null;

    //Adding The Markers and PolyLines
    if (idList.length == 0) {

        mark = L.marker([lat, lon], {icon: DefIcon}).bindPopup("Vehicle ID" + id, {
            autoPan: false
        });
        markerLayer.addLayer(mark).addTo(map);
        poly = L.polyline([], {
            color: 'green'
        });
        polylineLayer.addLayer(poly).addTo(map);

        idList.push([ id, mark, poly, false ]);
//        idListArea.value += id + ", ";
        return;
    }

    for (var i = idList.length; i > 0; i--) {
        if (id == idList[i - 1][0]) {
            len = i - 1;
            break;

        }
        // If the ID is not in the list initiate new entry
        else if ((i - 1) == 0) {
            mark = L.marker([lat, lon], {icon: DefIcon}).bindPopup("Vehicle ID" + id, {
                autoPan: false
            });
            markerLayer.addLayer(mark);
            poly = L.polyline([], {
                color: 'green'
            });
            polylineLayer.addLayer(poly).addTo(map);
            len = idList.length - 1;

            idList.push([ id, mark, poly, false ]);
//            idListArea.value += id + ", ";
            return;
        }
    }
    return false;
    // Checking for the Stationry Scenario
    if (stationedMaxTime.checked && stationedFlag == "true") {

        if (len != null) {

            //Adding the buffers first
            if (bufferList.length == 0) {

                //The radius is fixed 20m
                var circle = L.circle([ bufferLat, bufferLon ], 20, {
                    color: 'black',
                    fillColor: '#f03',
                    fillOpacity: 0.3
                }).bindPopup(
                        "Location(Lat & Lon) of Buffer : " + bufferLat
                        + " : " + bufferLon);

                bufferLayer.addLayer(circle).addTo(map);
                bufferList.push([ bufferLat, bufferLon, circle ]);

            }

            else {

                for (var k = bufferList.length; k > 0; k--) {
                    if (bufferList[k - 1][0] == bufferLat
                        && bufferList[k - 1][1] == bufferLon) {
                        break;
                    } else if (k - 1 == 0) {

                        var circle = L.circle([ 6.88985, 79.85882 ],
                            20, {
                                color: 'black',
                                fillColor: '#f03',
                                fillOpacity: 0.3
                            }).bindPopup(
                                "Lat,Lon of Buffer : " + bufferLat
                                + " : " + bufferLon);

                        bufferLayer.addLayer(circle).addTo(map);
                        bufferList
                            .push([ bufferLat, bufferLon, circle ]);

                    }

                }
            }

            if (stationedList.length == 0) {
                stationedList.push([ id, bufferLat, bufferLon ]);

            }

            else {
                for (var k = stationedList.length; k > 0; k--) {
                    if (id == stationedList[k - 1][0]) {
                        stationedList[k - 1][1] = bufferLat;
                        stationedList[k - 1][2] = bufferLon;
                        break;
                    }
                    if (k - 1 == 0) {
                        stationedList
                            .push([ id, bufferLat, bufferLon ]);
                    }
                }

            }

            idList[len][1].setIcon(redIcon).addTo(map);

        }
        markerCheck = true;
    }

    //Checking for the proximity Scenario

    if (proxi.checked && proximityFlag == "true") {

        // Adding to The proximity Alerted List
        if (proxymintyList.length == 0) {
            proxymintyList.push([ id, lat, lon, proxCloseId ]);

        }

        else {
            for (var k = proxymintyList.length; k > 0; k--) {
                if (id == proxymintyList[k - 1][0]) {
                    proxymintyList[k - 1][1] = lat;
                    proxymintyList[k - 1][2] = lon;
                    proxymintyList[k - 1][3] = proxCloseId;
                    break;
                }
                if (k - 1 == 0) {
                    proxymintyList.push([ id, lat, lon, proxCloseId ]);
                }
            }
        }
        idList[len][1].setIcon(greenIcon).addTo(map);
        markerCheck = true;

    }

    // Checking the speed Scenario

    if (spdflg.checked && speedFlag == "true") {

        //Adding to speed Alert List
        if (speedAlertedlist.length == 0) {
            speedAlertedlist.push([ id, lat, lon ]);

        }

        else {
            for (var k = speedAlertedlist.length; k > 0; k--) {
                if (id == speedAlertedlist[k - 1][0]) {
                    speedAlertedlist[k - 1][1] = lat;
                    speedAlertedlist[k - 1][2] = lon;
                    break;
                }
                if (k - 1 == 0) {
                    speedAlertedlist.push([ id, lat, lon ]);
                }
            }
        }

        idList[len][1].setIcon(pinkIcon);

        if (idList[len][3] == false) {

            idList[len][2].addLatLng([ lat, lon ]);
            poly = L.polyline([], {
                color: 'Red'
            });
            polylineLayer.addLayer(poly).addTo(map);
            idList[len][2] = poly;
            idList[len][3] = true;

        }
        markerCheck = true;

    } else {
        if (idList[len][3] == true) {
            idList[i - 1][2].addLatLng([ lat, lon ]);
            poly = L.polyline([], {
                color: 'Green'
            });
            polylineLayer.addLayer(poly).addTo(map);
            idList[len][2] = poly;
            idList[len][3] = false;

        }

    }
    if (!markerCheck) {
        idList[len][1].setIcon(DefIcon);
    }

    idList[len][1].setLatLng([ lat, lon ]).update(); // updating the marker

    if (document.getElementById('drawPath').checked) {
        idList[len][2].addLatLng([ lat, lon ]); // updating the poly-line

    }

    if (showDetailFlag && showDetailId == id) {

        showDetailsUpdater(id, lon, lat, speed);
    }

    if (document.getElementById("followId").checked
        && document.getElementById("followID").value == id) {
        map.panTo([ lat, lon ], {
            duration: 0.5
        });

    }

}


var normalIcon = L.icon({
    iconUrl: "assets/img/markers/arrow_normal.png",
    shadowUrl: false,
    iconSize: [24, 24],
    iconAnchor: [+12, +12],
    popupAnchor: [-2, -5] //[-3,-76]
});
var alertedIcon = L.icon({
    iconUrl: "assets/img/markers/arrow_alerted.png",
    shadowUrl: false,
    iconSize: [24, 24],
    iconAnchor: [+12, +12],
    popupAnchor: [-2, -5] //[-3,-76]
});
var offlineIcon = L.icon({
    iconUrl: "assets/img/markers/arrow_offline.png",
    iconSize: [24, 24],
    iconAnchor: [+12, +12],
    popupAnchor: [-2, -5] //[-3,-76]
});

var defaultIcon =  L.icon({
    iconUrl: "assets/img/markers/default_icons/marker-icon.png",
    iconSize: [24, 24],
    iconAnchor: [+12, +12],
    popupAnchor: [-2, -5] //[-3,-76]
});

function SpatialObject(geoJSON) {
    this.id = geoJSON.id;
    this.geoJson = L.geoJson(geoJSON, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng,{icon:normalIcon,iconAngle: this.heading});
        }
    });
    this.marker = this.geoJson.getLayers()[0];

    /* Method definitions */
    this.addTo = function (map) {
        this.geoJson.addTo(map);
    };
    this.setSpeed = function (speed) {
        this.speed = speed;
    };
    this.stateIcon = function(){
        switch(this.state) {
            case "NORMAL":
                return normalIcon;
                break;
            case "ALERTED":
                return alertedIcon;
                break;
            case "OFFLINE":
                return offlineIcon;
                break;
            default:
                return defaultIcon;
        }

    };
    this.update = function (geoJSON) {
        this.latitude = geoJSON.geometry.coordinates[1];
        this.longitude = geoJSON.geometry.coordinates[0];
        this.speed = geoJSON.properties.speed;
        this.state = geoJSON.properties.state;
        this.heading = geoJSON.properties.heading;
        this.information = geoJSON.properties.information;
        this.marker.setLatLng([this.latitude, this.longitude]);
        this.marker.setIconAngle(this.heading);
        this.marker.setIcon(this.stateIcon());
        popupTemplate = $('#markerPopup');
        popupTemplate.find('#objectId').html(this.id);
        popupTemplate.find('#information').html(this.information);
        popupTemplate.find('#speed').html(this.speed);
        popupTemplate.find('#heading').html(this.heading);
        this.marker.bindPopup(popupTemplate.html());
    };
    this.update(geoJSON);
    return this;
}