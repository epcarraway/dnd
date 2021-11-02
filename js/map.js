/* **** Leaflet **** */

// Base layers

//  .. White background
var white = L.tileLayer("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAAA1BMVEX///+nxBvIAAAAH0lEQVQYGe3BAQ0AAADCIPunfg43YAAAAAAAAAAA5wIhAAAB9aK9BAAAAABJRU5ErkJggg==");

// Overlay layers (TMS)
var lyr = L.tileLayer('https://epcarraway.blob.core.windows.net/dnd/{z}/{x}/{y}.png', 
    {tms: true, opacity: 1, minZoom: 12, minNativeZoom: 8, maxNativeZoom: 18, maxZoom: 20, attribution: ""});
var lyr2 = L.tileLayer('https://epcarraway.blob.core.windows.net/dnd2/{z}/{x}/{y}.png', 
    {tms: true, opacity: 1, minZoom: 4, minNativeZoom: 6, maxNativeZoom: 12, maxZoom: 20, attribution: ""});
var lyr3 = L.tileLayer('https://epcarraway.blob.core.windows.net/dnd3/{z}/{x}/{y}.png', 
    {tms: true, opacity: 1, minZoom: 10, minNativeZoom: 8, maxNativeZoom: 13, maxZoom: 20, attribution: ""});
var lyr4 = L.tileLayer('https://epcarraway.blob.core.windows.net/dnd4/{z}/{x}/{y}.png', 
    {tms: true, opacity: 1, minZoom: 12, minNativeZoom: 9, maxNativeZoom: 14, maxZoom: 20, attribution: ""});
var lyr5 = L.tileLayer('https://epcarraway.blob.core.windows.net/dnd5/{z}/{x}/{y}.png', 
    {tms: true, opacity: 1, minZoom: 12, minNativeZoom: 9, maxNativeZoom: 14, maxZoom: 20, attribution: ""});

// Map
var map = L.map("mapid", {
    center: [6.3, 7.0],
    zoom: 14,
    minZoom: 6,
    maxZoom: 20,
    maxBounds: [
        //south west
        [0, 0],
        //north east
        [10, 15]
        ], 
    layers: [lyr2]
});

var layerGroup = L.layerGroup().addTo(map);
lyr.addTo(map);
lyr3.addTo(map);
lyr4.addTo(map);
lyr5.addTo(map);
var basemaps = {"World background": lyr2, "No background": white};
var overlaymaps = {"Locations": layerGroup, "Waterdeep Map": lyr, "Icewind Dale Map": lyr3, "Neverwinter Map": lyr5, "Luskan Map": lyr4};

// Note
var src = 'Waterdeep';
var title = L.control({position: 'bottomleft'});
title.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'ctl src');
    this.update();
    return this._div;
};
title.update = function(props) {
    this._div.innerHTML = src;
};
title.addTo(map);

// Add base layers
L.control.layers(basemaps, overlaymaps, {collapsed: false}).addTo(map);

// Fit to overlay bounds (SW and NE points with (lat, lon))

var searchParams = new URLSearchParams(window.location.search);
if (searchParams.has("zoomLevel") && searchParams.has("lat") && searchParams.has("lng")) {
    zoomLevel = searchParams.get("zoomLevel")
    lat = searchParams.get("lat")
    lng = searchParams.get("lng")
    map.setView([lat, lng], zoomLevel);
} else if (searchParams.has("zoomLevel")) {
    zoomLevel = searchParams.get("zoomLevel")
    map.fitBounds([[6.287, 6.967], [6.315, 6.99]]);
    map.setZoom(zoomLevel);
} else {
    map.fitBounds([[6.287, 6.967], [6.315, 6.99]]);
};

var popup = L.popup();

function onMapClick(e) {
    lng2 = e.latlng.lng.toPrecision(7).toString()
    lat2 = e.latlng.lat.toPrecision(7).toString()
    content = "<table><tr><td>" + lng2 + "</td><td>" + lat2 + "</td></tr></table>"
    popup
        .setLatLng(e.latlng)
        .setContent(content)
        .openOn(map);
}

map.on('click', onMapClick);

map.on('moveend', function(e) {
    var zoomLevel = map.getZoom();
    var lat = map.getCenter()["lat"].toPrecision(7);
    var lng = map.getCenter()["lng"].toPrecision(7);
    var ll_title = document.getElementsByClassName('ctl src')[0];
    ll_title.innerHTML = "Zoom Level: " + zoomLevel.toString();
    var searchParams = new URLSearchParams(window.location.search);
    searchParams.set("zoomLevel", zoomLevel);
    searchParams.set("lat", lat);
    searchParams.set("lng", lng);
    var newRelativePathQuery = window.location.pathname + '?' + searchParams.toString();
    history.pushState(null, '', newRelativePathQuery);
    });
    
// Load the visualization API and the corechart packages
google.charts.load('current',{'packages':['corechart','table']});

// Set callback when the google visualization API is loaded
google.charts.setOnLoadCallback(drawAllSheets);
function drawAllSheets() {
    // Create Google Sheets query
    var queryString = 'https://docs.google.com/spreadsheets/d/1aXGMp6uO6CVxMFS8kxHfm5EazdeVisL_riQtsVxaZUg/gviz/tq?sheet=points&headers=1&tq=' + encodeURIComponent('SELECT A, B, C, D');
    console.log(queryString);
    query1 = new google.visualization.Query(queryString);
    query1.send(chartfunction);
    function chartfunction (response) {
        // Get and map data
        var data = response.getDataTable();
        for (i=0; i<data.getNumberOfRows(); i++) {
            var name1 = data.getValue(i, 0);
            var lat1 = data.getValue(i, 1);
            var lng1 = data.getValue(i, 2);
            var desc1 = data.getValue(i, 3);
            L.marker([lng1, lat1],{
                riseOnHover: true
            }).addTo(layerGroup)
                .bindPopup("<b>" + name1 + "</b><br />" + desc1)
                .bindTooltip("<b>" + name1 + "</b>");
        }

    }
}