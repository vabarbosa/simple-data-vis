/**
 *  - Bubble Chart visualization for the SimpleDataVis JavaScript module
 */
(function(datavis) {

  datavis.register({
    type: 'bubble-chart',

    canRender: function(bubblechartdata) {
      var data = bubblechartdata ? (bubblechartdata.data || bubblechartdata) : [];
      // an array of 1 - 50 objects with key/value
      return Object.prototype.toString.call(data) === '[object Array]'
        && data.length
        && data.length > 0
        && data.length <= 50
        && data[0].hasOwnProperty('key')
        && data[0].hasOwnProperty('value')
        && !isNaN(data[0].value);
    },

    render: function(selection, bubblechartdata, options, callbacks) {
      var duration = 500;

      var data = bubblechartdata ? (bubblechartdata.data || bubblechartdata) : [];

      var diameter = 800;
      var box = selection.node().getBoundingClientRect();
      var width = Math.max(diameter, box.width);
      var height = diameter;

      var color = d3.scale.category20();
      var bubble = d3.layout.pack()
        .sort(null)
        .padding(3);

      bubble.size([width, height]);

      // setup the svg element
      var svg = selection.selectAll('svg').data([data]);
      svg.enter().append('svg');
      svg.attr('width', width)
        .attr('height', height);

      var nodes = bubble.nodes({children:data})
        .filter(function(d) { 
          return !d.children;
        });

      var node = svg.selectAll('.node').data(nodes, function(d) { return d.key; });

      // update circle sizes
      svg.selectAll('circle')
        .data(nodes, function(d) { return d.key; })
        .transition()
        .duration(duration)
        .delay(function(d, i) {return i * 7;}) 
        .attr('r', function(d) { return d.r; });

      // update text 
      svg.selectAll('text')
        .data(nodes, function(d) { return d.key; })
        .transition()
        .duration(duration)
        .delay(function(d, i) {return i * 7;}) 
        .text(function(d) {
          var l = d.r / 5;
          if (d.key.length > l) {
            return d.key.substring(0, l) + '...';
          }
          else {
            return d.key;
          }
        });

      // update node positioning
      node.transition()
        .duration(duration)
        .delay(function(d, i) {return i * 7;}) 
        .attr('transform', function(d) {
          return 'translate(' + d.x + ',' + d.y + ')';
        })
        .style('opacity', 1);

      // add new nodes
      var g = node.enter().append('g')
        .attr('class', 'node')
        .attr('transform', function(d) {
          return 'translate(' + d.x + ',' + d.y + ')';
        });

      // add circles
      g.append('circle')
        .attr('r', function(d) { return d.r; })
        .style('fill', function(d, i) { return color(d.value); })
        .on('mouseover', function(d, i) {
          d3.select(this).transition()
            .attr('opacity', 0.75);
          SimpleDataVis.tooltip.mouseover(d, i, options);
        })
        .on('mousemove', SimpleDataVis.tooltip.mousemove)
        .on('mouseout', function(d, i) {
          d3.select(this).transition()
            .attr('opacity', 1);
          SimpleDataVis.tooltip.mouseout(d, i, options);
        });

      // add text
      g.append('text')
        .attr('dy', '.3em')
        .attr('class', 'bubbletext')
        .style('fill', '#ffffff')
        .style('font-size', '0.8rem')
        .style('pointer-events', 'none')
        .style('text-anchor', 'middle')
        .text(function(d) {
            var l = d.r / 5;
            if (d.key && d.key.length > l) {
              return d.key.substring(0, l) + '...';
            }
            else {
              return d.key;
            }
        });

      // remove old nodes
      node.exit().transition()
        .duration(duration)
        .style('opacity', 0)
        .remove();
    }
  })
}(SimpleDataVis));