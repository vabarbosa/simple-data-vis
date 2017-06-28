# Simple Data Vis

Simple Data Vis is a JavaScript module initially developed to visualize data gathered by the [Simple Logging Service](https://developer.ibm.com/clouddataservices/2016/03/03/simple-metrics-collector-microservices-edition/) for its [visualization page](http://simple-logging-service-vis.mybluemix.net/).

<img src="https://advocated-vis.mybluemix.net/chart/allActivities" />

It is however generic enough that can be used to visual various types of data including [cloudant.com views](https://gist.github.com/vabarbosa/bff35152c3888f4e2c0ad92e2511dc2b).

Once installed the module can be used to access any REST API that returns JSON array of key/value pairs and have that data visually displayed onto the web page (using D3).


# Install

* __Node.js__

	```
	npm install --save simple-data-vis
	```

* __browser__

	Include the following files in your HTML file:  
	
	* [D3](https://d3js.org/)
	* [`simpledatavis.js`](https://github.com/ibm-watson-data-lab/simple-data-vis/blob/master/simpledatavis.js)
	
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
	var datavis = SimpleDataVis(dataUrl);
	datavis
		.on('end', function (data, svgnode) {
			// chart has been created and available in the svgnode (D3 selection)
		})
		.render(selector);
	```

	where __dataUrl__ is the url to retrieve the JSON data. The __render()__ function is called passing in the selector where the visualization will be placed. For Node.js, the selector is not used/required instead the SVG will be available as a D3 selection in the _onEnd_ callback.
 

# Additional Info

Additional information available in the [Simple Data Vis Wiki](https://github.com/ibm-watson-data-lab/simple-data-vis/wiki).


# Demo  

Examples can be found in the [`/demo`](https://github.com/ibm-watson-data-lab/simple-data-vis/tree/master/demo) folder of the respository.  
