/* global SimpleDataVis */

/**
 *  - Stacked Bar Chart visualization for the SimpleDataVis JavaScript module
 */
(function () {
  var StackedBarChartVis = function (datavis) {
    var d3 = typeof module !== 'undefined' && module.exports ? require('d3') : window.d3

    datavis.register({
      type: 'stacked-bar-chart',

      canRender: function (groupedbarchartdata) {
        var data = groupedbarchartdata ? (groupedbarchartdata.data || groupedbarchartdata) : []
        // an array with key/value and value is an object
        return Object.prototype.toString.call(data) === '[object Array]' &&
          data.length &&
          data.length > 0 &&
          data[0].hasOwnProperty('key') &&
          data[0].value != null &&
          typeof data[0].value === 'object'
      },

      render: function (selection, groupedbarchartdata, options, callbacks) {
        var data = groupedbarchartdata ? (groupedbarchartdata.data || groupedbarchartdata) : []
        var opts = options || {}
        var groupKeys = []

        if (typeof data[0].value === 'object') {
          data.forEach(function (d) {
            for (var key in d.value) {
              if (groupKeys.indexOf(key) === -1) {
                groupKeys.push(key)
              }
            }
          })
        } else {
          data.forEach(function (d) {
            var value = {}
            for (var key in d) {
              if (key !== 'key') {
                value[key] = d[key]
                if (groupKeys.indexOf(key) === -1) {
                  groupKeys.push(key)
                }
              }
            }
            d.value = value
          })
        }

        var color = d3.scale.category10()
        var margin = {top: 20, right: 150, bottom: 120, left: 80}
        var box = selection.node().getBoundingClientRect()
        var width = (box.width || 1024) - margin.left - margin.right
        var height = (box.height || 600) - margin.top - margin.bottom

        var layers = d3.layout.stack()(groupKeys.map(function (key) {
          return data.map(function (d, i) {
            return {
              x: d.key, y: d.value[key] ? +d.value[key] : 0, l: key
            }
          })
        }))

        var yStackMax = d3.max(layers, function (layer) { return d3.max(layer, function (d) { return d.y0 + d.y }) })

        var xScale = d3.scale.ordinal()
          .domain(layers[0].map(function (d) { return d.x }))
          .rangeRoundBands([25, width], 0.08)

        if (xScale.rangeBand() > 100) {
          xScale.rangeRoundBands([25, layers[0].length * 100], 0.08)
        }

        var y = d3.scale.linear()
          .domain([0, yStackMax])
          .range([height, 0])

        var xAxis = d3.svg.axis()
          .scale(xScale)
          .tickSize(0)
          .tickPadding(6)
          .orient('bottom')

        var yAxis = d3.svg.axis()
          .scale(y)
          .orient('left')
          .tickFormat(d3.format('.2s'))

        // setup the svg element
        var svg = selection.selectAll('svg').data([data])
        svg.enter().append('svg')
        svg.attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .attr('xmlns', 'http://www.w3.org/2000/svg')
          .style('color', '#264a60')
          .style('fill', '#264a60')
          .style('font-family', 'HelvNeue,Helvetica,sans-serif')
          .style('font-size', '0.8rem')
          .style('font-weight', '300')
        svg.exit().remove()

        // setup graph area
        var graph = svg.selectAll('g.series').data([data])
        graph.enter().append('g')
          .attr('class', 'series')
        graph.attr('transform', function (d, i) {
          return 'translate(' + margin.left + ',' + (margin.top + (height + margin.bottom) * i) + ')'
        })
        graph.exit().remove()

        // setup a layer for stack entry
        var layer = graph.selectAll('.layer').data(layers)
        layer.enter().append('g')
          .attr('class', 'layer')
        layer.style('fill', function (d, i) { return color(i) })

        // setup the bar for each entry
        var rect = layer.selectAll('rect').data(function (d) { return d })
        rect.enter().append('rect')

        var recttransition = typeof module === 'undefined' || !module.exports
          ? rect.transition().duration(300).delay(function (d, i) { return i * 10 })
          : rect
        recttransition
          .attr('x', function (d) { return xScale(d.x) })
          .attr('width', xScale.rangeBand())
          .attr('y', function (d) {
            var a = y(d.y0 + d.y)
            return a
          })
          .attr('height', function (d) {
            var a = y(d.y0) - y(d.y0 + d.y)
            return a
          })

        if (typeof module === 'undefined' || !module.exports) {
          recttransition
            .each('end', function (d, i) {
              var index = i
              d3.select(this)
                .on('mouseover', function (d, i) {
                  SimpleDataVis.tooltip.mouseover({key: d.l, value: d.y, data: data[index]}, i, opts)
                })
                .on('mousemove', SimpleDataVis.tooltip.mousemove)
                .on('mouseout', SimpleDataVis.tooltip.mouseout)

              if (options.click) {
                d3.select(this)
                  .style('cursor', 'pointer')
                  .on('click', function (d, i) {
                    d3.event.stopPropagation()
                    options.click({key: d.l, value: d.y, data: d}, i)
                  })
              }
            })
        }

        rect.exit().remove()

        // the x axis
        var xaxis = graph.selectAll('g.x').data([data])
        xaxis.enter().append('g')
          .attr('class', 'x axis')
          .style('font-size', '0.8rem')
        var xaxistransition = typeof module === 'undefined' || !module.exports ? xaxis.transition() : xaxis
        xaxistransition
          .attr('transform', 'translate(0,' + height + ')')
          .call(xAxis)
          .selectAll('text').style('text-anchor', 'start')
            .attr('dx', '.8em')
            .attr('dy', '.15em')
            .attr('transform', function (d) { return 'rotate(45)' })
        xaxis.exit().remove()

        // the y axis
        var yaxis = graph.selectAll('g.y').data([data])
        yaxis.enter().append('g')
          .attr('class', 'y axis')
          .style('font-size', '0.8rem')
        var yaxistransition = typeof module === 'undefined' || !module.exports ? yaxis.transition() : yaxis
        yaxistransition
          .attr('transform', 'translate(20,0)')
          .call(yAxis)
        yaxis.exit().remove()

        // style the axis
        graph.selectAll('.axis path')
          .style('fill', 'none')
          .style('stroke', '#152935')
        graph.selectAll('.axis line')
          .style('fill', 'none')
          .style('stroke', '#152935')
        xaxis.selectAll('path')
          .style('stroke', 'none')

        // legend key
        var legendkey = svg.selectAll('rect.legend').data(color.domain().slice().reverse())

        // add new keys
        legendkey.enter().append('rect')
          .attr('class', 'legend')

        // update keys
        legendkey
          .style('fill', function (d) { return color(d) })
          .attr('x', width + margin.left + 25)
          .attr('y', function (d, i) { return (i * 20 + margin.top) })
          .attr('width', 18)
          .attr('height', 18)

        // remove old keys
        legendkey.exit().transition()
          .attr('opacity', 0)
          .remove()

        // legend label
        var legendlabel = svg.selectAll('text.legend').data(groupKeys.reverse())

        // add new labels
        legendlabel.enter().append('text')
          .attr('class', 'legend')

        // update labels
        legendlabel
          .text(function (d) { return d })
          .attr('x', width + margin.left + 45)
          .attr('y', function (d, i) { return (i * 20 + 9 + margin.top) })
          .attr('dy', '.35em')

        // remove old labels
        legendlabel.exit().transition()
          .attr('opacity', 0)
          .remove()
      }
    })
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StackedBarChartVis
  } else {
    StackedBarChartVis(SimpleDataVis)
  }
}())
