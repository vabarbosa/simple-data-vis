/* global SimpleDataVis */

/**
 *  - Range Chart visualization for the SimpleDataVis JavaScript module
 */
(function () {
  var RangeBarChartVis = function (datavis) {
    var d3 = typeof module !== 'undefined' && module.exports ? require('d3') : window.d3

    datavis.register({
      type: 'range-bar-chart',

      canRender: function (barchartdata) {
        var data = barchartdata ? (barchartdata.data || barchartdata) : []
        // an array of objects with key/value
        return Object.prototype.toString.call(data) === '[object Array]' &&
          data.length &&
          data.length > 0 &&
          data[0].hasOwnProperty('key') &&
          (data[0].hasOwnProperty('max') ||
          (data[0].hasOwnProperty('value') && data[0].value.hasOwnProperty('max')))
      },

      render: function (selection, barchartdata, options, callbacks) {
        if (d3.version.split('.')[0] === '3') {
          this.renderV3(selection, barchartdata, options, callbacks)
        } else {
          this.renderV4(selection, barchartdata, options, callbacks)
        }
      },

      renderV3: function (selection, barchartdata, options, callbacks) {
        var tooltipText = function (d) {
          return d.key + ': Min (' + d.min + '), Avg (' + d.avg + '), Max (' + d.max + ')'
        }
        var xScale = d3.scale.linear()
        var yScale = d3.scale.linear()

        var data = barchartdata ? (barchartdata.data || barchartdata) : []
        data.forEach(function (d) {
          if (typeof d.max !== 'number') {
            d.max = d.value && typeof d.value.max === 'number' ? d.value.max : 0
          }
          if (typeof d.min !== 'number') {
            d.min = d.value && typeof d.value.min === 'number' ? d.value.min : d.max
          }
          if (typeof d.avg !== 'number') {
            d.avg = (typeof d.sum === 'number' && typeof d.count === 'number')
              ? d.sum / d.count
              : d.value && typeof d.value.avg === 'number'
                ? d.value.avg
                : (d.value && typeof d.value.sum === 'number' && typeof d.value.count === 'number')
                  ? d.value.sum / d.value.count
                  : (d.max + d.min) / 2
          }
        })

        var box = selection.node().getBoundingClientRect()
        var width = (box.width || 1024)
        var h = (box.height || 600)
        var margin = { left: 100, right: 75, bottom: 25 }

        var height = Math.min(h, data.length * 85)

        var cdom = data.map(function (d) { return d.key })
        cdom.sort(function (a, b) { return a > b })
        var color = d3.scale.category10().domain(cdom)

        // set the ranges
        xScale.range([margin.left, width - margin.left - margin.right])
        yScale.range([0, height - margin.bottom])

        // scale the data
        var min = !isNaN(parseFloat(options.min))
          ? Math.min(parseFloat(options.min), d3.min(data, function (d) { return d.min }))
          : d3.min(data, function (d) { return d.min })
        var max = !isNaN(parseFloat(options.max))
          ? Math.max(parseFloat(options.max), d3.max(data, function (d) { return d.max }))
          : d3.max(data, function (d) { return d.max })
        xScale.domain([min, max])
        yScale.domain([0, data.length])

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

        // the x axis
        var xAxis = d3.svg.axis().scale(xScale).orient('bottom')
        var xaxis = svg.selectAll('g.x').data([data])
        xaxis.enter().append('g')
          .attr('class', 'x axis')
        var xaxistransition = typeof module === 'undefined' || !module.exports ? xaxis.transition() : xaxis
        xaxistransition
          .attr('transform', 'translate(0,' + (height - margin.bottom) + ')')
          .attr('opacity', 1)
          .call(xAxis)
        xaxis.exit().remove()

        // style the axis
        svg.selectAll('.axis path')
          .style('fill', 'none')
          .style('stroke', '#152935')
        svg.selectAll('.axis line')
          .style('fill', 'none')
          .style('stroke', '#152935')

        var bars = svg.selectAll('rect.bar').data(data)

        // add new bars
        bars.enter().append('rect')
          .attr('class', 'bar')
          .attr('opacity', 0)

        if (typeof module === 'undefined' || !module.exports) {
          bars
            .on('mouseover', function (d, i) {
              SimpleDataVis.tooltip.mouseover(d, i, options, tooltipText(d))
            })
            .on('mousemove', SimpleDataVis.tooltip.mousemove)
            .on('mouseout', SimpleDataVis.tooltip.mouseout)
        }

        // update bars
        var barstransition = typeof module === 'undefined' || !module.exports ? bars.transition() : bars
        barstransition
          .attr('x', function (d, i) { return xScale(d.min) })
          .attr('y', function (d, i) { return yScale(i + 0.1) + ((yScale(i + 0.9) - yScale(i + 0.4)) / 3.5) })
          .attr('height', function (d, i) {
            return yScale(i + 0.9) - yScale(i + 0.4)
          })
          .attr('width', function (d) { return xScale(d.max) - xScale(d.min) })
          .attr('opacity', 1)
          .style('fill', function (d, i) { return color(d.key) })

        if (options.click) {
          bars
            .style('cursor', 'pointer')
            .on('click', function (d, i) {
              d3.event.stopPropagation()
              options.click(d, i)
            })
        }

        // remove old bars
        bars.exit().transition()
          .attr('opacity', 0)
          .attr('width', 0)
          .remove()

        // key labels
        var keyLabels = svg.selectAll('text.barkey').data(data)

        // add new key labels
        keyLabels.enter().append('text')
          .attr('class', 'barkey')
          .attr('opacity', 0)
          .attr('dx', '-0.3em')
          .attr('dy', '0.35em')
          .attr('text-anchor', 'end')

        if (typeof module === 'undefined' || !module.exports) {
          keyLabels
            .on('mouseover', function (d, i) {
              SimpleDataVis.tooltip.mouseover(d, i, options, tooltipText(d))
            })
            .on('mousemove', SimpleDataVis.tooltip.mousemove)
            .on('mouseout', SimpleDataVis.tooltip.mouseout)
        }

        // update key labels
        var keylabelstransition = typeof module === 'undefined' || !module.exports ? keyLabels.transition() : keyLabels
        keylabelstransition
          .attr('x', xScale.range()[0])
          .attr('y', function (d, i) { return yScale(i + 0.5) })
          .attr('dx', '-5px')
          .attr('opacity', 1)
          .text(function (d) {
            var l = margin.left / 10
            if (d.key.length > l) {
              return d.key.substring(0, l) + '...'
            } else {
              return d.key
            }
          })

        // remove old key labels
        keyLabels.exit().transition()
          .attr('opacity', 0)
          .attr('x', 0)
          .remove()

        // avg marker
        var avgMarker = svg.selectAll('rect.avgvalue').data(data)

        // add new avg marker
        avgMarker.enter().append('rect')
          .attr('class', 'avgvalue')
          .attr('opacity', 0)

        if (typeof module === 'undefined' || !module.exports) {
          avgMarker
            .on('mouseover', function (d, i) {
              SimpleDataVis.tooltip.mouseover(d, i, options, tooltipText(d))
            })
            .on('mousemove', SimpleDataVis.tooltip.mousemove)
            .on('mouseout', SimpleDataVis.tooltip.mouseout)
        }

        // update avg marker
        var avgmarkertransition = typeof module === 'undefined' || !module.exports ? avgMarker.transition() : avgMarker
        avgmarkertransition
          .attr('x', function (d) { return xScale(d.avg) })
          .attr('y', function (d, i) { return yScale(i + 0.1) })
          .attr('height', function (d, i) {
            return yScale(i + 0.9) - yScale(i + 0.1)
          })
          .attr('width', '4px')
          .attr('dx', '-2px')
          .attr('opacity', 1)

        if (options.click) {
          avgMarker
            .style('cursor', 'pointer')
            .on('click', function (d, i) {
              d3.event.stopPropagation()
              options.click(d, i)
            })
        }

        // remove old avg marker
        avgMarker.exit().transition()
          .attr('opacity', 0)
          .attr('width', 0)
          .remove()
      },

      renderV4: function (selection, barchartdata, options, callbacks) {
        var tooltipText = function (d) {
          return d.key + ': Min (' + d.min + '), Avg (' + d.avg + '), Max (' + d.max + ')'
        }
        var xScale = d3.scaleLinear()
        var yScale = d3.scaleLinear()

        var data = barchartdata ? (barchartdata.data || barchartdata) : []
        data.forEach(function (d) {
          if (typeof d.max !== 'number') {
            d.max = d.value && typeof d.value.max === 'number' ? d.value.max : 0
          }
          if (typeof d.min !== 'number') {
            d.min = d.value && typeof d.value.min === 'number' ? d.value.min : d.max
          }
          if (typeof d.avg !== 'number') {
            d.avg = (typeof d.sum === 'number' && typeof d.count === 'number')
              ? d.sum / d.count
              : d.value && typeof d.value.avg === 'number'
                ? d.value.avg
                : (d.value && typeof d.value.sum === 'number' && typeof d.value.count === 'number')
                  ? d.value.sum / d.value.count
                  : (d.max + d.min) / 2
          }
        })

        var box = selection.node().getBoundingClientRect()
        var width = (box.width || 1024)
        var h = (box.height || 600)
        var margin = { left: 100, right: 75, bottom: 25 }

        var height = Math.min(h, data.length * 85)

        var cdom = data.map(function (d) { return d.key })
        cdom.sort(function (a, b) { return a > b })
        var color = d3.scaleOrdinal(d3.schemeCategory10).domain(cdom)

        // set the ranges
        xScale.range([margin.left, width - margin.left - margin.right])
        yScale.range([0, height - margin.bottom])

        // scale the data
        var min = !isNaN(parseFloat(options.min))
          ? Math.min(parseFloat(options.min), d3.min(data, function (d) { return d.min }))
          : d3.min(data, function (d) { return d.min })
        var max = !isNaN(parseFloat(options.max))
          ? Math.max(parseFloat(options.max), d3.max(data, function (d) { return d.max }))
          : d3.max(data, function (d) { return d.max })
        xScale.domain([min, max])
        yScale.domain([0, data.length])

        // setup the svg element
        var svg = selection.selectAll('svg').data([data])
        svg = svg.enter().append('svg')
            .attr('xmlns', 'http://www.w3.org/2000/svg')
            .style('font-family', 'HelvNeue,Helvetica,sans-serif')
            .style('font-size', '0.8rem')
            .style('font-weight', '300')
          .merge(svg)
        svg.attr('width', width)
          .attr('height', height)

        // the x axis
        var xAxis = d3.axisBottom(xScale)
        var xaxis = svg.selectAll('g.x').data([data])
        xaxis = xaxis.enter().append('g')
            .attr('class', 'x axis')
          .merge(xaxis)
        var xaxistransition = typeof module === 'undefined' || !module.exports ? xaxis.transition() : xaxis
        xaxistransition
          .attr('transform', 'translate(0,' + (height - margin.bottom) + ')')
          .attr('opacity', 1)
          .call(xAxis)
        xaxis.exit().remove()

        // style the axis
        svg.selectAll('.axis path')
          .style('fill', 'none')
          .style('stroke', '#152935')
        svg.selectAll('.axis line')
          .style('fill', 'none')
          .style('stroke', '#152935')

        var bars = svg.selectAll('rect.bar').data(data)

        // add new bars
        bars = bars.enter().append('rect')
            .attr('class', 'bar')
            .attr('opacity', 0)
          .merge(bars)

        if (typeof module === 'undefined' || !module.exports) {
          bars
            .on('mouseover', function (d, i) {
              SimpleDataVis.tooltip.mouseover(d, i, options, tooltipText(d))
            })
            .on('mousemove', SimpleDataVis.tooltip.mousemove)
            .on('mouseout', SimpleDataVis.tooltip.mouseout)
        }

        // update bars
        var barstransition = typeof module === 'undefined' || !module.exports ? bars.transition() : bars
        barstransition
          .attr('x', function (d, i) { return xScale(d.min) })
          .attr('y', function (d, i) { return yScale(i + 0.1) + ((yScale(i + 0.9) - yScale(i + 0.4)) / 3.5) })
          .attr('height', function (d, i) {
            return yScale(i + 0.9) - yScale(i + 0.4)
          })
          .attr('width', function (d) { return xScale(d.max) - xScale(d.min) })
          .attr('opacity', 1)
          .style('fill', function (d, i) { return color(d.key) })

        if (options.click) {
          bars
            .style('cursor', 'pointer')
            .on('click', function (d, i) {
              d3.event.stopPropagation()
              options.click(d, i)
            })
        }

        // remove old bars
        bars.exit().transition()
          .attr('opacity', 0)
          .attr('width', 0)
          .remove()

        // key labels
        var keyLabels = svg.selectAll('text.barkey').data(data)

        // add new key labels
        keyLabels = keyLabels.enter().append('text')
            .attr('class', 'barkey')
            .attr('opacity', 0)
            .attr('dx', '-0.3em')
            .attr('dy', '0.35em')
            .attr('text-anchor', 'end')
          .merge(keyLabels)

        if (typeof module === 'undefined' || !module.exports) {
          keyLabels
            .on('mouseover', function (d, i) {
              SimpleDataVis.tooltip.mouseover(d, i, options, tooltipText(d))
            })
            .on('mousemove', SimpleDataVis.tooltip.mousemove)
            .on('mouseout', SimpleDataVis.tooltip.mouseout)
        }

        // update key labels
        var keylabelstransition = typeof module === 'undefined' || !module.exports ? keyLabels.transition() : keyLabels
        keylabelstransition
          .attr('x', xScale.range()[0])
          .attr('y', function (d, i) { return yScale(i + 0.5) })
          .attr('dx', '-5px')
          .attr('opacity', 1)
          .text(function (d) {
            var l = margin.left / 10
            if (d.key.length > l) {
              return d.key.substring(0, l) + '...'
            } else {
              return d.key
            }
          })

        // remove old key labels
        keyLabels.exit().transition()
          .attr('opacity', 0)
          .attr('x', 0)
          .remove()

        // avg marker
        var avgMarker = svg.selectAll('rect.avgvalue').data(data)

        // add new avg marker
        avgMarker = avgMarker.enter().append('rect')
            .attr('class', 'avgvalue')
            .attr('opacity', 0)
          .merge(avgMarker)

        if (typeof module === 'undefined' || !module.exports) {
          avgMarker
            .on('mouseover', function (d, i) {
              SimpleDataVis.tooltip.mouseover(d, i, options, tooltipText(d))
            })
            .on('mousemove', SimpleDataVis.tooltip.mousemove)
            .on('mouseout', SimpleDataVis.tooltip.mouseout)
        }

        // update avg marker
        var avgmarkertransition = typeof module === 'undefined' || !module.exports ? avgMarker.transition() : avgMarker
        avgmarkertransition
          .attr('x', function (d) { return xScale(d.avg) })
          .attr('y', function (d, i) { return yScale(i + 0.1) })
          .attr('height', function (d, i) {
            return yScale(i + 0.9) - yScale(i + 0.1)
          })
          .attr('width', '4px')
          .attr('dx', '-2px')
          .attr('opacity', 1)

        if (options.click) {
          avgMarker
            .style('cursor', 'pointer')
            .on('click', function (d, i) {
              d3.event.stopPropagation()
              options.click(d, i)
            })
        }

        // remove old avg marker
        avgMarker.exit().transition()
          .attr('opacity', 0)
          .attr('width', 0)
          .remove()
      }
    })
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RangeBarChartVis
  } else {
    RangeBarChartVis(SimpleDataVis)
  }
}())
