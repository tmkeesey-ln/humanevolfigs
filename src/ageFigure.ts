/// <reference path="stratUnit.ts"/>

interface AgeFigureTaxon
{
	name: string;
	italics?: boolean;
	label?: string;
	mapImage?: string;
	maskMap?: boolean;
	silhouette?: string;
	specialMap?: string;
}

var STRATUM_HEIGHT = 150;
var SILHOUETTE_HEIGHT = 200;
var MAP_MARGIN = 12;
var MAP_SPACING = 8;
var MAX_MAP_SCALE = 4;
var SECTION_SPACING = 8;
var STRAT_UNIT_SPACING = 2;
var STRATUM_LINE_THICKNESS = 18;
var STRATUM_SIDE_LINE_THICKNESS = 4;
var TAXON_LABEL_MARGIN = 6;
var TAXON_LABEL_FONT_SIZE = 24;
var TAXON_LABEL_STYLE: { [name: string]: string; } = {
	'font-size': TAXON_LABEL_FONT_SIZE + 'px',
	'font-weight': 'bold',
	'font-family': 'Myriad Pro'
};
var STRAT_DIRECTION_STYLE: { [name: string]: string; } = {
	'font-size': STRATUM_LINE_THICKNESS + 'px',
	'font-weight': 'bold',
	'font-family': 'Myriad Pro'
};
var TIME_LABEL_FONT_SIZE = 28;
var TIME_LABEL_STYLE: { [name: string]: string; } = {
	'font-size': TIME_LABEL_FONT_SIZE + 'px',
	'font-weight': 'bold',
	'font-family': 'Myriad Pro'
};
var TIME_LABEL_SPACING = 8;
var COUNT_LABEL_FONT_SIZE = 20;
var COUNT_LABEL_STYLE: { [name: string]: string; } = {
	'font-size': COUNT_LABEL_FONT_SIZE + 'px',
	'font-family': 'Myriad Pro'
};

function ageFigureHeight(width: number, numTaxa: number, noStrat: boolean = false)
{
	if (noStrat) {
		return TIME_LABEL_FONT_SIZE + SILHOUETTE_HEIGHT + TAXON_LABEL_MARGIN * 2
			+ TAXON_LABEL_FONT_SIZE + COUNT_LABEL_FONT_SIZE + width / (numTaxa * 2) - MAP_SPACING;
	}
	return TIME_LABEL_FONT_SIZE + TIME_LABEL_SPACING + STRATUM_LINE_THICKNESS * 2 + STRATUM_HEIGHT + SILHOUETTE_HEIGHT + TAXON_LABEL_MARGIN * 2
		+ TAXON_LABEL_FONT_SIZE + COUNT_LABEL_FONT_SIZE + (width - TIME_LABEL_FONT_SIZE) / (numTaxa * 2) - MAP_SPACING;
}

function ageFigure(
	settings: {
		area: Haeckel.Rectangle;
		builder: Haeckel.ElementBuilder;
		defs: Haeckel.ElementBuilder;
		noStrat?: boolean;
		nomenclature: Haeckel.Nomenclature;
		occurrencesSource: Haeckel.DataSource;
		padForTimeLabel?: boolean;
		pngAssets?: Haeckel.PNGAssets;
		strataSource: Haeckel.DataSource;
		stratumHeight?: number;
		taxa: AgeFigureTaxon[];
		timeUnitName: string;
	}
)
{
	function capitalize(s: string)
	{
		return s.replace(/(^([a-zA-Z\p{M}]))|([ -][a-zA-Z\p{M}])/g, c => c.toUpperCase());
	}

	function getCountLabel(count: Haeckel.Range): string
	{
		if (count.min > 1000000000)
		{
			return "billions of";
		}
		if (count.min > 1000000)
		{
			return "millions of";
		}
		if (count.min > 1000)
		{
			return "thousands of";
		}
		var precise = count.size === 0;
		var whole = Math.floor(count.min) === count.min;
		if (whole)
		{
			if (precise)
			{
				return String(count.min);
			}
			return "≥" + count.min;
		}
		if (count.min < 2)
		{
			return "1?";
		}
		if (precise)
		{
			return '~' + Math.round(count.min);
		}
		if (count.min >= 100)
		{
			return ">" + (Math.floor(count.min / 100) * 100);
		}
		if (count.min >= 10)
		{
			return ">" + (Math.floor(count.min / 10) * 10);
		}
		return ">" + Math.floor(count.min);
	}

	var occurrences = settings.occurrencesSource.occurrences;
	var strata = settings.strataSource.strata;
	var SVG_NS = Haeckel.SVG_NS;
	var XLINK_NS = "http://www.w3.org/1999/xlink";
	var stratumHeight = settings.stratumHeight || STRATUM_HEIGHT;

	function findStratum(name: string)
	{
		return Haeckel.ext.singleMember(Haeckel.ext.where(strata, stratum => stratum.name === name));
	}

	/*
	function findNextStratum(start: number, type: string)
	{
		if (start >= 0) {
			return null;
		}
		try 
		{
			return Haeckel.ext.singleMember(Haeckel.ext.where(strata,
				stratum => Haeckel.precisionEqual(start, stratum.start.mean) && stratum.type === type));
		}
		catch (e)
		{
			return {
				name: 'Holocene',
				type: 'age',
				start: Haeckel.rng.create(start, start),
				end: Haeckel.RANGE_0
			};
		}
		return null;
	}

	function findPrevStratum(end: number, type: string)
	{
		return Haeckel.ext.singleMember(Haeckel.ext.where(strata,
			stratum => Haeckel.precisionEqual(end, stratum.end.mean) && stratum.type === type));
	}
	*/

	var stratum = findStratum(settings.timeUnitName);
	var time = Haeckel.rng.create(stratum.start.mean, stratum.end.mean);
	//var nextStratum = findNextStratum(time.max, stratum.type);
	//var prevStratum = findPrevStratum(time.min, stratum.type);

	// Background
	settings.builder
		.child(SVG_NS, 'rect')
		.attrs(SVG_NS, {
			x: settings.area.left + 'px',
			y: settings.area.top + 'px',
			width: settings.area.width + 'px',
			height: settings.area.height + 'px',
			fill: Haeckel.WHITE.hex
		});

	var numTaxa = settings.taxa.length;
	var leftOffset = (settings.noStrat || !settings. padForTimeLabel) ? 0 : TIME_LABEL_FONT_SIZE;
	var columnWidth = (settings.area.width - leftOffset) / numTaxa;
	var mapsGroup = settings.builder.child(SVG_NS, 'g');
	var silhouetteTop = TIME_LABEL_FONT_SIZE + (settings.noStrat ? 0 : (STRATUM_LINE_THICKNESS * 2 + stratumHeight + TIME_LABEL_SPACING));

	// Strat chart
	(() =>
	{
		var g = settings.builder.child(SVG_NS, 'g');
		if (settings.noStrat)
		{
			/*
			g
				.child(SVG_NS, 'rect')
				.attrs(SVG_NS, {
					x: settings.area.left + 'px',
					y: TIME_LABEL_FONT_SIZE + 'px',
					width: settings.area.width + 'px',
					height: STRATUM_LINE_THICKNESS + 'px',
					fill: Haeckel.BLACK.hex
				});
			*/
		}
		else
		{
			var stratArea = Haeckel.rec.create(settings.area.left + leftOffset, settings.area.top + TIME_LABEL_FONT_SIZE + TIME_LABEL_SPACING + STRATUM_LINE_THICKNESS,
				settings.area.width - leftOffset, stratumHeight);
			/*
			settings.defs
				.child(Haeckel.SVG_NS, 'pattern')
				.attrs(Haeckel.SVG_NS, {
					id: 'strat-unit-hatch',
					patternUnits: "userSpaceOnUse",
					width: '1',
					height: '3'
				})
				.child(Haeckel.SVG_NS, 'rect')
				.attrs(Haeckel.SVG_NS, {
					x: '0',
					y: '0',
					width: '1',
					height: '0.25'
				});

			g
				.child(SVG_NS, 'rect')
				.attrs(SVG_NS, {
					x: settings.area.left + 'px',
					y: stratArea.top + 'px',
					width: settings.area.width + 'px',
					height: stratArea.height + 'px',
					fill: 'url(#strat-unit-hatch)'
				});
			*/
			stratUnit({
				area: stratArea,
				areaPerOccurrence: 64,
				builder: g,
				defs: settings.defs,
				nomenclature: settings.nomenclature,
				occurrences: occurrences,
				spacing: STRAT_UNIT_SPACING,
				taxonNames: settings.taxa.map(taxon => taxon.name),
				time: time
			});
			g
				.child(SVG_NS, 'rect')
				.attrs(SVG_NS, {
					x: settings.area.left + 'px',
					y: (stratArea.top - STRATUM_LINE_THICKNESS) + 'px',
					width: settings.area.width + 'px',
					height: STRATUM_LINE_THICKNESS + 'px',
					fill: '#a0a0a0'
				});
			g
				.child(SVG_NS, 'rect')
				.attrs(SVG_NS, {
					x: settings.area.left + 'px',
					y: stratArea.bottom + 'px',
					width: settings.area.width + 'px',
					height: STRATUM_LINE_THICKNESS + 'px',
					fill: '#a0a0a0'
				});
			g
				.child(SVG_NS, 'rect')
				.attrs(SVG_NS, {
					x: settings.area.left + 'px',
					y: (stratArea.top - 1) + 'px',
					width: STRATUM_SIDE_LINE_THICKNESS + 'px',
					height: (stratArea.height + 2) + 'px',
					fill: '#a0a0a0'
				});
			g
				.child(SVG_NS, 'rect')
				.attrs(SVG_NS, {
					x: (settings.area.right - STRATUM_SIDE_LINE_THICKNESS) + 'px',
					y: (stratArea.top - 1) + 'px',
					width: STRATUM_SIDE_LINE_THICKNESS + 'px',
					height: (stratArea.height + 2) + 'px',
					fill: '#a0a0a0'
				});
			g
				.child(SVG_NS, 'text')
				.text('UPPER BOUNDARY')
				.attrs(SVG_NS, STRAT_DIRECTION_STYLE)
				.attrs(SVG_NS, {
					x: (settings.area.left + 8) + 'px',
					y: (stratArea.top - 3) + 'px',
					'text-anchor': 'start',
					fill: Haeckel.WHITE.hex
				});
			g
				.child(SVG_NS, 'text')
				.text('LOWER BOUNDARY')
				.attrs(SVG_NS, STRAT_DIRECTION_STYLE)
				.attrs(SVG_NS, {
					x: (settings.area.left + 8) + 'px',
					y: (stratArea.bottom + STRATUM_LINE_THICKNESS - 3) + 'px',
					'text-anchor': 'start',
					fill: Haeckel.WHITE.hex
				});
		}
	})();

	// Stratum label
	(() =>
	{
		var name = settings.timeUnitName;
		if (name === 'Gelasian' || name === 'Calabrian')
		{
			name = 'Lower Pleistocene: ' + name;
		}
		else if (name === 'Holocene')
		{
			name += ' (Recent)'
		}
		else if (name === 'Piacenzian')
		{
			name += ' (Upper Pliocene)'
		}
		else if (name === 'Zanclean')
		{
			name += ' (Lower Pliocene)'
		}
		else if (name === 'Messinian')
		{
			name = 'Upper Miocene: ' + name;
		}
		var label = settings.builder
			.child(SVG_NS, 'text')
			.text(name.toUpperCase())
			.attrs(SVG_NS, TIME_LABEL_STYLE)
			.attrs(SVG_NS, {
				x: settings.area.centerX + 'px',
				y: (settings.area.top + TIME_LABEL_FONT_SIZE - TIME_LABEL_SPACING) + 'px',
				'text-anchor': 'middle'
			});
	})();

	// Taxon labels
	(() =>
	{
		var g = settings.builder.child(SVG_NS, 'g');
		var y = silhouetteTop + SILHOUETTE_HEIGHT + TAXON_LABEL_MARGIN;
		for (var i = 0; i < numTaxa; ++i)
		{
			var taxon = settings.taxa[i];
			var label = taxon.label || taxon.name;
			var x = leftOffset + columnWidth * (i + 0.5);
			g
				.child(SVG_NS, 'text')
				.text(taxon.italics ? label : capitalize(label))
				.attrs(SVG_NS, TAXON_LABEL_STYLE)
				.attrs(SVG_NS, {
					'font-style': (taxon.italics ? 'italic' : 'normal'),
					'text-anchor': 'middle',
					x: x + 'px',
					y: y + 'px'
				});
		}
	})();

	// Specimen counts
	(() =>
	{
		var g = settings.builder.child(SVG_NS, 'g');
		var y = silhouetteTop + SILHOUETTE_HEIGHT + TAXON_LABEL_MARGIN + TAXON_LABEL_FONT_SIZE;
		for (var i = 0; i < numTaxa; ++i)
		{
			var figureTaxon = settings.taxa[i];
			var taxon = settings.nomenclature.nameMap[figureTaxon.name];
			var taxonOccurences = <Haeckel.ExtSet<Haeckel.Occurrence>> Haeckel.chr.states(occurrences, taxon, Haeckel.OCCURRENCE_CHARACTER);
			var min = 0;
			var max = 0;
			if (taxonOccurences)
			{
				Haeckel.ext.each(taxonOccurences, occurrence =>
				{
					if (Haeckel.rng.overlap(occurrence.time, time))
					{
						if (Haeckel.rng.includes(time, occurrence.time))
						{
							min += occurrence.count.min;
							max += occurrence.count.max;
						}
						else
						{
							var ratio = Haeckel.rng.intersect(occurrence.time, time).size / occurrence.time.size;
							min += ratio * occurrence.count.min;
							max += ratio * occurrence.count.max;
						}
					}
				});
			}
			var label = getCountLabel(Haeckel.rng.create(min, max));
			var singular = /^\D*1\D*$/.test(label);
			var x = leftOffset + columnWidth * (i + 0.5);
			g
				.child(SVG_NS, 'text')
				.text('(' + label + ' individual' + (singular ? '' : 's') + ')')
				.attrs(SVG_NS, COUNT_LABEL_STYLE)
				.attrs(SVG_NS, {
					'text-anchor': 'middle',
					x: x + 'px',
					y: y + 'px'
				});
		}
	})();

	// Taxon silhouettes
	(() =>
	{
		var g = settings.builder.child(SVG_NS, 'g');
		for (var i = 0; i < numTaxa; ++i)
		{
			var taxon = settings.taxa[i];
			g
				.child(Haeckel.SVG_NS, 'use')
				.attrs(Haeckel.SVG_NS, {
					x: (leftOffset + columnWidth * (i + 0.5) - SILHOUETTE_HEIGHT / 2)	 + 'px',
					y: silhouetteTop + 'px',
					width: SILHOUETTE_HEIGHT + 'px',
					height: SILHOUETTE_HEIGHT + 'px'
				})
				.attr('xlink:href', '#' + taxon.silhouette);
		}
	})();

	// Maps
	(() =>
	{
		var scale = 1;

		/*
		settings.defs
			.child(SVG_NS, 'pattern')
			.attrs(SVG_NS, {
				id: 'map-hatch',
				patternUnits: "userSpaceOnUse",
				width: '1',
				height: '3'
			})
			.child(SVG_NS, 'rect')
			.attrs(SVG_NS, {
				x: '0',
				y: '0',
				width: '1',
				height: '1'
			});
		*/

		function drawMap(id: string, builder: Haeckel.ElementBuilder, worldArea: Haeckel.Rectangle, mapArea: Haeckel.Rectangle, taxon: Haeckel.Taxic, specialMap: string, maskMap: boolean)
		{
			var clipPath = settings.defs
				.child(SVG_NS, 'clipPath')
				.attr(SVG_NS, 'id', id + '-mask');
			clipPath
				.child(SVG_NS, 'rect')
				.attrs(SVG_NS, {
						x: mapArea.x + 'px',
						y: mapArea.y + 'px',
						width: mapArea.width + 'px',
						height: mapArea.height + 'px'
					});
			if (maskMap)
			{
				var mapMask = settings.defs
					.child(SVG_NS, 'mask')
					.attr(SVG_NS, 'id', id + '-map-mask');
				mapMask
					.child(SVG_NS, 'use')
					.attrs(SVG_NS, {
							x: worldArea.left + 'px',
							y: worldArea.top + 'px',
							width: worldArea.width + 'px',
							height: worldArea.height + 'px'
						})
					.attr('xlink:href', '#assets/worldmap.svg');
			}
			var chartGroup = builder
				.child(SVG_NS, 'g')
				.attr(SVG_NS, 'clip-path', 'url(#' + id + '-mask)');
			chartGroup
				.child(SVG_NS, 'rect')
				.attrs(SVG_NS, {
						x: mapArea.x + 'px',
						y: mapArea.y + 'px',
						width: (mapArea.width - 0.5) + 'px',
						height: (mapArea.height - 0.5) + 'px',
						fill: '#a0a0a0'
					});
			chartGroup
				.child(SVG_NS, 'use')
				.attrs(SVG_NS, {
						x: worldArea.left + 'px',
						y: worldArea.top + 'px',
						width: worldArea.width + 'px',
						height: worldArea.height + 'px'
					})
				.attr('xlink:href', '#assets/worldmap.svg');
			if (specialMap)
			{
				var image = settings.pngAssets.image(chartGroup, specialMap)
					.attrs(SVG_NS, {
							x: worldArea.left + 'px',
							y: worldArea.top + 'px',
							width: worldArea.width + 'px',
							height: worldArea.height + 'px'
						});
				if (maskMap)
				{
					image.attr(SVG_NS, 'mask', 'url(#' + id + '-map-mask)');
				}
			}
			else
			{
				var taxonOccurrences = <Haeckel.ExtSet<Haeckel.Occurrence>> Haeckel.chr.states(occurrences, taxon, Haeckel.OCCURRENCE_CHARACTER);
				taxonOccurrences = Haeckel.occ.timeSlice(time, taxonOccurrences);
				var occGroup = chartGroup.child(SVG_NS, 'g');
				var chart = new Haeckel.GeoChart();
				chart.minThickness = scale;
				chart.occurrences = taxonOccurrences;
				chart.area = worldArea;
				chart.render(occGroup);
				if (maskMap)
				{
					occGroup.attr(SVG_NS, 'mask', 'url(#' + id + '-map-mask)');
				}
			}
			builder
				.child(SVG_NS, 'rect')
				.attrs(SVG_NS, {
						x: mapArea.x + 'px',
						y: mapArea.y + 'px',
						width: (mapArea.width - 0.5) + 'px',
						height: (mapArea.height - 0.5) + 'px',
						fill: 'none',
						stroke: Haeckel.BLACK.hex,
						'stroke-linejoin': 'miter',
						'stroke-width': '1px'
					});
		}

		var i: number;
		var mapArea = Haeckel.rec.create(0, 0, columnWidth - MAP_SPACING, (columnWidth - MAP_SPACING) / 2);
		var points = new Haeckel.ExtSetBuilder<Haeckel.Point>();
		var chart = new Haeckel.GeoChart();
		var tempGroup = mapsGroup.child(SVG_NS, 'g');
		chart.area = mapArea;
		chart.points = points;
		settings.taxa.forEach(taxon =>
		{
			if (taxon.specialMap)
			{
				points.add(Haeckel.pt.create(mapArea.left, mapArea.top));
				points.add(Haeckel.pt.create(mapArea.right, mapArea.top));
				points.add(Haeckel.pt.create(mapArea.left, mapArea.bottom));
				points.add(Haeckel.pt.create(mapArea.right, mapArea.bottom));
			}
			else
			{
				var taxonOccurrences = <Haeckel.ExtSet<Haeckel.Occurrence>> Haeckel.chr.states(occurrences, settings.nomenclature.nameMap[taxon.name], Haeckel.OCCURRENCE_CHARACTER);
				taxonOccurrences = Haeckel.occ.timeSlice(time, taxonOccurrences);
				chart.occurrences = taxonOccurrences;
				chart.render(tempGroup);
			}
		});
		tempGroup.detach();
		var contentArea = Haeckel.pt.rectangle(Haeckel.ext.list(points.build()));
		var viewArea = Haeckel.rec.create(MAP_MARGIN, MAP_MARGIN, mapArea.width - 2 * MAP_MARGIN, mapArea.height - 2 * MAP_MARGIN);
		var worldArea = mapArea;
		if (!Haeckel.rec.includes(contentArea, viewArea) && !contentArea.empty)
		{
			scale = Math.min(viewArea.width / Math.max(1, contentArea.width), viewArea.height / Math.max(1, contentArea.height));
			if (scale > MAX_MAP_SCALE)
			{
				var scaleRatio = scale / MAX_MAP_SCALE;
				var contentWidth = scaleRatio * contentArea.width;
				var contentHeight = scaleRatio * contentArea.height;
				contentArea = Haeckel.rec.create(contentArea.centerX - contentWidth / 2,
					contentArea.centerY - contentHeight / 2, contentWidth, contentHeight);
				contentArea = Haeckel.rec.intersect(contentArea, mapArea);
				scale = Math.min(viewArea.width / Math.max(1, contentArea.width), viewArea.height / Math.max(1, contentArea.height));
			}
			var w = scale * worldArea.width;
			var h = scale * worldArea.height;
			var scaledContentWidth = scale * contentArea.width;
			var scaledContentHeight = scale * contentArea.height;
			var scaledContentX = viewArea.centerX - scaledContentWidth / 2;
			var scaledContentY = viewArea.centerY - scaledContentHeight / 2;
			worldArea = Haeckel.rec.create(scaledContentX - scale * contentArea.x, scaledContentY - scale * contentArea.y, w, h);
		}
		var y = settings.area.bottom - (columnWidth - MAP_SPACING) / 2;
		for (i = 0; i < numTaxa; ++i)
		{
			var taxon = settings.taxa[i];
			mapArea = Haeckel.rec.create(leftOffset + columnWidth * i + MAP_SPACING / 2, y,
				columnWidth - MAP_SPACING, (columnWidth - MAP_SPACING) / 2);
			var taxonWorldArea = Haeckel.rec.create(mapArea.x + worldArea.x, mapArea.y + worldArea.y, worldArea.width, worldArea.height);
			drawMap('taxon' + i, mapsGroup, taxonWorldArea, mapArea, settings.nomenclature.nameMap[taxon.name], taxon.specialMap, taxon.maskMap);
		}				
	})();
}
