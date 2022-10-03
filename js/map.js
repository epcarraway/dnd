/* **** Leaflet **** */

// Base layers
var default_bounds = [[9.345, 5.660], [9.541, 5.920]]
var default_center = [(default_bounds[0][0] + default_bounds[1][0])/2, (default_bounds[0][1] + default_bounds[1][1])/2]

//  .. White background
var white = L.tileLayer("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAAA1BMVEX///+nxBvIAAAAH0lEQVQYGe3BAQ0AAADCIPunfg43YAAAAAAAAAAA5wIhAAAB9aK9BAAAAABJRU5ErkJggg==");

// Overlay layers (TMS)
var lyr = L.tileLayer('https://epcarraway.blob.core.windows.net/dnd7/{z}/{x}/{y}.png', 
    {tms: true, opacity: 1, minZoom: 12, minNativeZoom: 12, maxNativeZoom: 18, maxZoom: 23, attribution: ""});
var lyr2 = L.tileLayer('https://epcarraway.blob.core.windows.net/dnd2/{z}/{x}/{y}.png', 
    {tms: true, opacity: 1, minZoom: 4, minNativeZoom: 6, maxNativeZoom: 12, maxZoom: 23, attribution: ""});
var lyr3 = L.tileLayer('https://epcarraway.blob.core.windows.net/dnd3/{z}/{x}/{y}.png', 
    {tms: true, opacity: 1, minZoom: 10, minNativeZoom: 8, maxNativeZoom: 13, maxZoom: 23, attribution: ""});
var lyr4 = L.tileLayer('https://epcarraway.blob.core.windows.net/dnd4/{z}/{x}/{y}.png', 
    {tms: true, opacity: 1, minZoom: 12, minNativeZoom: 12, maxNativeZoom: 15, maxZoom: 23, attribution: ""});
var lyr5 = L.tileLayer('https://epcarraway.blob.core.windows.net/dnd5/{z}/{x}/{y}.png', 
    {tms: true, opacity: 1, minZoom: 12, minNativeZoom: 12, maxNativeZoom: 15, maxZoom: 23, attribution: ""});
var lyr6 = L.tileLayer('https://epcarraway.blob.core.windows.net/dnd6/{z}/{x}/{y}.png', 
    {tms: true, opacity: 1, minZoom: 15, minNativeZoom: 15, maxNativeZoom: 18, maxZoom: 23, attribution: ""});

// Map
var map = L.map("mapid", {
    // center: default_center,
    zoom: 14,
    minZoom: 6,
    maxZoom: 23,
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
var tiles = new L.GridLayer({tileSize: 64, opacity:0.5, minZoom: 20, minNativeZoom: 20, maxNativeZoom: 23, maxZoom: 23});

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

var basemaps = {"World background": lyr2, "No background": white};
var overlaymaps = {"Locations": layerGroup, 
                   "Characters": lyr7, 
                   "Waterdeep Map": lyr, 
                   "Icewind Dale Map": lyr3, 
                   "Ten Towns Map": lyr6, 
                   "Neverwinter Map": lyr5, 
                   "Luskan Map": lyr4};

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
if (searchParams.has("chars")) {
    if (searchParams.has("zoomLevel") && searchParams.has("lat") && searchParams.has("lng")) {
        zoomLevel = searchParams.get("zoomLevel")
        lat = searchParams.get("lat")
        lng = searchParams.get("lng")
        map.setView([lat, lng], zoomLevel);
    } else if (searchParams.has("zoomLevel")) {
        zoomLevel = searchParams.get("zoomLevel")
        map.fitBounds(default_bounds);
        map.setZoom(zoomLevel);
    } else {
        map.fitBounds(default_bounds);
    };
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


tiles.addTo(map);
layerControl.addOverlay(tiles, 'Grid');

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

var markerCount = 0;
// Add custom points
function addPoint(lng2, lat2, customName = 'humanoid') {
    var customIcon = L.icon({
        iconUrl: 'https://epcarraway.blob.core.windows.net/dnd/' + customName + '.png',
        iconSize:     [64, 64], 
        iconAnchor:   [32, 64], 
        popupAnchor:  [0, -32]
    });
    markerCount += 1;
    newMarkerId = 'marker_' + markerCount.toString();
    newContent = '<br /><button onclick="onMarkerButtonClick(' + "'" + newMarkerId + "'" + 
        ')" type="buttons" class="btn btn-danger" id="removePointId" style="margin: 2px;">Remove</button>';
    console.log(newMarkerId);
    L.marker([lat2, lng2],{
        icon: customIcon,
        riseOnHover: true, 
        color: 'black',
        draggable:'true',
        layerId: newMarkerId
    }).addTo(layerGroup)
        .bindPopup("<b>" + customName + "</b><br /><br />" + lng2.toString() + ", " + lat2.toString() + newContent)
        .bindTooltip("<b>" + customName + "</b>");
    map.closePopup();
};

// Remove custom marker
function onMarkerButtonClick(newMarkerId) {
    for (i = 0; i < Object.entries(layerGroup._layers).length; i++) {
        markerId = '';
        try {
            markerId = Object.entries(layerGroup._layers)[i][1]['options']['layerId'];
        } catch(e) {
        };
        if (markerId == newMarkerId) {
            console.log(newMarkerId);
            Object.entries(layerGroup._layers)[i][1].remove();
        };
    };
};

// Add custom box layer
function addBoxLayer(lng1, lat1, lng2, lat2, inputUrl) {
    console.log(lng1, lat1, lng2, lat2, inputUrl);
    var lyr9 = L.layerGroup();
    lyr9.addTo(map);
    layerControl.addOverlay(lyr9, 'Custom 2');
    L.imageOverlay(inputUrl, [[lat1, lng1, ], [lat2, lng2]]).addTo(lyr9);
    L.imageOverlay(inputUrl, [[lat1, lng1, ], [lat2, lng2]]).bringToFront();
};

// Create double click popup
var rightpopup = L.popup();  

function onMapRightClick(e) {
    lng2 = e.latlng.lng.toPrecision(7).toString()
    lat2 = e.latlng.lat.toPrecision(7).toString()
    content = '<b>Option Menu</b><br><div>'
    icons = ['humanoid', 'fiend', 'beast', 'greenmarker', 'bluemarker', 'redmarker']
    chars = searchParams.get("chars").split(';')
    for (i = 0; i < chars.length; i++) {
        icons.push(chars[i].split(',')[0]);
    };
    for (i = 0; i < icons.length; i++) {
        content = content + '<button onclick="addPoint(' + 
        lng2 + ',' + lat2 + ",'" + icons[i] + "'" + 
        ')" type="buttons" class="btn btn-danger" id="addPointId" style="margin: 2px;">Add ' + 
        icons[i] + '</button>';
        content = content + '</div>'
    };
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

// Create box popup
map.on('boxzoomend', function(e) {
    console.log('end');
    var lat1 = e.boxZoomBounds._southWest.lat.toPrecision(7);
    var lng1 = e.boxZoomBounds._southWest.lng.toPrecision(7);
    var lat2 = e.boxZoomBounds._northEast.lat.toPrecision(7);
    var lng2 = e.boxZoomBounds._northEast.lng.toPrecision(7);
    console.log(e.boxZoomBounds)
    content = '<b>Option Menu</b><br><div>';
    content = content + '<input type="text" id="inputLayerUrl" class="form-control" placeholder="enter layer image url">';
    content = content + '<button onclick="addBoxLayer(' + 
        lng1 + ',' + lat1 + ',' + lng2 + ',' + lat2 + ',document.getElementById(\'inputLayerUrl\').value' + 
        ')" type="buttons" class="btn btn-danger" id="addPointId" style="margin: 2px;">Add custom overlay</button>';
    content = content + '</div>';
    rightpopup
        .setLatLng(e.boxZoomBounds.getCenter())
        .setContent(content)
        .openOn(map);
});
    
// Load the visualization API and the corechart packages
google.charts.load('current',{'packages':['corechart','table']});

// Set callback when the google visualization API is loaded
google.charts.setOnLoadCallback(drawAllSheets);
function drawAllSheets() {
    var searchParams = new URLSearchParams(window.location.search);
    if (!searchParams.has("chars")) {
        var charQueryString = 'https://docs.google.com/spreadsheets/d/1aXGMp6uO6CVxMFS8kxHfm5EazdeVisL_riQtsVxaZUg/gviz/tq?sheet=characters&headers=1&tq=' + encodeURIComponent('SELECT A, B, C, D');
        console.log(charQueryString);
        charQuery = new google.visualization.Query(charQueryString);
        charQuery.send(charChartFunction);
        function charChartFunction (charResponse) {
            // Get stored character data
            var newchars2 = []
            lats = []
            lons = []
            history.pushState(null, '', newRelativePathQuery);
            var chardata = charResponse.getDataTable();
            if (chardata.getNumberOfRows() > 2) {
                for (i=0; i<chardata.getNumberOfRows(); i++) {
                    var charname = chardata.getValue(i, 0);
                    var charlon = chardata.getValue(i, 1);
                    var charlat = chardata.getValue(i, 2);
                    var lats = lats.concat([Number(charlat)])
                    var lons = lons.concat([Number(charlon)])
                    var newchars2 = newchars2.concat([charname + ',' + charlon + ',' + charlat])
                };
                if (!searchParams.has("lat") && !searchParams.has("lng")) {
                    var sum = 0;
                    for( var i = 0; i < lats.length; i++ ){
                        sum += lats[i];
                    }
                    var avglat = sum/lats.length; 
                    var sum = 0;
                    for( var i = 0; i < lons.length; i++ ){
                        sum += lons[i];
                    }
                    var avglon = sum/lons.length;
                    var zoomLevel = 12
                    searchParams.set("zoomLevel", zoomLevel);
                    searchParams.set("lat", avglat);
                    searchParams.set("lng", avglon);
                };
                var newchars2 = newchars2.join(';')
                searchParams.set("chars", newchars2);
                var newRelativePathQuery = window.location.pathname + '?' + searchParams.toString();
                console.log(newRelativePathQuery)
                window.location.replace(newRelativePathQuery)
            };
        };
    };
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
