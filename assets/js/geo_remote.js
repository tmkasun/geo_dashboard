/**
 * Created by kbsoft on 8/15/14.
 */
/* Make ajax call and store new tile URL*/

/* close all opened modals and side pane */
function addTileUrl() {
    /* TODO: add validation, check for empty url and names*/
    tileUrl = $('#tileUrl').val();
    urlName = $('#tileName').val();
    maxzoom = $('#maxzoom').val();
    subdomains = $('#sub_domains').val();
    attribution = $('#data_attribution').val();
    /* Add to base layers*/
    var newTileLayer = L.tileLayer(tileUrl, {
        maxZoom: parseInt(maxzoom),
        subdomains: subdomains.split(','),
        attribution: attribution
    });
    layerControl.addBaseLayer(newTileLayer, urlName);

    inputs = layerControl._form.getElementsByTagName('input');
    inputsLen = inputs.length;
    for (i = 0; i < inputsLen; i++) {
        input = inputs[i];
        obj = layerControl._layers[input.layerId];
        if (layerControl._map.hasLayer(obj.layer)) {
            map.removeLayer(obj.layer);
        }
    }
    map.addLayer(newTileLayer);

    /* Do ajax save */
    var data = {
        'url': tileUrl,
        'name': urlName,
        'attribution': attribution,
        'maxzoom': maxzoom,
        'subdomains': subdomains
    };
    var serverUrl = "controllers/tile_servers.jag";
    // TODO: If failure happens notify user about the error message
    $.post(serverUrl, data, function (response) {
        $.UIkit.notify({
            message: '<span style="color: dodgerblue">' + response + '</span>',
            status: 'success',
            timeout: 3000,
            pos: 'top-center'
        });
        closeAll();
    });

// TODO: Show a preview of newly added tileserver map
//    var mapPreview = L.map('mapPreview', {
//        zoom: 10,
//        center: [6.934846, 79.851980],
//    });
//    L.tileLayer(tileUrl).addTo(mapPreview);

}

var defaultOSM = L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: 'Map data © OpenStreetMap contributors <a href="http://openstreetmap.org/" target="_blank">Openstreetmap</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA.'
});

var baseLayers = {
    "Open Street Maps": defaultOSM
};
function getTileServers() {
    //For reference: returning JSON from server
    // {"serverId" : 44, "url" : "ffsafsa", "name" : "sadsa", "subdomains" : "asfasfsa", "attribution" : "dsfdsfdsf", "maxzoom" : 12}
    $.getJSON("controllers/tile_servers.jag?serverId=all", function (data) {
        $.each(data, function (key, val) {
            $.UIkit.notify({
                message: 'Loading... <span style="color: #ccfcff">' + val.name + '</span>' +
                    ' URL: <span style="color: #00ff00">' + val.url + '</span>',
                status: 'info',
                timeout: 2000,
                pos: 'bottom-left'
            });
            //baseLayers[val.name]
            var newTileLayer = L.tileLayer(
                val.url, {
                    maxZoom: val.maxzoom, // TODO: if no maxzoom level do not set this attribute
                    subdomains: val.subdomains.split(','), // TODO: if no subdomains do not set this attribute
                    attribution: val.attribution
                }
            );
            layerControl.addBaseLayer(newTileLayer, val.name); // TODO: implement single method for #20  and this and do validation
        });
    });

}

function addWmsEndPoint() {
    serviceName = $('#serviceName').val();
    layers = $('#layers').val();
    wmsVersion = $('#wmsVersion').val();
    serviceEndPoint = $('#serviceEndPoint').val();
    outputFormat = $('#outputFormat').val();

    wmsLayer = L.tileLayer.wms(serviceEndPoint, {
        layers: layers.split(','),
        format: outputFormat ? outputFormat : 'image/png',
//        version: wmsVersion,
        transparent: true,
        opacity: 0.4});

    layerControl.addOverlay(wmsLayer, serviceName, "Web Map Service layers");
    map.addLayer(wmsLayer);
    var data = {
        'serviceName': serviceName,
        'layers': layers,
        'wmsVersion': wmsVersion,
        'serviceEndPoint': serviceEndPoint,
        'outputFormat': outputFormat
    };
    var serverUrl = "controllers/wms_endpoints.jag";
    // TODO: If failure happens notify user about the error message
    $.post(serverUrl, data, function (response) {
        $.UIkit.notify({
            message: '<span style="color: dodgerblue">' + response + '</span>',
            status: 'success',
            timeout: 3000,
            pos: 'top-center'
        });
        closeAll();
    });
}

function getWms() {
    // For refference {"wmsServerId" : 1, "serviceUrl" : "http://{s}.somedomain.com/blabla/{z}/{x}/{y}.png", "name" : "Sample server URL", "layers" : "asdsad,sd,adasd,asd", "version" : "1.0.2", "format" : "sadasda/asdas"}
    $.getJSON("controllers/wms_endpoints.jag?serverId=all", function (data) {
        $.each(data, function (key, val) {

            wmsLayer = L.tileLayer.wms(val.serviceUrl, {
                layers: val.layers.split(','),
                format: val.format ? val.format : 'image/png',
                version: val.version,
                transparent: true,
                opacity: 0.4});
            layerControl.addOverlay(wmsLayer, val.name, "Web Map Service layers");
        });
    });
}


function closeAll() {
    $('.modal').modal('hide');
    setTimeout(function () {
        $.UIkit.offcanvas.hide()
    }, 100);
}


function setSpeedAlert() {
    var speedAlertValue = $("#speedAlertValue").val();
    data = {
        'parseKey': 'speedAlertValue',
        'parseValue': speedAlertValue,
        'executionPlan': 'speed',
        'customName': null
    };
    $.post('controllers/set_alerts.jag',data, function (response) {
        $.UIkit.notify({
            message: '<span style="color: dodgerblue">' + response.status + '</span><br>'+response.message,
            status: (response.status == 'success' ? 'success' : 'danger'),
            timeout: 3000,
            pos: 'top-center'
        });
        closeAll();
    },'json');
}


function setWithinAlert(leafletId) {
    var selectedAreaGeoJson = JSON.stringify(map._layers[leafletId].toGeoJSON().geometry).replace(/"/g, "'");
    data = {
        'parseKey': 'geoFenceGeoJSON',
        'parseValue': selectedAreaGeoJson,
        'executionPlan': 'within',
        'customName': null
    };
    $.post('controllers/set_alerts.jag',data, function (response) {
        $.UIkit.notify({
            message: '<span style="color: dodgerblue">' + response.status + '</span><br>'+response.message,
            status: (response.status == 'success' ? 'success' : 'danger'),
            timeout: 3000,
            pos: 'top-center'
        });
        closeAll();
        closeWithinTools(leafletId);
    },'json');
}