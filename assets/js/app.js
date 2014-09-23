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

/*Application configurations*/

$(".modal").draggable({
    handle: ".modal-header"
});

//Clear modal content for reuse the wrapper by other functions
$('body').on('hidden.bs.modal', '.modal', function () {
    $(this).removeData('bs.modal');
});

/*Map layer configurations*/
var map, boroughSearch = [], theaterSearch = [];

$("#loading").hide();

getTileServers();

/* Overlay Layers */
var highlight = L.geoJson(null);

var boroughs = L.geoJson(null, {
    style: function (feature) {
        return {
            color: "black",
            fill: false,
            opacity: 1,
            clickable: false
        };
    },
    onEachFeature: function (feature, layer) {
        boroughSearch.push({
            name: layer.feature.properties.BoroName,
            source: "Boroughs",
            id: L.stamp(layer),
            bounds: layer.getBounds()
        });
    }
});

/* Single marker cluster layer to hold all clusters */
var markerClusters = new L.MarkerClusterGroup({
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    disableClusteringAtZoom: 16
});

var browserLatitude;
var browserLongitude;
function success(position) {
    browserLatitude = position.coords.latitude;
    browserLongitude = position.coords.longitude;

    $.UIkit.notify({
        message: "Setting map view to browser location....",
        status: 'info',
        timeout: 3000,
        pos: 'top-center'
    });

    map.setView([browserLatitude, browserLongitude]);
    map.setZoom(13);
};

function error() {
    $.UIkit.notify({
        message: "Unable to find browser location!",
        status: 'warning',
        timeout: 3000,
        pos: 'top-center'
    });
};

navigator.geolocation.getCurrentPosition(success, error);

initializeMap();

function initializeMap(tileLayer) {
    if (typeof(tileLayer) === 'undefined') tileLayer = defaultOSM;
    if (typeof(map) !== 'undefined') map.remove();
    map = L.map("map", {
        zoom: 10,
        center: [6.934846, 79.851980],
        layers: [defaultOSM, boroughs, markerClusters, highlight],
        zoomControl: false,
        attributionControl: false,
        maxZoom: 20,
        maxNativeZoom: 18
    });

    map.on('click', function(e) {
        $.UIkit.offcanvas.hide();//[force = false] no animation
    });
}

/* Clear feature highlight when map is clicked */
map.on("click", function (e) {
    highlight.clearLayers();
});

/* Attribution control */
function updateAttribution(e) {
    $.each(map._layers, function (index, layer) {
        if (layer.getAttribution) {
            $("#attribution").html((layer.getAttribution()));
        }
    });
}
map.on("layeradd", updateAttribution);
map.on("layerremove", updateAttribution);

var attributionControl = L.control({
    position: "bottomright"
});
attributionControl.onAdd = function (map) {
    var div = L.DomUtil.create("div", "leaflet-control-attribution");
    div.innerHTML = "<a href='#' onclick='$(\"#attributionModal\").modal(\"show\"); return false;'>Attribution</a>";
    return div;
};
map.addControl(attributionControl);

var fullscreenControl = L.control.fullscreen({
    position: 'bottomright'
}).addTo(map);

var zoomControl = L.control.zoom({
    position: "bottomright"
}).addTo(map);

/* GPS enabled geolocation control set to follow the user's location */
/* TODO: for reference only remove if not use */
//var locateControl = L.control.locate({
//    drawCircle: false,
//    showPopup: false,
//    setView: true,
//    keepCurrentZoomLevel: true,
//    metric: true,
//    locateOptions: {
//        maxZoom: 18,
//        watch: true,
//        enableHighAccuracy: true
//    }
//}).addTo(map);
//locateControl.locate();

/* Larger screens get expanded layer control and visible sidebar */
// -for reference change to permanent collapsed true -
/*if (document.body.clientWidth <= 767) {
    var isCollapsed = true;
} else {
    var isCollapsed = false;
}*/


var groupedOverlays = {
    "Web Map Service layers": {
    }
};
getWms();
var layerControl = L.control.groupedLayers(baseLayers, groupedOverlays, {
    collapsed: true
}).addTo(map);

/* Highlight search box text on click */
$("#searchbox").click(function () {
    $(this).select();
});

/* Typeahead search functionality */

var substringMatcher = function () {
    return function findMatches(q, cb) {
        var matches, substrRegex;
        matches = [];
        substrRegex = new RegExp(q, 'i');
        $.each(currentSpatialObjects, function (i, str) {
            if (substrRegex.test(i)) {
                matches.push({ value: i });
            }
        });

        cb(matches);
    };
};


var chart;
var speedArray = ['speed'];
function createChart() {
    chart = c3.generate({
        bindto: '#chart_div',
        data: {
            columns: [
                speedArray
            ]
        },
        subchart: {
            show: true
        },
        axis: {
            y: {
                label: {
                    text: 'Speed',
                    position: 'outer-middle'
                }
            }
        },
        legend: {
            show: false
        }
    });
}

$('#searchbox').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    },
    {
        name: 'states',
        displayKey: 'value',
        source: substringMatcher()
    }).on('typeahead:selected', function ($e, datum) {
        objectId = datum['value'];
        focusOnSpatialObject(objectId)
    });


// TODO: when click on a notification alert ? "Uncaught ReferenceError: KM is not defined "
var toggled = false;
function focusOnSpatialObject(objectId) {
    clearFocuse(); // Clear current focus if any
    selectedSpatialObject = objectId; // (global) Why not use 'var' other than implicit declaration http://stackoverflow.com/questions/1470488/what-is-the-function-of-the-var-keyword-and-when-to-use-it-or-omit-it#answer-1471738
    var spatialObject = currentSpatialObjects[selectedSpatialObject];// (local)
    map.setView(spatialObject.marker.getLatLng(), 17, {animate: true}); // TODO: check the map._layersMaxZoom and set the zoom level accordingly

    $('#objectInfo').find('#objectInfoId').html(selectedSpatialObject);
    spatialObject.marker.openPopup();
    if (!toggled){
        $('#objectInfo').animate({width: 'toggle'}, 100);
        toggled = true;
    }
    getAlertsHistory(objectId);
    spatialObject.drawPath();
    setTimeout(function () {
        createChart();
    },100);
}

// Unfocuse on current searched spatial object
function clearFocuse(){
    if(selectedSpatialObject){
        spatialObject = currentSpatialObjects[selectedSpatialObject];
        spatialObject.removePath();
        spatialObject.marker.closePopup();
        selectedSpatialObject = null;
    }
}


