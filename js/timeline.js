// Create an empty DataSet.
// This DataSet is used for two way data binding with the Timeline.
var items = new vis.DataSet();

// create a timeline
var container = document.getElementById('visualization');

vis.moment.updateLocale('harptos_us', {
    months: 'Hammer_Alturiak_Ches_Tarsakh_Mirtul_Kythorn_Flamerule_Eleasis_Eleint_Marpenoth_Uktar_Nightal'.split('_'),
    weekdays: '________'.split('_'),
    weekdaysShort: '________'.split('_'),
    weekdaysMin: '________'.split('_'),
    monthsShort: 'Hammer_Alturiak_Ches_Tarsakh_Mirtul_Kythorn_Flamerule_Eleasis_Eleint_Marpenoth_Uktar_Nightal'.split('_'),
    additionals: 'Midwinter_Greengrass_Midsummer_Highharvestide_Feast of the Moon_Shieldmeet'.split('_'),
    additionalsShort: 'MW_GG_MS_HH_FM_SM'.split('_'),
    era: 'Dale Reckoning',
    eraShort: 'DR',
    formats: {
        L: 'MM/DD/YYYY',
        LL: 'MMMM D YYYY',
        LLL: 'MMMM D YYYY N',
        LLLL: 'dddd, MMMM Do YYYY N',
        LLLLL: 'YYYYYY-MM-DDTHH:mm:ss'},
    ordinal : function (n, token) {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return (s[(v - 20) % 10] || s[v] || s[0]);
    }
});

var options = {
    editable: true,
    showWeekScale: false,
    showCurrentTime: false,
    align: 'left',
    minHeight: '300px',
    maxHeight: '90%',
    stack: false,
    cluster: {
        maxItems: 4
    },
    moment: function(date) {
        return vis.moment(date);
    },
    order: function(date) {
        return vis.moment(date);
    },
    locale: 'harptos_us'
};
var timeline = new vis.Timeline(container, items, options);

items.clear();
// Load the visualization API and the corechart packages
google.charts.load('current',{'packages':['corechart','table']});

// Set callback when the google visualization API is loaded
google.charts.setOnLoadCallback(drawAllSheets);
function drawAllSheets() {
    // Create Google Sheets query
    var queryString = 'https://docs.google.com/spreadsheets/d/1aXGMp6uO6CVxMFS8kxHfm5EazdeVisL_riQtsVxaZUg/gviz/tq?sheet=timeline&headers=1&tq=' + encodeURIComponent('SELECT A, B, C, D');
    query1 = new google.visualization.Query(queryString);
    query1.send(chartfunction);
    function chartfunction (response) {
        // Get and plot data
        var data = response.getDataTable();
        var data2 = [];
        for (i=0; i<data.getNumberOfRows(); i++) {
                data2[i] = {};
                var content1 = data.getValue(i, 0).replace(/\n/g, "<br>");
                var start1 = data.getValue(i, 1);
                var end1 = data.getValue(i, 2);
                var start1a = vis.moment(start1, 'YYYYYY-MM-DDTHH:mm:ss');
                var content1 = vis.moment(start1a).format("MMMM D, YYYY [DR], h:mm a") + "<br>" + content1;
                data2[i]["id"] = i;
                data2[i]["content"] = content1;
                data2[i]["start"] = start1a;
                if (start1 != end1) {
                    data2[i]["end"] = end1;
                };
            }
        items.add(data2);
        timeline.fit();
    }
}