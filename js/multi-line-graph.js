var _mlg = {};

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

function createMultiLineGraph(dataSet) {
    _mlg.lineHash = {};
    _mlg.yHash = {};
    _mlg.dataSet = dataSet;
    _mlg.margin = {top: 20, right: 120, bottom: 30, left: 50};
    _mlg.width = 900 - _mlg.margin.left - _mlg.margin.right,
    _mlg.height = 450 - _mlg.margin.top - _mlg.margin.bottom;

    _mlg.x = d3.time.scale()
        .range([0, _mlg.width]);

    _mlg.xAxis = d3.svg.axis()
        .scale(_mlg.x)
        .orient("bottom");

    //map utility functions for data points
    _mlg.xMap = function(d){ return _mlg.x(d.date); };

    //append the svg element, with room for axes
    _mlg.svg = d3.select("body").append("svg")
        .attr("width", _mlg.width + _mlg.margin.left + _mlg.margin.right)
        .attr("height", _mlg.height + _mlg.margin.top + _mlg.margin.bottom)
        .attr("class", "mlg")
        .append("g")
        .attr("transform", "translate(" + _mlg.margin.left + "," + _mlg.margin.top + ")");

    //Find the aggregate range of dataSet time series
    var minDate = d3.min(dataSet[0].data, function(d) { return d.date }),
        maxDate = d3.max(dataSet[0].data, function(d) { return d.date });

    dataSet.forEach(function(dataItem){
        var tmpMin = d3.min(dataItem.data, function(d) { return d.date }),
            tmpMax = d3.max(dataItem.data, function(d) { return d.date });

        if (tmpMin < minDate) minDate = tmpMin;
        if (tmpMax < maxDate) maxDate = tmpMax;
    });

    _mlg.x.domain([minDate, maxDate]);

    _mlg.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + _mlg.height + ")")
        .call(_mlg.xAxis);

    //Define drag handler
    var drag = d3.behavior.drag()
        .origin(function(d) { return d; })
        .on("dragstart", _mlg.onDragStart)
        .on("drag", _mlg.onDrag)
        .on("dragend", _mlg.onDragEnd);


    //Handle everything for y-axis (data dependent)
    dataSet.forEach(function(dataItem, index){
        var y = d3.scale.linear()
            .range([_mlg.height, 0]);
        _mlg.yHash[dataItem.name] = y;

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        var yMap = function(d){ return y(d.value); };

        var line = d3.svg.line()
            .x(function(d) { return _mlg.x(d.date); })
            .y(function(d) { return y(d.value); });
        //Save a reference for the update method
        _mlg.lineHash[dataItem.name] = line;

        y.domain(d3.extent(dataItem.data, function(d){ return d.value; }));

        _mlg.svg.append("g")
            .attr("class", "y axis " + dataItem.name)
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text(dataItem.yAxisLabel);

        _mlg.svg.append("path")
            .datum(dataItem.data)
            .attr("class", "line " + dataItem.name)
            .attr("d", line);

        _mlg.svg.selectAll(".dot" + dataItem.name)
            .data(dataItem.data)
            .enter().append("circle")
            .attr("class", "dot " + dataItem.name)
            .attr("r", 4)
            .attr("cx", _mlg.xMap)
            .attr("cy", yMap)
            .on("mouseover", _mlg.onMouseOver)
            .on("mouseout", _mlg.onMouseOut)
            .call(drag);

        // add id field to data points
        _mlg.svg.selectAll(".dot" + "." + dataItem.name).each(function(d, i){
            d.ind = index + "-" + i;
        });

        updateMultiLineGraph(dataItem);
    });


    //attach the legend
    _mlg.legend = d3.select("svg.mlg")
        .append("g")
        .attr("transform", "translate(" + (_mlg.margin.left + _mlg.width + 20) + "," + _mlg.margin.top + ")");
    dataSet.forEach(function(dataItem, index){
        _mlg.legend.append("g").attr("class", "legend-item " + dataItem.name)
            .attr("transform", "translate(10," + (index * 30) + ")")
            .append("text")
            .text(dataItem.yAxisLabel.charAt(0).toUpperCase() + dataItem.yAxisLabel.slice(1))
            .on("click", _mlg.legendClick)
            .on("mouseover", _mlg.legendMouseOver)
            .on("mouseout", _mlg.legendMouseOut);
    })
}
function updateMultiLineGraph(dataItem) {
    var className = "." + dataItem.name;
    _mlg.svg.selectAll("path" + className).datum(dataItem.data);
    var t0 = _mlg.svg.transition().duration(0);
    t0.selectAll(".line" + className).attr("d", _mlg.lineHash[dataItem.name]);

    _mlg.svg.selectAll(".dot"+ className).data(dataItem.data);
    t0.selectAll(".dot" + className)
        .attr("cy", function(d) { return _mlg.yHash[dataItem.name](d.value); });
}

function transitionTime(minDate, maxDate) {
    _mlg.x.domain([minDate, maxDate]);
    var t0 = _mlg.svg.transition().duration(1000);
    t0.selectAll(".x.axis").call(_mlg.xAxis);
    _mlg.dataSet.forEach(function(dataItem){
        var className = "." + dataItem.name;
        t0.selectAll(".line" + className).attr("d", _mlg.lineHash[dataItem.name]);
        t0.selectAll(".dot" + className)
            .attr("cx", function(d) { return _mlg.x(d.date); });
    });
}


_mlg.onDragStart = function (d) {
    d3.event.sourceEvent.stopPropagation();
    d3.select(this).classed("dragging", true);
}
_mlg.onDrag = function(d) {
    var dataItem = _mlg.dataSet[d.ind.split('-')[0]];
    var y = _mlg.yHash[dataItem.name];
    d.value += (y.invert(d3.event.dy) - y.invert(0));
    dataItem.data[d.ind.split('-')[1]].value = d.value;
    updatePredictiveGraph(dataItem);
    d3.event.sourceEvent.stopPropagation();
}
_mlg.onDragEnd = function(d) {
    d3.select(this).classed("dragging", false);
}
_mlg.onMouseOver = function(d) {
    var name = _mlg.dataSet[d.ind.split('-')[0]].name;
    _mlg.svg.selectAll(".y.axis" + "." + name).style("opacity", 1);
}
_mlg.onMouseOut = function(d) {
    var name = _mlg.dataSet[d.ind.split('-')[0]].name;
    _mlg.svg.selectAll(".y.axis" + "." + name).style("opacity", 0);
}
_mlg.legendClick = function(d, i) {
    var className = "." + this.textContent.trim().replace(/\s+/g, '_').toLowerCase();
    console.log(className);
    if (d3.select(this).classed("inactive")) {
        d3.select(this).classed("inactive", false);
        _mlg.svg.selectAll(".line" + className).classed("fade", false);
        _mlg.svg.selectAll(".dot" + className).classed("fade", false);
    } else {
        d3.select(this).classed("inactive", true);
        _mlg.svg.selectAll(".line" + className).classed("fade", true);
        _mlg.svg.selectAll(".dot" + className).classed("fade", true);
    }
}
_mlg.legendMouseOver = function(d, i) {
    var className = "." + this.textContent.trim().replace(/\s+/g, '_').toLowerCase();
    _mlg.svg.selectAll(".y.axis" + className).style("opacity", 1);
}
_mlg.legendMouseOut = function(d, i) {
    var className = "." + this.textContent.trim().replace(/\s+/g, '_').toLowerCase();
    _mlg.svg.selectAll(".y.axis" + className).style("opacity", 0);
}