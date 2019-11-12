import * as d3 from "d3";
import dataTransform from "../dataTransform";
import { dispatch, attachEventListners } from "../events";
import { colorParse } from "../colorHelper";

/**
 * Reusable 3D Bubble Chart Component
 *
 * @module
 */
export default function() {

	/* Default Properties */
	let dimensions = { x: 40, y: 40, z: 40 };
	let colors = d3.schemeRdYlGn[8];
	let color;
	let classed = "d3X3dBubbles";
	let mappings;

	/* Scales */
	let xScale;
	let yScale;
	let zScale;
	let colorScale;
	let sizeScale;
	let sizeRange = [0.2, 4.0];

	/**
	 * Array to String
	 *
	 * @private
	 * @param {array} arr
	 * @returns {string}
	 */
	const array2dToString = function(arr) {
		return arr.reduce((a, b) => a.concat(b), [])
			.reduce((a, b) => a.concat(b), [])
			.join(" ");
	};

	/**
	 * Initialise Data and Scales
	 *
	 * @private
	 * @param {Array} data - Chart data.
	 */
	const init = function(data) {
		let newData = {};
		['x', 'y', 'z', 'size', 'color'].forEach((dimension) => {
			let set = {
				key: dimension,
				values: []
			};

			data.values.forEach((d) => {
				let key = mappings[dimension];
				let value = d.values.find((v) => v.key === key).value;
				set.values.push({ key: key, value: value });
			});

			newData[dimension] = dataTransform(set).summary();
		});

		let extentX = newData.x.valueExtent;
		let extentY = newData.y.valueExtent;
		let extentZ = newData.z.valueExtent;
		let extentSize = newData.size.valueExtent;
		let extentColor = newData.color.valueExtent;

		if (typeof xScale === "undefined") {
			xScale = d3.scaleLinear()
				.domain(extentX)
				.range([0, dimensions.x]);
		}

		if (typeof yScale === "undefined") {
			yScale = d3.scaleLinear()
				.domain(extentY)
				.range([0, dimensions.y]);
		}

		if (typeof zScale === "undefined") {
			zScale = d3.scaleLinear()
				.domain(extentZ)
				.range([0, dimensions.z]);
		}

		if (typeof sizeScale === "undefined") {
			sizeScale = d3.scaleLinear()
				.domain(extentSize)
				.range(sizeRange);
		}

		if (color) {
			colorScale = d3.scaleQuantize()
				.domain(extentColor)
				.range([color, color]);
		} else if (typeof colorScale === "undefined") {
			colorScale = d3.scaleQuantize()
				.domain(extentColor)
				.range(colors);
		}
	};

	/**
	 * Constructor
	 *
	 * @constructor
	 * @alias bubbles
	 * @param {d3.selection} selection - The chart holder D3 selection.
	 */
	const my = function(selection) {
		selection.each(function(data) {
			init(data);

			const element = d3.select(this)
				.classed(classed, true)
				.attr("id", (d) => d.key);

			const particleData = function(data) {
				const pointSizes = function(Y) {
					return Y.values.map(function(d) {
						let sizeVal = d.values.find((v) => v.key === mappings.size).value;
						return [sizeScale(sizeVal), sizeScale(sizeVal), sizeScale(sizeVal)];
					})
				};

				const pointCoords = function(Y) {
					return Y.values.map(function(d) {
						let xVal = d.values.find((v) => v.key === mappings.x).value;
						let yVal = d.values.find((v) => v.key === mappings.y).value;
						let zVal = d.values.find((v) => v.key === mappings.z).value;
						return [xScale(xVal), yScale(yVal), zScale(zVal)];
					})
				};

				const pointColors = function(Y) {
					return Y.values.map(function(d) {
						let colorVal = d.values.find((v) => v.key === mappings.color).value;
						let color = d3.color(colorScale(colorVal));
						return colorParse(color);
					})
				};

				data.point = array2dToString(pointCoords(data));
				data.color = array2dToString(pointColors(data));
				data.size = array2dToString(pointSizes(data));

				return [data];
			};

			const particles = element.selectAll(".particles")
				.data((d) => particleData(d), (d) => d.key);

			const particleSelect = particles
				.enter()
				.append("Shape")
				.classed("particles", true);

			const appearance = particleSelect.append("Appearance");
			appearance.append("Material");
			appearance.append("DepthMode")
				.attr("readOnly", "true");
			// appearance.append("ImageTexture")
			//	.attr("url", "./circle_texture.png");

			const pSet = particleSelect.append("ParticleSet")
				.attr("size", (d) => d.size)
				.attr("drawOrder", "backToFront");

			pSet.append("Coordinate")
				.attr("point", (d) => d.point);

			pSet.append("Color")
				.attr("color", (d) => d.color);

			particleSelect.merge(particles);
		});
	};

	/**
	 * Dimensions Getter / Setter
	 *
	 * @param {{x: number, y: number, z: number}} _v - 3D object dimensions.
	 * @returns {*}
	 */
	my.dimensions = function(_v) {
		if (!arguments.length) return dimensions;
		dimensions = _v;
		return this;
	};

	/**
	 * X Scale Getter / Setter
	 *
	 * @param {d3.scale} _v - D3 scale.
	 * @returns {*}
	 */
	my.xScale = function(_v) {
		if (!arguments.length) return xScale;
		xScale = _v;
		return my;
	};

	/**
	 * Y Scale Getter / Setter
	 *
	 * @param {d3.scale} _v - D3 scale.
	 * @returns {*}
	 */
	my.yScale = function(_v) {
		if (!arguments.length) return yScale;
		yScale = _v;
		return my;
	};

	/**
	 * Z Scale Getter / Setter
	 *
	 * @param {d3.scale} _v - D3 scale.
	 * @returns {*}
	 */
	my.zScale = function(_v) {
		if (!arguments.length) return zScale;
		zScale = _v;
		return my;
	};

	/**
	 * Size Scale Getter / Setter
	 *
	 * @param {d3.scale} _v - D3 size scale.
	 * @returns {*}
	 */
	my.sizeScale = function(_v) {
		if (!arguments.length) return sizeScale;
		sizeScale = _v;
		return my;
	};

	/**
	 * Size Range Getter / Setter
	 *
	 * @param {number[]} _v - Size min and max (e.g. [1, 9]).
	 * @returns {*}
	 */
	my.sizeRange = function(_v) {
		if (!arguments.length) return sizeRange;
		sizeRange = _v;
		return my;
	};

	/**
	 * Color Scale Getter / Setter
	 *
	 * @param {d3.scale} _v - D3 color scale.
	 * @returns {*}
	 */
	my.colorScale = function(_v) {
		if (!arguments.length) return colorScale;
		colorScale = _v;
		return my;
	};

	/**
	 * Color Getter / Setter
	 *
	 * @param {string} _v - Color (e.g. "red" or "#ff0000").
	 * @returns {*}
	 */
	my.color = function(_v) {
		if (!arguments.length) return color;
		color = _v;
		return my;
	};

	/**
	 * Colors Getter / Setter
	 *
	 * @param {Array} _v - Array of colours used by color scale.
	 * @returns {*}
	 */
	my.colors = function(_v) {
		if (!arguments.length) return colors;
		colors = _v;
		return my;
	};

	/**
	 * Mappings Getter / Setter
	 *
	 * @param {Object}
	 * @returns {*}
	 */
	my.mappings = function(_v) {
		if (!arguments.length) return mappings;
		mappings = _v;
		return my;
	};

	/**
	 * Dispatch On Getter
	 *
	 * @returns {*}
	 */
	my.on = function() {
		let value = dispatch.on.apply(dispatch, arguments);
		return value === dispatch ? my : value;
	};

	return my;
}
