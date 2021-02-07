queue()
    .defer(d3.json, "/olympics/projects")
    .defer(d3.json, "static/geojson/countries.geo.json")
    .await(makeGraphs);

function makeGraphs(error, projectsJson, mapJson) 
{
    var dataset = projectsJson;

    // button to reset all selection made by user
    d3.select("#resetAll")
        .on('click', function() {
            dc.filterAll();
            dc.redrawAll();
        });
    
    // crossfilter accross the full data
    var ndx = crossfilter(dataset);

    // Create dimension for every column of interest
    var sexDim = ndx.dimension(function (d) {return d["Sex"]; });
    var ageDim = ndx.dimension(function (d) {return +d["Age"]; });
    var heightDim = ndx.dimension(function (d) {return +d["Height"]; });
    var weightDim = ndx.dimension(function (d) {return +d["Weight"]; });
    var seasonDim = ndx.dimension(function (d) {return d["Season"]; });
    var yearDim = ndx.dimension(function (d) {return d["Year"]; });
    var countryDim = ndx.dimension(function(d) { return d["country"]; });
    var sportDim = ndx.dimension(function(d) { return d["Sport"]; });
    var medalDim = ndx.dimension(function(d) { return d["Medal"]; });
    
    // Create groups for all interesting dimensions
    var all = ndx.groupAll();
    var groupBySex = sexDim.group();
    var groupByAge = ageDim.group();
    var groupBySeason = seasonDim.group();
    var groupByYear = yearDim.group();
    var groupByCountry = countryDim.group();
    var groupBySport = sportDim.group();
    var groupByMedal = medalDim.group();
    var groupByHeight = heightDim.group();
    var groupByWeight = weightDim.group();

    // Create special filtered groups removing 0 values for height, age, weight so they don't show in their own charts
    var filtered_Height = remove_empty_bins(groupByHeight);
    var filtered_Weight = remove_empty_bins(groupByWeight);
    var filtered_Age = remove_empty_bins(groupByAge);
    
    // Specify limits for dimensions
    var max_country = groupByCountry.top(1)[0].value;
    var minDate = yearDim.bottom(1)[0]["Year"];
    var maxDate = yearDim.top(1)[0]["Year"];
    var minAge = ageDim.bottom(1)[0]["Age"];
    var maxAge = ageDim.top(1)[0]["Age"];
    var maxHeight = heightDim.top(1)[0]["Height"];
    var maxWeight = weightDim.top(1)[0]["Weight"];

    // Create charts
    var timeChart = dc.barChart("#time-chart");
    var ageChart = dc.barChart("#age-chart");
    var heightChart = dc.barChart("#height-chart");
    var weightChart = dc.barChart("#weight-chart");
    var worldChart = dc.geoChoroplethChart("#map");
    var mapText = dc.numberDisplay("#map-number");
    var medalChart = dc.rowChart("#medal-chart");
    var sexChart = dc.rowChart("#sex-chart");
    var seasonChart = dc.rowChart("#season-chart");
    var sportChart = dc.pieChart("#sport-chart");    
    
    // Chart for medals, spefically ordered from gold to no medal
    medalChart
        .width(300)
        .height(250)
        .dimension(medalDim)
        .group(groupByMedal)
        .ordering(function(d) {
            if(d.key == "Gold") return 0;
            else if(d.key == "Silver") return 1;
            else if(d.key == "Bronze") return 2;
            else return 3;
        })
        .elasticX(true)
        .xAxis().ticks(4);
    
    // char discplaying sex/gender
    sexChart
        .width(300)
        .height(250)
        .dimension(sexDim)
        .group(groupBySex)
        .elasticX(true)
        .xAxis().ticks(4);
    
    // chart for seasons
    seasonChart
        .width(300)
        .height(250)
        .dimension(seasonDim)
        .group(groupBySeason)
        .elasticX(true)
        .xAxis().ticks(4);
    
    // Chart showing sports, limited to 10 specific sports
    sportChart
        .width(700)
        .height(480)
        .slicesCap(10)
        .innerRadius(70)
        .dimension(sportDim)
        .group(groupBySport)
        .minAngleForLabel(0)

    // Chart for timeline, axis scales according to data
    timeChart
        .width(600)
        .height(160)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(yearDim)
        .group(groupByYear)
        .transitionDuration(500)
        .x(d3.scale.linear().domain([minDate, maxDate]))
        .elasticY(true)
        .xAxisLabel("Year")
        .yAxis().ticks(4);
    
    // Chart for age, axis scales according to data
    ageChart
        .width(600)
        .height(160)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(ageDim)
        .group(filtered_Age)
        .transitionDuration(500)
        .x(d3.scale.linear().domain([minAge, maxAge]))
        .elasticY(true)
        .xAxisLabel("Age")
        .yAxis().ticks(4);

    //Chart for height, axis scales according to data
    heightChart
        .width(600)
        .height(160)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(heightDim)
        .group(filtered_Height)
        .transitionDuration(500)
        .x(d3.scale.linear().domain([140, maxHeight]))
        .elasticY(true)
        .xAxisLabel("Height (cm)")
        .yAxis().ticks(4);

    // Chart for weight, axis scales according to data
    weightChart
        .width(600)
        .height(160)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(weightDim)
        .group(filtered_Weight)
        .transitionDuration(500)
        .x(d3.scale.linear().domain([30, maxWeight]))
        .elasticY(true)
        .xAxisLabel("Weight (kg)")
        .yAxis().ticks(4);
    
    // Create world map, including zoom function
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

    // world map linking geo json of the world to the country column from our data
    worldChart
        .width(1000)
        .height(500)
        .transitionDuration(500)
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

// function that filters all null values
function remove_empty_bins(source_group) {
    return {
        all:function () {
            return source_group.all().filter(function(d) {
                return d.key !== 0;
            });
        }
    };
}