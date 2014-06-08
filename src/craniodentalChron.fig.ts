/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>

enum LabelPosition
{
	LEFT,
	RIGHT,
	TOP,
	BOTTOM
}

interface LabelInfo
{
	text?: string;
	italic?: boolean;
	position: LabelPosition;
	area?: Haeckel.Rectangle;
}

var MIN_RANGE_SIZE = 0.05;

var MAX_RANGE_SIZE = 0.2;

var TIME_START = -7246000;//-23030000;

var FIGURE_HEIGHT = 1050;

var FIGURE_WIDTH = 800;

var MARGIN = 25;

var LABELS: { [name: string]: LabelInfo; } = {
	"Ponginae": {
		text: "orangutans &\nstem-orangutans",
		position: LabelPosition.RIGHT
	},
	"Oreopithecus": {
		italic: true,
		position: LabelPosition.TOP
	},
	"Gorilla": {
		text: 'gorillas',
		position: LabelPosition.BOTTOM
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
		position: LabelPosition.RIGHT
	},
	"Paranthropus": {
		italic: true,
		position: LabelPosition.TOP
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
		position: LabelPosition.BOTTOM
	}
};

function getCraniodentalDistance(sources: Haeckel.DataSources): Haeckel.DistanceMatrix<Haeckel.Taxic>
{
	var nameMap = sources.nomenclature.nameMap;
	var solver = new Haeckel.PhyloSolver(sources.sources["data/2004 - Strait & Grine.json"].phylogenies["Fig4a"]);
	var specifiers = Haeckel.tax.union([ nameMap["Homo sapiens sapiens (living)"], nameMap["Pongo pygmaeus"] ]);
	var outgroup = Haeckel.tax.union([ nameMap['Colobus guereza'], nameMap['Papio'] ]);
	var source = sources.sources["data/2004 - Strait & Grine.json"];
	var cmBuilder = new Haeckel.CharacterMatrixBuilder<Haeckel.Set>();
	cmBuilder.addMatrix(source.characterMatrices["Table3-modified"]);
	cmBuilder.inferStates(solver.dagSolver, outgroup);
	solver = new Haeckel.PhyloSolver(sources.sources["data/compiled/phylogeny.json"].phylogenies["allTaxa"]);
	cmBuilder.inferStates(solver.dagSolver, outgroup);
	return Haeckel.chr.toDistanceMatrix(cmBuilder.build(), specifiers);
}

function distanceMatrixToRatioMap<T>(matrix: Haeckel.DistanceMatrix<T>, low: T, high: T, rangeSize: Haeckel.Range): (vertex: T) => Haeckel.Range
{
	matrix = Haeckel.dst.normalize(matrix);
	var builder = new Haeckel.DistanceMatrixBuilder<T>();
	Haeckel.ext.each(matrix.members, (vertex: T) =>
	{
		var lowDist = Haeckel.dst.get(matrix, vertex, low);
		var highDist = Haeckel.dst.get(matrix, vertex, high);
		var range = Haeckel.rng.create(lowDist.min + 1 - highDist.max, lowDist.max + 1 - highDist.min);
		builder.addRange(low, vertex, range);
	});
	matrix = Haeckel.dst.normalize(builder.build());

	return (vertex: T) => 
	{
		var range = Haeckel.dst.get(matrix, low, vertex);
		if (range.size < rangeSize.min)
		{
			return Haeckel.rng.create(range.mean - rangeSize.min / 2, range.mean + rangeSize.min / 2);
		}
		else if (range.size > rangeSize.max)
		{
			return Haeckel.rng.create(range.mean - rangeSize.max / 2, range.mean + rangeSize.max / 2);
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
        'data/2004 - Strait & Grine.json',
        'data/2014 - ICS.json'
	],

	render: (builder: Haeckel.ElementBuilder, sources: Haeckel.DataSources, defs: () => Haeckel.ElementBuilder, pngAssets: Haeckel.PNGAssets) =>
	{
        var AREA = Haeckel.rec.createFromCoords(MARGIN + 24, MARGIN, FIGURE_WIDTH - MARGIN, FIGURE_HEIGHT);
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
							x1: '0px',
							y1: endY.mean + 'px',
							x2: FIGURE_WIDTH + 'px',
							y2: endY.mean + 'px'
						});
				boundaries.add(endY);
				if ((startY.mean - endY.mean) > 16)
				{
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
					var y = Math.min((startY.mean + endY.mean) / 2, FIGURE_HEIGHT - MARGIN - box.width / 2);
					text.attr(Haeckel.SVG_NS, 'transform',
						'translate(' + (MARGIN + 12) + ',' + y + ') rotate(-90)');
				}
			});
			Haeckel.arr.each(stages, (stratum: Haeckel.Stratum) =>
			{
				var endY = chart.getTimeY(stratum.end);
				if (boundaries.contains(endY))
				{
					return;
				}
				//var startY = chart.getTimeY(stratum.start);
				group.child(Haeckel.SVG_NS, 'line')
						.attrs({
							stroke: Haeckel.BLACK.hex,
							'stroke-opacity': '0.25',
							'stroke-dasharray': '4 2',
							'stroke-width': '1px',
							x1: '0px',
							y1: endY.mean + 'px',
							x2: FIGURE_WIDTH + 'px',
							y2: endY.mean + 'px'
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

				// :TODO: text labels
				group.child(Haeckel.SVG_NS, 'rect')
					.attrs(Haeckel.SVG_NS, {
						x: (labelInfo.area.x - 10) + 'px',
						y: (labelInfo.area.y - 10) + 'px',
						width: (labelInfo.area.width + 20) + 'px',
						height: (labelInfo.area.height + 20) + 'px',
						rx: '10px',
						ry: '10px',
						fill: 'none',//Haeckel.BLACK.hex,
						//'fill-opacity': '0.05',
						'stroke': Haeckel.BLACK.hex,
						'stroke-opacity': '0.5',
						'stroke-dasharray': '1 3'
					});
			}
		}

		function plotOccurrences()
		{
	        var distance = getCraniodentalDistance(sources);
	        var nameMap = sources.nomenclature.nameMap;

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
			chart.characterMatrix = sources.sources["data/compiled/characters.json"].occurrences;
			chart.horizontalRatioMap = distanceMatrixToRatioMap(distance,
				nameMap["Pongo pygmaeus"],
				nameMap["Homo sapiens sapiens (living)"],
				Haeckel.rng.create(MIN_RANGE_SIZE, MAX_RANGE_SIZE));
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

/*

		
		var strata = sources.getDataSource("2012 - ICS").strata;
		
		var stratChart = new Haeckel.StratChart();
		stratChart.copyFrom(chart);
		stratChart.strata = strata;
		stratChart.type = "series/epoch";
		var stratLines = stratChart.render(paper);
		console.log('STRAT LINES', stratLines);
		stratLines.forEach(function(element: raphaeljs.Element)
		{
			if ((<Haeckel.Range> element.data('yRange')).mean === area.top)
			{
				element.remove();
				return false;
			}
		});
		
		var coreLufengpithecus = Haeckel.tax.setDiff(Haeckel.taxon('Lufengpithecus'), Haeckel.taxon('Lufengpithecus wushanensis'));

		var regionChart = new Haeckel.RegionChart();
		regionChart.copyFrom(chart);
		regionChart.labels = function(taxon: Haeckel.Taxic): Haeckel.RegionLabel
		{
			if (Haeckel.equal(taxon, Haeckel.taxon('Homo')))
			{
				return { angle: Haeckel.degrees(110), attrs: {'font-size': '24px', 'font-style': 'italic', 'text-anchor': 'middle'}, label: 'Homo'};
			}
			if (Haeckel.equal(taxon, Haeckel.taxon('Paranthropus')))
			{
				return { angle: Haeckel.degrees(-90), attrs: {'font-size': '20px', 'font-style': 'italic', 'text-anchor': 'middle'}, label: 'Paranthropus'};
			}
			if (Haeckel.equal(taxon, Haeckel.taxon('Australopithecus')))
			{
				return { angle: Haeckel.degrees(55), attrs: {'font-size': '20px', 'font-style': 'italic', 'text-anchor': 'start'}, label: 'Australopithecus'};
			}
			if (Haeckel.equal(taxon, Haeckel.taxon('Ardipithecus')))
			{
				return { angle: Haeckel.degrees(65), attrs: {'font-size': '18px', 'font-style': 'italic', 'text-anchor': 'start'}, label: 'Ardipithecus'};
			}
			if (Haeckel.equal(taxon, Haeckel.taxon('Orrorin')))
			{
				return { angle: 0, attrs: {'font-size': '14px', 'font-style': 'italic', 'text-anchor': 'start'}, label: 'Orrorin'};
			}
			if (Haeckel.equal(taxon, Haeckel.taxon('Sahelanthropus')))
			{
				return { angle: 0, attrs: {'font-size': '12px', 'font-style': 'italic', 'text-anchor': 'middle'}, label: 'Sahelanthropus'};
			}
			if (Haeckel.equal(taxon, Haeckel.taxon('Pan')))
			{
				return { angle: Haeckel.degrees(90), attrs: {'font-size': '16px', 'text-anchor': 'middle'}, label: 'chimpanzees'};
			}
			if (Haeckel.equal(taxon, Haeckel.taxon('Gorilla')))
			{
				return { angle: Haeckel.degrees(90), attrs: {'font-size': '16px', 'text-anchor': 'middle'}, label: 'gorillas'};
			}
			if (Haeckel.equal(taxon, Haeckel.taxon('Pongo')))
			{
				return { angle: Haeckel.degrees(10), attrs: {'font-size': '16px', 'text-anchor': 'middle'}, label: 'orangutans'};
			}
			if (Haeckel.equal(taxon, Haeckel.taxon('Gigantopithecus blacki')))
			{
				return { angle: Haeckel.degrees(90), attrs: {'font-size': '14px', 'font-style': 'italic', 'text-anchor': 'middle'}, label: 'Gigantopithecus\nblacki'};
			}
			if (Haeckel.equal(taxon, Haeckel.taxon('Lufengpithecus wushanensis')))
			{
				return { angle: Haeckel.degrees(90), attrs: {'font-size': '12px', 'font-style': 'italic', 'text-anchor': 'middle'}, label: 'Lufengpithecus?\nwushanensis'};
			}
			if (Haeckel.equal(taxon, coreLufengpithecus))
			{
				return { angle: Haeckel.degrees(-90), attrs: {'font-size': '14px', 'font-style': 'italic', 'text-anchor': 'middle'}, label: 'Lufengpithecus'};
			}
			if (Haeckel.equal(taxon, Haeckel.taxon('Khoratpithecus')))
			{
				return { angle: Haeckel.degrees(-90), attrs: {'font-size': '14px', 'font-style': 'italic', 'text-anchor': 'middle'}, label: 'Khoratpithecus'};
			}
		};
		regionChart.minPointDistance = 4;
		regionChart.pointsPerRegion = 720;
		regionChart.smoothing = 12;
		regionChart.margin = 12;
		regionChart.taxa = [regionTaxon('Homo', 'Homo sapiens sapiens'), regionTaxon('Paranthropus', 'Paranthropus robustus'),
			regionTaxon('Australopithecus', 'Australopithecus africanus'), regionTaxon('Ardipithecus', 'Ardipithecus ramidus'),
			regionTaxon('Orrorin'), regionTaxon('Sahelanthropus'), regionTaxon('Pan', 'Pan troglodytes troglodytes'), regionTaxon('Gorilla', 'Gorilla gorilla gorilla'),
			regionTaxon('Gigantopithecus blacki'), regionTaxon('Lufengpithecus wushanensis'), { taxon: coreLufengpithecus, type: Haeckel.taxon('Lufengpithecus lufengensis') },
			regionTaxon('Khoratpithecus', 'Khoratpithecus piriyai'), regionTaxon('Pongo', 'Pongo pygmaeus')];
		regionChart.render(paper)
			.attr('font-family', humevolfigs.STYLE['font-family']);
		
		var stratLabeler = new Haeckel.StratLabeler();
		stratLabeler.chart = stratChart;
		stratLabeler.fontSize = 24;
		stratChart.type = "series/epoch";
		var stratLabels = stratLabeler.render(paper);
		stratLabels.attr({/*'fill-opacity': 0.5,*/ /*'font-family': humevolfigs.STYLE['font-family']});

		stratLabeler.fontSize = 12;
		stratLabeler.margin += 20;
		stratChart.type = "stage/age";
		stratLabels = stratLabeler.render(paper);
		stratLabels.forEach(function(element: raphaeljs.Element)
		{
			if (String(element.attr('text')) !== 'Messinian')
			{
				element.remove();
			}
			else
			{
				element.attr('text', '(Messinian)');
			}
		});
		stratLabels.attr({/*'fill-opacity': 0.5,*/ /*'font-family': humevolfigs.STYLE['font-family']});

		var plots = chart.render(paper);
		plots.forEach(function(element: raphaeljs.Element)
		{
			if (!element.data("withinMinimum"))
			{
				element.remove();
			}
			else
			{
				var taxon = element.data('taxon');
				var name = Haeckel.list(Haeckel.names(taxon)).join("/");
				element.attr('title', name);
				$(element.node).mouseover(function()
				{
					console.log('TAXON', name);
				});
			}
		});
		console.log("Plots:", plots);
		
		/*
		var names = Haeckel.set("Homo", "Homo floresiensis", "chimpanzees", "Australopithecus",
			"Paranthropus", "Ardipithecus", "Orrorin", "Sahelanthropus");
		
		var labeler = new Haeckel.VectorChronoLabeler();
		labeler.chart = chart;
		var labelVectors =
		{
			"Homo": Haeckel.vector(0, 120),
			"Homo floresiensis": Haeckel.vector(Haeckel.degrees(45), 15),
			"chimpanzees": Haeckel.vector(0, 0),
			"Paranthropus": Haeckel.vector(Haeckel.degrees(-90), 100),
			"Australopithecus": Haeckel.vector(Haeckel.degrees(22.5), 125),
			"Ardipithecus": Haeckel.vector(Haeckel.degrees(-70), 50),
			"Orrorin": Haeckel.vector(0, 50),
			"Sahelanthropus": Haeckel.vector(0, 75)
		};
		labeler.nameVectorMap = function(name: string)
		{
			return <Haeckel.Vector> labelVectors[name];
		};
		labeler.names = names;
		labeler.nomenclature = nomenclature;
		labeler.sizeMap = function(area: number): number
		{
			console.log("AREA", area);
			return Math.min(32, Math.max(14, area / 275));
		};
		var taxonLabels = labeler.render(paper);
		taxonLabels.attr('font-family', humevolfigs.STYLE['font-family']);
		taxonLabels.forEach(function(element: raphaeljs.Element)
		{
			var name = element.data("name");
			var c = name.charAt(0);
			if (c == c.toUpperCase())
			{
				element.attr('font-style', 'italic');
			}
		});
		console.log("Taxon labels:", taxonLabels);
		*/
		/*
		chart = null;
		
		// border
		paper.rect(0, 0, paper.width, area.y)
			.attr({'fill': '#FFFFFF', 'stroke-opacity': 0});
		paper.rect(0, area.bottom, paper.width, paper.height - area.bottom)
			.attr({'fill': '#FFFFFF', 'stroke-opacity': 0});
		paper.rect(0, 0, area.x, paper.height)
			.attr({'fill': '#FFFFFF', 'stroke-opacity': 0});
		paper.rect(area.right, 0, paper.width - area.right, paper.height)
			.attr({'fill': '#FFFFFF', 'stroke-opacity': 0});
		paper.rect(area.x - 1, area.y - 1, area.width + 2, area.height + 2)
			.attr({'fill-opacity': 0, 'stroke-opacity': 1, 'stroke-linejoin': 'miter', 'stroke-linecap': 'square', 'stroke-width': 2});

		//outer labels
		var bottomLabelAttrs = { 'font-size': '12px', 'font-family': humevolfigs.STYLE['font-family'] };
		paper.text(area.left, area.bottom + 12, '\u2190 skull & teeth more orangutan-like')
			.attr(bottomLabelAttrs)
			.attr('text-anchor', 'start');
		paper.text(area.right, area.bottom + 12, 'skull & teeth more human-like \u2192')
			.attr(bottomLabelAttrs)
			.attr('text-anchor', 'end');

		console.log("Completed Craniodental Chronology figure.")
	};
}

humevolfigs.setFigure("craniodentalChronology", humevolfigs.figs.craniodentalChronology);
*/