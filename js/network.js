// Load the visualization API and the corechart packages
google.charts.load('current',{'packages':['corechart','table']});
        
// Set callback when the google visualization API is loaded
google.charts.setOnLoadCallback(drawAllSheets);
function drawAllSheets() {
    // Create Google Sheets query
    var queryString = 'https://docs.google.com/spreadsheets/d/1aXGMp6uO6CVxMFS8kxHfm5EazdeVisL_riQtsVxaZUg/gviz/tq?sheet=people&headers=1&tq=' + encodeURIComponent('SELECT A, B');
    query2 = new google.visualization.Query(queryString);
    query2.send(chartfunction2);
    function chartfunction2 (response) {
        function preTitle(text) {
            text = text.replace(': </b>null','</b>')
            text = '<div style="max-width:400px;word-wrap:break-all;white-space:normal;"><span>' + text + '</span></div>'
            const container = document.createElement("div");
            container.innerHTML = text;
            return container;
          }
        // Get and plot data
        var data = response.getDataTable();
        var pdata = {};
        for (i=0; i<data.getNumberOfRows(); i++) {
            var label = data.getValue(i, 0);
            var description = data.getValue(i, 1);
            pdata[label] = description;
        };
        var queryString = 'https://docs.google.com/spreadsheets/d/1aXGMp6uO6CVxMFS8kxHfm5EazdeVisL_riQtsVxaZUg/gviz/tq?sheet=network&headers=1&tq=' + encodeURIComponent('SELECT A, B, C, D, E');
        query1 = new google.visualization.Query(queryString);
        query1.send(chartfunction);
        function chartfunction (response) {
            // Get and plot data
            var data = response.getDataTable();
            var nodelist = [];
            var nodedata = [];
            var edgedata = [];
            for (i=0; i<data.getNumberOfRows(); i++) {
                    edgedata[i] = {};
                    var label1 = data.getValue(i, 0);
                    var label2 = data.getValue(i, 1);
                    var direction1 = data.getValue(i, 2);
                    var label3 = data.getValue(i, 3);
                    var color1 = data.getValue(i, 4);
                    if (!(nodelist.includes(label1))) {
                        nodelist.push(label1);
                        nodedata[nodelist.indexOf(label1)] = {
                            "id": nodelist.indexOf(label1), 
                            "label": label1, 
                            "title": preTitle('<b>' + label1 + ': </b>' + pdata[label1])
                        };
                        };
                    if (!(nodelist.includes(label2))) {
                        nodelist.push(label2);
                        nodedata[nodelist.indexOf(label2)] = {
                            "id": nodelist.indexOf(label2), 
                            "label": label2, 
                            "title": preTitle('<b>' + label2 + ': </b>' + pdata[label2])
                        };
                        };
                    edgedata[i]["from"] = nodelist.indexOf(label1);
                    edgedata[i]["to"] = nodelist.indexOf(label2);
                    edgedata[i]["arrows"] = direction1;
                    edgedata[i]["label"] = label3;
                    edgedata[i]["color"] = color1;
            };
            // create an array with nodes
            var nodes = new vis.DataSet(nodedata);
            // create an array with edges
            var edges = new vis.DataSet(edgedata);
            // create a network
            var container = document.getElementById("mynetwork");
            var data2 = {
                nodes: nodes,
                edges: edges,
            };
            var options = {}
            var network = new vis.Network(container, data2, options);
            var searchParams = new URLSearchParams(window.location.search);
            if (searchParams.has("charLabel")) {
                var charLabel = searchParams.get("charLabel");
                console.log(charLabel);
                var charId = nodelist.indexOf(charLabel);
                console.log(charId);
                network.once("afterDrawing", function() {
                    var options = { 
                        nodes:[charId],
                        minZoomLevel: 1.5,
                        maxZoomLevel: 1.5,
                        animation: {      
                          duration: 500,
                          easingFunction: "easeInOutQuad"
                        }
                      };
                    network.fit(options=options)
                })
            };
            
            
        };
    };
};