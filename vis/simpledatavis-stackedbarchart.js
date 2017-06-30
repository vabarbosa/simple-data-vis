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

      render: function (selection, barchartdata, options, callbacks) {
        if (d3.version.split('.')[0] === '3') {
          this.renderV3(selection, barchartdata, options, callbacks)
        } else {
          this.renderV4(selection, barchartdata, options, callbacks)
        }
      },

      renderV3: function (selection, groupedbarchartdata, options, callbacks) {
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
          .attr('width', width + margin.left + margin.right)
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
      },

      renderV4: function (selection, groupedbarchartdata, options, callbacks) {
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

        var color = d3.scaleOrdinal(d3.schemeCategory10)
        var margin = {top: 20, right: 150, bottom: 120, left: 80}
        var box = selection.node().getBoundingClientRect()
        var width = (box.width || 1024) - margin.left - margin.right
        var height = (box.height || 600) - margin.top - margin.bottom

        var v = data.map(function (d, i) {
          return d.value
        })
        var kv = function (d, key) {
          return d.value[key]
        }

        var layers = d3.stack().keys(groupKeys).value(kv)(data)

        var yStackMax = d3.max(v, function (d) { return d3.sum(Object.keys(d), function (o) { return d[o] }) })

        var xScale = d3.scaleBand()
          .domain(data.map(function (d) { return d.key }))
          .rangeRound([25, width]).padding(0.08)

        if (xScale.bandwidth() > 100) {
          xScale.rangeRound([25, v.length * 100]).padding(0.08)
        }

        var y = d3.scaleLinear()
          .domain([0, yStackMax])
          .range([height, 0])

        var xAxis = d3.axisBottom(xScale)
          .tickSize(0)
          .tickPadding(6)

        var yAxis = d3.axisLeft(y)
          .tickFormat(d3.format('.2s'))

        // setup the svg element
        var svg = selection.selectAll('svg').data([data])
        svg.exit().remove()
        svg = svg.enter().append('svg')
            .attr('xmlns', 'http://www.w3.org/2000/svg')
            .style('font-family', 'HelvNeue,Helvetica,sans-serif')
            .style('font-size', '0.8rem')
            .style('font-weight', '300')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
          .merge(svg)

        // setup graph area
        var graph = svg.selectAll('g.series').data([data])
        graph.exit().remove()
        graph = graph.enter().append('g')
            .attr('class', 'series')
          .merge(graph)
        graph.attr('transform', function (d, i) {
          return 'translate(' + margin.left + ',' + (margin.top + (height + margin.bottom) * i) + ')'
        })

        // setup a layer for stack entry
        var layer = graph.selectAll('.layer').data(layers)
        layer = layer.enter().append('g')
            .attr('class', 'layer')
          .merge(layer)
        layer.style('fill', function (d, i) { return color(i) })

        // setup the bar for each entry
        var rect = layer.selectAll('rect').data(function (d) { return d })
        rect.exit().remove()
        rect = rect.enter().append('rect').merge(rect)

        var recttransition = typeof module === 'undefined' || !module.exports
          ? rect.transition().duration(300).delay(function (d, i) { return i * 10 })
          : rect
        recttransition
          .attr('x', function (d) { return xScale(d.data.key) })
          .attr('width', xScale.bandwidth())
          .attr('y', function (d) { return y(d[1]) })
          .attr('height', function (d) { return y(d[0]) - y(d[1]) })

        if (typeof module === 'undefined' || !module.exports) {
          recttransition
            .on('end', function (d, i) {
              d3.select(this)
                .on('mouseover', function (d, i) {
                  SimpleDataVis.tooltip.mouseover({key: d.data.key, value: (d[1] - d[0]), data: d.data}, i, opts)
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

        // the x axis
        var xaxis = graph.selectAll('g.x').data([data])
        xaxis.exit().remove()
        xaxis = xaxis.enter().append('g')
            .attr('class', 'x axis')
            .style('font-size', '0.8rem')
          .merge(xaxis)
        var xaxistransition = typeof module === 'undefined' || !module.exports ? xaxis.transition() : xaxis
        xaxistransition
          .attr('transform', 'translate(0,' + height + ')')
          .call(xAxis)
          .selectAll('text').style('text-anchor', 'start')
            .attr('dx', '.8em')
            .attr('dy', '.15em')
            .attr('transform', function (d) { return 'rotate(45)' })

        // the y axis
        var yaxis = graph.selectAll('g.y').data([data])
        yaxis.exit().remove()
        yaxis = yaxis.enter().append('g')
            .attr('class', 'y axis')
            .style('font-size', '0.8rem')
          .merge(yaxis)
        var yaxistransition = typeof module === 'undefined' || !module.exports ? yaxis.transition() : yaxis
        yaxistransition
          .attr('transform', 'translate(20,0)')
          .call(yAxis)

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

        // remove old keys
        legendkey.exit().transition()
          .attr('opacity', 0)
          .remove()

        // add new keys
        legendkey = legendkey.enter().append('rect')
            .attr('class', 'legend')
          .merge(legendkey)

        // update keys
        legendkey
          .style('fill', function (d) { return color(d) })
          .attr('x', width + margin.left + 25)
          .attr('y', function (d, i) { return (i * 20 + margin.top) })
          .attr('width', 18)
          .attr('height', 18)

        // legend label
        var legendlabel = svg.selectAll('text.legend').data(groupKeys.reverse())

        // remove old labels
        legendlabel.exit().transition()
          .attr('opacity', 0)
          .remove()

        // add new labels
        legendlabel = legendlabel.enter().append('text')
            .attr('class', 'legend')
          .merge(legendlabel)

        // update labels
        legendlabel
          .text(function (d) { return d })
          .attr('x', width + margin.left + 45)
          .attr('y', function (d, i) { return (i * 20 + 9 + margin.top) })
          .attr('dy', '.35em')
      }
    })
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StackedBarChartVis
  } else {
    StackedBarChartVis(SimpleDataVis)
  }
}())
