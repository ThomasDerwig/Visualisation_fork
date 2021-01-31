d3.json("/olympics/projects").then(function(data) {
    var olympicsProjects = data;
    olympicsProjects.forEach(function(d){
       d["Age"] = +d["Age"] 
    });

    var ndx = crossfilter(olympicsProjects);

    var ageDim = ndx.dimension(function(d) { return d["Age"]; });

    var all = ndx.groupAll();
    var groupAge = ageDim.group();
    var ageChart = dc.rowChart("#age-row-chart");

    ageChart
        .width(300)
        .height(250)
        .dimension(ageDim)
        .group(groupAge)
        .xAxis().ticks(4);

    //var worldChart = dc.geoChoroplethChart("#world-chart");

    dc.renderAll();
});