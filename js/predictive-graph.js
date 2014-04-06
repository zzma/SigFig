var _pg = {};

/**
 * Creates a multiple data set graph, based on dataSet, which takes the
 * following form:
 * dataSet = [{
 *              name: <String>, yAxisLabel: <String>,
 *              data: [{date: <Date>, value: <integer>},
 *                  {date: <Date>, value: <integer>},...]
 *           }]
 * NOTE: the 'name' field must not contain any '-' characters
 **/

function createPredictiveGraph(dataSet) {
    _pg.lineHash = {};
    _pg.yHash = {};
    _pg.dataSet = dataSet;
    _pg.margin = {top: 20, right: 120, bottom: 30, left: 50};
    _pg.width = 900 - _pg.margin.left - _pg.margin.right,
        _pg.height = 300 - _pg.margin.top - _pg.margin.bottom;

    _pg.x = d3.time.scale()
        .range([0, _pg.width]);

    _pg.xAxis = d3.svg.axis()
        .scale(_pg.x)
        .orient("bottom");

    //map utility functions for data points
    _pg.xMap = function(d){ return _pg.x(d.date); };

    //append the svg element, with room for axes
    _pg.svg = d3.select("body").append("svg")
        .attr("width", _pg.width + _pg.margin.left + _pg.margin.right)
        .attr("height", _pg.height + _pg.margin.top + _pg.margin.bottom)
        .attr("class", "pg")
        .append("g")
        .attr("transform", "translate(" + _pg.margin.left + "," + _pg.margin.top + ")");

    console.log(dataSet);
    //Find the aggregate range of dataSet time series
    var minDate = d3.min(dataSet[0].data, function(d) { return d.date }),
        maxDate = d3.max(dataSet[0].data, function(d) { return d.date });

    dataSet.forEach(function(dataItem){
        var tmpMin = d3.min(dataItem.data, function(d) { return d.date }),
            tmpMax = d3.max(dataItem.data, function(d) { return d.date });

        if (tmpMin < minDate) minDate = tmpMin;
        if (tmpMax < maxDate) maxDate = tmpMax;
    });

    _pg.x.domain([minDate, maxDate]);

    _pg.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + _pg.height + ")")
        .call(_pg.xAxis);

    //Define drag handler
    var drag = d3.behavior.drag()
        .origin(function(d) { return d; })
        .on("dragstart", _pg.onDragStart)
        .on("drag", _pg.onDrag)
        .on("dragend", _pg.onDragEnd);


    //Handle everything for y-axis (data dependent)
    dataSet.forEach(function(dataItem, index){
        var y = d3.scale.linear()
            .range([_pg.height, 0]);
        _pg.yHash[dataItem.name] = y;

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        var yMap = function(d){ return y(d.value); };

        var line = d3.svg.line()
            .x(function(d) { return _pg.x(d.date); })
            .y(function(d) { return y(d.value); });
        //Save a reference for the update method
        _pg.lineHash[dataItem.name] = line;

        y.domain(d3.extent(dataItem.data, function(d){ return d.value; }));

        _pg.svg.append("g")
            .attr("class", "y axis " + dataItem.name)
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text(dataItem.yAxisLabel);

        _pg.svg.append("path")
            .datum(dataItem.data)
            .attr("class", "line " + dataItem.name)
            .attr("d", line);

        _pg.svg.selectAll(".dot" + dataItem.name)
            .data(dataItem.data)
            .enter().append("circle")
            .attr("class", "dot " + dataItem.name)
            .attr("r", 4)
            .attr("cx", _pg.xMap)
            .attr("cy", yMap)
            .on("mouseover", _pg.onMouseOver)
            .on("mouseout", _pg.onMouseOut)
            .call(drag);

        // add id field to data points
        _pg.svg.selectAll(".dot" + "." + dataItem.name).each(function(d, i){
            d.ind = index + "-" + i;
        });

        updatePredictiveGraph(dataItem);
    });


    //attach the legend
    _pg.legend = d3.select("svg.pg")
        .append("g")
        .attr("transform", "translate(" + (_pg.margin.left + _pg.width + 20) + "," + _pg.margin.top + ")");
    dataSet.forEach(function(dataItem, index){
        _pg.legend.append("g").attr("class", "legend-item " + dataItem.name)
            .attr("transform", "translate(10," + (index * 30) + ")")
            .append("text")
            .text(dataItem.yAxisLabel.charAt(0).toUpperCase() + dataItem.yAxisLabel.slice(1))
            .on("click", _pg.legendClick)
            .on("mouseover", _pg.legendMouseOver)
            .on("mouseout", _pg.legendMouseOut);
    })
}
function updatePredictiveGraph(dataItem) {
    var className = "." + dataItem.name;
    _pg.svg.selectAll("path" + className).datum(dataItem.data);
    var t0 = _pg.svg.transition().duration(0);
    t0.selectAll(".line" + className).attr("d", _pg.lineHash[dataItem.name]);

    _pg.svg.selectAll(".dot"+ className).data(dataItem.data);
    t0.selectAll(".dot" + className)
        .attr("cy", function(d) { return _pg.yHash[dataItem.name](d.value); });
}



_pg.onDragStart = function (d) {
    d3.event.sourceEvent.stopPropagation();
    d3.select(this).classed("dragging", true);
}
_pg.onDrag = function(d) {
    var dataItem = _pg.dataSet[d.ind.split('-')[0]];
    var y = _pg.yHash[dataItem.name];
    d.value += (y.invert(d3.event.dy) - y.invert(0));
    dataItem.data[d.ind.split('-')[1]].value = d.value;
    updatePrediction(d3.event.dy);
    updatePredictiveGraph(dataItem);
    d3.event.sourceEvent.stopPropagation();
}
_pg.onDragEnd = function(d) {
    d3.select(this).classed("dragging", false);
}
_pg.onMouseOver = function(d) {
    var name = _pg.dataSet[d.ind.split('-')[0]].name;
    _pg.svg.selectAll(".y.axis" + "." + name).style("opacity", 1);
}
_pg.onMouseOut = function(d) {
    var name = _pg.dataSet[d.ind.split('-')[0]].name;
    _pg.svg.selectAll(".y.axis" + "." + name).style("opacity", 0);
}
_pg.legendClick = function(d, i) {
    var className = "." + this.textContent.trim().replace(/\s+/g, '_').toLowerCase();
    if (d3.select(this).classed("inactive")) {
        d3.select(this).classed("inactive", false);
        _pg.svg.selectAll(".line" + className).classed("fade", false);
        _pg.svg.selectAll(".dot" + className).classed("fade", false);
    } else {
        d3.select(this).classed("inactive", true);
        _pg.svg.selectAll(".line" + className).classed("fade", true);
        _pg.svg.selectAll(".dot" + className).classed("fade", true);
    }
}
_pg.legendMouseOver = function(d, i) {
    var className = "." + this.textContent.trim().replace(/\s+/g, '_').toLowerCase();
    _pg.svg.selectAll(".y.axis" + className).style("opacity", 1);
}
_pg.legendMouseOut = function(d, i) {
    var className = "." + this.textContent.trim().replace(/\s+/g, '_').toLowerCase();
    _pg.svg.selectAll(".y.axis" + className).style("opacity", 0);
}