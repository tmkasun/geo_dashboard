/*
 *  Copyright (c) 2005-2010, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var debugObject; // assign object and debug from browser console, this is for debugging purpose , unless this var is unused
var showPathFlag = false; // Flag to hold the status of draw objects path
var currentSpatialObjects = {};
var selectedSpatialObject; // This is set when user search for an object from the search box
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
    var geoJsonFeature = $.parseJSON(message.data);
    if (geoJsonFeature.id in currentSpatialObjects) {
        var excitingObject = currentSpatialObjects[geoJsonFeature.id];
        excitingObject.update(geoJsonFeature);
    }
    else {
        var receivedObject = new SpatialObject(geoJsonFeature);
        currentSpatialObjects[receivedObject.id] = receivedObject;
        currentSpatialObjects[receivedObject.id].addTo(map);
    }
};

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
var defaultIcon = L.icon({
    iconUrl: "assets/img/markers/default_icons/marker-icon.png",
    iconSize: [24, 24],
    iconAnchor: [+12, +12],
    popupAnchor: [-2, -5] //[-3,-76]
});

function SpatialObject(geoJSON) {
    this.id = geoJSON.id;

    // Have to store the coordinates , to use when user wants to draw path
    this.pathGeoJsons = []; // GeoJson standard MultiLineString(http://geojson.org/geojson-spec.html#id6) can't use here because this is a collection of paths(including property attributes)
    this.path = []; // Path is an array of sections, where each section is a notified state of the path
//    {
//        "type": "LineString",
//        "coordinates": []
//    };


    // Private variable as a LineStringFeature template
    var createLineStringFeature = function (state, information, coordinates) {
        return {"type": "Feature",
            "properties": {
                "state": state,
                "information": information
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [coordinates]
            }
        };
    };

    this.speedHistory = ['speed']; // TODO: fetch this array from backend DB rather than keeping as in-memory array
    this.geoJson = L.geoJson(geoJSON, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {icon: normalIcon, iconAngle: this.heading});
        }
    }); // Create Leaflet GeoJson object

    this.marker = this.geoJson.getLayers()[0];
    this.marker.options.title = this.id;

    this.popupTemplate = $('#markerPopup');
    this.marker.bindPopup(this.popupTemplate.html());

    /* Method definitions */
    this.addTo = function (map) {
        this.geoJson.addTo(map);
    };
    this.setSpeed = function (speed) {
        this.speed = speed;
        this.speedHistory.push(speed);
        if (this.speedHistory.length > 20) {
            this.speedHistory.splice(1, 1);
        }
    };
    this.stateIcon = function () {
        // Performance of if-else, switch or map based conditioning http://stackoverflow.com/questions/8624939/performance-of-if-else-switch-or-map-based-conditioning
        switch (this.state) {
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
    this.updatePath = function (LatLng) {
        this.path[this.path.length - 1].addLatLng(LatLng); // add LatLng to last section
//        try{
//            this.path[this.path.length - 1].addLatLng(LatLng); // add to last section
//        }catch (error){
//            this.path[this.path.length - 1].addTo(map); // TODO: this will only add the last path section which is not added to map , middle sections ???
//        }
    };
    this.drawPath = function () {
        var previousSectionLastPoint = []; // re init all the time when calls the function
        if (this.path.length > 0) {
            this.removePath();
//            throw "geoDashboard error: path already exist,remove current path before drawing a new path, if need to update LatLngs use setLatLngs method instead"; // Path already exist
        }
        for (var lineString in this.pathGeoJsons) {
            var currentSectionState = this.pathGeoJsons[lineString].properties.state;
            var currentSection = new L.polyline(this.pathGeoJsons[lineString].geometry.coordinates, getSectionStyles(currentSectionState)); // Create path object when and only drawing the path (save memory) TODO: if need directly draw line from geojson

            var currentSectionFirstPoint = this.pathGeoJsons[lineString].geometry.coordinates[0];
            console.log("DEBUG: previousSectionLastPoint = " + previousSectionLastPoint + " currentSectionFirstPoint = " + currentSectionFirstPoint);
            previousSectionLastPoint.push(currentSectionFirstPoint);
            var sectionJoin = new L.polyline(previousSectionLastPoint, getSectionStyles());
            previousSectionLastPoint = [this.pathGeoJsons[lineString].geometry.coordinates[this.pathGeoJsons[lineString].geometry.coordinates.length - 1]];
            sectionJoin.addTo(map);
            this.path.push(sectionJoin);
            console.log("DEBUG: Alert Information: " + this.pathGeoJsons[lineString].properties.information);
            currentSection.bindPopup("Alert Information: " + this.pathGeoJsons[lineString].properties.information);
            currentSection.addTo(map);
            this.path.push(currentSection);
        }
    };

    this.removePath = function () {
        for (var section in this.path) {
            map.removeLayer(this.path[section]);
        }
        this.path = []; // Clear the path layer (save memory)
    };

    var pathColor;
    var getSectionStyles = function (state) {
        switch (state) {
            case "NORMAL":
                pathColor = 'blue'; // Scope of function
                break;
            case "ALERTED":
                pathColor = 'red';
                break;
            case "WARNING":
                pathColor = 'orange';
                break;
            case "OFFLINE":
                pathColor = 'green';
                break;
            default:
                return {color: "#19FFFF", weight: 8};
        }
        return {color: pathColor, weight: 8};
    };
    
    this.update = function (geoJSON) {
        this.latitude = geoJSON.geometry.coordinates[1];
        this.longitude = geoJSON.geometry.coordinates[0];
        this.setSpeed(geoJSON.properties.speed);
        this.state = geoJSON.properties.state;
        this.heading = geoJSON.properties.heading;

        this.information = geoJSON.properties.information;

        if (geoJSON.properties.notify) {
            notifyAlert("Object ID: <span style='color: blue;cursor: pointer' onclick='focusOnSpatialObject(" + this.id + ")'>" + this.id + "</span> change state to: <span style='color: red'>" + geoJSON.properties.state + "</span> Info : " + geoJSON.properties.information);
            var newLineStringGeoJson = createLineStringFeature(this.state, this.information, [this.latitude, this.longitude]);
            this.pathGeoJsons.push(newLineStringGeoJson);

            // only add the new path section to map if the spatial object is selected
            if (selectedSpatialObject == this.id) {
                var newPathSection = new L.polyline(newLineStringGeoJson.geometry.coordinates, getSectionStyles(geoJSON.properties.state));
                newPathSection.bindPopup("Alert Information: " + newLineStringGeoJson.properties.information);

                // Creating two sections joint
                var lastSection = this.path[this.path.length - 1].getLatLngs();
                var joinLine = [lastSection[lastSection.length - 1], [this.latitude, this.longitude]];
                var sectionJoin = new L.polyline(joinLine, getSectionStyles());

                this.path.push(sectionJoin);
                this.path.push(newPathSection); // Order of the push matters , last polyLine object should be the `newPathSection` not the `sectionJoin`

                sectionJoin.addTo(map);
                newPathSection.addTo(map);
            }
        }

        // Update the spatial object leaflet marker
        this.marker.setLatLng([this.latitude, this.longitude]);
        this.marker.setIconAngle(this.heading);
        this.marker.setIcon(this.stateIcon());

        try {
            // To prevent conflicts in
            // Leaflet(http://leafletjs.com/reference.html#latlng) and geoJson standards(http://geojson.org/geojson-spec.html#id2),
            // have to do this swapping, but the resulting geoJson in not upto geoJson standards
            this.pathGeoJsons[this.pathGeoJsons.length - 1].geometry.coordinates.push([geoJSON.geometry.coordinates[1], geoJSON.geometry.coordinates[0]]);
        }
        catch (error) {
            console.log("DEBUG: Dam error = " + error);
            // TODO: optimize if can , catch block execute only when initializing the object (suggestion do this in object initialization stage but then redundant LatLng)
            newLineStringGeoJson = createLineStringFeature(this.state, this.information, [geoJSON.geometry.coordinates[1], geoJSON.geometry.coordinates[0]]);
            this.pathGeoJsons.push(newLineStringGeoJson);
        }

        if (selectedSpatialObject == this.id) {
            this.updatePath([geoJSON.geometry.coordinates[1], geoJSON.geometry.coordinates[0]]);
            chart.load({columns: [this.speedHistory]});
            map.setView([this.latitude, this.longitude]);
        }

        // TODO: remove consecutive two lines object ID never change with time + information toggled only when `geoJSON.properties.notify` true (done in CEP side)
        this.popupTemplate.find('#objectId').html(this.id);
        this.popupTemplate.find('#information').html(this.information);

        this.popupTemplate.find('#speed').html(this.speed);
        this.popupTemplate.find('#heading').html(this.heading);
        this.marker.setPopupContent(this.popupTemplate.html())


    };
    this.update(geoJSON);
    return this;
}

function notifyAlert(message) {
    $.UIkit.notify({
        message: "Alert: " + message,
        status: 'warning',
        timeout: 3000,
        pos: 'bottom-left'
    });
}

function Alert(type, message, level) {
    this.type = type;
    this.message = message;
    if (level)
        this.level = level;
    else
        this.level = 'info';

    this.notify = function () {
        $.UIkit.notify({
            message: this.level + ': ' + this.type + ' ' + this.message,
            status: 'info',
            timeout: 1000,
            pos: 'bottom-left'
        });
    }
}