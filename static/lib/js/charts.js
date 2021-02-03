queue()
    .defer(d3.json, "/olympics/projects")
    .await(makeGraphs);

function makeGraphs(error, projectsJson) 
{
    var dataset = projectsJson;
    var ndx = crossfilter(dataset);

    // FIELDS = {'Name': True, 'Sex': True, 'Age': True, 'Height': True, 'Weight': True, 'Team': True, 'Games': True, 'Year': True}
    var namesDim = ndx.dimension(function (d) {return d["Name"]; });
    var sexDim = ndx.dimension(function (d) {return d["Sex"]; });
    var ageDim = ndx.dimension(function (d) {return d["Age"]; });
    var heightDim = ndx.dimension(function (d) {return d["Height"]; });
    var weightDim = ndx.dimension(function (d) {return d["Weight"]; });
    var teamDim = ndx.dimension(function (d) {return d["Team"]; });
    var gamesDim = ndx.dimension(function (d) {return d["Games"]; });
    var yearDim = ndx.dimension(function (d) {return d["Year"]; });

    var all = ndx.groupAll();
    var groupByName = namesDim.group();
    var groupBySex = sexDim.group();
    var groupByAge = ageDim.group();
    var groupByTeam = teamDim.group();
    var groupByGames = gamesDim.group();
    var groupByYear = yearDim.group();

    var minDate = yearDim.bottom(1)[0]["Year"];
    var maxDate = yearDim.top(1)[0]["Year"];

    var testChart = dc.barChart("#test-chart");

    testChart
        .width(1000)
        .height(1000)
        .dimension(yearDim)
        .group(groupByYear)
        .x(d3.time.scale().domain([minDate, maxDate]));

    dc.renderAll();
};