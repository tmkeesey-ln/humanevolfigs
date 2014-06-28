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

var TIME_START = -7246000;

var FIGURE_HEIGHT = 1050;

var FIGURE_WIDTH = 800;

var MARGIN = 25;

var TOP_MARGIN = 75;

var LABELS: { [name: string]: LabelInfo; } = {
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
	"Australopithecus & Paranthropus": {
		italic: true,
		position: LabelPosition.LEFT
	},
	"Praeanthropus & Kenyanthropus": {
		italic: true,
		position: LabelPosition.RIGHT
	},
	"Homo floresiensis": {
		italic: true,
		position: LabelPosition.BOTTOM
	},
	"Homo habilis & rudolfensis": {
		italic: true,
		position: LabelPosition.BOTTOM_RIGHT
	},
	/*
	"Homo erectus & ergaster": {
		italic: true,
		position: LabelPosition.BOTTOM_RIGHT
	},
	*/
	"Homo ergaster": {
		italic: true,
		position: LabelPosition.RIGHT
	},
	/*
	"Homo erectus": {
		italic: true,
		position: LabelPosition.TOP_LEFT
	},
	"Homo heidelbergensis": {
		italic: true,
		position: LabelPosition.RIGHT
	},
	*/
	"Homo erectus & heidelbergensis": {
		italic: true,
		position: LabelPosition.RIGHT
	},
	/*
	"Homo neanderthalensis": {
		text: "Neandertals",
		position: LabelPosition.BOTTOM_RIGHT
	},
	"Homo sapiens": {
		text: "humans",
		position: LabelPosition.TOP
	}
	*/
	"humans & Neandertals": {
		position: LabelPosition.TOP
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
			y = area.bottom + 12;
			break;
		case LabelPosition.TOP:
		case LabelPosition.TOP_LEFT:
		case LabelPosition.TOP_RIGHT:
			y = area.top - 2;
			break;
		case LabelPosition.LEFT:
		case LabelPosition.RIGHT:
			y = area.centerY + 6;
			break;
		default:
			throw new Error("Invalid position: " + info.position);
	}
	var text = builder.child(Haeckel.SVG_NS, 'text')
		.text(info.text || name)
		.attrs({
			'fill': Haeckel.BLACK.hex,
			'fill-opacity': '0.5',
			'font-size': '12px',
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

function getCCMatrix(sources: Haeckel.DataSources, taxon: Haeckel.Taxic): Haeckel.CharacterMatrix<Haeckel.Set>
{
	function addFromMatrix(matrix: Haeckel.CharacterMatrix<Haeckel.Set>,
		character: Haeckel.Character<Haeckel.Set>,
		factor: number = 1,
		characterIndex: number = 0)
	{
		var char = matrix.characterList[characterIndex];
		Haeckel.ext.each(matrix.taxon.units, (unit: Haeckel.Taxic) =>
		{
			var range = <Haeckel.Range> Haeckel.chr.states(matrix, unit, char);
			cmBuilder.states(unit, character, Haeckel.rng.multiply(range, factor));
		});
	}

	function addOccurrenceFromMatrix(matrix: Haeckel.CharacterMatrix<Haeckel.Set>,
		timeCharacterIndex: number = 0,
		timeFactor: number = 1)
	{
		function getHigherTaxonTime(taxon: Haeckel.Taxic): Haeckel.Range
		{
			var imPrcsList: Haeckel.ExtSet<Haeckel.Taxic>[] = [];
			Haeckel.ext.each(taxon.units, (unit: Haeckel.Taxic) =>
			{
				imPrcsList.push(solver.dagSolver.imPrcs(unit));
			});
			var imPrcs = Haeckel.ext.union(imPrcsList);
			var higherTaxon = solver.sucUnion(Haeckel.tax.union(Haeckel.ext.list(imPrcs)));
			var time = <Haeckel.Range> Haeckel.chr.states(matrix, higherTaxon, char);
			if (!time && !Haeckel.equal(taxon, higherTaxon))
			{
				return getHigherTaxonTime(higherTaxon);
			}
			return time;
		}

		var char = matrix.characterList[timeCharacterIndex];
		Haeckel.ext.each(matrix.taxon.units, (unit: Haeckel.Taxic) =>
		{
			var time = <Haeckel.Range> Haeckel.chr.states(matrix, unit, char);
			if (!time)
			{
				time = getHigherTaxonTime(unit);
			}
			if (time && timeFactor !== 1)
			{
				time = Haeckel.rng.multiply(time, timeFactor);
			}
			cmBuilder.states(unit, Haeckel.TIME_CHARACTER, time);
			cmBuilder.states(unit, Haeckel.COUNT_CHARACTER, Haeckel.RANGE_1);
			var occurrence = Haeckel.occ.create(Haeckel.RANGE_1, null, time);
			cmBuilder.states(unit, Haeckel.OCCURRENCE_CHARACTER, Haeckel.ext.create<Haeckel.Occurrence>([ occurrence ]));
		});
	}

	var solver = new Haeckel.PhyloSolver(sources.sources["data/compiled/phylogeny.json"].phylogenies["allTaxa"]);
	var cmBuilder = new Haeckel.CharacterMatrixBuilder<Haeckel.Set>();
	var ccChar = Haeckel.chr.createRange(Haeckel.rng.create(0, 2000), true, true, "Endocranial Volume (cc)");
	cmBuilder.addListed(ccChar);
	cmBuilder.addListed(Haeckel.TIME_CHARACTER);
	cmBuilder.addListed(Haeckel.COUNT_CHARACTER);

	addFromMatrix(sources.sources['data/2002 - Brunet & al.json'].characterMatrices['Differential diagnosis'], ccChar);
	addFromMatrix(sources.sources['data/2004 - Begun & Kordos.json'].characterMatrices['Table 14.2'], ccChar, 1.14);
	addFromMatrix(sources.sources['data/2004 - Brown & al.json'].characterMatrices['Description-modified'], ccChar);
	addFromMatrix(sources.sources['data/2004 - Holloway & al.json'].characterMatrices['Appendix I Part 1'], ccChar);
	addFromMatrix(sources.sources['data/2009 - Suwa & al.json'].characterMatrices['Discussion'], ccChar);
	addFromMatrix(sources.sources['data/2010 - Berger & al.json'].characterMatrices['Discussion'], ccChar);
	addFromMatrix(sources.sources['data/2013 - Lordkipanidze & al.json'].characterMatrices['Abstract'], ccChar);

	cmBuilder.states(sources.nomenclature.nameMap['Homo sapiens sapiens (living)'], ccChar, Haeckel.rng.create(1040, 1595));
	// 90% of living humans fit in this range.
	// from Burenhult G. (1993): The first humans: human origins and history to 10,000 BC. New York: HarperCollins.

	cmBuilder.inferStates(solver.dagSolver, sources.nomenclature.nameMap['Hylobatidae']);

	addOccurrenceFromMatrix(sources.sources['data/2002 - Brunet & al.json'].characterMatrices['Abstract'], 0, 1000000);
	addOccurrenceFromMatrix(sources.sources['data/2004 - Brown & al.json'].characterMatrices['Description-modified'], 1, 1000);
	addOccurrenceFromMatrix(sources.sources['data/2004 - Holloway & al.json'].characterMatrices['Appendix I Part 1'], 1, -1000000);
	addOccurrenceFromMatrix(sources.sources['data/2009 - Suwa & al.json'].characterMatrices['Discussion'], 1, 1000000);
	addOccurrenceFromMatrix(sources.sources['data/2010 - Berger & al.json'].characterMatrices['Discussion'], 1, 1000000);
	addOccurrenceFromMatrix(sources.sources['data/2013 - Lordkipanidze & al.json'].characterMatrices['Abstract'], 1, -1000000);

	//cmBuilder.addMatrix(sources.sources["data/compiled/characters.json"].occurrences);
	cmBuilder.removeTaxon(Haeckel.tax.setDiff(cmBuilder.taxon, taxon));
	return cmBuilder.build();
}

function getCCRange(matrix: Haeckel.CharacterMatrix<Haeckel.Set>)
{
	var ccChar = matrix.characterList[0];
	var ccRange = <Haeckel.Range> Haeckel.chr.states(matrix, matrix.taxon, ccChar);
	return Haeckel.rng.create(0, Math.ceil(ccRange.max / 100) * 100);
}

function getCCRatioMap(matrix: Haeckel.CharacterMatrix<Haeckel.Set>, range: Haeckel.Range, nomenclature: Haeckel.Nomenclature): (vertex: Haeckel.Taxic) => Haeckel.Range
{
	var ccChar = matrix.characterList[0];
	var ccRange = range;

	return (vertex: Haeckel.Taxic) =>
	{
		var range = <Haeckel.Range> Haeckel.chr.states(matrix, vertex, ccChar);
		if (range && !range.empty)
		{
			range = Haeckel.rng.multiply(Haeckel.rng.add(range, -ccRange.min), 1 / ccRange.size);
		}
		if (!range || range.empty)
		{
			//throw new Error("No range for " + Haeckel.ext.list(Haeckel.nom.forTaxon(nomenclature, vertex)).join('/') + '.');
			return Haeckel.RANGE_0_TO_1;
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
        'data/2002 - Brunet & al.json',
        'data/2004 - Begun & Kordos.json',
        'data/2004 - Brown & al.json',
        'data/2004 - Holloway & al.json',
        'data/2009 - Suwa & al.json',
        'data/2010 - Berger & al.json',
        'data/2013 - Lordkipanidze & al.json',
        'data/2014 - ICS.json'
	],

	render: (builder: Haeckel.ElementBuilder, sources: Haeckel.DataSources, defs: () => Haeckel.ElementBuilder, pngAssets: Haeckel.PNGAssets) =>
	{
        var AREA = Haeckel.rec.createFromCoords(MARGIN + 24, TOP_MARGIN, FIGURE_WIDTH - MARGIN - 24, FIGURE_HEIGHT);
        var TIME = Haeckel.rng.create(TIME_START, 0);
		var chart = new Haeckel.ChronoChart();
		chart.area = AREA;
		chart.time = TIME;
		var nameMap = sources.nomenclature.nameMap;
        var taxon = nameMap['Hominina'];
        var matrix: Haeckel.CharacterMatrix<Haeckel.Set>;
        var ccRange: Haeckel.Range;
        var horizontalRatioMap: (vertex: Haeckel.Taxic) => Haeckel.Range;

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

		function createChartClipPath()
		{
	        defs().child(Haeckel.SVG_NS, 'clipPath')
	        	.attr(Haeckel.SVG_NS, 'id', 'chart-area')
	        	.child(Haeckel.SVG_NS, 'rect')
	        	.attrs(Haeckel.SVG_NS, {
	        		x: AREA.left + 'px',
	        		y: AREA.top + 'px',
	        		width: AREA.width + 'px',
	        		height: (AREA.height + MARGIN) + 'px'
	        	});
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

		function drawGoalposts(g: Haeckel.ElementBuilder)
		{
			function drawRange(taxonName: string, label: string)
			{
				var range = <Haeckel.Range> Haeckel.chr.states(matrix, nameMap[taxonName], ccChar);
				if (!range)
				{
					throw new Error("No range for " + taxonName + ".");
				}
				range = Haeckel.rng.multiply(Haeckel.rng.add(range, -ccRange.min), 1 / ccRange.size);

				g.child(Haeckel.SVG_NS, 'rect')
					.attrs(Haeckel.SVG_NS, {
						fill: Haeckel.BLACK.hex,
						'fill-opacity': '0.05',
						stroke: 'none',/*Haeckel.BLACK.hex,
						'stroke-opacity': '0.1',
						'stroke-width': '2px',
						'stroke-dasharray': '2 6',*/
						x: (AREA.left + range.min * AREA.width) + 'px',
						y: '-1px',
						width: (range.size * AREA.width) + 'px',
						height: (FIGURE_HEIGHT + 2) + 'px'
					});
				g.child(Haeckel.SVG_NS, 'text')
					.text(label)
					.attrs(Haeckel.SVG_NS, {
						fill: Haeckel.BLACK.hex,
						'fill-opacity': '0.333',
						x: (AREA.left + range.mean * AREA.width) + 'px',
						y: (MARGIN + 8) + 'px',
						'text-anchor': 'middle',
						'font-size': '16px',
						'font-family': 'Myriad Pro',
						'font-weight': 'bold'
					});
			}

			var ccChar = matrix.characterList[0];
			drawRange('Pan', 'chimpanzee range');
			drawRange('Homo sapiens', 'human range');
		}

		function drawStrata(g: Haeckel.ElementBuilder)
		{
			var top = chart.getTimeY(Haeckel.RANGE_0);
			g.child(Haeckel.SVG_NS, 'rect')
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
			//var boundaries = new Haeckel.ExtSetBuilder<Haeckel.Range>();
			Haeckel.arr.each(series, (stratum: Haeckel.Stratum) =>
			{
				var startY = chart.getTimeY(stratum.start);
				var endY = chart.getTimeY(stratum.end);
				g.child(Haeckel.SVG_NS, 'line')
						.attrs({
							stroke: Haeckel.BLACK.hex,
							'stroke-opacity': '0.5',
							'stroke-width': '1px',
							x1: '0px',
							y1: startY.mean + 'px',
							x2: FIGURE_WIDTH + 'px',
							y2: startY.mean + 'px'
						});
				//boundaries.add(startY);
				var yRange = Haeckel.rng.create(endY.mean, Math.min(FIGURE_HEIGHT, startY.mean));
				var text = g.child(Haeckel.SVG_NS, 'text')
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
			var fillStratum = true;
			Haeckel.arr.each(stages, (stratum: Haeckel.Stratum) =>
			{
				var startY = chart.getTimeY(stratum.start);
				var endY = chart.getTimeY(stratum.end);
				if (fillStratum)
				{
					g.child(Haeckel.SVG_NS, 'rect')
							.attrs({
								stroke: 'none',
								fill: Haeckel.BLACK.hex,
								'fill-opacity': '0.1',
								x: '0px',
								y: endY.mean + 'px',
								width: FIGURE_WIDTH + 'px',
								height: (startY.mean - endY.mean) + 'px'
							});
				}
				fillStratum = !fillStratum;
			});
		}

		function drawTimes(linesGroup: Haeckel.ElementBuilder, textGroup: Haeckel.ElementBuilder)
		{
			var TIME_INCREMENT = -1000000;
			for (var time = Math.ceil(TIME.max / TIME_INCREMENT) * TIME_INCREMENT; time >= TIME.min; time += TIME_INCREMENT)
			{
				var y = chart.getTimeY(Haeckel.rng.create(time, time)).mean;
				linesGroup.child(Haeckel.SVG_NS, 'rect')
					.attrs({
						fill: Haeckel.BLACK.hex,
						'fill-opacity': '0.15',
						stroke: 'none',
						x: '0px',
						y: (y - 0.5) + 'px',
						width: FIGURE_WIDTH + 'px',
						height: '1px'
					});
				textGroup.child(Haeckel.SVG_NS, 'text')
					.text(time === 0 ? 'present' : Math.round(time / -1000000) + ' Mya')
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

		function labelTaxa(linesGroup: Haeckel.ElementBuilder, textGroup: Haeckel.ElementBuilder)
		{
			var name: string;
			for (name in LABELS)
			{
				var labelInfo = LABELS[name];
				if (!labelInfo.area)
				{
					continue;
				}

				var rect = Haeckel.rec.create(labelInfo.area.x - 10, labelInfo.area.y - 10, labelInfo.area.width + 20, labelInfo.area.height + 20);

				linesGroup.child(Haeckel.SVG_NS, 'rect')
					.attrs(Haeckel.SVG_NS, {
						x: rect.left + 'px',
						y: rect.top + 'px',
						width: rect.width + 'px',
						height: rect.height + 'px',
						rx: '10px',
						ry: '10px',
						fill: 'none',//Haeckel.BLACK.hex,
						//'fill-opacity': '0.05',
						stroke: Haeckel.BLACK.hex,
						'stroke-opacity': '0.333',
						'stroke-dasharray': '6 3'
					});

				drawLabel(textGroup, name, labelInfo, rect);
			}
		}

		function labelXAxis(linesGroup: Haeckel.ElementBuilder, textGroup: Haeckel.ElementBuilder)
		{
			for (var cc = 0; cc <= ccRange.max; cc += 100)
			{
				var x = AREA.left + cc * AREA.width / ccRange.max;
				linesGroup.child(Haeckel.SVG_NS, 'line')
					.attrs(Haeckel.SVG_NS, {
						x1: x + 'px',
						y1: '0px',
						x2: x + 'px',
						y2: FIGURE_HEIGHT + 'px',
						stroke: Haeckel.BLACK.hex,
						'stroke-width': '0.5px',
						'stroke-opacity': '0.2'
					});
				textGroup.child(Haeckel.SVG_NS, 'text')
					.text(cc + 'cc')
					.attrs(Haeckel.SVG_NS, {
						x: x + 'px',
						y: '16px',
						fill: Haeckel.BLACK.hex,
						'fill-opacity': '0.333',
						'font-family': 'Myriad Pro',
						'font-size': '11px',
						'text-anchor': 'middle',
						'font-weight': 'bold'
					});
			}
		}

		function plotOtherOccurrences(g: Haeckel.ElementBuilder)
		{
			var chart = new Haeckel.OccurrencePlotChart();
			chart.area = AREA;
			var cmBuilder = new Haeckel.CharacterMatrixBuilder<Haeckel.Set>();
			var occurrences = sources.sources["data/compiled/characters.json"].occurrences;
			cmBuilder.addMatrix(occurrences);
			cmBuilder.removeTaxon(Haeckel.tax.setDiff(occurrences.taxon, taxon));
			chart.characterMatrix = cmBuilder.build();
			chart.horizontalRatioMap = horizontalRatioMap;
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
						x: (point.x - 1) + 'px',
						y: (point.y - 1) + 'px',
						width: '2px',
						height: '2px',
						fill: Haeckel.BLACK.hex,
						stroke: 'none'
					});
			};
			chart.random = Haeckel.seedRandom(0);
			chart.time = TIME;
			chart.render(g)
				.attr(Haeckel.SVG_NS, 'clip-path', 'url(#chart-area)');
		}

		function plotStrictOccurrences(g: Haeckel.ElementBuilder)
		{
			var chart = new Haeckel.OccurrencePlotChart();
			chart.area = AREA;
			chart.characterMatrix = matrix;
			chart.horizontalRatioMap = horizontalRatioMap;
			chart.drawArea = (builder: Haeckel.ElementBuilder, area: Haeckel.Rectangle, taxon: Haeckel.Taxic) =>
			{
				var point = Haeckel.pt.create(area.centerX, area.centerY);
				chart.drawPoint(builder, point, taxon);
			};
			chart.drawPoint = (builder: Haeckel.ElementBuilder, point: Haeckel.Point, taxon: Haeckel.Taxic) =>
			{
				addToLabelRect(taxon, Haeckel.rec.create(point.x - 4, point.y - 4, 8, 8));
				/*
				builder.child(Haeckel.SVG_NS, 'circle')
					.attrs(Haeckel.SVG_NS, {
						cx: point.x + 'px',
						cy: point.y + 'px',
						r: '4.5px',
						fill: Haeckel.BLACK.hex,
						stroke: 'none',
						'fill-opacity': '0.2'
					});
				*/
				builder.child(Haeckel.SVG_NS, 'circle')
					.attrs(Haeckel.SVG_NS, {
						cx: point.x + 'px',
						cy: point.y + 'px',
						r: '4px',
						fill: Haeckel.WHITE.hex,
						stroke: Haeckel.BLACK.hex,
						'stroke-width': '2px'
					});
			};
			chart.random = Haeckel.seedRandom(0);
			chart.time = TIME;
			chart.render(g);
			//	.attr(Haeckel.SVG_NS, 'clip-path', 'url(#chart-area)');
		}

		try
		{
        	matrix = getCCMatrix(sources, nameMap['Hominini']);

        	/*
        	var writer = new Haeckel.CharacterScoresWriter();
        	writer.nomenclature = sources.nomenclature;
        	var data = writer.write(matrix);
        	throw new Error(JSON.stringify(data));
        	*/

        	ccRange = getCCRange(matrix);
        	horizontalRatioMap = getCCRatioMap(matrix, ccRange, sources.nomenclature);

        	createChartClipPath();
        	drawBackground();
        	var guides = builder.child(Haeckel.SVG_NS, 'g');
        	var plots = builder.child(Haeckel.SVG_NS, 'g');
        	var labels = builder.child(Haeckel.SVG_NS, 'g');
			drawStrata(guides.child(Haeckel.SVG_NS, 'g'));
			drawGoalposts(guides.child(Haeckel.SVG_NS, 'g'));
			//drawTimes(guides.child(Haeckel.SVG_NS, 'g'), labels.child(Haeckel.SVG_NS, 'g'));
			plotOtherOccurrences(plots.child(Haeckel.SVG_NS, 'g'));
			plotStrictOccurrences(plots.child(Haeckel.SVG_NS, 'g'));
			labelTaxa(guides.child(Haeckel.SVG_NS, 'g'), labels.child(Haeckel.SVG_NS, 'g'));
			labelXAxis(guides.child(Haeckel.SVG_NS, 'g'), labels.child(Haeckel.SVG_NS, 'g'));
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
