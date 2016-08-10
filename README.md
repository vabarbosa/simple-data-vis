# Simple Data Vis

Simple Data Vis is a JavaScript module initially developed to visualize data gathered by the [Simple Logging Service](https://developer.ibm.com/clouddataservices/2016/03/03/simple-metrics-collector-microservices-edition/) for its [visualization page](http://simple-logging-service-vis.mybluemix.net/). It is however generic enough that can be used to visual various types of data including [cloudant.com views](https://gist.github.com/vabarbosa/bff35152c3888f4e2c0ad92e2511dc2b).

Once installed the module can be used to access any REST API that returns JSON array of key/value pairs and have that data visually displayed onto the web page (using D3).


# Install

Include the following files in your HTML file:  

* [D3](https://d3js.org/)
* [`simpledatavis.js`](https://github.com/ibm-cds-labs/simple-data-vis/blob/master/simpledatavis.js)

```
<script src="https://d3js.org/d3.v3.min.js"></script>
<script src="simpledatavis.js"></script>
```  

Also include the desired visualizations:

```
<script type="text/javascript" src="vis/simpledatavis-barchart.js"></script>
<script type="text/javascript" src="vis/simpledatavis-bubblechart.js"></script>
<script type="text/javascript" src="vis/simpledatavis-piechart.js"></script>
```  


# Usage

The module can be initialized via JavaScript or using HTML data attributes:  

* __HTML data attributes__

	```
	<div type="text" data-vis="http://some-data-url"
	        data-vis-type="bar-chart"
	        data-vis-ondata="onDataCallback"></div>
	```

	__data-vis__ - (_Required_) the url to retrieve the JSON data  
	__data-vis-type__ - (_Optional_) the type of visualization to use to render the data (e.g., _bar-chart_, _pie-chart_, _bubble-chart_, etc.)  
	__data-vis-ondata__ - (_Optional_) the callback function when data has been retrieved but before visualization is rendered  
	
	Additional attributes are available based on the visualization. See the __Visualizations__ section for more information.
	
* __Javascript__

	```
	var datavis = new SimpleDataVis(dataUrl);
	datavis.render('#chartwrapper');
	```

	where __dataUrl__ is the url to retrieve the JSON data. The __render()__ function is called passing in the selector where the visualization will be placed.
	
  
When the `DOMContentLoaded` event is fired the SimpleDataVis will check the page for the HTML `data-vis` attributes. If none is found or the DOM element (with `data-vis` attributes) is added to the page after the event, then the module would need to be initialized via JavaScript (i.e. `SimpleDataVis.init()`).  


# Visualizations

Various visualizations are available to display the data. If no visualization is specified the module will try to select an appropriate one to show the data. Visualizations can be found in the [`/vis`](https://github.com/ibm-cds-labs/simple-data-vis/tree/master/vis) folder of the respository.  

| Visualization | Data schema | Attributes | Description |
|---|---|---|---|
| bar-chart | `[{ key: "", value: n }, ...]` | `tooltip` | Horizontal bar chart where each _key_ is represented by a horizontal bar whose length is determined by _value_. |
| pie-chart | `[{ key: "", value: n }, ...]` | <ul><li>`tooltip`</li><li>`donut`: true, to render as donut chart</li></ul> | A pie chart where each _key_ is represented by a slice of the pie. The size of the slice is a percentage of _value_ to the sum of all _value_s. |
| bubble-chart | `[{ key: "", value: n }, ...]` | `tooltip` | Bubble chart where each _key_ is represented by a circle with radius determined by _value_. |
| grouped-bar-chart | `[{ key: "", value: { v1: n, v2: n, ...} }, ...]` | <ul><lil>`tooltip`</li><li>`maxgroups`: maximum number of key groups to show per single chart. multiple charts created if more _key_s exist</li></ul> | Bar chart grouped by specified _key_s
| table-vis | `[{ field1: "", field2: "", ...}, ...]` |  `htmlcells`: true, if table cells should allow html content | Table with each item in the data represented by a row and the columns set to the fields of the items. |
| timeline | `[{ key: "", date: d, value: n }, ...]` | `scatter`: true, if data point should not be connected | Timeline where each _value_ is plotted against the corresponding _date_. |
| map-vis | `[{ key: "", geo: [long, lat], value: n }, ...]` | <ul><li>`tooltip`</li><li>`features`: [topojson](https://github.com/mbostock/topojson/wiki) features used for drawing the map</li></ul> | Map where each _value_ is plotted against the longitude and latitude as provided by _geo_. |


# API

### attr(_name_, [_value_])  

Get or set attributes.

__name__ - (_Required_) the name of the attribute/option to set or get  
__value__ - (_Optional_) if omitted the current value of the attribute is returned. If set to `null` the attribute is removed. Otherwise the attribute is set to the specified value.

Current set of attributes include:

| Name | Type | HTML data attribute | Description |
|---|---|---|---|
| type | string | `data-vis-type` | the visualization to render (e.g., _bar-chart_, _bubble-chart_, etc.) |
| tooltip | string or function | `data-vis-tooltip` | the message or a function that returns the message to be dislayed when hovering over a specific areas of the visualization (based on the visualization). Examples: <br/> `dataVis.attr('tooltip', 'Nothing to see here')` <br/> `dataVis.attr('tooltip', function(d) { return d.key })`  

### on(_type_, _callback_)

Set the callback functions.

__type__ - (_Required_) the callback type to set (i.e., _data_, _end_, _fail_)  
__value__ - (_Required_) if omitted the callback is returned. If set to `null` the callback is removed. Otherwise the callback is set to the specified value.

For example:

```
// insert HTML link in the data
var datawithlink = function(data) {
	return data.map(function(d) {
		d.link = '<a href="' + d.key + '">' + d.value + '</a>';
		return d;
	});
}

// create a table-vis with HTML enabled cells, making the inserted links clickable
var tableVis = new SimpleDataVis(dataUrl);
tableVis
	.attr('type', 'table-vis')
	.attr('htmlcells', true)
	.on('data', datawithlink)
	.render('#dataTableWrapper');
```

```
// create a bar-chart, displaying only first ten results
var barChart = new SimpleDataVis(dataUrl);
barChart
	.attr('type', 'bar-chart')
	.on('data', function(data) { return data.slice(0, 10)})
	.render('#firstTenWrapper');
```

Available callbacks include:

| Name | Type | HTML data attribute | Callback Arguments | Description |
|---|---|---|---|---|
| start | string or function | `data-vis-onstart` | `dataUrl` - the url that will be used to retrieve the data | _Optional_ - called when data is about to be retrieved |
| data | string or function | `data-vis-ondata` | `data` - the data that was retrieved | _Optional_ - called when data has been retrieved but before rendering begins. This callback can be used to transform the data before it is rendered. |
| end | string or function | `data-vis-onend` |  | _Optional_ - called when data visualization completes. |
| fail | string or function | `data-vis-onfail` | `error` - the error message | _Optional_ - called when data retrieval fails or data visualization fails. |  

### render(selector)

Render the visualization within the HTML DOM defined by the given CSS selector. Any `svg` elements within the selector DOM will be replaced.

### init()

Visualization is automatically performed when the DOM is successfully processed. In addition, it can also be triggered programmatically to reinspect and reinitiate the DOM elements.
	
```
SimpleDataVis.init();
```  

# Demo  

Examples can be found in the [`/demo`](https://github.com/ibm-cds-labs/simple-data-vis/tree/master/demo) folder of the respository.  
