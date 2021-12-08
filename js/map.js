/* **** Leaflet **** */

// Base layers

//  .. White background
var white = L.tileLayer("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAAA1BMVEX///+nxBvIAAAAH0lEQVQYGe3BAQ0AAADCIPunfg43YAAAAAAAAAAA5wIhAAAB9aK9BAAAAABJRU5ErkJggg==");

// Overlay layers (TMS)
var lyr = L.tileLayer('https://epcarraway.blob.core.windows.net/dnd7/{z}/{x}/{y}.png', 
    {tms: true, opacity: 1, minZoom: 12, minNativeZoom: 12, maxNativeZoom: 18, maxZoom: 20, attribution: ""});
var lyr2 = L.tileLayer('https://epcarraway.blob.core.windows.net/dnd2/{z}/{x}/{y}.png', 
    {tms: true, opacity: 1, minZoom: 4, minNativeZoom: 6, maxNativeZoom: 12, maxZoom: 20, attribution: ""});
var lyr3 = L.tileLayer('https://epcarraway.blob.core.windows.net/dnd3/{z}/{x}/{y}.png', 
    {tms: true, opacity: 1, minZoom: 10, minNativeZoom: 8, maxNativeZoom: 13, maxZoom: 20, attribution: ""});
var lyr4 = L.tileLayer('https://epcarraway.blob.core.windows.net/dnd4/{z}/{x}/{y}.png', 
    {tms: true, opacity: 1, minZoom: 12, minNativeZoom: 12, maxNativeZoom: 15, maxZoom: 20, attribution: ""});
var lyr5 = L.tileLayer('https://epcarraway.blob.core.windows.net/dnd5/{z}/{x}/{y}.png', 
    {tms: true, opacity: 1, minZoom: 12, minNativeZoom: 12, maxNativeZoom: 15, maxZoom: 20, attribution: ""});
var lyr6 = L.tileLayer('https://epcarraway.blob.core.windows.net/dnd6/{z}/{x}/{y}.png', 
    {tms: true, opacity: 1, minZoom: 15, minNativeZoom: 15, maxNativeZoom: 18, maxZoom: 20, attribution: ""});

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
var lyr7 = L.layerGroup();
lyr.addTo(map);
lyr3.addTo(map);
lyr4.addTo(map);
lyr5.addTo(map);
lyr6.addTo(map);
lyr7.addTo(map);

// Create grid layer of fixed size
var tiles = new L.GridLayer({tileSize: 64, opacity:0.5, minZoom: 20, minNativeZoom: 20, maxNativeZoom: 20, maxZoom: 22});

tiles.createTile = function(coords) {
  var tile = L.DomUtil.create('canvas', 'leaflet-tile');
  var ctx = tile.getContext('2d');
  var size = this.getTileSize();
  tile.width = size.x;
  tile.height = size.y;
  
  // calculate projection coordinates of top left tile pixel
  var nwPoint = coords.scaleBy(size);
  
  // calculate geographic coordinates of top left tile pixel
  var nw = map.unproject(nwPoint, coords.z);
  
  ctx.strokeStyle = 'black';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size.x-1, 0);
  ctx.lineTo(size.x-1, size.y-1);
  ctx.lineTo(0, size.y-1);
  ctx.closePath();
  ctx.stroke();
  return tile;
};
	
tiles.addTo(map);

var basemaps = {"World background": lyr2, "No background": white};
var overlaymaps = {"Locations": layerGroup, 
                   "Characters": lyr7, 
                   "Waterdeep Map": lyr, 
                   "Icewind Dale Map": lyr3, 
                   "Ten Towns Map": lyr6, 
                   "Neverwinter Map": lyr5, 
                   "Luskan Map": lyr4, 
                   "Grid": tiles};

// Set bottom left text
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
var layerControl = L.control.layers(basemaps, overlaymaps, {collapsed: false}).addTo(map);

// Set zoom levels and extent based on parameters
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

// Add character icons from query parameters
if (searchParams.has("chars")) {
    var chars = searchParams.get("chars").split(';')
    for (i = 0; i < chars.length; i++) {
        var charname = chars[i].split(',')[0]
        charlat = chars[i].split(',')[1]
        charlng = chars[i].split(',')[2]
        var charIcon = L.icon({
            iconUrl: 'https://epcarraway.blob.core.windows.net/dnd/' + charname.toLocaleLowerCase() + '.png',
            iconSize:     [64, 64], 
            iconAnchor:   [32, 64], 
            popupAnchor:  [0, -32] 
        });
        L.marker([charlng, charlat],{
            icon: charIcon,
            riseOnHover: true, 
            color: 'red',
            draggable:'true'
        }).addTo(lyr7)
            .bindPopup("<b>" + charname + "</b><br />Current location of " + charname)
            .bindTooltip("<b>" + charname + "</b>")
            .on("drag", function(e) {
                var marker = e.target;
                var charname = marker.getTooltip().getContent().replace('<b>', '').replace('</b>', '');
                var position = marker.getLatLng();
                charlat = position.lat.toPrecision(7).toString()
                charlon = position.lng.toPrecision(7).toString()
                var searchParams = new URLSearchParams(window.location.search);
                var newchars2 = []
                var chars2 = searchParams.get("chars").split(';')
                for (i = 0; i < chars.length; i++) {
                    if (chars2[i].split(',')[0] == charname) {
                        var newchars2 = newchars2.concat([charname + ',' + charlon + ',' + charlat])
                    } else {
                        var newchars2 = newchars2.concat([chars2[i]])
                    };
                };
                var newchars2 = newchars2.join(';')
                searchParams.set("chars", newchars2);
                var newRelativePathQuery = window.location.pathname + '?' + searchParams.toString();
                history.pushState(null, '', newRelativePathQuery);
        });
    };
};


// add an image to map
if (searchParams.has("mapconfig")) {
    var lyr8 = L.layerGroup();
    lyr8.addTo(map);
    layerControl.addOverlay(lyr8, 'Custom');
    $.getJSON("https://epcarraway.blob.core.windows.net/dnd/mapconfig.json", function(e) {
        for (i = 0; i < e.length; i++) {
            L.imageOverlay(e[i].imageUrl, e[i].imageBounds).addTo(lyr8);
            L.imageOverlay(e[i].imageUrl, e[i].imageBounds).bringToFront();
        };
    });
};

// Create double click popup
var popup = L.popup();  

function onMapClick(e) {
    lng2 = e.latlng.lng.toPrecision(7).toString()
    lat2 = e.latlng.lat.toPrecision(7).toString()
    content = "<table><tr><td>" + lng2 + "</td><td>" + lat2 + "</td></tr></table>";
    popup
        .setLatLng(e.latlng)
        .setContent(content)
        .openOn(map);
};

function addPoint(lng2, lat2) {
    customName = 'humanoid'
    var customIcon = L.icon({
        iconUrl: 'https://epcarraway.blob.core.windows.net/dnd/' + customName + '.png',
        iconSize:     [64, 64], 
        iconAnchor:   [32, 64], 
        popupAnchor:  [0, -32] 
    });
    L.marker([lat2, lng2],{
        icon: customIcon,
        riseOnHover: true, 
        color: 'black',
        draggable:'true'
    }).addTo(layerGroup)
        .bindPopup("<b>" + customName + "</b><br />" + lng2 + ", " + lat2)
        .bindTooltip("<b>" + customName + "</b>")
};

// Create double click popup
var rightpopup = L.popup();  

function onMapRightClick(e) {
    lng2 = e.latlng.lng.toPrecision(7).toString()
    lat2 = e.latlng.lat.toPrecision(7).toString()
    content = '<b>Option Menu</b><br><br><div><button onclick="addPoint(' + lng2 + ',' + lat2 + ')" type="buttons" class="btn btn-danger" id="addPointId">Add Point</button></div><br><div>';
    rightpopup
        .setLatLng(e.latlng)
        .setContent(content)
        .openOn(map);
};

map.on('dblclick', onMapClick);

map.on('contextmenu', onMapRightClick);

// Update zoom/center parameters
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
    var charIcon2 = L.icon({
        iconUrl: 'https://epcarraway.blob.core.windows.net/dnd/marker.png',
        iconSize:     [32, 64], 
        iconAnchor:   [16, 60], 
        popupAnchor:  [0, -64] 
    });
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
                icon: charIcon2,
                riseOnHover: true
            }).addTo(layerGroup)
                .bindPopup("<b>" + name1 + "</b><br />" + desc1)
                .bindTooltip("<b>" + name1 + "</b>");
        };
    };
};