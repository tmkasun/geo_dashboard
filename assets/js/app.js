/*Application configurations*/

$(".modal").draggable({
    handle: ".modal-header"
});

//Clear modal content for reuse the wrapper by other functions
$('body').on('hidden.bs.modal', '.modal', function () {
    $(this).removeData('bs.modal');
});

/*Map layer configurations*/
var map, featureList, boroughSearch = [], theaterSearch = [], museumSearch = [];

$("#loading").hide();

$(document).on("click", ".feature-name", function (e) {
    sidebarClick(parseInt($(this).attr('id')));
});

function sidebarClick(id) {
    map.addLayer(theaterLayer).addLayer(museumLayer);
    var layer = markerClusters.getLayer(id);
    markerClusters.zoomToShowLayer(layer, function () {
        map.setView([layer.getLatLng().lat, layer.getLatLng().lng], 17);
        layer.fire("click");
    });
    /* Hide sidebar and go to the map on small screens */
    if (document.body.clientWidth <= 767) {
        $("#sidebar").hide();
        map.invalidateSize();
    }
}


// TODO: use this method to load tileservers from backend database
getTileServers();
/* Basemap Layers */
var mapquestOSM = L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png", {
    maxZoom: 19,
    subdomains: ["otile1", "otile2", "otile3", "otile4"],
    attribution: 'Tiles courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA.'
});
var mapquestOAM = L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg", {
    maxZoom: 18,
    subdomains: ["oatile1", "oatile2", "oatile3", "oatile4"],
    attribution: 'Tiles courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a>. Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency'
});
var mapquestHYB = L.layerGroup([L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg", {
    maxZoom: 18,
    subdomains: ["oatile1", "oatile2", "oatile3", "oatile4"]
}), L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/hyb/{z}/{x}/{y}.png", {
    maxZoom: 19,
    subdomains: ["oatile1", "oatile2", "oatile3", "oatile4"],
    attribution: 'Labels courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA. Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency'
})]);
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

/* Empty layer placeholder to add to layer control for listening when to add/remove theaters to markerClusters layer */
var theaterLayer = L.geoJson(null);
var theaters = L.geoJson(null, {
    pointToLayer: function (feature, latlng) {
        return L.marker(latlng, {
            icon: L.icon({
                iconUrl: "assets/img/theater.png",
                iconSize: [24, 28],
                iconAnchor: [12, 28],
                popupAnchor: [0, -25]
            }),
            title: feature.properties.NAME,
            riseOnHover: true
        });
    },
    onEachFeature: function (feature, layer) {
        if (feature.properties) {
            var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Name</th><td>" + feature.properties.NAME + "</td></tr>" + "<tr><th>Phone</th><td>" + feature.properties.TEL + "</td></tr>" + "<tr><th>Address</th><td>" + feature.properties.ADDRESS1 + "</td></tr>" + "<tr><th>Website</th><td><a class='url-break' href='" + feature.properties.URL + "' target='_blank'>" + feature.properties.URL + "</a></td></tr>" + "<table>";
            layer.on({
                click: function (e) {
                    $("#feature-title").html(feature.properties.NAME);
                    $("#feature-info").html(content);
                    $("#featureModal").modal("show");
                    highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], {
                        stroke: false,
                        fillColor: "#00FFFF",
                        fillOpacity: 0.7,
                        radius: 10
                    }));
                }
            });
            $("#feature-list tbody").append('<tr style="cursor: pointer;"><td style="vertical-align: middle;"><img width="16" height="18" src="assets/img/theater.png"></td><td class="feature-name" id="' + L.stamp(layer) + '">' + layer.feature.properties.NAME + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
            theaterSearch.push({
                name: layer.feature.properties.NAME,
                address: layer.feature.properties.ADDRESS1,
                source: "Theaters",
                id: L.stamp(layer),
                lat: layer.feature.geometry.coordinates[1],
                lng: layer.feature.geometry.coordinates[0]
            });
        }
    }
});
//*temp_for_not_to_make_ajax*$.getJSON("data/DOITT_THEATER_01_13SEPT2010.geojson", function (data) {
//  theaters.addData(data);
//  map.addLayer(theaterLayer);
//});

var browserLatitude;
var browserLongitude;
function success(position) {
    browserLatitude  = position.coords.latitude;
    browserLongitude = position.coords.longitude;

    $.UIkit.notify({
        message: "Setting map view to browser location....",
        status: 'info',
        timeout: 3000,
        pos: 'top-center'
    });

    map.setView([browserLatitude,browserLongitude]);
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
        attributionControl: false
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
if (document.body.clientWidth <= 767) {
    var isCollapsed = true;
} else {
    var isCollapsed = false;
}


//var precipitation = L.tileLayer.wms("http://sedac.ciesin.columbia.edu/geoserver/wms", {
//    layers: 'wildareas-v2:wildareas-v2-human-footprint-geographic',
//    format: 'image/png',
//    transparent: true,
//    opacity: 0.4
//});

var groupedOverlays = {
    "Web Map Service layers": {
    }
// For reference
//    ,
//    "Reference": {
//        "Boroughs": boroughs,
//        "Subway Lines": subwayLines
//    }
};
getWms();
var layerControl = L.control.groupedLayers(baseLayers, groupedOverlays, {
    collapsed: isCollapsed
}).addTo(map);

/* Highlight search box text on click */
$("#searchbox").click(function () {
    $(this).select();
});

/* Typeahead search functionality */

var substringMatcher = function() {
    return function findMatches(q, cb) {
        var matches, substrRegex;
        matches = [];
        substrRegex = new RegExp(q, 'i');
        $.each(currentSpatialObjects, function(i, str) {
            if (substrRegex.test(i)) {
                matches.push({ value: i });
            }
        });

        cb(matches);
    };
};

$('#searchbox').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    },
    {
        name: 'states',
        displayKey: 'value',
        source: substringMatcher()
    }).on('typeahead:selected', function($e, datum) {
        spatialObject = currentSpatialObjects[datum['value']];
        map.setView(spatialObject.marker.getLatLng(),17); // TODO: check the map._layersMaxZoom and set the zoom level accordingly
        spatialObject.marker.openPopup();
        spatialObject.drawPath();
    });
























//var spatialObjects = new Bloodhound({
//    datumTokenizer: function (d) {
//        return Bloodhound.tokenizers.whitespace(d.value);
//    },
//    queryTokenizer: Bloodhound.tokenizers.whitespace,
//    local: $.map(currentSpatialObjects, function (currentSpatialObject) {
//        return { value: currentSpatialObject.id };
//    })
//});
//// kicks off the loading/processing of `local` and `prefetch`
//spatialObjects.initialize();
//
//$(function () {
//    $('#searchbox').typeahead({
//        hint : true,
//        highlight : true,
//        minLength : 1
//    }, {
//        name : 'spatialObjects',
//        displayKey : 'value',
//        source : spatialObjects.ttAdapter()
//    }).on('typeahead:autocompleted', function($e, datum) {
//        selected_value = datum["value"];
//    }).on('typeahead:selected', function($e, datum) {
//        selected_value = datum["value"];
//        for (var spatialObject in currentSpatialObjects) {
//            if (currentSpatialObjects[spatialObject].id == selected_value) {
//                map.setView(currentSpatialObjects[spatialObject].marker.getLatLng(),16);
//            }
//        }
//    });
//
//});
