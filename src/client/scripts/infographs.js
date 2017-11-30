var infograph = {};
infograph.sunburst = {
	radius: 0,
	colors: ['#455C7B', '#455C7B', '#685C79', '#AC6C82', '#AC6C82', '#AC6C82', '#AC6C82'],
	totalSize: 0,
	vis: null,
	partition: null,
	arc: null,
	tree: null
}
infograph.sunburst.initialize = function () {
	$Q('.infograph[data-info="infog1"]').innerHTML = views.infog1();
	var width = 750, height = 600;
	infograph.sunburst.radius = Math.min(width, height) / 2;
	infograph.sunburst.vis = d3.select("#infog1-visual").append("svg:svg")
		.attr("width", width)
		.attr("height", height)
		.append("svg:g")
		.attr("id", "infog1-visual-container")
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	infograph.sunburst.partition = d3.partition()
		.size([2 * Math.PI, infograph.sunburst.radius * infograph.sunburst.radius]);

	infograph.sunburst.arc = d3.arc()
		.startAngle(function (d) { return d.x0; })
		.endAngle(function (d) { return d.x1; })
		.innerRadius(function (d) { return Math.sqrt(d.y0); })
		.outerRadius(function (d) { return Math.sqrt(d.y1); });

	infograph.sunburst.tree = app.outgoing.getSiteTree()
	// Bounding circle underneath the sunburst, to make it easier to detect
	// when the mouse leaves the parent g.
	infograph.sunburst.vis.append("svg:circle")
		.attr("r", infograph.sunburst.radius)
		.style("opacity", 0);

	var root = d3.hierarchy(infograph.sunburst.tree)
		.sum(function (d) { return d.size; })
		.sort(function (a, b) { return b.value - a.value; });

	var nodes = infograph.sunburst.partition(root).descendants();

	var path = infograph.sunburst.vis.data([infograph.sunburst.tree]).selectAll("path")
		.data(nodes)
		.enter().append("svg:path")
		.attr("display", function (d) { return d.depth ? null : "none"; })
		.attr("d", infograph.sunburst.arc)
		.attr("fill-rule", "evenodd")
		.style("fill", function (d) { return infograph.sunburst.colors[d.depth]; })
		.style("opacity", 1)
		.on("mouseover", infograph.sunburst.mouseover);

	d3.select("#infog1-visual-container").on("mouseleave", infograph.sunburst.mouseleave);
	infograph.sunburst.totalSize = path.datum().value;

}


// Fade all but the current sequence, and show it in the breadcrumb trail.

infograph.sunburst.mouseover = function (d) {

	var percentage = (100 * d.value / infograph.sunburst.totalSize).toPrecision(3);
	var percentageString = percentage + "%";
	if (percentage < 0.1) {
		percentageString = "< 0.1%";
	}

	d3.select("#infog1-percentage")
		.text(percentageString);

	d3.select("#infog1-count")
		.text('(' + d.value + ')');

	d3.select("#infog1-tip")
		.style("visibility", "");

	var sequenceArray = d.ancestors().reverse();
	sequenceArray.shift(); // remove root node from the array
	infograph.sunburst.updateBreadcrumbs(sequenceArray);

	// Fade all the segments.
	d3.selectAll("path")
		.style("opacity", 0.3);

	// Then highlight only those that are an ancestor of the current segment.
	infograph.sunburst.vis.selectAll("path")
		.filter(function (node) {
			return (sequenceArray.indexOf(node) >= 0);
		})
		.style("opacity", 1);
}

// Restore everything to full opacity when moving off the visualization.

infograph.sunburst.mouseleave = function (d) {

	// Hide the breadcrumb trail
	$Q('#infog1-path').innerHTML = '';

	// Deactivate all segments during transition.
	d3.selectAll("path").on("mouseover", null);

	// Transition each segment to full opacity and then reactivate it.
	d3.selectAll("path")
		.transition()
		.duration(1000)
		.style("opacity", 1)
		.on("end", function () {
			d3.select(this).on("mouseover", infograph.sunburst.mouseover);
		});

	d3.select("#infog1-tip")
		.style("visibility", "hidden");
}

// Update the breadcrumb trail to show the current sequence and percentage.

infograph.sunburst.updateBreadcrumbs = function (nodeArray) {
	var str = '<span style="color:#DA727E;">';
	for (var i = 0; i < nodeArray.length; i++) {
		str += (i > 1 ? '/' : '') + '<span style="color: ' + infograph.sunburst.colors[i + 1] + '">' + nodeArray[i].data.name + '</span>' + (i == 0 ? '//' : '');
	}
	$Q('#infog1-path').innerHTML = str + '</span>';
	return;
}
infograph.bandwidth = {};
infograph.bandwidth.initialize = function () {
	this.data = [];
	this.minHeight = 4;
	for (var i = 0; i < 60; i++)
		this.data.push(0);
	this.update(0)
}
infograph.bandwidth.update = function (value) {
	this.data.push(value)
	var max = Math.max.apply(null, this.data.slice(1));
	$Q('#bandwidth-stat .max').innerHTML = '<b>Max</b>' + views.bytesize(max);
	$Q('#bandwidth-stat .current').innerHTML = '<b>Current</b>' + views.bytesize(value);


	d3.select("#bandwidth-bar")
		.selectAll("rect")
		.data(this.data)
		.enter()
		.append("rect")
		.attr("class", "bar")
		.attr("height", function (d, i) { return '1%' })
		.attr("x", function (d, i) { return (i * ((85 / 60) + .25)) + .25 + '%' })
		.attr('y', (d, i) => { return '49.5%' })

	this.data.shift();
	d3.select("#bandwidth-bar")
		.select("rect")
		.remove();

	d3.select("#bandwidth-bar")
		.selectAll("rect")
		.data(this.data)
		.attr("height", function (d, i) { return Math.max(1, ((d / max || 0) * 100)) + '%' })
		.attr("x", function (d, i) { return (i * ((85 / 60) + .25)) + .25 + '%' })
		.attr('y', (d, i) => { return Math.min(49.5, (100 - (((d / max || 0)) * 100)) / 2) + '%' })
}
infograph.line = function (container) {
	var self = this;
	this.data = [];
	for (var i = 0; i < 60; i++)
		this.data.push(0);
	this.svg = d3.select(container)
		.append('svg')
		.attr('viewBox', '0 0 300 100')
		.attr('preserveAspectRatio', 'xMidYMid meet')

	this.x = d3.scaleLinear().range([15, 285]);
	this.y = d3.scaleLinear().range([85, 0]);

	this.x.domain([-60, 0]);
	this.y.domain([0, 1]);

	this.line = d3.line()
		.x(function (d, i) { return self.x(i - 60); })
		.y(function (d, i) { return self.y(d); });

	this.svg.append("path")
		.attr('vector-effect', 'non-scaling-stroke')
		.attr("class", "linepath")
		.attr("d", this.line(this.data));

	this.svg.append("g")
		.attr('class', 'y-axis')
		.attr("transform", "translate(15,0)")
		.call(d3.axisLeft(this.y));

	this.svg.append("g")
		.attr('class', 'x-axis')
		.attr("transform", "translate(0,85)")
		.call(d3.axisBottom(this.x));

	this.svg.select('.x-axis path').remove();
	this.svg.select('.y-axis path').remove();

}

infograph.line.prototype.update = function (value) {
	this.data.push(value)
	this.data.shift();
	this.y.domain([0, Math.ceil((Math.max.apply(null, this.data) / 10) + .1) * 10]);
	this.svg.select("path")
		.attr("d", this.line(this.data));
	this.svg.select('.y-axis')
		.call(d3.axisLeft(this.y));
	this.svg.select('.y-axis path').remove();

}
