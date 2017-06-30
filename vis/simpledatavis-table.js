/* global d3, SimpleDataVis */

/**
 *  - Table visualization for the SimpleDataVis JavaScript module
 */
(function (datavis) {
  datavis.register({
    type: 'table-vis',

    render: function (selection, barchartdata, options, callbacks) {
      if (d3.version.split('.')[0] === '3') {
        this.renderV3(selection, barchartdata, options, callbacks)
      } else {
        this.renderV4(selection, barchartdata, options, callbacks)
      }
    },

    renderV3: function (selection, tabledata, options, callbacks) {
      var format = d3.format(',d')

      var data = tabledata ? (tabledata.data || tabledata) : []
      var opts = options || {}
      var cols = tabledata.fields || []

      if (cols.length === 0) {
        data.forEach(function (d) {
          for (var v in d) {
            if (cols.indexOf(v) === -1) cols.push(v)
          }
        })
      }

      var box = selection.node().getBoundingClientRect()
      // var width = Math.max(800, box.width)
      // var height = Math.max(500, box.height)
      var margin = {top: 25, right: 25, bottom: 25, left: 25}
      var width = (box.width || 800) - margin.left - margin.right
      var height = (box.height || 500) - margin.top - margin.bottom

      // setup the container element
      var div = selection.selectAll('div.table-vis').data([data])
      div.enter().append('div')
      div.attr('width', width)

      // table
      var tablecontainer = div.selectAll('.table-vis-table').data([data])
      tablecontainer.enter().append('div')
        .attr('class', 'table-vis-table')
        // .style('max-height', '600px')
        .style('max-height', height + 'px')
        .style('overflow', 'scroll')
      var table = tablecontainer.selectAll('table').data([data])
      table.enter().append('table')
      table.attr('width', width)
        // .attr('height', height)
        .attr('class', 'table table_basic')

      // thead
      var thead = table.selectAll('thead').data([cols])
      thead.enter()
        .append('thead')
        .style('border', '0 none')

      var theadr = thead.selectAll('tr').data([cols])
      theadr.enter()
        .append('tr')

      var th = theadr.selectAll('th').data(cols, function (d, i) { return d + '-' + i })
      th.enter().append('th')
        .style('padding', '0')
        .append('div')
        .style('max-height', '1px')
        .style('visibility', 'hidden')
        .text(function (d) { return d })
      th.exit().remove()

      // tbody
      var tbody = table.selectAll('tbody').data([data])
      tbody.enter()
        .append('tbody')

      var rows = tbody.selectAll('tr').data(data)
      rows.enter()
        .append('tr')
      rows.exit().remove()

      var cells = rows.selectAll('td')
        .data(function (d) {
          return cols.map(function (c) {
            return {column: c, value: d[c]}
          })
        })

      if (opts.htmlcells) {
        cells.enter().append('td')
        cells.html(function (d) {
          if (typeof d.value === 'number') return format(d.value) || d.value
          else return d.value
        })
      } else {
        cells.enter().append('td')
        cells.text(function (d) {
          if (typeof d.value === 'number') return format(d.value) || d.value
          else return d.value
        })
      }

      cells.exit().remove()

      // keep header fixed when table scrolls
      var fixedheader = div.selectAll('.table-vis-fixed').data([cols])
      fixedheader.enter()
        .insert('div', ':first-child')
        .attr('class', 'table-vis-fixed')
        .style('overflow', 'hidden')
        .style('position', 'relative')
        .style('color', '#008571')
      fixedheader.exit().remove()

      fixedheader = fixedheader.selectAll('.table-vis-fixed-thead').data([cols])
      fixedheader.enter()
        .append('div')
        .attr('class', 'table-vis-fixed-thead')
        .style('display', 'table')
        .style('border-bottom', '2px solid')
        .style('padding-left', '10px')
        .style('position', 'relative')
      fixedheader.style('width', table.node().getBoundingClientRect().width + 'px')
      fixedheader.exit().remove()

      var fixedrow = fixedheader.selectAll('.table-vis-fixed-tr').data([cols])
      fixedrow.enter().append('div')
        .attr('class', 'table-vis-fixed-tr')
        .style('display', 'table-row')
        .style('margin', '0')
        .style('padding', '0')
      fixedrow.exit().remove()

      var fixedcell = fixedrow.selectAll('.table-vis-fixed-th').data(cols, function (d, i) { return d + '-' + i })
      fixedcell.enter()
        .append('div')
        .attr('class', 'table-vis-fixed-th')
        .style('display', 'table-cell')
        .style('margin', '0')
        .style('text-align', 'left')
        .style('word-wrap', 'break-word')
      fixedcell
        .text(function (d) { return d })
        .transition()
        .style('width', function (d, i) {
          return thead.select('th:nth-child(' + (i + 1) + ')').node().getBoundingClientRect().width + 'px'
        })
      fixedcell.exit().remove()

      tablecontainer.on('scroll', function () {
        fixedheader.style('left', (-tablecontainer.node().scrollLeft || '0') + 'px')
      })
    },

    renderV4: function (selection, tabledata, options, callbacks) {
      var format = d3.format(',d')

      var data = tabledata ? (tabledata.data || tabledata) : []
      var opts = options || {}
      var cols = tabledata.fields || []

      if (cols.length === 0) {
        data.forEach(function (d) {
          for (var v in d) {
            if (cols.indexOf(v) === -1) cols.push(v)
          }
        })
      }

      var box = selection.node().getBoundingClientRect()
      var margin = {top: 25, right: 25, bottom: 25, left: 25}
      var width = (box.width || 800) - margin.left - margin.right
      var height = (box.height || 500) - margin.top - margin.bottom

      // setup the container element
      var div = selection.selectAll('div.table-vis').data([data])
      div = div.enter().append('div').merge(div)
      div.attr('width', width)

      // table
      var tablecontainer = div.selectAll('.table-vis-table').data([data])
      tablecontainer = tablecontainer.enter().append('div')
        .attr('class', 'table-vis-table')
        .style('max-height', height + 'px')
        .style('overflow', 'scroll')
        .merge(tablecontainer)
      var table = tablecontainer.selectAll('table').data([data])
      table = table.enter().append('table').merge(table)
      table.attr('width', width)
        .attr('class', 'table table_basic')

      // thead
      var thead = table.selectAll('thead').data([cols])
      thead = thead.enter()
        .append('thead')
        .style('border', '0 none')
        .merge(thead)

      var theadr = thead.selectAll('tr').data([cols])
      theadr = theadr.enter().append('tr').merge(theadr)

      var th = theadr.selectAll('th').data(cols, function (d, i) { return d + '-' + i })
      th.exit().remove()
      th.enter().append('th')
          .style('padding', '0')
        .merge(th)
          .append('div')
          .style('max-height', '1px')
          .style('visibility', 'hidden')
          .text(function (d) { return d })

      // tbody
      var tbody = table.selectAll('tbody').data([data])
      tbody = tbody.enter().append('tbody').merge(tbody)

      var rows = tbody.selectAll('tr').data(data)
      rows.exit().remove()
      rows = rows.enter().append('tr').merge(rows)

      var cells = rows.selectAll('td')
        .data(function (d) {
          return cols.map(function (c) {
            return {column: c, value: d[c]}
          })
        })

      cells.exit().remove()
      cells = cells.enter().append('td').merge(cells)

      if (opts.htmlcells) {
        cells.html(function (d) {
          if (typeof d.value === 'number') return format(d.value) || d.value
          else return d.value
        })
      } else {
        cells.text(function (d) {
          if (typeof d.value === 'number') return format(d.value) || d.value
          else return d.value
        })
      }

      // keep header fixed when table scrolls
      var fixedtable = div.selectAll('.table-vis-fixed').data([cols])
      fixedtable.exit().remove()
      fixedtable = fixedtable.enter()
          .insert('div', ':first-child')
          .attr('class', 'table-vis-fixed')
          .style('overflow', 'hidden')
          .style('position', 'relative')
          .style('color', '#008571')
        .merge(fixedtable)

      var fixedheader = fixedtable.selectAll('.table-vis-fixed-thead').data([cols])
      fixedheader.exit().remove()
      fixedheader = fixedheader.enter()
          .append('div')
          .attr('class', 'table-vis-fixed-thead')
          .style('display', 'table')
          .style('border-bottom', '2px solid')
          .style('padding-left', '10px')
          .style('position', 'relative')
        .merge(fixedheader)
      fixedheader.style('width', table.node().getBoundingClientRect().width + 'px')

      var fixedrow = fixedheader.selectAll('.table-vis-fixed-tr').data([cols])
      fixedrow.exit().remove()
      fixedrow = fixedrow.enter().append('div')
          .attr('class', 'table-vis-fixed-tr')
          .style('display', 'table-row')
          .style('margin', '0')
          .style('padding', '0')
        .merge(fixedrow)

      var fixedcell = fixedrow.selectAll('.table-vis-fixed-th').data(cols, function (d, i) { return d + '-' + i })
      fixedcell.exit().remove()
      fixedcell = fixedcell.enter().append('div')
          .attr('class', 'table-vis-fixed-th')
          .style('display', 'table-cell')
          .style('margin', '0')
          .style('text-align', 'left')
          .style('word-wrap', 'break-word')
        .merge(fixedcell)
      fixedcell
        .text(function (d) { return d })
        .transition()
        .style('width', function (d, i) {
          return thead.select('th:nth-child(' + (i + 1) + ')').node().getBoundingClientRect().width + 'px'
        })

      tablecontainer.on('scroll', function () {
        fixedheader.style('left', (-tablecontainer.node().scrollLeft || '0') + 'px')
      })
    }
  })
}(SimpleDataVis))
