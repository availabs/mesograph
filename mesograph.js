(function() {
	var mesograph = {};

	function MESOgraph() {
		var self = this;

		self.stationData = {
				stationID: null,
				stationNum: null,
				time: {},
				data: []
			};
	}

	/*
	T = temperature in fahrenheit
	*/
	function f2c(T) {
		return (T-32)*(5/9);
	}

	/*
	T = temperature in celsius
	*/
	function c2f(T) {
		return (T*(9/5))+32;
	}

	/*
	T = temp in celsius
	V = wind velocity, km/h, measured at height of 10 meters
	*/
	function windChill(T, V) {
		return 13.12 + 0.6215*T - 11.37*Math.pow(V, 0.16) + 0.3965*T*Math.pow(V, 0.16);
	}

	/*
	T = temp in fahrenheit
	RH = relative humidity as a percent
	*/
	function heatIndex(T, RH) {
		var c_1 = 16.923,
			c_2 = 0.185212,
			c_3 = 5.37941,
			c_4 = -0.100254,
			c_5 = 9.41695 * Math.pow(10, -3),
			c_6 = 7.28898 * Math.pow(10, -3),
			c_7 = 3.45372 * Math.pow(10, -4),
			c_8 = -8.14971 * Math.pow(10, -4),
			c_9 = 1.02102 * Math.pow(10, -5),
			c_10 = -3.8646 * Math.pow(10, -5),
			c_11 = 2.91583 * Math.pow(10, -5),
			c_12 = 1.42721 * Math.pow(10, -6),
			c_13 = 1.97483 * Math.pow(10, -7),
			c_14 = -2.18429 * Math.pow(10, -8),
			c_15 = 8.43296 * Math.pow(10, -10),
			c_16 = -4.81975 * Math.pow(10, -11);

		var TT = T*T,
			RHRH = RH*RH,
			TTT = TT*T,
			RHRHRH = RHRH*RH;

		return c_1 + c_2*T + c_3*RH + c_4*T*RH + c_5*TT + c_6*RHRH + c_7*TT*RH + 
			   c_8*T*RHRH + c_9*TT*RHRH + c_10*TTT + c_11*RHRHRH + 
			   c_12*TTT*RH + c_13*T*RHRHRH + c_14*TTT*RHRH + 
			   c_15*TT*RHRHRH + c_16*TTT*RHRHRH;
	}

	/*
	T = temp in celsius
	RH = relative humidity as a percent
	*/
	function dewPoint(T, RH) {
		var a = 6.112,
			b = 17.67,
			c = 243.5;

		/*
		magnus helper function
		*/
		function magnus() {
			return Math.log(RH/100) + (b*T)/(c+T);
		}

		/*
		Water Vapor Pressure formula
		*/
		function WVP() {
			return a*Math.exp(magnus(T, RH));
		}

		return (c*Math.log(WVP()/a)) / (b-Math.log(WVP()/a));
	}

	MESOgraph.prototype.readData = function(file, callback) {
		var self = this;

		d3.text(file, function(error, file) {
			var split = file.split('\n'),
				time = split[1].split(/\s+/).slice(2, 5),
				headers = split[2].split(/\s+/),
				tempData = split.slice(3);

			self.stationData.time = {
				year: time[0],
				month: time[1],
				day: time[2]
			}

			for (var i = 0; i < tempData.length-1; i++) {
				var d = tempData[i].split(/\s+/);

				self.stationData.stationID = d[1];
				self.stationData.stationNum = d[2];

				var obj = {
					hour: +d[3],
					data: {}
				}

				for (var j = 4; j < headers.length; j++) {
					obj.data[headers[j]] = +d[j];
				}
				obj.data['TA9M'] = c2f(obj.data['TA9M']);
				obj.data['TFAR'] = c2f(obj.data['TAIR']);
				obj.data['WKPH'] = obj.data['WSPD']*3.6;
				obj.data['DEWP'] = c2f(dewPoint(obj.data['TAIR'], obj.data['RELH']));
				if (obj.data['WSPD']*3.6 > 4.8 && obj.data['TAIR'] < 10) {
					obj.data['WCHL'] = c2f(windChill(obj.data['TAIR'], obj.data['WSPD']*3.6));
				}
				else {
					obj.data['WCHL'] = -999;
				}
				if (obj.data['RELH'] > 40 && c2f(obj.data['TAIR']) > 80) {
					obj.data['HNDX'] = heatIndex(c2f(obj.data['TAIR']), obj.data['RELH']);
				}
				else {
					obj.data['HIND'] = -999;
				}

				if (obj.data['RELH'] > 0) {
					self.stationData.data.push(obj);
				}
			}

			callback(self.stationData);
		})
	}

	MESOgraph.prototype.initSVG = function(svg) {
		var self = this;

		var margins = {top: 20, right: 20, bottom: 40, left: 40},
			width = parseInt(svg.attr('width')),
			height = parseInt(svg.attr('height'));

		svg.wdth = width - margins.left - margins.right,
		svg.hght = height - margins.top - margins.bottom;

		var extent = d3.extent(self.stationData.data, function(d) { return d.hour; });

		svg.xScale = d3.scale.linear()
			.domain(extent)
			.range([0, svg.wdth]);

		svg.yScale = d3.scale.linear()
			.domain([50, 100])
			.range([svg.hght, 0]);

		svg.append('g')
			.attr('class', 'group')
			.attr('transform', 'translate(' + margins.left + ', ' + margins.top + ')')
			.style('height', svg.hght+'px')
			.style('width', svg.wdth+'px');

		svg.stationData = self.stationData;

		svg.color = d3.scale.ordinal()
			.domain(['TFAR', 'DEWP', 'TA9M'])
			.range(["#e41a1c","#377eb8","#4daf4a"])//,"#984ea3","#ff7f00","#ffff33","#a65628","#f781bf","#999999"])
	}

	MESOgraph.prototype.addAxes = function(svg) {
		var group = svg.select('.group');

		var xAxis = d3.svg.axis()
			.scale(svg.xScale)
			.orient('bottom');

		group.append('g')
			.attr('class', 'x axis')
			.attr('transform', 'translate(0, ' + svg.hght + ')')
			.call(xAxis);

		var yAxis = d3.svg.axis()
			.scale(svg.yScale)
			.orient('left');

		group.append('g')
			.attr('class', 'y axis')
			.call(yAxis);
	}

	MESOgraph.prototype.drawAreas = function(svg, areas) {
		var self = this,
			group = svg.select('.group');

		for (var i = 0; i < areas.length; i++) {
			var attribute = areas[i];

			var line = d3.svg.line()
				.x(function(d) { return svg.xScale(d.hour); })
				.y(function(d) { return svg.yScale(d.data[attribute]) });

			var area = d3.svg.area()
				.x(function(d) { return svg.xScale(d.hour); })
				.y0(svg.hght)
				.y1(function(d) { return svg.yScale(d.data[attribute]) });

			group.append('path')
				.attr('class', 'line')
				.attr('stroke', svg.color(attribute))
				.attr('d', line(self.stationData.data))

			group.append('path')
				.attr('class', 'area')
				.attr('fill', svg.color(attribute))
				.attr('d', area(self.stationData.data))
		}
	}

	MESOgraph.prototype.drawLines = function(svg, lines) {
		var self = this,
			group = svg.select('.group');

		for (var i = 0; i < lines.length; i++) {
			var attribute = lines[i];

			var line = d3.svg.line()
				.x(function(d) { return svg.xScale(d.hour); })
				.y(function(d) { return svg.yScale(d.data[attribute]) });

			group.append('path')
				.attr('class', 'line')
				.attr('stroke', svg.color(attribute))
				.attr('d', line(self.stationData.data))
		}
	}

	MESOgraph.prototype.enablePopup = function(svg) {
		var self = this,
			group = svg.select('.group');

		var hoverLine = group.append('line')
			.attr('x1', 0)
			.attr('y1', 0)
			.attr('x2', 0)
			.attr('y2', svg.hght)
			.attr('class', 'hover-line')
			.style('display', 'none')

		var hoverBox = group.append('svg')
			.attr('width', svg.wdth*.2)
			.attr('height', svg.hght*.9)
			.attr('y', (svg.hght-svg.hght*.9)/2)
			.attr('class', 'hover-box')
			.style('display', 'none')
		
		var rect = group.append('rect')
			.attr('width', svg.wdth)
			.attr('height', svg.hght)
			.attr('class', 'hover-rect')
			.on('mouseover', function() { showPopup(svg); })
			.on('mousemove', function() { movePopup(svg, this); })
			.on('mouseout', function() { hidePopup(svg); })
	}

	function showPopup(svg) {
		svg.select('.hover-line')
			.style('display', 'block')
		svg.select('.hover-box')
			.style('display', 'block')
	}

	function movePopup(svg, DOMel) {
		var hoverBox = svg.select('.hover-box')

		hoverBox.selectAll('*').remove();

		var mouseX = d3.mouse(DOMel)[0];

		hoverBox.append('rect')
			.attr('width', svg.wdth*.2)
			.attr('height', svg.hght*.9)
			.attr('class', 'fill-rect')

		hoverBox
			.attr('x', function() {
				if (mouseX < svg.wdth-svg.wdth*.2-(svg.hght-svg.hght*.9)/2*2) {
					return mouseX + (svg.hght-svg.hght*.9)/2;
				}
				else {
					return mouseX-svg.wdth*.2-(svg.hght-svg.hght*.9)/2;
				}
			})

		var index = Math.floor(svg.xScale.invert(mouseX/5));

		svg.select('.hover-line')
			.attr('x1', mouseX)
			.attr('x2', mouseX)

		var i = 0,
			size = 15;

		for (var key in svg.stationData.data[index].data) {
			hoverBox.append('text')
				.attr('x', size)
				.attr('y', i * size + 1 + size*1.5)
				.attr('font-size', size)
				.text(key + ': ')
			hoverBox.append('text')
				.attr('x', 100)
				.attr('y', i * size + 1 + size*1.5)
				.attr('font-size', size)
				.text(svg.stationData.data[index].data[key])
			i++;
		}
	}

	function hidePopup(svg) {
		svg.select('.hover-line')
			.style('display', 'none')
		svg.select('.hover-box')
			.style('display', 'none')
	}

	mesograph.Graph = function() {
		return new MESOgraph();
	}

	this.mesograph = mesograph;
})()