/**
 * Created by kbsoft on 8/29/14.
 */
var debugObject;
var drawControl;
function openWithinTools() {
    closeAll();
    $.UIkit.notify({
        message: "Please draw the required area on the map",
        status: 'success',
        timeout: 3000,
        pos: 'top-center'
    });

    // Initialise the FeatureGroup to store editable layers
    var drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    var defaultMarker = L.Icon.extend({
        options: {
            shadowUrl: 'assets/img/markers/default_icons/marker-shadow.png',
            iconUrl: 'assets/img/markers/default_icons/marker-icon.png'
        }
    });
    // Initialise the draw control and pass it the FeatureGroup of editable layers
    drawControl = new L.Control.Draw({
        draw:   {
//            polyline: {
//                shapeOptions: {
//                    color: '#f357a1',
//                    weight: 10
//                }
//            }
            polygon: {
                allowIntersection: false, // Restricts shapes to simple polygons
                drawError: {
                    color: '#e1e100', // Color the shape will turn when intersects
                    message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect
                },
                shapeOptions: {
                    color: '#ff0043'
                }
            },
            rectangle: {
                shapeOptions: {
                    color: '#002bff'
                }
            },
            polyline: false,
            circle: false, // Turns off this drawing tool
            marker: false // Markers are not applicable for within geo fencing
//            marker: {
//                icon: new defaultMarker()
//            }
        },
        edit: {
            featureGroup: drawnItems
        }
    });
    map.addControl(drawControl);

    map.on('draw:created', function (e) {
        var type = e.layerType,
            layer = e.layer;

        if (type === 'marker') {
            // Do marker specific actions
        }
        drawnItems.addLayer(layer);
        popupTemplate = $('#setWithinAlert');
        popupTemplate.find('#editGeoJson').attr('leaflet_id',layer._leaflet_id);
        popupTemplate.find('#exportGeoJson').attr('leaflet_id',layer._leaflet_id);
        popupTemplate.find('#addWithinAlert').attr('leaflet_id',layer._leaflet_id);
        layer.bindPopup(popupTemplate.html(),{closeOnClick: false, closeButton: false}).openPopup();
        debugObject = layer;
        // transparent the layer .leaflet-popup-content-wrapper
        $(layer._popup._container.childNodes[0]).css("background","rgba(255,255,255,0.9)")
    });

}

function closeWithinTools(leafletId){
    map._layers[leafletId].closePopup().unbindPopup();
    map.removeControl(drawControl);
}

/* Export selected area on the map as a json encoded geoJson standard file, no back-end calls simple HTML5 trick ;) */
function exportToGeoJSON(link,content) {
    // HTML5 features has been used here
    geoJsonData = 'data:application/json;charset=utf-8,' + encodeURIComponent(content);
    // TODO: replace closest()  by using persistence id for templates, template id prefixed by unique id(i.e leaflet_id)
    fileName = $(link).closest('form').find('#areaName').val() || 'geoJson';
    $(link).attr({
        'href': geoJsonData,
        'target': '_blank',
        'download': fileName+'.json' // Use the fence name given by the user as the file name of the JSON file
    });
}

// TODO: Give abilities to add a geoJSON file without going thought the creation part
function updateGeoJson(button) {
    inputFile = button.parentElement.getElementsByTagName('input')[0].files[0]; //closest('div').find('#importGeoJsonFile').get(0).files;
    var updatedGeoJson;
    // If the user has upload a file using the file browser this condition become true
    if(inputFile){
        // create HTML5 reader
        fileName = inputFile.name.split('.json')[0];// TODO: put this file name (after removing the extension .json) in to the fence name #areaName input
        var reader = new FileReader();
        reader.readAsText(inputFile);
        reader.onload = function(e) {
            // browser completed reading file - display it
            // Wait until the state become ready(complete the file read)
            while(e.target.readyState != FileReader.DONE);
            // Take the content of the file
            // TODO: do validation, check wheather a valid JSON || GeoJSON file if not $.notify the user
            updatedGeoJson = e.target.result.toString();
            // TODO: check the uploded GeoJSON file for the type (circle, polygon , line, etc ) and update only if the drawn element is match with the uploaded geoJSON else $.notify the user
            updateDrawing(updatedGeoJson,button,fileName);
        };
    }
    // else use the edited text on the textarea
    else{
        updatedGeoJson = $(button).closest('div').find('textarea').val();
        updateDrawing(updatedGeoJson,button);
    }
    // Write TODO: s
}

function updateDrawing(updatedGeoJson,button) {
    updatedGeoJson = JSON.parse(updatedGeoJson);
    layerId = $(button).attr('leaflet_id');
    console.log(layerId);
    currentDrawingLayer = map._layers[layerId];
    // Pop the last LatLng pair because according to the geoJSON standard it use complete round LatLng set to store polygon coordinates
    updatedGeoJson.geometry.coordinates[0].pop();
    leafletLatLngs = [];
    $.each(updatedGeoJson.geometry.coordinates[0], function(idx, pItem){
        leafletLatLngs.push({lat: pItem[1], lng: pItem[0]});
    });
    currentDrawingLayer.setLatLngs(leafletLatLngs);
    // At least a line or polygon must have 2 points so try the following with '0', '1',not more that that could give unexpected errors
    currentDrawingLayer._popup.setLatLng(leafletLatLngs[1]);
    // TODO: Use rails a-like id generating method to identify each copy of the the templates uniquely i.e marker_popup_{leaflet_layer_id}
    //$(button).closest('form').find('#areaName').val(fileName);
    closeAll();

}