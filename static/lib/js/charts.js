queue()
    .defer(d3.json, "/olympics/projects")
    .defer(d3.json, "static/geojson/countries.geo.json")
    .await(makeGraphs);

function makeGraphs(error, projectsJson, mapJson) 
{
    var dataset = projectsJson;

    d3.select("#resetAll")
        .on('click', function() {
            dc.filterAll();
            dc.redrawAll();
        });
    
    var ndx = crossfilter(dataset);

    // FIELDS = {'Name': True, 'Sex': True, 'Age': True, 'Height': True, 'Weight': True, 'Team': True, 'Games': True, 'Year': True, 'country': True}
    var namesDim = ndx.dimension(function (d) {return d["Name"]; });
    var sexDim = ndx.dimension(function (d) {return d["Sex"]; });
    var ageDim = ndx.dimension(function (d) {return +d["Age"]; });
    var heightDim = ndx.dimension(function (d) {return +d["Height"]; });
    var weightDim = ndx.dimension(function (d) {return +d["Weight"]; });
    var teamDim = ndx.dimension(function (d) {return d["Team"]; });
    var seasonDim = ndx.dimension(function (d) {return d["Season"]; });
    var yearDim = ndx.dimension(function (d) {return d["Year"]; });
    var countryDim = ndx.dimension(function(d) { return d["country"]; });
    var sportDim = ndx.dimension(function(d) { return d["Sport"]; });
    var medalDim = ndx.dimension(function(d) { return d["Medal"]; });

    var all = ndx.groupAll();
    var groupByName = namesDim.group();
    var groupBySex = sexDim.group();
    var groupByAge = ageDim.group();
    var groupByTeam = teamDim.group();
    var groupBySeason = seasonDim.group();
    var groupByYear = yearDim.group();
    var groupByCountry = countryDim.group();
    var groupBySport = sportDim.group();
    var groupByMedal = medalDim.group();
    var groupByHeight = heightDim.group();
    var groupByWeight = weightDim.group();
    var filtered_Height = remove_empty_bins(groupByHeight);
    var filtered_Weight = remove_empty_bins(groupByWeight);
    var filtered_Age = remove_empty_bins(groupByAge);

    var max_country = groupByCountry.top(1)[0].value;
    var minDate = yearDim.bottom(1)[0]["Year"];
    var maxDate = yearDim.top(1)[0]["Year"];
    var minAge = ageDim.bottom(1)[0]["Age"];
    var maxAge = ageDim.top(1)[0]["Age"];
    var maxHeight = heightDim.top(1)[0]["Height"];
    var maxWeight = weightDim.top(1)[0]["Weight"];

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

    sexChart
        .width(300)
        .height(250)
        .dimension(sexDim)
        .group(groupBySex)
        .elasticX(true)
        .xAxis().ticks(4);

    seasonChart
        .width(300)
        .height(250)
        .dimension(seasonDim)
        .group(groupBySeason)
        .elasticX(true)
        .xAxis().ticks(4);

    sportChart
        .width(700)
        .height(480)
        .slicesCap(10)
        .innerRadius(70)
        .dimension(sportDim)
        .group(groupBySport)
        .minAngleForLabel(0)

    mapText
        .formatNumber(d3.format("d"))
        .valueAccessor(function(d){return d;})
        .group(all);

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

function remove_empty_bins(source_group) {
    return {
        all:function () {
            return source_group.all().filter(function(d) {
                return d.key !== 0;
            });
        }
    };
}