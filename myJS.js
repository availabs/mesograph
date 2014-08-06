window.onload = function() {
	var graph = mesograph.Graph();

	graph.readData('./20140804nrmn.mts', prepare);

	function prepare(data) {
		var svg = d3.select('body').append('div')
			.attr('class', 'graph')
			.append('svg')
			.attr('class', 'graph-svg')
			.attr('width', (window.innerWidth-400)+'px')
			.attr('height', function() {
				return (parseInt(d3.select(this).attr('width'))/2) + 'px';
			})

		graph.initSVG(svg);
		graph.addAxes(svg);
		graph.drawAreas(svg, ['TFAR', 'DEWP']);
		graph.drawLines(svg, ['TA9M']);
		graph.enablePopup(svg);
	}
}

/*
**************
wind chill
**************

wc = 13.12 + 0.6215*T - 11.37*(V ^ 0.16) + 0.3965*T*(V ^ 0.16)

T = temp in celsius
V = wind velocity, km/h, at 10 meters



**************
heat index
**************

all temps in fahrenheit

HI = c_1 + c_2 T + c_3 R + c_4 T R + c_5 T^2 + c_6 R^2 + c_7 T^2 R + c_8 T R^2 + c_9 T^2 R^2 + c_{10} T^3 + c_{11} R^3 + c_{12} T^3 R + 
    c_{13} T R^3 + c_{14} T^3 R^2 + c_{15} T^2 R^3 + c_{16} T^3 R^3

T = temp. in fahrenheit
R = rel. humid. percent

c_1 = 16.923,
c_2 = 0.185212,
c_3 = 5.37941,
c_4 = -0.100254,
c_5 = 9.41695 * 10^{-3},
c_6 = 7.28898 * 10^{-3},
c_7 = 3.45372 * 10^{-4},
c_8 = -8.14971 * 10^{-4},
c_9 = 1.02102 * 10^{-5},
c_{10} = -3.8646 * 10^{-5},
c_{11} = 2.91583 * 10^{-5},
c_{12} = 1.42721 * 10^{-6},
c_{13} = 1.97483 * 10^{-7},
c_{14} = -2.18429 * 10^{-8},
c_{15} = 8.43296 * 10^{-10},
c_{16} = -4.81975 * 10^{-11}



**************
dew point
**************

all temps in celsius

a = 6.112
b = 17.67
c = 243.5

magnus(T, RH) = ln(RH/100) + bT/(c+T)

water vapor pressure: WVP(T) = a * exp(magnus(T, RH))

Dew Point Temp: Tdp = [c * ln(WVP(T) / a)] / [b - ln(WVP(T) / a)]



**************
temp conversions
**************

F2C(Tf) = (Tf - 32) * (5/9)
C2F(Tc) = (Tc * (9/5)) + 32
*/