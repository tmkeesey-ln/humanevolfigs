/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>

enum LabelPosition
{
	LEFT,
	RIGHT,
	TOP,
	TOP_LEFT,
	TOP_RIGHT,
	BOTTOM,
	BOTTOM_LEFT,
	BOTTOM_RIGHT
}

interface LabelInfo
{
	text?: string;
	italic?: boolean;
	position: LabelPosition;
	area?: Haeckel.Rectangle;
}

var MIN_RANGE_SIZE = 0.025;

var MAX_RANGE_SIZE = 0.25;

var TIME_START = -7000000;

var FIGURE_HEIGHT = 1050;

var FIGURE_WIDTH = 800;

var MARGIN = 25;

var TOP_MARGIN = 75;

var LABELS: { [name: string]: LabelInfo; } = {
	"Gorilla": {
		text: 'gorillas',
		position: LabelPosition.BOTTOM_LEFT
	},
	"Pan": {
		text: 'chimpanzees',
		position: LabelPosition.BOTTOM
	},
	"Sahelanthropus": {
		italic: true,
		position: LabelPosition.RIGHT
	},
	"Orrorin": {
		italic: true,
		position: LabelPosition.RIGHT
	},
	"Ardipithecus": {
		italic: true,
		position: LabelPosition.RIGHT
	},
	"Australopithecus": {
		italic: true,
		position: LabelPosition.LEFT
	},
	"Paranthropus": {
		italic: true,
		position: LabelPosition.TOP_LEFT
	},
	"Praeanthropus": {
		italic: true,
		position: LabelPosition.LEFT
	},
	"Kenyanthropus": {
		italic: true,
		position: LabelPosition.RIGHT
	},
	"Homo": {
		italic: true,
		position: LabelPosition.TOP_RIGHT
	}
};

function drawLabel(builder: Haeckel.ElementBuilder, name: string, info: LabelInfo, area: Haeckel.Rectangle)
{
	var anchor: string;
	var x: number;
	var y: number;
	switch (info.position)
	{
		case LabelPosition.BOTTOM:
		case LabelPosition.TOP:
			anchor = "middle";
			break;
		case LabelPosition.LEFT:
		case LabelPosition.BOTTOM_RIGHT:
		case LabelPosition.TOP_RIGHT:
			anchor = "end"
			break;
		case LabelPosition.RIGHT:
		case LabelPosition.BOTTOM_LEFT:
		case LabelPosition.TOP_LEFT:
			anchor = "start"
			break;
		default:
			throw new Error("Invalid position: " + info.position);
	}
	switch (info.position)
	{
		case LabelPosition.BOTTOM:
		case LabelPosition.TOP:
			x = area.centerX;
			break;
		case LabelPosition.LEFT:
			x = area.left - 4;
			break;
		case LabelPosition.RIGHT:
			x = area.right + 4;
			break;
		case LabelPosition.BOTTOM_RIGHT:
		case LabelPosition.TOP_RIGHT:
			x = area.right - 10;
			break;
		case LabelPosition.BOTTOM_LEFT:
		case LabelPosition.TOP_LEFT:
			x = area.left + 10;
			break;
		default:
			throw new Error("Invalid position: " + info.position);
	}
	switch (info.position)
	{
		case LabelPosition.BOTTOM:
		case LabelPosition.BOTTOM_LEFT:
		case LabelPosition.BOTTOM_RIGHT:
			y = area.bottom + 18;
			break;
		case LabelPosition.TOP:
		case LabelPosition.TOP_LEFT:
		case LabelPosition.TOP_RIGHT:
			y = area.top - 4;
			break;
		case LabelPosition.LEFT:
		case LabelPosition.RIGHT:
			y = area.centerY + 9;
			break;
		default:
			throw new Error("Invalid position: " + info.position);
	}
	var text = builder.child(Haeckel.SVG_NS, 'text')
		.text(info.text || name)
		.attrs({
			'fill': Haeckel.BLACK.hex,
			'fill-opacity': '0.5',
			'font-size': '18px',
			'font-weight': 'bold',
			'font-family': "Myriad Pro",
			'text-anchor': anchor,
			x: x + 'px',
			y: y + 'px'
		});
	if (info.italic)
	{
		text.attr(Haeckel.SVG_NS, 'font-style', 'italic');
	}
}

function getCCMatrix(sources: Haeckel.DataSources, taxon: Haeckel.Taxic): Haeckel.CharacterMatrix<Haeckel.Range>
{
	var solver = new Haeckel.PhyloSolver(sources.sources["data/compiled/phylogeny.json"].phylogenies["allTaxa"]);
	var cmBuilder = new Haeckel.CharacterMatrixBuilder<Haeckel.Range>();
	cmBuilder.addMatrix(<Haeckel.CharacterMatrix<Haeckel.Range>> sources.sources["data/compiled/characters.json"].characterMatrices["cranialCapacity"]);
	cmBuilder.inferStates(solver.dagSolver, Haeckel.EMPTY_SET);
	cmBuilder.removeTaxon(Haeckel.tax.setDiff(cmBuilder.taxon, taxon));
	return cmBuilder.build();
}

function getCCRatioMap(sources: Haeckel.DataSources, matrix: Haeckel.CharacterMatrix<Haeckel.Range>, taxon: Haeckel.Taxic): (vertex: Haeckel.Taxic) => Haeckel.Range
{
	var ccChar = matrix.characterList[0];
	var ccRange = Haeckel.chr.states(matrix, taxon, ccChar);

	return (vertex: Haeckel.Taxic) =>
	{
		var range = Haeckel.chr.states(matrix, vertex, ccChar);
		if (range && !range.empty)
		{
			range = Haeckel.rng.multiply(Haeckel.rng.add(range, -ccRange.min), 1 / ccRange.size);
		}
		return range;
	};
}

var FIGURE_TO_RENDER: Haeckel.Figure = 
{
	height: FIGURE_HEIGHT,
	width: FIGURE_WIDTH,

	sources: [
        'data/compiled/characters.json',
        'data/compiled/nomenclature.json',
        'data/compiled/phylogeny.json',
        'data/2014 - ICS.json'
	],

	render: (builder: Haeckel.ElementBuilder, sources: Haeckel.DataSources, defs: () => Haeckel.ElementBuilder, pngAssets: Haeckel.PNGAssets) =>
	{
        var AREA = Haeckel.rec.createFromCoords(MARGIN + 24, TOP_MARGIN, FIGURE_WIDTH - MARGIN, FIGURE_HEIGHT);
        var TIME = Haeckel.rng.create(TIME_START, 0);
		var chart = new Haeckel.ChronoChart();
		chart.area = AREA;
		chart.time = TIME;
		var nameMap = sources.nomenclature.nameMap;

		function addToLabelRect(taxon: Haeckel.Taxic, rect: Haeckel.Rectangle)
		{
			var name: string;
			for (name in LABELS)
			{
				if (Haeckel.tax.includes(nameMap[name], taxon))
				{
					var labelInfo = LABELS[name];
					if (!labelInfo.area)
					{
						labelInfo.area = rect;
					}
					else
					{
						labelInfo.area = Haeckel.rec.combine([ labelInfo.area, rect ]);
					}
					return;
				}
			}
		}

		function drawBackground()
		{
			builder.child(Haeckel.SVG_NS, 'rect')
				.attrs(Haeckel.SVG_NS, {
					fill: Haeckel.WHITE.hex,
					stroke: 'none',
					x: '0px',
					y: '0px',
					width: FIGURE_WIDTH + 'px',
					height: FIGURE_HEIGHT + 'px'
				});
		}

		function drawStrata()
		{
			var group = builder.child(Haeckel.SVG_NS, 'g');
			var top = chart.getTimeY(Haeckel.RANGE_0);
			group.child(Haeckel.SVG_NS, 'rect')
				.attrs({
					fill: Haeckel.BLACK.hex,
					'fill-opacity': '0.333',
					stroke: 'none',
					x: '0px',
					y: (top.min - 1) + 'px',
					width: FIGURE_WIDTH + 'px',
					height: '1px'
				});
			var strata = Haeckel.ext.list(sources.sources['data/2014 - ICS.json'].strata);
			strata.sort((a: Haeckel.Stratum, b: Haeckel.Stratum) => b.start.mean - a.start.mean);
			var stages = strata.filter((stratum: Haeckel.Stratum) => stratum.type === 'stage/age');
			var series = strata.filter((stratum: Haeckel.Stratum) => stratum.type === 'series/epoch');
			var boundaries = new Haeckel.ExtSetBuilder<Haeckel.Range>();
			Haeckel.arr.each(series, (stratum: Haeckel.Stratum) =>
			{
				var startY = chart.getTimeY(stratum.start);
				var endY = chart.getTimeY(stratum.end);
				group.child(Haeckel.SVG_NS, 'line')
						.attrs({
							stroke: Haeckel.BLACK.hex,
							'stroke-opacity': '0.5',
							'stroke-width': '1px',
							'stroke-dasharray': '4 2',
							x1: '0px',
							y1: startY.mean + 'px',
							x2: FIGURE_WIDTH + 'px',
							y2: startY.mean + 'px'
						});
				boundaries.add(startY);
				var yRange = Haeckel.rng.create(endY.mean, Math.min(FIGURE_HEIGHT, startY.mean));
				var text = group.child(Haeckel.SVG_NS, 'text')
					.text(stratum.name === 'Miocene' ? 'MESSINIAN' : stratum.name.toUpperCase())
					.attrs(Haeckel.SVG_NS, {
						'fill': Haeckel.BLACK.hex,
						'fill-opacity': '0.5',
						'font-size': '24px',
						'font-weight': 'bold',
						'font-family': "Myriad Pro",
						'text-anchor': 'middle',
						'letter-spacing': '0.25em'
					});
				var box = Haeckel.rec.createFromBBox(<SVGTextElement> text.build());
				if (box.width > yRange.size)
				{
					text.detach();
				}
				else
				{
					text.attr(Haeckel.SVG_NS, 'transform',
						'translate(' + (MARGIN + 12) + ',' + yRange.mean + ') rotate(-90)');
				}
			});
			Haeckel.arr.each(stages, (stratum: Haeckel.Stratum) =>
			{
				var startY = chart.getTimeY(stratum.start);
				if (boundaries.contains(startY))
				{
					return;
				}
				group.child(Haeckel.SVG_NS, 'line')
						.attrs({
							stroke: Haeckel.BLACK.hex,
							'stroke-opacity': '0.125',
							'stroke-dasharray': '2 4',
							'stroke-width': '1px',
							x1: '0px',
							y1: startY.mean + 'px',
							x2: FIGURE_WIDTH + 'px',
							y2: startY.mean + 'px'
						});
			});
		}

		/*
		function drawTimes()
		{
			var group = builder.child(Haeckel.SVG_NS, 'g');
			var TIME_INCREMENT = -1000000;
			for (var time = TIME.max + TIME_INCREMENT; time >= TIME.min; time += TIME_INCREMENT)
			{
				var y = chart.getTimeY(Haeckel.rng.create(time, time)).mean;
				group.child(Haeckel.SVG_NS, 'rect')
					.attrs({
						fill: Haeckel.BLACK.hex,
						'fill-opacity': '0.15',
						stroke: 'none',
						x: '0px',
						y: (y - 0.5) + 'px',
						width: FIGURE_WIDTH + 'px',
						height: '1px'
					});
				group.child(Haeckel.SVG_NS, 'text')
					.text(Math.round(time / -1000000) + ' Mya')
					.attrs(Haeckel.SVG_NS, {
						x: (FIGURE_WIDTH - MARGIN) + 'px',
						y: (y - 1) + 'px',
						'font-weight': 'bold',
						'fill': Haeckel.BLACK.hex,
						'fill-opacity': '0.5',
						'font-size': '12px',
						'font-family': "Myriad Pro",
						'text-anchor': 'end'
					});
			}
		}
		*/

		function labelTaxa()
		{
			var group = builder.child(Haeckel.SVG_NS, 'g');
			var name: string;
			for (name in LABELS)
			{
				var labelInfo = LABELS[name];
				if (!labelInfo.area)
				{
					throw new Error('No area for ' + name + '.');
				}

				var rect = Haeckel.rec.create(labelInfo.area.x - 10, labelInfo.area.y - 10, labelInfo.area.width + 20, labelInfo.area.height + 20);

				group.child(Haeckel.SVG_NS, 'rect')
					.attrs(Haeckel.SVG_NS, {
						x: rect.left + 'px',
						y: rect.top + 'px',
						width: rect.width + 'px',
						height: (rect.bottom >= FIGURE_HEIGHT - MARGIN ? (FIGURE_HEIGHT - rect.top + 20) : rect.height) + 'px',
						rx: '10px',
						ry: '10px',
						fill: 'none',
						'stroke': Haeckel.BLACK.hex,
						'stroke-opacity': '0.5',
						'stroke-dasharray': '1 3'
					});

				drawLabel(group, name, labelInfo, rect);
			}
		}

		function labelXAxis()
		{
			// :TODO:
			//var group = builder.child(Haeckel.SVG_NS, 'g');
		}

		function plotOccurrences()
		{
	        var nameMap = sources.nomenclature.nameMap;
	        var taxon = nameMap['Homininae'];
	        var matrix = getCCMatrix(sources, taxon);

	        defs().child(Haeckel.SVG_NS, 'clipPath')
	        	.attr(Haeckel.SVG_NS, 'id', 'chart-area')
	        	.child(Haeckel.SVG_NS, 'rect')
	        	.attrs(Haeckel.SVG_NS, {
	        		x: AREA.left + 'px',
	        		y: AREA.top + 'px',
	        		width: AREA.width + 'px',
	        		height: (AREA.height + MARGIN) + 'px'
	        	});

			var chart = new Haeckel.OccurrencePlotChart();
			chart.area = AREA;
			chart.characterMatrix = matrix;
			chart.horizontalRatioMap = getCCRatioMap(sources, matrix, taxon);
			chart.drawArea = (builder: Haeckel.ElementBuilder, area: Haeckel.Rectangle, taxon: Haeckel.Taxic) =>
			{
				addToLabelRect(taxon, area);
				var left = area.left;
				var width = area.width;
				var top = area.top;
				var height = area.height;
				if (width < 2)
				{
					left = area.centerX - 1;
					width = 2;
				}
				if (height < 2)
				{
					top = area.centerY - 1;
					height = 2;
				}
				builder.child(Haeckel.SVG_NS, 'rect')
					.attrs(Haeckel.SVG_NS, {
						x: left + 'px',
						y: top + 'px',
						width: width + 'px',
						height: height + 'px',
						fill: Haeckel.BLACK.hex,
						stroke: 'none'
					});
			};
			chart.drawPoint = (builder: Haeckel.ElementBuilder, point: Haeckel.Point, taxon: Haeckel.Taxic) =>
			{
				addToLabelRect(taxon, Haeckel.rec.createFromPoints(point, point));
				builder.child(Haeckel.SVG_NS, 'rect')
					.attrs(Haeckel.SVG_NS, {
						x: point.x + 'px',
						y: point.y + 'px',
						width: '2px',
						height: '2px',
						fill: Haeckel.BLACK.hex,
						stroke: 'none'
					});
			};
			chart.random = Haeckel.seedRandom(0);
			chart.time = TIME;
			chart.render(builder)
				.attr(Haeckel.SVG_NS, 'clip-path', 'url(#chart-area)');
		}

		try
		{
			drawBackground();
			drawStrata();
			//drawTimes();
			plotOccurrences();
			labelTaxa();
			labelXAxis();
		}
		catch (e)
		{
			builder.child(Haeckel.SVG_NS, 'text')
				.attrs(Haeckel.SVG_NS, 
				{
					'font-size': '12px',
					fill: 'red',
					x: '10px',
					y: '10px'
				})
				.text("ERROR! " + String(e.stack));
		}

		return builder;
	}
};
