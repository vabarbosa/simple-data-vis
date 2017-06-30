/* global SimpleDataVis */

/**
 *  - Bubble Chart visualization for the SimpleDataVis JavaScript module
 */
(function () {
  var BubbleChartVis = function (datavis) {
    var d3 = typeof module !== 'undefined' && module.exports ? require('d3') : window.d3

    datavis.register({
      type: 'bubble-chart',

      canRender: function (bubblechartdata) {
        var data = bubblechartdata ? (bubblechartdata.data || bubblechartdata) : []
        // an array of 1 - 50 objects with key/value
        return Object.prototype.toString.call(data) === '[object Array]' &&
          data.length &&
          data.length > 0 &&
          data.length <= 50 &&
          data[0].hasOwnProperty('key') &&
          data[0].hasOwnProperty('value') &&
          !isNaN(parseInt(data[0].value, 10))
      },

      render: function (selection, barchartdata, options, callbacks) {
        if (d3.version.split('.')[0] === '3') {
          this.renderV3(selection, barchartdata, options, callbacks)
        } else {
          this.renderV4(selection, barchartdata, options, callbacks)
        }
      },

      renderV3: function (selection, bubblechartdata, options, callbacks) {
        var duration = 500

        var data = bubblechartdata ? (bubblechartdata.data || bubblechartdata) : []

        // var diameter = 800
        var box = selection.node().getBoundingClientRect()
        var width = (box.width || 600)
        var height = (box.height || 600)
        // var width = Math.max(diameter, box.width)
        // var height = diameter

        var color = d3.scale.category20()
        var bubble = d3.layout.pack()
          .sort(null)
          .padding(3)

        bubble.size([width, height])

        // setup the svg element
        var svg = selection.selectAll('svg').data([data])
        svg.enter().append('svg')
        svg.attr('width', width)
          .attr('height', height)
          .attr('xmlns', 'http://www.w3.org/2000/svg')
          .style('color', '#264a60')
          .style('fill', '#264a60')
          .style('font-family', 'HelvNeue,Helvetica,sans-serif')
          .style('font-size', '0.8rem')
          .style('font-weight', '300')

        var nodes = bubble.nodes({children: data})
          .filter(function (d) {
            return !d.children
          })

        var node = svg.selectAll('.node').data(nodes, function (d) { return d.key })

        // update circle sizes
        var svgcircles = svg.selectAll('circle')
          .data(nodes, function (d) { return d.key })

        if (typeof module === 'undefined' || !module.exports) {
          svgcircles = svgcircles
            .transition()
            .duration(duration)
            .delay(function (d, i) { return i * 7 })
        }

        svgcircles.attr('r', function (d) { return d.r })

        // update text
        var svgtext = svg.selectAll('text')
          .data(nodes, function (d) { return d.key })

        if (typeof module === 'undefined' || !module.exports) {
          svgtext = svgtext
            .transition()
            .duration(duration)
            .delay(function (d, i) { return i * 7 })
        }

        svgtext
          .text(function (d) {
            var l = d.r / 5
            if (d.key.length > l) {
              return d.key.substring(0, l) + '...'
            } else {
              return d.key
            }
          })

        // update node positioning
        var svgnode = node

        if (typeof module === 'undefined' || !module.exports) {
          svgnode = node.transition()
            .duration(duration)
            .delay(function (d, i) { return i * 7 })
        }

        svgnode
          .attr('transform', function (d) {
            return 'translate(' + d.x + ',' + d.y + ')'
          })
          .style('opacity', 1)

        // add new nodes
        var g = node.enter().append('g')
          .attr('class', 'node')
          .attr('transform', function (d) {
            return 'translate(' + d.x + ',' + d.y + ')'
          })

        // add circles
        var circles = g.append('circle')
          .attr('r', function (d) { return d.r })
          .style('fill', function (d, i) { return color(d.value) })

        if (typeof module === 'undefined' || !module.exports) {
          circles
            .on('mouseover', function (d, i) {
              d3.select(this).transition()
                .attr('opacity', 0.75)
              SimpleDataVis.tooltip.mouseover(d, i, options)
            })
            .on('mousemove', SimpleDataVis.tooltip.mousemove)
            .on('mouseout', function (d, i) {
              d3.select(this).transition()
                .attr('opacity', 1)
              SimpleDataVis.tooltip.mouseout(d, i, options)
            })
        }

        if (options.click) {
          circles
            .style('cursor', 'pointer')
            .on('click', function (d, i) {
              d3.event.stopPropagation()
              options.click(d, i)
            })
        }

        // add text
        g.append('text')
          .attr('dy', '.3em')
          .attr('class', 'bubbletext')
          .style('fill', '#ffffff')
          .style('font-size', '0.8rem')
          .style('pointer-events', 'none')
          .style('text-anchor', 'middle')
          .text(function (d) {
            var l = d.r / 5
            if (d.key && d.key.length > l) {
              return d.key.substring(0, l) + '...'
            } else {
              return d.key
            }
          })

        // remove old nodes
        node.exit().transition()
          .duration(duration)
          .style('opacity', 0)
          .remove()
      },

      renderV4: function (selection, bubblechartdata, options, callbacks) {
        var data = bubblechartdata ? (bubblechartdata.data || bubblechartdata) : []

        var box = selection.node().getBoundingClientRect()
        var width = (box.width || 600)
        var height = (box.height || 600)

        var duration = 500
        var color = d3.scaleOrdinal(d3.schemeCategory20)
        var bubble = d3.pack()
          .padding(3)
          .size([width, height])

        // setup the svg element
        var svg = selection.selectAll('svg').data([data])
        svg = svg.enter().append('svg')
            .attr('xmlns', 'http://www.w3.org/2000/svg')
            .style('color', '#264a60')
            .style('fill', '#264a60')
            .style('font-family', 'HelvNeue,Helvetica,sans-serif')
            .style('font-size', '0.8rem')
            .style('font-weight', '300')
          .merge(svg)
            .attr('width', width)
            .attr('height', height)

        var nodes = bubble(d3.hierarchy({children: data})
            .sum(function (d) { return d.value })
            .each(function (d) { d.key = d.data.key }))
          .leaves()

        var node = svg.selectAll('.node').data(nodes, function (d) { return d.key })

        // remove old nodes
        node.exit().transition()
          .duration(duration)
          .style('opacity', 0)
          .remove()

        // add new nodes
        var g = node.enter().append('g')
          .attr('class', 'node')
          .attr('transform', function (d) {
            return 'translate(' + d.x + ',' + d.y + ')'
          })

        // update node positioning with animation
        if (typeof module === 'undefined' || !module.exports) {
          node = node.transition()
            .duration(duration)
            .delay(function (d, i) { return i * 7 })
        }

        node
          .attr('transform', function (d) {
            return 'translate(' + d.x + ',' + d.y + ')'
          })
          .style('opacity', 1)

        // add circles
        var circles = g.append('circle')
          .attr('r', function (d) { return d.r })
          .style('fill', function (d, i) { return color(d.value) })

        if (typeof module === 'undefined' || !module.exports) {
          circles
            .on('mouseover', function (d, i) {
              d3.select(this).transition()
                .attr('opacity', 0.75)
              SimpleDataVis.tooltip.mouseover(d, i, options)
            })
            .on('mousemove', SimpleDataVis.tooltip.mousemove)
            .on('mouseout', function (d, i) {
              d3.select(this).transition()
                .attr('opacity', 1)
              SimpleDataVis.tooltip.mouseout(d, i, options)
            })
        }

        if (options.click) {
          circles
            .style('cursor', 'pointer')
            .on('click', function (d, i) {
              d3.event.stopPropagation()
              options.click(d, i)
            })
        }

        // add text
        g.append('text')
          .attr('dy', '.3em')
          .attr('class', 'bubbletext')
          .style('fill', '#ffffff')
          .style('font-size', '0.8rem')
          .style('pointer-events', 'none')
          .style('text-anchor', 'middle')
          .text(function (d) {
            var l = d.r / 5
            if (d.key && d.key.length > l) {
              return d.key.substring(0, l) + '...'
            } else {
              return d.key
            }
          })
      }
    })
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BubbleChartVis
  } else {
    BubbleChartVis(SimpleDataVis)
  }
}())
