queue()
    .defer(d3.csv, "/olympics/projects")
    .defer(d3.json, "static/geojson/countries.geo.json")
    .await(makeGraphs);

function makeGraphs(error, projectsJson, mapJson) 
{
    var dataset = projectsJson;
    dataset.forEach(function(d){
        d["count"] = + d["count"];
    });
    
    var ndx = crossfilter(dataset);

    // FIELDS = {'Name': True, 'Sex': True, 'Age': True, 'Height': True, 'Weight': True, 'Team': True, 'Games': True, 'Year': True, 'country': True}
    var namesDim = ndx.dimension(function (d) {return d["Name"]; });
    var sexDim = ndx.dimension(function (d) {return d["Sex"]; });
    var ageDim = ndx.dimension(function (d) {return d["Age"]; });
    var heightDim = ndx.dimension(function (d) {return d["Height"]; });
    var weightDim = ndx.dimension(function (d) {return d["Weight"]; });
    var teamDim = ndx.dimension(function (d) {return d["Team"]; });
    var gamesDim = ndx.dimension(function (d) {return d["Games"]; });
    var yearDim = ndx.dimension(function (d) {return d["Year"]; });
    var countryDim = ndx.dimension(function(d) { return d["country"]; });
    var sportDim = ndx.dimension(function(d) { return d["Sport"]; });
    var medalDim = ndx.dimension(function(d) { return d["Medal"]; });

    var all = ndx.groupAll();
    var groupByName = namesDim.group();
    var groupBySex = sexDim.group();
    var groupByAge = ageDim.group();
    var groupByTeam = teamDim.group();
    var groupByGames = gamesDim.group();
    var groupByYear = yearDim.group();
    var groupByCountry = countryDim.group();
    var groupBySport = sportDim.group();
    var groupByMedal = medalDim.group();

    var max_country = groupByCountry.top(1)[0].value;
    var minDate = yearDim.bottom(1)[0]["Year"];
    var maxDate = yearDim.top(1)[0]["Year"];

    var timeChart = dc.barChart("#time-chart");
    var worldChart = dc.geoChoroplethChart("#map");
    var mapText = dc.numberDisplay("#map-number");
    var medalChart = dc.rowChart("#medal-chart");
    var sportChart = dc.rowChart("#sport-chart");

    medalChart
    .width(300)
    .height(250)
    .dimension(medalDim)
    .group(groupByMedal)
    .xAxis().ticks(4);

    sportChart
    .width(300)
    .height(250)
    .dimension(sportDim)
    .group(groupBySport)
    .xAxis().ticks(4);

    mapText
        .formatNumber(d3.format("d"))
        .valueAccessor(function(d){return d;})
        .group(all);

    timeChart
        .width(600)
        .height(160)
        .dimension(yearDim)
        .group(groupByYear)
        .x(d3.scale.linear().domain([minDate, maxDate]));
    
    var width = 1000,
        height = 500;
    
    var projection = d3.geo.mercator()
        .scale(100)
    
    function zoomed() {
        projection
        .translate(d3.event.translate)
        .scale(d3.event.scale);
        worldChart.render();
    }
    
    var zoom = d3.behavior.zoom()
        .translate(projection.translate())
        .scale(projection.scale())
        .scaleExtent([height/5, 8 * height])
        .on("zoom", zoomed);
    
    var svg = d3.select("#map")
        .attr("width", width)
        .attr("height", height)
        .call(zoom);

    worldChart
        .width(1000)
        .height(500)
        .transitionDuration(1000)
        .dimension(countryDim)
        .group(groupByCountry)
        .colors(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"])
        .colorDomain([0, max_country])
        .overlayGeoJson(mapJson["features"], "country", function (d) {
            return d.properties.name;
        })
        .projection(projection)
        .title(function (p) {
            return "Country: " + p["key"]
                    + "\n"
                    + "Total entries: " + Math.round(p["value"]);
        })

    dc.renderAll();
};