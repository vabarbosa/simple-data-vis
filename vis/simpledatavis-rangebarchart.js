/* global d3, SimpleDataVis */

/**
 *  - Range Chart visualization for the SimpleDataVis JavaScript module
 */
(function (datavis) {
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
      var width = (box.width || 600)
      var height = (box.height || 600)
      var margin = { left: 100, right: 75, bottom: 25 }

      var color = d3.scale.category10()

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

      // the x axis
      var xAxis = d3.svg.axis().scale(xScale).orient('bottom')
      var xaxis = svg.selectAll('g.x').data([data])
      xaxis.enter().append('g')
        .attr('class', 'x axis')
      xaxis.transition()
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
        .on('mouseover', function (d, i) {
          SimpleDataVis.tooltip.mouseover(d, i, options,
            d.key + ': Min (' + d.min + '), Max (' + d.max + '), Avg (' + d.avg + ')')
        })
        .on('mousemove', SimpleDataVis.tooltip.mousemove)
        .on('mouseout', SimpleDataVis.tooltip.mouseout)

      // update bars
      bars.transition()
        .attr('x', function (d, i) { return xScale(d.min) })
        .attr('y', function (d, i) { return yScale(i + 0.1) + ((yScale(i + 0.9) - yScale(i + 0.4)) / 3.5) })
        .attr('height', function (d, i) {
          return yScale(i + 0.9) - yScale(i + 0.4)
        })
        .attr('width', function (d) { return xScale(d.max) - xScale(d.min) })
        .attr('opacity', 1)
        .style('fill', function (d, i) { return color(i) })

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
        .on('mouseover', function (d, i) {
          SimpleDataVis.tooltip.mouseover(d, i, options,
            d.key + ': Min (' + d.min + '), Max (' + d.max + '), Avg (' + d.avg + ')')
        })
        .on('mousemove', SimpleDataVis.tooltip.mousemove)
        .on('mouseout', SimpleDataVis.tooltip.mouseout)

      // update key labels
      keyLabels.transition()
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
        .on('mouseover', function (d, i) {
          SimpleDataVis.tooltip.mouseover(d, i, options,
            d.key + ': Min (' + d.min + '), Max (' + d.max + '), Avg (' + d.avg + ')')
        })
        .on('mousemove', SimpleDataVis.tooltip.mousemove)
        .on('mouseout', SimpleDataVis.tooltip.mouseout)

      // update avg marker
      avgMarker.transition()
        .attr('x', function (d) { return xScale(d.avg) })
        .attr('y', function (d, i) { return yScale(i + 0.1) })
        .attr('height', function (d, i) {
          return yScale(i + 0.9) - yScale(i + 0.1)
        })
        .attr('width', '4px')
        .attr('dx', '-2px')
        .attr('opacity', 1)

      // remove old avg marker
      avgMarker.exit().transition()
        .attr('opacity', 0)
        .attr('width', 0)
        .remove()
    }
  })
}(SimpleDataVis))
