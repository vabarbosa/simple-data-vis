/**
 * SimpleDataVis
 *
 *  - JavaScript module for simple data visualizations
 *
 */
(function () {
  var d3
  var jsdom

  if (typeof module !== 'undefined' && module.exports) {
    global.XMLHttpRequest = require('xhr2') // d3.json won't work otherwise
    d3 = require('d3')
    jsdom = require('jsdom').jsdom
  } else {
    d3 = window.d3
  }

  function isArray (o) {
    return Object.prototype.toString.call(o) === '[object Array]'
  }

  var SimpleDataVis = function (dataSource) {
    function shallowCopy (orig) {
      var copy = {}
      for (var key in orig) {
        copy[key] = orig[key]
      }
      return copy
    }

    function getErrorMsg (e) {
      var msg
      if (typeof e === 'string') {
        msg = e
      } else if (e.message) {
        msg = e.message
      } else if (e.response) {
        msg = e.response
      } else if ('status' in e) {
        msg = (e.status ? e.status + ': ' : '') + (e.statusText || 'connection failed')
      } else {
        msg = JSON.stringify(e)
      }
      return msg
    }

    var getData = function (datasource, viewname, options, callbacks) {
      if (isArray(datasource)) {
        callbacks.done(datasource)
      } else if (typeof datasource === 'function') {
        var data = datasource()
        callbacks.done(data)
      } else if (typeof datasource === 'string') {
        var url = datasource || window.location.origin

        if (url.lastIndexOf('/') !== url.length - 1 && url.indexOf('?') === -1) {
          url += '/'
        }

        var opts = options || {}
        var params = opts.param || {}

        if (opts.hasOwnProperty('group')) {
          delete params['group_level']
          if (opts.group.toString().toLowerCase() === 'true') {
            params.group = true
          } else if (opts.group.toString().toLowerCase() === 'false') {
            params.group = false
          } else if (!isNaN(opts.group)) {
            params['group_level'] = opts.group
            delete params.group
          } else {
            params.group = opts.group
          }
        }

        if (opts.hasOwnProperty('startkey')) {
          if (isArray(opts.startkey)) {
            var s = opts.startkey.map(function (item) {
              if (typeof item === 'string') return '"' + item + '"'
              else if (typeof item === 'object') return '{}'
              else return item
            })

            params.startkey = encodeURIComponent('[' + s.join() + ']')
          } else {
            params.startkey = opts.startkey
          }
        }

        if (opts.hasOwnProperty('endkey')) {
          if (isArray(opts.endkey)) {
            var e = opts.endkey.map(function (item) {
              if (typeof item === 'string') return '"' + item + '"'
              else if (typeof item === 'object') return '{}'
              else return item
            })

            params.endkey = encodeURIComponent('[' + e.join() + ']')
          } else {
            params.endkey = opts.endkey
          }
        }

        var u = url + (viewname || '')
        u += u.indexOf('?') === -1 ? '?' : '&'
        for (var p in params) {
          if (params[p]) {
            u += (p + '=' + params[p] + '&')
          }
        }
        if (u.lastIndexOf('?') === u.length - 1 || u.lastIndexOf('&') === u.length - 1) {
          u = u.substring(0, u.length - 1)
        }

        if (callbacks && typeof callbacks.onStart === 'function') {
          callbacks.onStart(u)
        }

        d3.json(u, function (error, json) {
          if (error) {
            console.error(error)
            if (callbacks && typeof callbacks.onFail === 'function') {
              callbacks.onFail(getErrorMsg(error))
            }
          } else if (callbacks && typeof callbacks.done === 'function') {
            callbacks.done(json)
          }
        })
      } else {
        console.warn('SimpleDataVis - unexpected datasource provided:', datasource)
        // perhaps it will be provided/corrected from the on-data callback
        callbacks.done(datasource)
      }
    }

    var visualizeData = function (type, options, callbacks) {
      var clear = function (selection, exclude, callback) {
        var n = 0
        var s = selection.select('.simpledatavis')
        var e = s.selectAll('*')
        var start = function () { n++ }
        var end = function () {
          this.remove()
          if (--n === 0 && callback) {
            s.remove()
            callback()
          }
        }

        if (!s.empty() && (!exclude || !s.classed(exclude)) && (!e.empty())) {
          var t = e.data([]).exit().transition()
            .attr('opacity', 0)
            .attr('width', 0)

          if (d3.version.split('.')[0] === '3') {
            t.each('start', start)
              .each('end', end)
          } else {
            t.on('start', start)
              .on('end', end)
          }
        } else if (callback) {
          callback()
        }
      }

      var message = function (selection, message) {
        clear(d3.select(selection), 'message', function () {
          var box = d3.select(selection).node().getBoundingClientRect()
          var s = d3.select(selection).selectAll('svg').data([message])
          s.enter().append('svg')
          s.attr('width', box.width)
            .attr('height', 200)
            .attr('class', 'simpledatavis message')
          var msg = s.selectAll('text.message').data([message])
          msg.enter().append('text')
            .attr('class', 'message')
            .attr('opacity', 0)
            .attr('x', 50)
            .attr('y', 40)
          msg.transition()
            .attr('opacity', 1)
            .text(message)
          msg.exit().transition().attr('opacity', 0).remove()
        })
      }

      var getVisualization = function (visdata) {
        var vis = []

        if (typeof type === 'string') {
          vis = SimpleDataVis._visregistry.filter(function (v, index) {
            return v.type === type
          })
        }

        if (vis.length === 0) {
          console.warn((type ? 'invalid vis type specified:' : 'no vis type specified:'), type)
          vis = SimpleDataVis._visregistry.filter(function (v, index) {
            if (typeof v.canRender === 'function') {
              return v.canRender(visdata)
            }
          })
        }

        if (vis.length === 0) {
          // default to table, if no valid visualizations found
          console.warn('no valid vis found, using table-vis:', SimpleDataVis._visregistry.map(function (v, i) { return v.type }).join(','))
          var tablevis = null
          for (var v in SimpleDataVis._visregistry) {
            if (SimpleDataVis._visregistry[v].type === 'table-vis') {
              tablevis = SimpleDataVis._visregistry[v]
              break
            }
          }
          return tablevis
        } else if (vis.length === 1) {
          return vis[0]
        } else {
          // if more than one applicable visualization, get a random visualization
          return vis[Math.floor((Math.random() * vis.length))]
        }
      }

      var renderer = function (selection) {
        selection.each(function (visdata) {
          var that = this
          var data = visdata ? (visdata.data || visdata) : []
          if (data.length === 0) {
            message(this, 'No results available')
            if (typeof callbacks.onEnd === 'function') {
              callbacks.onEnd(data)
            }
          } else {
            var vis = getVisualization(visdata)
            clear(d3.select(that), vis.type, function () {
              vis.render(d3.select(that), visdata, options, callbacks)
              // vis.render.call(that, visdata, options, callbacks)
              var it = d3.select(that).select('*')
                .classed('simpledatavis', true)
                .classed(vis.type, true)

              if (typeof callbacks.onEnd === 'function') {
                callbacks.onEnd(data, it)
              }
            })
          }
        })
      }

      return renderer
    }

    var simpledatavis = function (datasource) {
      var options = {}
      var callbacks = {}
      var scope = {}

      var datavis = function (selection) {
        var visOptions = shallowCopy(options)
        var visCallback = shallowCopy(callbacks)
        var visScope = shallowCopy(scope)

        var onStart = function () {
          if (typeof visCallback.start === 'function') {
            visCallback.start.apply(selection, arguments)
          } else if (typeof visCallback.start === 'string') {
            if (visScope[visCallback.start]) {
              visScope[visCallback.start].apply(selection, arguments)
            } else if (window[visCallback.start]) {
              window[visCallback.start].apply(selection, arguments)
            }
          }
        }

        var onFail = function () {
          if (typeof visCallback.fail === 'function') {
            visCallback.fail.apply(selection, arguments)
          } else if (typeof visCallback.fail === 'string') {
            if (visScope[visCallback.fail]) {
              visScope[visCallback.fail].apply(selection, arguments)
            } else if (window[visCallback.fail]) {
              window[visCallback.fail].apply(selection, arguments)
            }
          }
        }

        var onData = function (data) {
          var updated
          if (typeof visCallback.data === 'function') {
            updated = visCallback.data.apply(selection, arguments)
          } else if (typeof visCallback.data === 'string') {
            if (visScope[visCallback.data]) {
              updated = visScope[visCallback.data].apply(selection, arguments)
            } else if (window[visCallback.data]) {
              updated = window[visCallback.data].apply(selection, arguments)
            }
          }
          updated = (typeof updated === 'undefined') ? data : updated
          return updated
        }

        var onEnd = function () {
          if (typeof visCallback.end === 'function') {
            visCallback.end.apply(selection, arguments)
          } else if (typeof visCallback.end === 'string') {
            if (visScope[visCallback.end]) {
              visScope[visCallback.end].apply(selection, arguments)
            } else if (window[visCallback.end]) {
              window[visCallback.end].apply(selection, arguments)
            }
          }
        }

        var onClick = function () {
          if (typeof visCallback.click === 'function') {
            visCallback.click.apply(selection, arguments)
          } else if (typeof visCallback.click === 'string') {
            if (visScope[visCallback.click]) {
              visScope[visCallback.click].apply(selection, arguments)
            } else if (window[visCallback.click]) {
              window[visCallback.click].apply(selection, arguments)
            }
          }
        }

        var done = function (data) {
          var d = onData(data)
          if (selection) {
            d = (d && d.rows) ? d.rows : (d || [])

            // in case options were changed during onData
            var visOpts = shallowCopy(options)

            if (typeof visOpts.tooltip === 'string') {
              if (visScope[visOpts.tooltip]) {
                visOpts.tooltip = visScope[visOpts.tooltip]
              } else if (window[visOpts.tooltip]) {
                visOpts.tooltip = window[visOpts.tooltip]
              }
            }

            if (visCallback.click) {
              visOpts.click = onClick
            }

            var renderer = visualizeData(visOpts.type, visOpts, { onFail: onFail, onEnd: onEnd })

            selection
              .style('color', '#264a60')
              .style('fill', '#264a60')
              .style('font-family', 'HelvNeue,Helvetica,sans-serif')
              .style('font-size', '0.8rem')
              .style('font-weight', '300')
              .datum(d)
              .call(renderer)
          } else {
            onEnd()
          }
        }

        var cb = { onStart: onStart, onFail: onFail, done: done }

        getData(datasource, visOptions.view, visOptions, cb)
      }

      datavis.attr = function (option, keyOrValue, value) {
        if (typeof keyOrValue === 'undefined') {
          return options[option]
        } else if (keyOrValue == null) {
          if (options.hasOwnProperty(option)) {
            delete options[option]
          }
        } else if (option === 'param') {
          if (keyOrValue == null) {
            options['param'] = {}
          } else if (typeof value === 'undefined') {
            return options['param'][keyOrValue]
          } else {
            var param = (options['param'] || {})
            if (keyOrValue === 'group_level' && options.hasOwnProperty('group')) {
              delete options.group
            }
            param[keyOrValue] = value
            options['param'] = param
          }
        } else {
          if (option === 'group' && options.param && options.hasOwnProperty('group_level')) {
            delete options.param['group_level']
          }
          options[option] = keyOrValue
        }
        return datavis
      }

      // callbacks include 'start', 'data', 'end', 'fail', click
      datavis.on = function (callback, value) {
        if (typeof value === 'undefined') {
          return callbacks[callback]
        } else if (value == null) {
          if (callbacks.hasOwnProperty(callback)) {
            delete callbacks[callback]
          }
        } else {
          callbacks[callback] = value
        }
        return datavis
      }

      datavis.render = function (theselector, context) {
        var selector = theselector

        if (typeof module !== 'undefined' && module.exports) {
          selector = d3.select(jsdom().documentElement).select('body')
        }

        if (context === null) {
          scope = {}
        } else if (typeof context === 'string') {
          scope = window[context]
        } else if (typeof context !== 'undefined') {
          scope = context
        }

        if (typeof selector === 'string') {
          d3.select(selector).call(datavis)
        } else if (!selector) {
          datavis()
        } else if (typeof selector.call === 'function') {
          selector.call(datavis)
        } else {
          var msg = 'datavis.render invalid selector: ' + selector
          console.error(msg)
          if (typeof callbacks.fail === 'function') {
            callbacks.fail(msg)
          } else if (typeof callbacks.fail === 'string') {
            if (scope[callbacks.fail]) {
              scope[callbacks.fail](msg)
            } else if (window[callbacks.fail]) {
              window[callbacks.fail](msg)
            }
          }
        }

        return datavis
      }

      return datavis
    }

    return simpledatavis(dataSource)
  }

  SimpleDataVis._visregistry = []

  SimpleDataVis.register = function (typeStrOrNewVisObj, renderFunc) {
    if (typeof typeStrOrNewVisObj === 'object' && typeof typeStrOrNewVisObj.type === 'string' && typeof typeStrOrNewVisObj.render === 'function') {
      SimpleDataVis._visregistry.push(typeStrOrNewVisObj)
    } else if (typeof typeStrOrNewVisObj === 'string' && typeof renderFunc === 'function') {
      SimpleDataVis._visregistry.push({
        type: typeStrOrNewVisObj,
        render: renderFunc
      })
    }
  }

  SimpleDataVis.init = function (selection, context) {
    var s = selection || d3.selectAll('[data-vis]')
    s.each(function () {
      var v = d3.select(this).attr('data-vis')
      var dataurl = v // v.indexOf('http') == 0 ? v : (url + (v.indexOf('/') == 0 ? v.substring(1) : v))

      if (dataurl) {
        var vis = new SimpleDataVis(dataurl)
        var attributes = this.attributes
        var onPre = 'data-vis-on'
        var paramPre = 'data-vis-param'
        var attrPre = 'data-vis-'

        for (var i = 0; i < attributes.length; i++) {
          var attr = attributes[i]
          if (attr.name.indexOf(onPre) === 0) {
            vis.on(attr.name.substring(onPre.length), attr.value)
          } else if (attr.name.indexOf(paramPre) === 0) {
            var param = attr.value.split('=')
            if (param.length === 2) {
              vis.attr('param', param[0], param[1])
            } else {
              vis.attr('param', null)
            }
          } else if (attr.name.indexOf(attrPre) === 0) {
            var attrName = attr.name.substring(attrPre.length)
            vis.attr(attrName, attr.value)
          }
        }

        vis.render(d3.select(this), context)
      }
    })

    tooltipInit()
  }

  var tooltipInit = function () {
    var format = d3.format(',')
    var tooltipselection = null

    var tip = function () {
      tooltipselection =
          d3.select('body')
            .selectAll('.simpledatavis-tooltip')
            .data(['simpledatavis-tooltip'])

      if (d3.version.split('.')[0] === '3') {
        tooltipselection.enter().append('div')
          .attr('class', 'simpledatavis-tooltip')
      } else {
        tooltipselection = tooltipselection.enter().append('div')
            .attr('class', 'simpledatavis-tooltip')
          .merge(tooltipselection)
      }

      tooltipselection
        .style('background-color', 'rgba(21, 41, 53, 0.9)')
        .style('color', '#ffffff')
        .style('font-family', 'HelvNeue,Helvetica,sans-serif')
        .style('font-size', '0.75rem')
        .style('font-weight', '300')
        .style('max-width', '300px')
        .style('padding', '8px')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('z-index', '100')
        .text('simpledatavis-tooltip')
    }

    tip.mouseover = function (d, i, options, text) {
      tooltipselection
        .text(tip.text(d, i, options, text))
        .style('visibility', 'visible')
    }

    tip.mousemove = function (d, i) {
      tooltipselection
        .style('top', (d3.event.pageY - 10) + 'px')
        .style('left', (d3.event.pageX + 10) + 'px')
    }

    tip.mouseout = function (d, i) {
      tooltipselection.style('visibility', 'hidden')
    }

    tip.text = function (d, i, options, text) {
      return function () {
        if (typeof options.tooltip === 'function') {
          return options.tooltip(d)
        } else if (typeof options.tooltip === 'string') {
          return options.tooltip
        } else if (typeof text === 'function') {
          return text(d, i)
        } else if (typeof text === 'string') {
          return text
        } else {
          var msg = (d.data && d.data.key ? d.data.key : d.key) + ': ' + (typeof d.value === 'number' ? format(d.value) : d.value)
          if (d.date) msg += ' , date: ' + d.date
          if (d.geo) msg += ' , geo: ' + (d.geo.length && isArray(d.geo[0]) ? d.geo.length : d.geo)
          return msg
        }
      }
    }

    tip()
    SimpleDataVis.tooltip = tip
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleDataVis
    require('./vis/simpledatavis-barchart')(SimpleDataVis)
    require('./vis/simpledatavis-bubblechart')(SimpleDataVis)
    require('./vis/simpledatavis-groupedbarchart')(SimpleDataVis)
    require('./vis/simpledatavis-piechart')(SimpleDataVis)
    require('./vis/simpledatavis-rangebarchart')(SimpleDataVis)
    require('./vis/simpledatavis-stackedbarchart')(SimpleDataVis)
    require('./vis/simpledatavis-timeline')(SimpleDataVis)
  } else {
    window.SimpleDataVis = SimpleDataVis

    window.addEventListener('DOMContentLoaded', function () {
      // find elements with data-vis-view attribute and initiate them
      window.SimpleDataVis.init()
    })
  }
}())
