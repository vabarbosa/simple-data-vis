/* global SimpleDataVis */

/**
 *  - Timeline visualization for the SimpleDataVis JavaScript module
 */
(function () {
  var TimelineVis = function (datavis) {
    var d3 = typeof module !== 'undefined' && module.exports ? require('d3') : window.d3

    datavis.register({
      type: 'timeline',

      canRender: function (timelinedata) {
        var data = timelinedata ? (timelinedata.data || timelinedata) : []
        // an array of objects with key/value/date (or more accurately the first object has key/value/date)
        return Object.prototype.toString.call(data) === '[object Array]' &&
          data.length &&
          data.length > 0 &&
          data[0].hasOwnProperty('key') &&
          data[0].hasOwnProperty('value') &&
          data[0].hasOwnProperty('date') &&
          !isNaN(parseInt(data[0].value, 10))
      },

      render: function (selection, barchartdata, options, callbacks) {
        if (d3.version.split('.')[0] === '3') {
          this.renderV3(selection, barchartdata, options, callbacks)
        } else {
          this.renderV4(selection, barchartdata, options, callbacks)
        }
      },

      renderV3: function (selection, timelinedata, options, callbacks) {
        var timeformat = d3.time.format('%Y-%m-%d')
        var tScale = d3.time.scale()
        var yScale = d3.scale.linear()

        var data = timelinedata ? (timelinedata.data || timelinedata) : []
        var opts = options || {}
        var keys = timelinedata.keys && typeof timelinedata.keys !== 'function' ? timelinedata.keys : []
        if (keys.length === 0) {
          data.forEach(function (d) {
            if (d.key && keys.indexOf(d.key) === -1) {
              keys.push(d.key)
            }
          })
        }
        // sort by the date
        data.sort(function (a, b) { return a.date > b.date })

        var margin = {top: 20, right: 150, bottom: 30, left: 75}
        var box = selection.node().getBoundingClientRect()
        // var box = d3.select(this).node().getBoundingClientRect()
        var width = Math.max(800, (box.width || 1024)) - margin.left - margin.right
        var height = 500 - margin.top - margin.bottom

        var color = d3.scale.category10()
        var line = d3.svg.line()

        // set the ranges
        tScale.range([0, width])
        yScale.range([height, 0])
        color.domain(keys)

        // scale the data
        tScale.domain([
          d3.min(data, function (c) { return c.date }),
          d3.max(data, function (c) { return c.date })
        ])

        yScale.domain([0, d3.max(data, function (c) { return c.value })])

        // define the axes
        var xAxis = d3.svg.axis().scale(tScale).orient('bottom')
        var yAxis = d3.svg.axis().scale(yScale).orient('left')

        // setup the svg element
        var svg = selection.selectAll('svg').data([data])
        // var svg = d3.select(this).selectAll('svg').data([data])
        svg.enter().append('svg')
        svg.attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .attr('xmlns', 'http://www.w3.org/2000/svg')
          .style('color', '#264a60')
          .style('fill', '#264a60')
          .style('font-family', 'HelvNeue,Helvetica,sans-serif')
          .style('font-size', '0.8rem')
          .style('font-weight', '300')

        var graph = svg.selectAll('g').data([data])
        graph.enter().append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

        // setup the x axis
        var xaxis = graph.selectAll('g.x').data([data])
        xaxis.enter().append('g')
          .attr('class', 'x axis')
        var xaxistransition = typeof module === 'undefined' || !module.exports ? xaxis.transition() : xaxis
        xaxistransition
          .attr('transform', 'translate(0,' + height + ')')
          .attr('opacity', 1)
          .call(xAxis)
        xaxis.exit().remove()

        // setup the y axis
        var yaxis = graph.selectAll('g.y').data([data])
        yaxis.enter().append('g')
          .attr('class', 'y axis')
        var yaxistransition = typeof module === 'undefined' || !module.exports ? yaxis.transition() : yaxis
        yaxistransition
          .attr('opacity', 1)
          .call(yAxis)
        yaxis.exit().remove()

        // style the axis
        graph.selectAll('.axis path')
          .style('fill', 'none')
          .style('stroke', '#152935')
        graph.selectAll('.axis line')
          .style('fill', 'none')
          .style('stroke', '#152935')

        if (opts.scatter) {
          // timeplot
          var circles = graph.selectAll('circle').data(data)

          // add new points
          circles.enter().append('circle').attr('r', 5)

          // update points
          circles
            .attr('cx', function (d) { return tScale(d.date) })
            .attr('cy', function (d) { return yScale(d.value) })
            .attr('class', function (d) { return 'dot key-' + d.key.replace(/\s+/g, '') })
            .style('fill', function (d) { return color(d.key) })

          if (typeof module === 'undefined' || !module.exports) {
            circles
              .on('mouseover', function (d, i) {
                d3.select(this).transition()
                  .attr('r', 10)
                  .attr('opacity', 0.75)
                SimpleDataVis.tooltip.mouseover(d, i, options,
                    (timeformat(new Date(d.date)) + ', ' + d.key + ', ' + d.value))
              })
              .on('mousemove', SimpleDataVis.tooltip.mousemove)
              .on('mouseout', function (d, i) {
                d3.select(this).transition()
                  .attr('r', 5)
                  .attr('opacity', 1)
                SimpleDataVis.tooltip.mouseout(d, i)
              })

            if (options.click) {
              circles.select(this)
                .style('cursor', 'pointer')
                .on('click', function (d, i) {
                  d3.event.stopPropagation()
                  options.click(d, i)
                })
            }
          }

          // remove old points
          circles.exit().remove()
        } else {
          // timeline
          line
            .x(function (d) { return tScale(d.date) })
            .y(function (d) { return yScale(d.value) })

          var keynest = d3.nest().key(function (d) { return d.key }).entries(data)
          var evtgraph = graph.selectAll('g.event').data([keynest])
          evtgraph.enter().append('g')
            .attr('class', 'event')
          evtgraph.exit().remove()

          // event line
          var evtpath = evtgraph.selectAll('path.line').data(keynest)

          // add new lines
          evtpath.enter()
            .append('path')
              .attr('class', function (d) {
                return 'line key-' + d.key.replace(/\s+/g, '')
              })
              .style('fill', 'none')
              .style('stroke', function (d) { return color(d.key) })

          // update lines
          var evtpathtransition = typeof module === 'undefined' || !module.exports ? evtpath.transition() : evtpath
          evtpathtransition
            .attr('d', function (d) { return line(d.values) })

          // remove old lines
          evtpath.exit().remove()
        }

        // legend key
        var legendkey = svg.selectAll('rect.legend').data(keys)

        // add new keys
        legendkey.enter().append('rect')
          .attr('class', 'legend')
          // .attr('opacity', 0)
          .attr('x', width + margin.left + 25)
          .attr('y', function (d, i) { return (i * 20 + margin.top) })
          .attr('width', 18)
          .attr('height', 18)

        // update keys
        var legendkeytransition = typeof module === 'undefined' || !module.exports ? legendkey.transition() : legendkey
        legendkeytransition
          .style('fill', function (d) { return color(d) })

        // remove old keys
        legendkey.exit().transition()
          .attr('opacity', 0)
          .remove()

        // legend label
        var legendlabel = svg.selectAll('text.legend').data(keys)

        // add new labels
        legendlabel.enter().append('text')
          .attr('class', 'legend')
          .attr('x', width + margin.left + 45)
          .attr('y', function (d, i) { return (i * 20 + 9 + margin.top) })
          .attr('dy', '.35em')

        // update labels
        legendlabel
          .text(function (d) { return d })

        if (typeof module === 'undefined' || !module.exports) {
          legendlabel
            .on('mouseover', function (d, i) {
              d3.select(this)
                .style('cursor', 'pointer')
                .style('font-weight', 'bold')
              d3.selectAll('.dot.key-' + d.replace(/\s+/g, ''))
                .attr('r', 10)
                .attr('opacity', 0.7)
              d3.selectAll('.line.key-' + d.replace(/\s+/g, ''))
                .style('stroke-width', 5)
                .attr('opacity', 0.7)
            })
            .on('mouseout', function (d, i) {
              d3.select(this)
                .style('cursor', null)
                .style('font-weight', null)
              d3.selectAll('.dot.key-' + d.replace(/\s+/g, ''))
                .attr('r', 5)
                .attr('opacity', 1)
              d3.selectAll('.line.key-' + d.replace(/\s+/g, ''))
                .style('stroke-width', null)
                .attr('opacity', 1)
            })
            .on('click', function (d, i) {
              d3.selectAll('.key-' + d.replace(/\s+/g, ''))
                .transition().duration(100)
                .style('display', (this.display = (this.display === 'none' ? '' : 'none')))
            })
        }

        // remove old labels
        legendlabel.exit().transition()
          .attr('opacity', 0)
          .remove()
      },

      renderV4: function (selection, timelinedata, options, callbacks) {
        var timeformat = d3.timeFormat('%Y-%m-%d')
        var tScale = d3.scaleTime()
        var yScale = d3.scaleLinear()

        var data = timelinedata ? (timelinedata.data || timelinedata) : []
        var opts = options || {}
        var keys = timelinedata.keys && typeof timelinedata.keys !== 'function' ? timelinedata.keys : []
        if (keys.length === 0) {
          data.forEach(function (d) {
            if (d.key && keys.indexOf(d.key) === -1) {
              keys.push(d.key)
            }
          })
        }
        // sort by the date
        data.sort(function (a, b) { return a.date > b.date })

        var margin = {top: 20, right: 150, bottom: 30, left: 75}
        var box = selection.node().getBoundingClientRect()
        var width = Math.max(800, (box.width || 1024)) - margin.left - margin.right
        var height = 500 - margin.top - margin.bottom

        var color = d3.scaleOrdinal(d3.schemeCategory10)
        var line = d3.line()

        // set the ranges
        tScale.range([0, width])
        yScale.range([height, 0])
        color.domain(keys)

        // scale the data
        tScale.domain([
          d3.min(data, function (c) { return c.date }),
          d3.max(data, function (c) { return c.date })
        ])

        yScale.domain([0, d3.max(data, function (c) { return c.value })])

        // define the axes
        var xAxis = d3.axisBottom(tScale)
        var yAxis = d3.axisLeft(yScale)

        // setup the svg element
        var svg = selection.selectAll('svg').data([data])
        svg = svg.enter().append('svg')
          .merge(svg)
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .attr('xmlns', 'http://www.w3.org/2000/svg')
            .style('color', '#264a60')
            .style('fill', '#264a60')
            .style('font-family', 'HelvNeue,Helvetica,sans-serif')
            .style('font-size', '0.8rem')
            .style('font-weight', '300')

        var graph = svg.selectAll('g').data([data])
        graph = graph.enter().append('g')
          .merge(graph)
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

        // setup the x axis
        var xaxis = graph.selectAll('g.x').data([data])
        xaxis = xaxis.enter().append('g')
          .merge(xaxis)
            .attr('class', 'x axis')
        var xaxistransition = typeof module === 'undefined' || !module.exports ? xaxis.transition() : xaxis
        xaxistransition
          .attr('transform', 'translate(0,' + height + ')')
          .attr('opacity', 1)
          .call(xAxis)
        xaxis.exit().remove()

        // setup the y axis
        var yaxis = graph.selectAll('g.y').data([data])
        yaxis = yaxis.enter().append('g')
          .merge(yaxis)
            .attr('class', 'y axis')
        var yaxistransition = typeof module === 'undefined' || !module.exports ? yaxis.transition() : yaxis
        yaxistransition
          .attr('opacity', 1)
          .call(yAxis)
        yaxis.exit().remove()

        // style the axis
        graph.selectAll('.axis path')
          .style('fill', 'none')
          .style('stroke', '#152935')
        graph.selectAll('.axis line')
          .style('fill', 'none')
          .style('stroke', '#152935')

        if (opts.scatter) {
          // timeplot
          var circles = graph.selectAll('circle').data(data)

          // add new points
          circles = circles.enter().append('circle').attr('r', 5).merge(circles)

          // update points
          circles
            .attr('cx', function (d) { return tScale(d.date) })
            .attr('cy', function (d) { return yScale(d.value) })
            .attr('class', function (d) { return 'dot key-' + d.key.replace(/\s+/g, '') })
            .style('fill', function (d) { return color(d.key) })

          if (typeof module === 'undefined' || !module.exports) {
            circles
              .on('mouseover', function (d, i) {
                d3.select(this).transition()
                  .attr('r', 10)
                  .attr('opacity', 0.75)
                SimpleDataVis.tooltip.mouseover(d, i, options,
                    (timeformat(new Date(d.date)) + ', ' + d.key + ', ' + d.value))
              })
              .on('mousemove', SimpleDataVis.tooltip.mousemove)
              .on('mouseout', function (d, i) {
                d3.select(this).transition()
                  .attr('r', 5)
                  .attr('opacity', 1)
                SimpleDataVis.tooltip.mouseout(d, i)
              })

            if (options.click) {
              circles.select(this)
                .style('cursor', 'pointer')
                .on('click', function (d, i) {
                  d3.event.stopPropagation()
                  options.click(d, i)
                })
            }
          }

          // remove old points
          circles.exit().remove()
        } else {
          // timeline
          line
            .x(function (d) { return tScale(d.date) })
            .y(function (d) { return yScale(d.value) })

          var keynest = d3.nest().key(function (d) { return d.key }).entries(data)
          var evtgraph = graph.selectAll('g.event').data([keynest])
          evtgraph = evtgraph.enter().append('g')
              .attr('class', 'event')
            .merge(evtgraph)
          evtgraph.exit().remove()

          // event line
          var evtpath = evtgraph.selectAll('path.line').data(keynest)

          // add new lines
          evtpath = evtpath.enter()
              .append('path')
            .merge(evtpath)
              .attr('class', function (d) {
                return 'line key-' + d.key.replace(/\s+/g, '')
              })
              .style('fill', 'none')
              .style('stroke', function (d) { return color(d.key) })

          // update lines
          var evtpathtransition = typeof module === 'undefined' || !module.exports ? evtpath.transition() : evtpath
          evtpathtransition
            .attr('d', function (d) { return line(d.values) })

          // remove old lines
          evtpath.exit().remove()
        }

        // legend key
        var legendkey = svg.selectAll('rect.legend').data(keys)

        // add new keys
        legendkey = legendkey.enter().append('rect')
          .merge(legendkey)
            .attr('class', 'legend')
            // .attr('opacity', 0)
            .attr('x', width + margin.left + 25)
            .attr('y', function (d, i) { return (i * 20 + margin.top) })
            .attr('width', 18)
            .attr('height', 18)

        // update keys
        var legendkeytransition = typeof module === 'undefined' || !module.exports ? legendkey.transition() : legendkey
        legendkeytransition
          .style('fill', function (d) { return color(d) })

        // remove old keys
        legendkey.exit().transition()
          .attr('opacity', 0)
          .remove()

        // legend label
        var legendlabel = svg.selectAll('text.legend').data(keys)

        // add new labels
        legendlabel = legendlabel.enter().append('text')
          .merge(legendlabel)
            .attr('class', 'legend')
            .attr('x', width + margin.left + 45)
            .attr('y', function (d, i) { return (i * 20 + 9 + margin.top) })
            .attr('dy', '.35em')

        // update labels
        legendlabel
          .text(function (d) { return d })

        if (typeof module === 'undefined' || !module.exports) {
          legendlabel
            .on('mouseover', function (d, i) {
              d3.select(this)
                .style('cursor', 'pointer')
                .style('font-weight', 'bold')
              d3.selectAll('.dot.key-' + d.replace(/\s+/g, ''))
                .attr('r', 10)
                .attr('opacity', 0.7)
              d3.selectAll('.line.key-' + d.replace(/\s+/g, ''))
                .style('stroke-width', 5)
                .attr('opacity', 0.7)
            })
            .on('mouseout', function (d, i) {
              d3.select(this)
                .style('cursor', null)
                .style('font-weight', null)
              d3.selectAll('.dot.key-' + d.replace(/\s+/g, ''))
                .attr('r', 5)
                .attr('opacity', 1)
              d3.selectAll('.line.key-' + d.replace(/\s+/g, ''))
                .style('stroke-width', null)
                .attr('opacity', 1)
            })
            .on('click', function (d, i) {
              d3.selectAll('.key-' + d.replace(/\s+/g, ''))
                .transition().duration(100)
                .style('display', (this.display = (this.display === 'none' ? '' : 'none')))
            })
        }

        // remove old labels
        legendlabel.exit().transition()
          .attr('opacity', 0)
          .remove()
      }
    })
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimelineVis
  } else {
    TimelineVis(SimpleDataVis)
  }
}())
