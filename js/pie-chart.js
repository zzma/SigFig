var _pie = {};

/**
 * Creates a pieChart, based on dataSet, which takes the
 * following form:
 * dataSet = [{label: <String>, value: <integer/float>}, ...]
 * NOTE: the 'name' field must not contain any '-' characters
 **/

function createPieChart(data) {
    _pie.svg = d3.select("body")
        .append("svg")
        .append("g")

    _pie.svg.append("g")
        .attr("class", "slices");
    _pie.svg.append("g")
        .attr("class", "labels");
    _pie.svg.append("g")
        .attr("class", "lines");

    var width = 500,
        height = 300;

    _pie.radius = Math.min(width, height) / 2;
    _pie.pie = d3.layout.pie()
        .sort(null)
        .value(function(d) {
            return d.value;
        });

    _pie.arc = d3.svg.arc()
        .outerRadius(_pie.radius * 0.8)
        .innerRadius(_pie.radius * 0.4);

    _pie.outerArc = d3.svg.arc()
        .innerRadius(_pie.radius * 0.9)
        .outerRadius(_pie.radius * 0.9);

    _pie.svg.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    _pie.key = function(d){ return d.data.label; };

    updatePieChart(data);
}

function updatePieChart(data) {
    // array of random colors
//    var randomColors = [], randomColorPalette = d3.scale.category20();
//    var dataLength = data.length;
//    for (var i = 0; i < dataLength; i++) {
//        randomColors.push(randomColorPalette(i));
//    }

    var dataLabels = [];
    data.forEach(function(point){
       dataLabels.push(point.label);
    });

//    //Smaller data set
//    var color = d3.scale.ordinal()
//        .domain(dataLabels)
//        .range(randomColors.slice(0, data.length));

    change(data);

    function change(data) {

        /* ------- PIE SLICES -------*/
        var slice = _pie.svg.select(".slices").selectAll("path.slice")
            .data(_pie.pie(data), _pie.key);

        slice.enter()
            .insert("path")
//            .style("fill", function(d) { return color(d.data.label); })
            .attr("class", function(d){ return "slice " + d.data.label});

        slice.transition().duration(0)
            .attrTween("d", function(d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t) {
                    return _pie.arc(interpolate(t));
                };
            })

        slice.exit()
            .remove();

        /* ------- TEXT LABELS -------*/

        var text = _pie.svg.select(".labels").selectAll("text")
            .data(_pie.pie(data), _pie.key);

        text.enter()
            .append("text")
            .attr("dy", ".35em")
            .text(function(d) {
                return d.data.label;
            });

        function midAngle(d){
            return d.startAngle + (d.endAngle - d.startAngle)/2;
        }

        text.transition().duration(0)
            .attrTween("transform", function(d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t) {
                    var d2 = interpolate(t);
                    var pos = _pie.outerArc.centroid(d2);
                    pos[0] = _pie.radius * (midAngle(d2) < Math.PI ? 1 : -1);
                    return "translate("+ pos +")";
                };
            })
            .styleTween("text-anchor", function(d){
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t) {
                    var d2 = interpolate(t);
                    return midAngle(d2) < Math.PI ? "start":"end";
                };
            });

        text.exit()
            .remove();

        /* ------- SLICE TO TEXT POLYLINES -------*/
        var polyline = _pie.svg.select(".lines").selectAll("polyline")
            .data(_pie.pie(data), _pie.key);

        polyline.enter()
            .append("polyline");

        polyline.transition().duration(0)
            .attrTween("points", function(d){
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t) {
                    var d2 = interpolate(t);
                    var pos = _pie.outerArc.centroid(d2);
                    pos[0] = _pie.radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
                    return [_pie.arc.centroid(d2), _pie.outerArc.centroid(d2), pos];
                };
            });

        polyline.exit()
            .remove();
    };
}