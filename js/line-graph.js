var _line = {};

function createLineGraph(data, data2) {
    _line.margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = 700 - _line.margin.left - _line.margin.right,
        height = 300 - _line.margin.top - _line.margin.bottom;

    _line.x = d3.time.scale()
        .range([0, width]);

    _line.y = d3.scale.linear()
        .range([height, 0]);

    _line.xAxis = d3.svg.axis()
        .scale(_line.x)
        .orient("bottom");

    //maps for data points
    _line.xMap = function(d){ return _line.x(d.date); };
    _line.yMap = function(d){ return _line.y(d.value); };

    _line.yAxis = d3.svg.axis()
        .scale(_line.y)
        .orient("left");

    _line.line = d3.svg.line()
        .x(function(d) { return _line.x(d.date); })
        .y(function(d) { return _line.y(d.value); });

    _line.svg = d3.select("body").append("svg")
        .attr("width", width + _line.margin.left + _line.margin.right)
        .attr("height", height + _line.margin.top + _line.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + _line.margin.left + "," + _line.margin.top + ")");

    _line.x.domain(d3.extent(data, function(d) { return d.date; }));
    _line.y.domain(d3.extent(data, function(d) { return d.value; }));


    _line.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(_line.xAxis);

    _line.svg.append("g")
        .attr("class", "y axis")
        .call(_line.yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Price ($)");

    _line.svg.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", _line.line);

    _line.svg.append("path")
        .datum(data2)
        .attr("class", "line2")
        .attr("d", _line.line);

    var drag = d3.behavior.drag()
        .origin(function(d) { return d; })
        .on("dragstart", function(d){
            d3.event.sourceEvent.stopPropagation();
            d3.select(this).classed("dragging", true);
        })
        .on("drag", function(d){
            d.value += (_line.y.invert(d3.event.dy)-_line.y.invert(0));
            data[d.ind].value = d.value;
            updateLineGraph(data);
        })
        .on("dragend", function(d){
            d3.select(this).classed("dragging", false);
        });

    _line.svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 4)
        .attr("cx", _line.xMap)
        .attr("cy", _line.yMap)
//        .attr("id", function(d, i){ return "dp" + i; })
        .call(drag);

//    add id field to data
    _line.svg.selectAll(".dot").each(function(d, i){
        d.ind = i;
    });

    _line.svg.selectAll(".dot2")
        .data(data2)
        .enter().append("circle")
        .attr("class", "dot2")
        .attr("r", 4)
        .attr("cx", _line.xMap)
        .attr("cy", _line.yMap)
        .style("fill", function(d) { return "#0000ff"; });

    updateLineGraph(data);
}

function updateLineGraph(data) {
    //Transition for data line
    _line.svg.selectAll("path").datum(data);
    var t0 = _line.svg.transition().duration(0);
    t0.selectAll(".line").attr("d", _line.line);

    _line.svg.selectAll(".dot").data(data);
    t0.selectAll(".dot").attr("cx", _line.xMap).attr("cy", _line.yMap);
}