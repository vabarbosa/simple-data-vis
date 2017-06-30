/* global d3, SimpleDataVis */

/**
 *  - Map visualization for the SimpleDataVis JavaScript module
 */
(function (datavis) {
  var isArray = function (o) {
    return Object.prototype.toString.call(o) === '[object Array]'
  }

  datavis.register({
    type: 'map-vis',

    canRender: function (geodata) {
      var data = geodata ? (geodata.data || geodata) : []
      // an array of objects with key/value/geo (or more accurately the first object has key/value/geo)
      return isArray(data) &&
      data.length &&
      data[0].hasOwnProperty('key') &&
      data[0].hasOwnProperty('value') &&
      data[0].hasOwnProperty('geo') &&
      !isNaN(parseInt(data[0].value, 10))
    },

    render: function (selection, barchartdata, options, callbacks) {
      if (d3.version.split('.')[0] === '3') {
        this.renderV3(selection, barchartdata, options, callbacks)
      } else {
        this.renderV4(selection, barchartdata, options, callbacks)
      }
    },

    renderV3: function (selection, geodata, options, callbacks) {
      var data = geodata ? (geodata.data || geodata) : []

      if (!geodata.features) {
        // message(this, 'Missing map feaures')
        if (typeof callbacks.onFail === 'function') {
          callbacks.onFail('Missing map feaures')
        }
      } else {
        var box = selection.node().getBoundingClientRect()
        var width = Math.max(800, box.width)
        var height = (width / 2)

        var color = d3.scale.category10()
        var radius = d3.scale.ordinal().range([5, 15])
        var explode = d3.scale.ordinal().range([15, 30])
        var projection = d3.geo.equirectangular()
        var geopath = d3.geo.path()

        var geoGroup = data[0].geo && isArray(data[0].geo) && isArray(data[0].geo[0])
        var geoStr = (typeof data[0].geo === 'string') && data[0].geo.split(',').length === 2
        var geoKeyStr = (typeof data[0].key === 'string') && data[0].key.split(',').length === 2
        var geoKey = isNaN(data[0].key) && data[0].key.length === 2 && !isNaN(data[0].key[0]) && !isNaN(data[0].key[1])

        var countFunc = geoGroup
          ? function (d) { return d.geo.length }
          : function (d) { return d.value }

        var coordinate = function (d) {
          if (geoGroup) {
            if (geoKey) return d.key
            else if (geoKeyStr) return d.key.split(',')
            else return d.geo[0]
          } else {
            if (geoStr) return d.geo.split(',')
            else if (d.geo) return d.geo
            else if (geoKey) return d.key
            else if (geoKeyStr) return d.key.split(',')
          }
        }

        // scale the data
        radius.domain([
          d3.min(data, function (d) { return d.value }),
          d3.max(data, function (d) { return d.value })
        ])

        color.domain([
          d3.min(data, countFunc),
          d3.max(data, countFunc)
        ])

        explode.domain([
          d3.min(data, countFunc),
          d3.max(data, countFunc)
        ])

        // setup the svg element
        var svg = selection.selectAll('svg').data([data])
        svg.enter().append('svg')
        svg.attr('width', width)
          .attr('height', height)

        // setup the map projections
        var proj = geodata.projection
          ? geodata.projection
          : projection
            .scale(height / Math.PI)
            .translate([width / 2, height / 2])
            .precision(0.1)

        geopath.projection(proj)

        // paint the land
        if (geodata.features.length && geodata.features[0].type) {
          svg.selectAll('path')
            .data(geodata.features)
            .enter()
            .append('path')
            .attr('class', 'land')
            .attr('d', geopath)
            .style('fill', '#d3d9dd')
        } else {
          svg.append('path')
            .datum(geodata.features)
            .attr('class', 'land')
            .attr('d', geopath)
            .style('fill', '#d3d9dd')
        }

        // geo points
        var points = svg.selectAll('.pin').data(data)

        // add new points
        points.enter()
          .append('circle', '.pin')
          .attr('r', 0)
          .attr('opacity', 0)
          .style('fill', function (d, i) { return color(geoGroup ? d.geo.length : i) })
          .on('mouseover', function (d, i) {
            d3.select(this).transition()
              .attr('r', function (d) {
                return explode(geoGroup ? d.geo.length : 1)
              })
              .attr('opacity', 0.5)

            SimpleDataVis.tooltip.mouseover(d, i, options,
                      (d.value + ' points near [' + coordinate(d) + ']'))
          })
          .on('mousemove', SimpleDataVis.tooltip.mousemove)
          .on('mouseout', function (d, i) {
            d3.select(this).transition()
              .attr('r', function (d) { return radius(d.value) })
              .attr('opacity', 0.75)
            SimpleDataVis.tooltip.mouseout(d, i)
          })

        // update points
        points.transition()
          .attr('transform', function (d) {
            var coor = coordinate(d)
            return 'translate(' + proj(coor) + ')'
          })
          .attr('r', function (d) { return radius(d.value) })
          .attr('opacity', 0.75)
          .each('end', function (d, i) {
            if (options.click) {
              d3.select(this)
                .style('cursor', 'pointer')
                .on('click', function (d, i) {
                  d3.event.stopPropagation()
                  options.click(d, i)
                })
            }
          })

        // remove old points
        points.exit().transition()
          .attr('r', 0)
          .attr('opacity', 0)
          .remove()
      }
    },

    renderV4: function (selection, geodata, options, callbacks) {
      var data = geodata ? (geodata.data || geodata) : []

      if (!geodata.features) {
        // message(this, 'Missing map feaures')
        if (typeof callbacks.onFail === 'function') {
          callbacks.onFail('Missing map feaures')
        }
      } else {
        var box = selection.node().getBoundingClientRect()
        var width = Math.max(800, box.width)
        var height = (width / 2)

        var color = d3.scaleOrdinal(d3.schemeCategory10)
        var radius = d3.scaleOrdinal().range([5, 15])
        var explode = d3.scaleOrdinal().range([15, 30])
        var projection = d3.geoEquirectangular()
        var geopath = d3.geoPath()

        var geoGroup = data[0].geo && isArray(data[0].geo) && isArray(data[0].geo[0])
        var geoStr = (typeof data[0].geo === 'string') && data[0].geo.split(',').length === 2
        var geoKeyStr = (typeof data[0].key === 'string') && data[0].key.split(',').length === 2
        var geoKey = isNaN(data[0].key) && data[0].key.length === 2 && !isNaN(data[0].key[0]) && !isNaN(data[0].key[1])

        var countFunc = geoGroup
          ? function (d) { return d.geo.length }
          : function (d) { return d.value }

        var coordinate = function (d) {
          if (geoGroup) {
            if (geoKey) return d.key
            else if (geoKeyStr) return d.key.split(',')
            else return d.geo[0]
          } else {
            if (geoStr) return d.geo.split(',')
            else if (d.geo) return d.geo
            else if (geoKey) return d.key
            else if (geoKeyStr) return d.key.split(',')
          }
        }

        // scale the data
        radius.domain([
          d3.min(data, function (d) { return d.value }),
          d3.max(data, function (d) { return d.value })
        ])

        color.domain([
          d3.min(data, countFunc),
          d3.max(data, countFunc)
        ])

        explode.domain([
          d3.min(data, countFunc),
          d3.max(data, countFunc)
        ])

        // setup the svg element
        var svg = selection.selectAll('svg').data([data])
        svg = svg.enter().append('svg')
          .merge(svg)
            .attr('width', width)
            .attr('height', height)

        // setup the map projections
        var proj = geodata.projection
          ? geodata.projection
          : projection
            .scale(height / Math.PI)
            .translate([width / 2, height / 2])
            .precision(0.1)

        geopath.projection(proj)

        // paint the land
        if (geodata.features.length && geodata.features[0].type) {
          svg.selectAll('path')
            .data(geodata.features)
            .enter()
            .append('path')
            .attr('class', 'land')
            .attr('d', geopath)
            .style('fill', '#d3d9dd')
        } else {
          svg.append('path')
            .datum(geodata.features)
            .attr('class', 'land')
            .attr('d', geopath)
            .style('fill', '#d3d9dd')
        }

        // geo points
        var points = svg.selectAll('.pin').data(data)

        // add new points
        points = points.enter()
          .append('circle', '.pin')
            .attr('r', 0)
            .attr('opacity', 0)
          .merge(points)
            .style('fill', function (d, i) { return color(geoGroup ? d.geo.length : i) })
            .on('mouseover', function (d, i) {
              d3.select(this).transition()
                .attr('r', function (d) {
                  return explode(geoGroup ? d.geo.length : 1)
                })
                .attr('opacity', 0.5)

              SimpleDataVis.tooltip.mouseover(d, i, options,
                        (d.value + ' points near [' + coordinate(d) + ']'))
            })
            .on('mousemove', SimpleDataVis.tooltip.mousemove)
            .on('mouseout', function (d, i) {
              d3.select(this).transition()
                .attr('r', function (d) { return radius(d.value) })
                .attr('opacity', 0.75)
              SimpleDataVis.tooltip.mouseout(d, i)
            })

        // update points
        points.transition()
          .attr('transform', function (d) {
            var coor = coordinate(d)
            return 'translate(' + proj(coor) + ')'
          })
          .attr('r', function (d) { return radius(d.value) })
          .attr('opacity', 0.75)
          .on('end', function (d, i) {
            if (options.click) {
              d3.select(this)
                .style('cursor', 'pointer')
                .on('click', function (d, i) {
                  d3.event.stopPropagation()
                  options.click(d, i)
                })
            }
          })

        // remove old points
        points.exit().transition()
          .attr('r', 0)
          .attr('opacity', 0)
          .remove()
      }
    }
  })
}(SimpleDataVis))
