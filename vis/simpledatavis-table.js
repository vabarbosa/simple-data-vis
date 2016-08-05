/**
 *  - Table visualization for the SimpleDataVis JavaScript module
 */
(function(datavis) {

  datavis.register({
    type: 'table-vis',

    render: function(selection, tabledata, options, callbacks) {
      var format = d3.format(',d');

      var data = tabledata ? (tabledata.data || tabledata) : [];
      var opts = options || {};
      var cols = tabledata.fields || [];

      if (cols.length === 0) {
        data.forEach(function(d) {
          for (var v in d) {
            if (cols.indexOf(v) === -1) cols.push(v);
          }
        });
      }

      var box = selection.node().getBoundingClientRect();
      var width = Math.max(800, box.width);
      var height = Math.max(500, box.height);
      var margin = {top: 25, right: 25, bottom: 25, left: 25};

      var color = d3.scale.category10();
      var line = d3.svg.line();

      // setup the container element
      var div = selection.selectAll('div.table-vis').data([data]);
      div.enter().append('div');
      div.attr('width', width)
        .style('max-height', '600px')
        .style('overflow', 'scroll');

      // table
      var table = div.selectAll('table').data([data]);
      table.enter().append('table');
      table.attr('width', width)
        .attr('height', height)
        .attr('class', 'table table_basic');

      // thead
      var thead = table.selectAll('thead').data([cols]);
      thead.enter()
        .append('thead');

      var theadr = thead.selectAll('tr').data([cols]);
      theadr.enter()
        .append('tr');

      var th = theadr.selectAll('th').data(cols);
      th.enter()
        .append('th');
      th.text(function(d) { return d; });
      th.exit().remove();

      // tbody
      var tbody = table.selectAll('tbody').data([data]);
      tbody.enter()
        .append('tbody');

      var rows = tbody.selectAll('tr').data(data);
      rows.enter()
        .append('tr');
      rows.exit().remove();

      var cells = rows.selectAll('td')
        .data(function(d) {
          return cols.map(function(c) {
            return {column: c, value: d[c]};
          });
        });

      if (opts.htmlcells) {
        cells.enter().append('td');
        cells.html(function(d) {
          if (typeof d.value === 'number') return format(d.value) || d.value;
          else return d.value;
        });
      }
      else {
        cells.enter().append('td');
        cells.text(function(d) {
          if (typeof d.value === 'number') return format(d.value) || d.value;
          else return d.value;
        });
      }
      
      cells.exit().remove();
    }
  })
}(SimpleDataVis));