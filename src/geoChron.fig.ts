/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>

var CONNECTION_THICKNESS = 3;

var CONNECTION_OFFSET = 4.33;

var EXTANT_TAXON_LABEL_SIZE = 0;//12;

var EXTENT_ATTRS: { [name: string]: string; } = {
	stroke: '#000000',
	'stroke-width': '1px',
	'stroke-linecap': 'square'
};

var MARGIN_BOTTOM = 20;

var MARGIN_TOP = 50;

var SILHOUETTE_SCALE = 0.25;

var SILHOUETTES = [
	'assets/silhouettes/Pongo pygmaeus (female, climbing).svg',
	'assets/silhouettes/Lufengpithecus hudienensis.svg',

	'assets/silhouettes/Gorilla gorilla (female, quadrupedal).svg',
	'assets/silhouettes/Pan paniscus.svg',

	'assets/silhouettes/Ardipithecus ramidus.svg',
	'assets/silhouettes/Paranthropus boisei (male).svg',

	'assets/silhouettes/Homo rudolfensis.svg',
	'assets/silhouettes/Homo floresiensis.svg',

	'assets/silhouettes/Homo ergaster ergaster.svg',
	'assets/silhouettes/Homo erectus pekinensis.svg',

	'assets/silhouettes/Homo heidelbergensis rhodesiensis.svg',
	'assets/silhouettes/Homo neanderthalensis (female).svg',
	
	'assets/silhouettes/Homo sapiens sapiens (female, walking).svg',
	'assets/silhouettes/Homo sapiens sapiens (male, running).svg'
];

var SPACING = 20;

var TAXON_LABEL_SIZE = 15;

var TEXT_MARGIN = 4;

var TIME_LABEL_SIZE = 12;

var TIME_LABEL_ATTRS: { [name: string]: string; } = {
	'font-size': TIME_LABEL_SIZE + 'px',
	'font-weight': 'bold',
	"font-family": "Myriad Pro"
};

var XLINK_NS = "http://www.w3.org/1999/xlink";

var FIGURE_HEIGHT = 700;

var FIGURE_WIDTH = 950;

interface CellPosition
{
	column: number;
	row: number;
}

var FIGURE_TO_RENDER: Haeckel.Figure = 
{
	height: FIGURE_HEIGHT,
	width: FIGURE_WIDTH,

	assets: {
		png: ['assets/worldmap_popdensity.png'],
		svg: ['assets/worldmap.svg'].concat(SILHOUETTES)
	},
	sources: [
		'data/compiled/characters.json',
		'data/compiled/nomenclature.json',
		'data/2014 - ICS.json'
	],

	render: (builder: Haeckel.ElementBuilder, sources: Haeckel.DataSources, defs: () => Haeckel.ElementBuilder, pngAssets: Haeckel.PNGAssets) =>
	{
		function connect(builder: Haeckel.ElementBuilder, source: CellPosition, target: CellPosition,
			offset: number = 0, strength: number = 1, sourceBlank: boolean = false)
		{
			var sourceArea = getMapArea(source.column, source.row),
				targetArea = getMapArea(target.column, target.row);
			offset *= CONNECTION_THICKNESS * 4;
			var sourceX = sourceArea.centerX + offset,
				targetX = targetArea.centerX + offset,
				sourceY = (source.row === target.row) ? sourceArea.centerY : (sourceBlank ? sourceArea.bottom : sourceArea.top),
				targetY = (source.row === target.row) ? targetArea.centerY : targetArea.bottom;
			if (source.row === target.row || source.column !== target.column)
			{
				sourceX = (target.column < source.column) ? sourceArea.left : sourceArea.right;
				if (source.row === target.row)
				{
					targetX = (target.column > source.column) ? targetArea.left : targetArea.right;
				}
			}

			var yDiff = targetY - sourceY,
				xDiff = targetX - sourceX,
				angle = Math.atan2(yDiff, xDiff),
				distance = Math.sqrt(yDiff * yDiff + xDiff * xDiff) - CONNECTION_OFFSET;
			targetX = Math.cos(angle) * distance + sourceX;
			targetY = Math.sin(angle) * distance + sourceY;

			builder.child(SVG_NS, 'path')
				.attrs(SVG_NS, {
						'd': 'M' + sourceX + ' ' + sourceY + 'L' + targetX + ' ' + targetY,
						'marker-end': 'url(#arrowhead)',
						'fill': 'none',
						'opacity': String(strength),
						stroke: '#000000',
						'stroke-width': CONNECTION_THICKNESS + 'px',
						'stroke-linecap': 'round'
					});
		}

		function drawMap(id: string, builder: Haeckel.ElementBuilder, area: Haeckel.Rectangle, taxon: Haeckel.Taxic, time: Haeckel.Range): boolean
		{
			var matrix = sources.sources['data/compiled/characters.json'].occurrences,
				occurrences = <Haeckel.ExtSet<Haeckel.Occurrence>> Haeckel.chr.states(matrix, taxon, Haeckel.OCCURRENCE_CHARACTER);
			occurrences = Haeckel.occ.timeSlice(time, occurrences);

			if (occurrences.empty)
			{
				return false;
			}

			var clipPath = builder.child(SVG_NS, 'clipPath')
				.attr(SVG_NS, 'id', id + '-mask');
			clipPath.child(SVG_NS, 'rect')
				.attrs(SVG_NS, {
						x: area.x + 'px',
						y: area.y + 'px',
						width: area.width + 'px',
						height: area.height + 'px'
					});
			var chartGroup = builder.child(SVG_NS, 'g')
				.attr(SVG_NS, 'clip-path', 'url(#' + id + '-mask)');
			chartGroup
				.child(SVG_NS, 'use')
				.attrs(SVG_NS, {
						x: area.x + 'px',
						y: area.y + 'px',
						width: area.width + 'px',
						height: area.height + 'px'
					})
				.attr('xlink:href', '#assets/worldmap.svg');

			var occGroup = chartGroup.child(SVG_NS, 'g'),
				chart = new Haeckel.GeoChart();
			chart.minThickness = 1;
			chart.occurrences = occurrences;
			chart.area = area;
			chart.render(occGroup);
			if (!(occGroup.build().firstChild.childNodes.length > 0))
			{
				clipPath.detach();
				chartGroup.detach();
				return false;
			}

			builder.child(SVG_NS, 'rect')
				.attrs(SVG_NS, {
						x: area.x + 'px',
						y: area.y + 'px',
						width: area.width + 'px',
						height: area.height + 'px',
						fill: 'none',
						stroke: '#000000',
						'stroke-width': '1px'
					});

			return true;
		}

		function drawSilhouette(builder: Haeckel.ElementBuilder, column: number, onLeft: boolean, assetName: string)
		{
			var area = getMapArea(column, 0);
			builder
				.child(SVG_NS, 'use')
				.attrs(SVG_NS, {
					x: (area.centerX + ((onLeft ? -1 : 1) * 100 - 100) * SILHOUETTE_SCALE) + 'px',
					y: (area.y - 200 * SILHOUETTE_SCALE) + 'px',
					width: (200 * SILHOUETTE_SCALE) + 'px',
					height: (200 * SILHOUETTE_SCALE) + 'px'
				})
				.attr('xlink:href', '#' + assetName);
		}

		function getMapArea(column: number, row: number)
		{
			var columnWidth = (FIGURE_WIDTH - TIME_LABEL_SIZE * 2 - (columns + 1) * SPACING) / columns,
				rowHeight = (FIGURE_HEIGHT - MARGIN_BOTTOM - MARGIN_TOP - (TAXON_LABEL_SIZE + SPACING) - EXTANT_TAXON_LABEL_SIZE - (rows + 1) * SPACING) / rows,
				x = (column + 1) * SPACING + column * columnWidth + TIME_LABEL_SIZE * 2,
				y = (row + 1) * SPACING + EXTANT_TAXON_LABEL_SIZE + row * rowHeight + MARGIN_TOP;
			return Haeckel.rec.create(x, y, columnWidth, rowHeight);
		}

		function getStratumTime(name: string): Haeckel.Range
		{
			var stratum: Haeckel.Stratum;
			Haeckel.ext.each(sources.sources['data/2014 - ICS.json'].strata, (candidate: Haeckel.Stratum) =>
			{
				if (candidate.name === name)
				{
					stratum = candidate;
					return false;
				}
			});
			if (!stratum)
			{
				throw new Error('Could not find stratum: "' + name + '".');
			}
			return Haeckel.rng.create(stratum.start.mean, stratum.end.mean);
		}

		/*
		function labelExtantTaxon(builder: Haeckel.ElementBuilder, name: string, column: number)
		{
			var area = getMapArea(column, 0);
			builder.child(SVG_NS, 'text')
				.text(name)
				.attrs(SVG_NS, {
						x: area.centerX + 'px',
						y: (area.top - EXTANT_TAXON_LABEL_SIZE / 2) + 'px',
						'text-anchor': 'middle',
						'font-size': EXTANT_TAXON_LABEL_SIZE + 'px',
						"font-family": "Myriad Pro"
					});
		}
		*/

		function labelTaxon(builder: Haeckel.ElementBuilder, name: string, row: number,
			leftColumn: number, rightColumn: number = NaN, textAttrs: { [name: string]: string; } = null)
		{
			if (isNaN(rightColumn))
			{
				rightColumn = taxa.length - 1;
			}
			var area = Haeckel.rec.combine([ getMapArea(leftColumn, row), getMapArea(rightColumn, row)]),
				textGroup = builder.child(SVG_NS, 'g'),
				y = area.top + TAXON_LABEL_SIZE,
				text = textGroup
					.child(SVG_NS, 'text')
					.text(name)
					.attrs(SVG_NS, {
							y: (area.top + TAXON_LABEL_SIZE * 0.75) + 'px',
							'text-anchor': 'middle',
							'font-size': TAXON_LABEL_SIZE + 'px',
							"font-family": "Myriad Pro"
						});
			if (textAttrs)
			{
				text.attrs(SVG_NS, textAttrs);
			}

			var box = Haeckel.rec.createFromBBox(<SVGTextElement> text.build()),
				x = area.centerX - box.width / 2,
				extent = textGroup.child(SVG_NS, 'g');

			text.attr(SVG_NS, 'x', area.centerX + 'px');
			box = Haeckel.rec.create(x + box.x, y + box.y, box.width, box.height);
			extent.child(SVG_NS, 'path')
				.attr(SVG_NS, 'd', 'M' + area.left + ' ' + area.top + 'v' + TAXON_LABEL_SIZE)
				.attrs(SVG_NS, EXTENT_ATTRS);
			extent.child(SVG_NS, 'path')
				.attr(SVG_NS, 'd', 'M' + area.right + ' ' + area.top + 'v' + TAXON_LABEL_SIZE)
				.attrs(SVG_NS, EXTENT_ATTRS);
			extent.child(SVG_NS, 'path')
				.attr(SVG_NS, 'd', 'M' + area.left + ' ' + (area.top + TAXON_LABEL_SIZE / 2) + 'H' + (box.left - TEXT_MARGIN))
				.attrs(SVG_NS, EXTENT_ATTRS);
			extent.child(SVG_NS, 'path')
				.attr(SVG_NS, 'd', 'M' + (box.right + TEXT_MARGIN) + ' ' + (area.top + TAXON_LABEL_SIZE / 2) + 'H' + area.right)
				.attrs(SVG_NS, EXTENT_ATTRS);
		}

		function labelTime(builder: Haeckel.ElementBuilder, name: string, row: number, isEpoch: boolean = false)
		{
			var area = getMapArea(0, row),
				x = area.left - TIME_LABEL_SIZE / 2,
				y = area.centerY;
			if (isEpoch)
			{
				x -= TIME_LABEL_SIZE;
			}
			builder
				.child(SVG_NS, 'text')
				.text(isEpoch ? name.toUpperCase() : name)
				.attrs(SVG_NS, {
						x: x + 'px',
						y: y + 'px',
						'text-anchor': 'middle',
						'transform': 'rotate(-90,' + x + ',' + y + ')'
					})
				.attrs(SVG_NS, TIME_LABEL_ATTRS);
		}

		function labelTimeRange(builder: Haeckel.ElementBuilder, name: string, topRow: number, bottomRow: number)
		{
			var area = Haeckel.rec.combine([ getMapArea(0, topRow), getMapArea(0, bottomRow)]),
				x = area.left - TIME_LABEL_SIZE * 1.5,
				y = area.centerY,
				textGroup = builder.child(SVG_NS, 'g'),
				text = textGroup.child(SVG_NS, 'text')
					.text(name.toUpperCase())
					.attrs(SVG_NS, {
							'text-anchor': 'middle',
							x: x + 'px',
							y: y + 'px'
						})
					.attrs(SVG_NS, TIME_LABEL_ATTRS),
				box = Haeckel.rec.createFromBBox(<SVGTextElement> text.build()),
				extent = textGroup.child(SVG_NS, 'g');
			text.attr(SVG_NS, 'transform', 'rotate(-90,' + x + ',' + y + ')');
			extent.child(SVG_NS, 'path')
				.attr(SVG_NS, 'd', 'M' + (area.left - TIME_LABEL_SIZE * 2.5) + ' ' + area.top + 'h' + TIME_LABEL_SIZE)
				.attrs(SVG_NS, EXTENT_ATTRS);
			extent.child(SVG_NS, 'path')
				.attr(SVG_NS, 'd', 'M' + (area.left - TIME_LABEL_SIZE * 2.5) + ' ' + area.bottom + 'h' + TIME_LABEL_SIZE)
				.attrs(SVG_NS, EXTENT_ATTRS);
			extent.child(SVG_NS, 'path')
				.attr(SVG_NS, 'd', 'M' + (area.left - TIME_LABEL_SIZE * 2) + ' ' + area.top + 'V' + (y - (box.width / 2) - TEXT_MARGIN))
				.attrs(SVG_NS, EXTENT_ATTRS);
			extent.child(SVG_NS, 'path')
				.attr(SVG_NS, 'd', 'M' + (area.left - TIME_LABEL_SIZE * 2) + ' ' + area.bottom + 'V' + (y + (box.width / 2) + TEXT_MARGIN))
				.attrs(SVG_NS, EXTENT_ATTRS);
		}

		var SVG_NS = Haeckel.SVG_NS;

		defs().child(SVG_NS, 'marker')
			.attrs(SVG_NS, {
					id: 'arrowhead',
	      			viewBox: "0 0 10 10",
	      			refX: "5",
	      			refY: "5",
	      			markerUnits: "strokeWidth",
	      			markerWidth: "4",
	      			markerHeight: "3",
	      			orient: "auto"
	  			})
			.child(SVG_NS, 'path')
				.attr(SVG_NS, 'd', "M0 0L10 5L0 10z");

		var nomenclature = sources.nomenclature,
			names = nomenclature.nameMap;

		var taxa: Haeckel.Taxic[] = [
			Haeckel.tax.setDiff(names['Hominidae'], names['pan-Homininae']),
			Haeckel.tax.setDiff(names['pan-Homininae'], names['Hominina']),
			Haeckel.tax.setDiff(names['Hominina'], names['Homo']),
			Haeckel.tax.setDiff(names['Homo'], names['Homo (Homo)']),
			Haeckel.tax.setDiff(names['Homo (Homo)'], names['Homo (sapiens)']),
			Haeckel.tax.setDiff(names['Homo (sapiens)'], names['Homo sapiens']),
			names['Homo sapiens']
		];
		var times: Haeckel.Range[] = [
			getStratumTime('Holocene'),
			getStratumTime('Upper Pleistocene'),
			getStratumTime('Middle Pleistocene'),
			getStratumTime('Calabrian'),
			getStratumTime('Gelasian'),
			getStratumTime('Pliocene'),
			getStratumTime('Messinian'),
			Haeckel.rng.combine([ getStratumTime('Tortonian'), getStratumTime('Aquitanian') ]),
		];
		var columns = taxa.length,
			rows = times.length;

		var connections = builder.child(SVG_NS, 'g').attr(SVG_NS, 'id', 'connections');

		connect(connections, { column: 0, row: 7}, {column: 0, row: 6}); // Ponginae
		connect(connections, { column: 0, row: 7}, {column: 0, row: 6}, 2); // Dryopithecinae
		connect(connections, { column: 0, row: 7}, {column: 1, row: 7}); // pan-Homininae
		connect(connections, { column: 0, row: 6}, {column: 0, row: 5}, -1); // Sivapithecina
		connect(connections, { column: 0, row: 6}, {column: 0, row: 2}); // Pongina
		connect(connections, { column: 0, row: 6}, {column: 0, row: 4}, 1); // Lufengpithecini
		connect(connections, { column: 0, row: 5}, {column: 0, row: 2}, -1); // Gigantopithecus
		connect(connections, { column: 0, row: 2}, {column: 0, row: 1}, -1); // Gigantopithecus
		connect(connections, { column: 0, row: 2}, {column: 0, row: 1}); // Pongo
		connect(connections, { column: 0, row: 1}, {column: 0, row: 0}); // Pongo (Pongo)

		connect(connections, { column: 1, row: 7}, {column: 1, row: 0}, -0.5);
		connect(connections, { column: 1, row: 7}, {column: 1, row: 2}, 0.5);
		connect(connections, { column: 1, row: 7}, {column: 2, row: 6});
		connect(connections, { column: 1, row: 2}, {column: 1, row: 0}, 0.5);

		connect(connections, { column: 2, row: 6}, {column: 2, row: 5});
		connect(connections, { column: 2, row: 5}, {column: 2, row: 4}, -0.5);
		connect(connections, { column: 2, row: 5}, {column: 2, row: 4}, 0.5);
		connect(connections, { column: 2, row: 5}, {column: 3, row: 4});
		connect(connections, { column: 2, row: 4}, {column: 2, row: 3}, -0.5);
		connect(connections, { column: 2, row: 4}, {column: 2, row: 3}, 0.5);
		connect(connections, { column: 2, row: 3}, {column: 2, row: 2}, 0.5);

		connect(connections, { column: 3, row: 4}, {column: 3, row: 3});
		connect(connections, { column: 3, row: 4}, {column: 4, row: 3});
		connect(connections, { column: 3, row: 3}, {column: 3, row: 1}, 0, 0.75);

		connect(connections, { column: 4, row: 3}, {column: 4, row: 2});
		connect(connections, { column: 4, row: 3}, {column: 4, row: 2}, 1);
		connect(connections, { column: 4, row: 3}, {column: 5, row: 3});
		connect(connections, { column: 4, row: 2}, {column: 4, row: 1});
		connect(connections, { column: 4, row: 2}, {column: 3, row: 1}, 0, 0.25);
		connect(connections, { column: 4, row: 2}, {column: 5, row: 2}, 0, 0.375);
		connect(connections, { column: 4, row: 2}, {column: 4, row: 1});

		connect(connections, { column: 5, row: 3}, {column: 5, row: 2}, -1, 0.5);
		connect(connections, { column: 5, row: 3}, {column: 5, row: 2}, 0, 0.75);
		connect(connections, { column: 5, row: 3}, {column: 5, row: 2}, 1);
		connect(connections, { column: 5, row: 3}, {column: 6, row: 2}, 0, 0.5);
		connect(connections, { column: 5, row: 2}, {column: 5, row: 1}, -1);
		connect(connections, { column: 5, row: 2}, {column: 5, row: 1});
		connect(connections, { column: 5, row: 2}, {column: 5, row: 1}, 1);
		connect(connections, { column: 5, row: 2}, {column: 6, row: 2}, 1, 0.5);
		connect(connections, { column: 5, row: 1}, {column: 6, row: 1}, 0, 0.1);

		connect(connections, { column: 6, row: 2}, {column: 6, row: 1}, 0, 0.9);
		connect(connections, { column: 6, row: 1}, {column: 6, row: 0});

		var maps = builder.child(SVG_NS, 'g').attr(SVG_NS, 'id', 'maps');

		for (var column = 0; column < columns; ++column)
		{
			for (var row = 0; row < rows; ++row)
			{
				var mapID = 'map-' + row + '-' + column,
					map = maps.child(SVG_NS, 'g').attr(SVG_NS, 'id', mapID),
					area = getMapArea(column, row),
					usePopDensityMap = column === columns - 1 && row === 0;
				if (usePopDensityMap)
				{
					pngAssets.image(map, "assets/worldmap_popdensity.png")
						.attrs(SVG_NS, {
								x: area.x + 'px',
								y: area.y + 'px',
								width: area.width + 'px',
								height: area.height + 'px'
							});
					map.child(SVG_NS, 'rect')
						.attrs(SVG_NS, {
								x: area.x + 'px',
								y: area.y + 'px',
								width: area.width + 'px',
								height: area.height + 'px',
								fill: 'none',
								stroke: '#000000',
								'stroke-width': '1px'
							})
				}
				else if (!drawMap(mapID, map, getMapArea(column, row), taxa[column], times[row]))
				{
					map.detach();
				}
			}
		}

		var labels = builder.child(SVG_NS, 'g').attr(SVG_NS, 'id', 'labels');

		labelTaxon(labels, 'great apes', 8.5, 0, 1);
		labelTaxon(labels, 'hominines and stem-hominines', 8, 1);
		labelTaxon(labels, 'stem-humans', 7, 2, taxa.length - 2);
		labelTaxon(labels, 'Homo', 5, 3, NaN, { 'font-style': 'italic' });
		labelTaxon(labels, 'large brains', 4.5, 4);
		labelTaxon(labels, 'near-humans', 4, 5, 5);
		labelTaxon(labels, 'Homo sapiens', 3, 6, 6, { 'font-style': 'italic' });

		//labelExtantTaxon(labels, 'orangutans', 0);
		//labelExtantTaxon(labels, 'gorillas & chimpanzees', 1);
		//labelExtantTaxon(labels, 'humans', 6);

		labelTime(labels, 'Recent', 0, true);
		labelTime(labels, 'Tarantian', 1);
		labelTime(labels, 'Ionian', 2);
		labelTime(labels, 'Calabrian', 3);
		labelTime(labels, 'Gelasian', 4);
		labelTime(labels, 'Pliocene', 5, true);
		labelTime(labels, 'Messinian', 6);

		labelTimeRange(labels, 'Pleistocene', 1, 4);
		labelTimeRange(labels, 'Miocene', 6, 7);

		var silhouettes = builder.child(SVG_NS, 'g').attr(SVG_NS, 'id', 'silhouettes');
		SILHOUETTES.forEach((name: string, index: number) => drawSilhouette(silhouettes, Math.floor(index / 2), index % 2 === 0, name));
	}
};