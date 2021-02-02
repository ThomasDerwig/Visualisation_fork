d3.json("/olympics/projects").then(function(data) {
    var olympicsProjects = data;
    
    olympicsProjects.forEach(function(d){
        //d["Year"] = +d["Year"];
        d["Age"] = +d["Age"] 
    });

    var ndx = crossfilter(olympicsProjects);

    var yearDim = ndx.dimension(function(d) { return d["Year"]; });
    var ageDim = ndx.dimension(function(d) { return d["Age"]; });

    var all = ndx.groupAll();
    var groupYear = yearDim.group(); 
    var groupAge = ageDim.group();
    

    var minYear = yearDim.bottom(1)[0]["Year"];
    var maxYear = yearDim.top(1)[0]["Year"];

    var timeChart = dc.barChart("#time-chart");
    var ageChart = dc.rowChart("#age-row-chart");

    timeChart
    .width(600)
    .height(160)
    .margins({top: 10, right: 50, bottom: 30, left: 50})
    .dimension(yearDim)
    .group(groupYear)
    .transitionDuration(500)
    .x(d3.scaleLinear().domain([minYear, maxYear]))
    .elasticY(true)
    .xAxisLabel("Year")
    .yAxis().ticks(4);

    ageChart
        .width(300)
        .height(250)
        .dimension(ageDim)
        .group(groupAge)
        .xAxis().ticks(4);

    //var worldChart = dc.geoChoroplethChart("#world-chart");

    dc.renderAll();
});