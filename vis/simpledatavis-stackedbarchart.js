/**
 *  - Stacked Bar Chart visualization for the SimpleDataVis JavaScript module
 */
(function(datavis) {

  datavis.register({
    type: 'stacked-bar-chart',

    canRender: function(groupedbarchartdata) {
      var data = groupedbarchartdata ? (groupedbarchartdata.data || groupedbarchartdata) : [];
      // an array with key/value and value is an object
      return Object.prototype.toString.call(data) === '[object Array]'
        && data.length
        && data.length > 0
        && data[0].hasOwnProperty('key')
        && data[0].value != null
        && typeof data[0].value === 'object';
    },

    render: function(selection, groupedbarchartdata, options, callbacks) {
      var data = groupedbarchartdata ? (groupedbarchartdata.data || groupedbarchartdata) : [];
      var opts = options || {};
      var groupKeys = [];

      if (typeof data[0].value === 'object') {
        data.forEach(function(d) {
          for (var key in d.value) {
            if (groupKeys.indexOf(key) == -1) {
              groupKeys.push(key);
            }
          }
        });
      }
      else {
        data.forEach(function(d) {
          for (var key in d) {
            if (key !== 'key' && groupKeys.indexOf(key) == -1) {
              groupKeys.push(key);
            }
          }
        });
      }

      var color = d3.scale.category10();
      var margin = {top: 20, right: 150, bottom: 120, left: 80};
      var box = selection.node().getBoundingClientRect();
      var width = Math.max(800, box.width) - margin.left - margin.right;
      var height = 600 - margin.top - margin.bottom;

      var layers = d3.layout.stack()(groupKeys.map(function(key) {
        return data.map(function(d, i) {
          return {
            x: d.key, y: d.value[key] ? +d.value[key] : 0
          };
        });
      }));

      var yStackMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); });

      var xScale = d3.scale.ordinal()
        .domain(layers[0].map(function(d) { return d.x; }))
        .rangeRoundBands([25, width], .08);

      if (100 < xScale.rangeBand()) {
        xScale.rangeRoundBands([25, layers[0].length * 100], .08);
      }

      var y = d3.scale.linear()
        .domain([0, yStackMax])
        .range([height, 0]);

      var xAxis = d3.svg.axis()
        .scale(xScale)
        .tickSize(0)
        .tickPadding(6)
        .orient("bottom");

      var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickFormat(d3.format(".2s"));
    
      // setup the svg element
      var svg = selection.selectAll('svg').data([data]);
      svg.enter().append('svg');
      svg.attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);
      svg.exit().remove();

      // setup graph area
      var graph = svg.selectAll('g.series').data([data]);
      graph.enter().append('g')
        .attr('class', 'series')
      graph.attr('transform', function(d, i) {
        return 'translate(' + margin.left + ',' + (margin.top + (height + margin.bottom) * i) + ')'
      });
      graph.exit().remove();

      // setup a layer for stack entry
      var layer = graph.selectAll(".layer").data(layers);
      layer.enter().append("g")
        .attr("class", "layer");
      layer.style("fill", function(d, i) { return color(i); });

      // setup the bar for each entry
      var rect = layer.selectAll("rect").data(function(d) { return d; });
      rect.enter().append("rect");
      rect.transition()
        .duration(300)
        .delay(function(d, i) { return i * 10; })
        .attr("x", function(d) { return xScale(d.x); })
        .attr("y", height)
        .attr("width", xScale.rangeBand())
        .delay(function(d, i) { return i * 10; })
        .attr("y", function(d) { return y(d.y0 + d.y); })
        .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); })
      rect.exit().remove();

      // the x axis
      var xaxis = graph.selectAll('g.x').data([data]);
      xaxis.enter().append('g')
        .attr('class', 'x axis')
        .style('font-size', '0.8rem');
      xaxis.transition()
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text").style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", function(d) { return "rotate(-45)" });
      xaxis.exit().remove();

      // the y axis
      var yaxis = graph.selectAll('g.y').data([data]);
      yaxis.enter().append('g')
        .attr('class', 'y axis')
        .style('font-size', '0.8rem');
      yaxis.transition()
        .attr("transform", "translate(20,0)")
        .call(yAxis)
      yaxis.exit().remove();

      // style the axis
      graph.selectAll('.axis path')
        .style('fill', 'none')
        .style('stroke', '#152935');
      graph.selectAll('.axis line')
        .style('fill', 'none')
        .style('stroke', '#152935');
      xaxis.selectAll('path')
        .style('stroke', 'none');

      // legend key
      var legendkey = svg.selectAll('rect.legend').data(color.domain().slice().reverse());

      // add new keys
      legendkey.enter().append('rect')
        .attr('class', 'legend');

      // update keys
      legendkey
        .style('fill', function(d) { return color(d); })
        .attr('x', width + margin.left + 25)
        .attr('y', function(d, i) { return i*20; })
        .attr('width', 18)
        .attr('height', 18);

      // remove old keys
      legendkey.exit().transition()
        .attr('opacity', 0)
        .remove();

      // legend label
      var legendlabel = svg.selectAll('text.legend').data(groupKeys);

      // add new labels
      legendlabel.enter().append('text')
        .attr('class', 'legend');

      // update labels
      legendlabel
        .text(function(d) { return d; })
        .attr('x', width + margin.left + 45)
        .attr('y', function(d, i) { return (i*20 + 9); })
        .attr('dy', '.35em');

      // remove old labels
      legendlabel.exit().transition()
        .attr('opacity', 0)
        .remove();
    }
  })
}(SimpleDataVis));