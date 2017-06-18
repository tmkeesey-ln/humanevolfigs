/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>

interface NameEntry
{
	ancestral?: boolean;
	column: number;
	name?: string;
	italic?: boolean;
}

interface TaxonEntry extends NameEntry
{
	taxon: Haeckel.Taxic;
	name: string;
	showName?: boolean;
}

var SOURCES: string[] = [
	'data/compiled/characters.json',
	'data/compiled/nomenclature.json',
	'data/compiled/phylogeny.json',

	'data/2014 - ICS.json',

	'data/1996 - Zhi & al.json',
	'data/2006 - Steiper & Young.json',
	'data/2012 - Langergraber & al.json',
	'data/2013 - Fu & al.json',
	'data/2014 - Meyer & al.json'
];

var TIME = Haeckel.rng.create(-20000000, 0);

var TIME_INCREMENT = -1000000;

function capitalize(s: string)
{
	return s.replace(/(^([a-zA-Z\p{M}]))|([ \-"][a-zA-Z\p{M}])/g, c => c.toUpperCase());
}

interface ColumnTracker {
	max: number;
}

function toTaxonEntries(nomenclature: Haeckel.Nomenclature, nameEntries: { [name: string]: NameEntry; }, colTracker: ColumnTracker): { [taxonHash: string]: TaxonEntry; }
{
	var name: string;
	var taxonEntries: { [taxonHash: string]: TaxonEntry; } = {};
	for (name in nameEntries)
	{
		var entry = nameEntries[name];
		colTracker.max = Math.max(colTracker.max, entry.column);
		var taxon = nomenclature.nameMap[name];
		taxonEntries[Haeckel.hash(taxon)] = {
			ancestral: !!entry.ancestral,
			column: entry.column,
			name: entry.name || (entry.italic ? name : capitalize(name)),
			italic: !!entry.italic,
			showName: !!entry.name || !entry.ancestral,
			taxon: taxon
		};
	}
	return taxonEntries;
}

function addToCharacterMatrix(sources: { [filename: string]: Haeckel.DataSource; }, builder: Haeckel.CharacterMatrixBuilder<Haeckel.Range>, solver: Haeckel.PhyloSolver, datingSources: string[][])
{
	Haeckel.arr.each(datingSources, (source: string[]) =>
	{
		builder.addMatrix(Haeckel.dat.toCharacterMatrixBuilder(sources[source[0]].datings[source[1]], solver).build());
	});
	return builder;
}

function createHorizontalRatioMap(nomenclature: Haeckel.Nomenclature, nameEntries: { [name: string]: NameEntry; }, taxonEntries: { [hash: string]: TaxonEntry; }, solver: Haeckel.PhyloSolver, maxColumn: number): (taxon: Haeckel.Taxic) => Haeckel.Range
{
	return (taxon: Haeckel.Taxic) =>
	{
		var entry = taxonEntries[Haeckel.hash(taxon)];
		var column = 0;
		if (entry)
		{
			column = entry.column;
		}
		else
		{
			var total = 0;
			try
			{
				var clade = solver.clade(taxon);
			}
			catch (e)
			{
				clade = taxon;
			}
			for (let name in nameEntries)
			{
				var subtaxon = nomenclature.nameMap[name];
				if (subtaxon && Haeckel.tax.includes(clade, subtaxon))
				{
					column += nameEntries[name].column;
					++total;
				}
			}
			if (total === 0)
			{
				column = maxColumn / 2;
			}
			else
			{
				column /= total;
			}
		}
		return Haeckel.rng.create((column + 0.75) / (maxColumn + 2), (column + 1.25) / (maxColumn + 2));
	};
}

function labelTaxon(group: Haeckel.ElementBuilder, entry: TaxonEntry, rectangle: Haeckel.Rectangle, bold?: boolean)
{
	//var rect = group.child(Haeckel.SVG_NS, 'rect');
	var text = group.child(Haeckel.SVG_NS, 'text')
		.text(entry.name)
		.attrs(Haeckel.SVG_NS, {
			'fill': Haeckel.BLACK.hex,
			'font-style': entry.italic ? 'italic' : 'normal',
			'font-size': '14px',
			'font-weight': bold ? 'bolder' : 'lighter',
			'font-family': "Myriad Pro",
			transform: 'translate(' + (rectangle.centerX + 4) + ',' + (rectangle.top - 6) + ') rotate(-90)'
		});
	/*
	var box = Haeckel.rec.createFromBBox(<SVGTextElement> text.build());
	rect.attrs(Haeckel.SVG_NS, {
		fill: '#FFFFFF',
		stroke: 'none',
		x: rectangle.left + 'px',
		y: (rectangle.top - 6 - box.width) + 'px',
		width: rectangle.width + 'px',
		height: (box.width + 6) + 'px'
	});
	*/
}

function getSourceY(sourceRect: Haeckel.Rectangle, targetRect: Haeckel.Rectangle)
{
	return Math.max(sourceRect.centerY, targetRect.bottom);
}

function createArcRenderer(useSides?: boolean)
{
	return (builder: Haeckel.ElementBuilder, arc: Haeckel.Arc<Haeckel.Taxic>, sourceRect: Haeckel.Rectangle, targetRect: Haeckel.Rectangle) =>
	{
		var data = 'M';
		if (Haeckel.precisionEqual(targetRect.centerX, sourceRect.centerX))
		{
			data += [sourceRect.centerX, useSides ? sourceRect.top : sourceRect.centerY].join(' ')
				+ 'V' + targetRect.bottom;
		}
		else
		{
			var sourceY = getSourceY(sourceRect, targetRect);
			var startX = (useSides && sourceY === sourceRect.centerY)
				? (targetRect.centerX < sourceRect.centerX ? sourceRect.left : sourceRect.right)
				: sourceRect.centerX;
			var targetY = Math.min(targetRect.bottom, sourceY);
			data += [startX, sourceY].join(' ')
				+ 'Q' + [targetRect.centerX, sourceY, targetRect.centerX, targetY];
		}
		builder.child(Haeckel.SVG_NS, 'path')
			.attrs(Haeckel.SVG_NS, {
				'd': data,
				'stroke': Haeckel.BLACK.hex,
				'fill': 'none',
				'stroke-linecap': 'round',
				'stroke-dasharray': '2 4',
				'stroke-width': '2px'
			});
	};
}

function times(group: Haeckel.ElementBuilder, strata: Haeckel.Stratum[], figureArea: Haeckel.Rectangle, chartArea: Haeckel.Rectangle, time: Haeckel.Range, timeIncrement: number, includeStrata: boolean = true)
{
	var fontSize = 16;
	var chart = new Haeckel.ChronoChart();
	chart.area = chartArea;
	chart.time = time;
	var top = chart.getTimeY(Haeckel.RANGE_0);
	group.child(Haeckel.SVG_NS, 'rect')
		.attrs({
			fill: Haeckel.BLACK.hex,
			'fill-opacity': '0.333',
			stroke: 'none',
			x: '0px',
			y: (top.min - 1) + 'px',
			width: figureArea.width + 'px',
			height: '1px'
		});
	if (includeStrata)
	{
		strata.sort((a: Haeckel.Stratum, b: Haeckel.Stratum) =>
		{
			return b.start.mean - a.start.mean;
		});
		var fillStratum = false;
		Haeckel.arr.each(strata, (stratum: Haeckel.Stratum) =>
		{
			if (stratum && stratum.type === 'series/epoch')
			{
				var startY = chart.getTimeY(stratum.start);
				var endY = chart.getTimeY(stratum.end);
				if (fillStratum)
				{
					if (endY.mean <= chartArea.bottom)
					{
						group.child(Haeckel.SVG_NS, 'rect')
							.attrs({
								fill: Haeckel.BLACK.hex,
								'fill-opacity': '0.1',
								stroke: 'none',
								x: '0px',
								y: endY.mean + 'px',
								width: figureArea.width + 'px',
								height: (startY.mean - endY.mean) + 'px'
							});
					}
				}
				fillStratum = !fillStratum;
				if ((startY.mean - endY.mean) > fontSize)
				{
					var text = group.child(Haeckel.SVG_NS, 'text')
						.text(stratum.name.toUpperCase())
						.attrs(Haeckel.SVG_NS, {
							'fill': Haeckel.BLACK.hex,
							'fill-opacity': '0.5',
							'font-size': fontSize + 'px',
							'font-weight': 'bold',
							'font-family': "Myriad Pro",
							'text-anchor': 'middle'
						});
					var box = Haeckel.rec.createFromBBox(<SVGTextElement> text.build());
					var y = (startY.mean + endY.mean) / 2;
					if (y + box.width / 2 > chartArea.bottom)
					{
						y = chartArea.bottom - box.width / 2;
					}
					text.attr(Haeckel.SVG_NS, 'transform',
						'translate(' + (chartArea.left + fontSize / 2) + ',' + y + ') rotate(-90)');
				}
			}
		});
	}
	for (var t = time.max + timeIncrement; t >= time.min; t += timeIncrement)
	{
		var y = chart.getTimeY(Haeckel.rng.create(t, t)).mean;
		group.child(Haeckel.SVG_NS, 'rect')
			.attrs({
				fill: Haeckel.BLACK.hex,
				'fill-opacity': '0.15',
				stroke: 'none',
				x: '0px',
				y: (y - 0.5) + 'px',
				width: figureArea.width + 'px',
				height: '1px'
			});
		group.child(Haeckel.SVG_NS, 'text')
			.text((t / -1000000) + ' Mya')
			.attrs(Haeckel.SVG_NS, {
				x: (chartArea.right + 7) + 'px',
				y: (y - 1) + 'px',
				'font-weight': 'bold',
				'fill': Haeckel.BLACK.hex,
				'fill-opacity': '0.5',
				'font-size': '14px',
				'font-family': "Myriad Pro",
				'text-anchor': 'end'
			});
	}
}

interface LegendSettings
{
	[name: string]: boolean;
	specimens?: boolean;
	gaps?: boolean;
	ancestors?: boolean;
	lineages?: boolean;
}

function legend(group: Haeckel.ElementBuilder, area: Haeckel.Rectangle, settings: LegendSettings)
{
	group.child(Haeckel.SVG_NS, 'rect')
		.attrs(Haeckel.SVG_NS, {
			'x': area.left + 'px',
			'y': area.top + 'px',
			'width': area.width + 'px',
			'height': area.height + 'px',
			'fill': Haeckel.WHITE.hex,
			'stroke': Haeckel.BLACK.hex,
			'stroke-width': '2px',
			'stroke-linejoin': 'miter'
		});
	var rows = 1;
	var prop: string;
	for (prop in settings)
	{
		if (settings[prop])
		{
			rows++;
		}
	}
	var fontSize = (area.height / (2 * rows)) + 'px';
	group.child(Haeckel.SVG_NS, 'text')
		.text('LEGEND')
		.attrs(Haeckel.SVG_NS, {
			'x': area.centerX + 'px',
			'y': (area.top + area.height * 3 / (rows * 4)) + 'px',
			'text-anchor': 'middle',
			'font-weight': 'bolder',
			'font-family': 'Myriad Pro',
			'font-size': fontSize
		});

	var rowHeight = area.height / rows;
	var offset = rowHeight;

	if (settings.specimens)
	{
		var rectangle = Haeckel.rec.create(area.left + area.width / 12, area.top + offset + rowHeight / 4,
				area.width / 12, rowHeight / 2);
		group.child(Haeckel.SVG_NS, 'rect')
			.attrs(Haeckel.SVG_NS, {
				'x': rectangle.left + 'px',
				'y': rectangle.top + 'px',
				'width': rectangle.width + 'px',
				'height': rectangle.height + 'px',
				'fill': Haeckel.BLACK.hex,
				'stroke': 'none'
			});
		group.child(Haeckel.SVG_NS, 'text')
			.text('specimens')
			.attrs(Haeckel.SVG_NS, {
				'x': (area.left + area.width / 4) + 'px',
				'y': (area.top + offset + rowHeight * 5 / 8) + 'px',
				'text-anchor': 'left',
				'font-family': 'Myriad Pro',
				'font-size': fontSize
			});
		offset += rowHeight;
	}

	if (settings.gaps)
	{
		rectangle = Haeckel.rec.create(area.left + area.width / 12, area.top + offset + rowHeight / 4,
				area.width / 12, rowHeight / 2);
		group.child(Haeckel.SVG_NS, 'rect')
			.attrs(Haeckel.SVG_NS, {
				'x': rectangle.left + 'px',
				'y': rectangle.top + 'px',
				'width': rectangle.width + 'px',
				'height': rectangle.height + 'px',
				'fill': Haeckel.WHITE.hex,
				'stroke': Haeckel.BLACK.hex,
				'stroke-width': '1px',
				'stroke-linejoin': 'miter'
			});
		group.child(Haeckel.SVG_NS, 'text')
			.text('fossil gap')
			.attrs(Haeckel.SVG_NS, {
				'x': (area.left + area.width / 4) + 'px',
				'y': (area.top + offset + rowHeight * 5 / 8) + 'px',
				'text-anchor': 'left',
				'font-family': 'Myriad Pro',
				'font-size': fontSize
			});
		offset += rowHeight;
	}

	if (settings.ancestors)
	{
		var rectangle = Haeckel.rec.create(area.left + area.width / 12, area.top + offset + rowHeight / 4,
				area.width / 12, rowHeight / 2);
		group.child(Haeckel.SVG_NS, 'ellipse')
			.attrs(Haeckel.SVG_NS, {
				'cx': rectangle.centerX + 'px',
				'cy': rectangle.centerY + 'px',
				'rx': (rectangle.width / 2) + 'px',
				'ry': (rectangle.height / 2) + 'px',
				'fill': '#D0D0D0',
				'stroke': Haeckel.BLACK.hex,
				'stroke-dasharray': '4 2',
				'stroke-width': '2px',
				'stroke-linejoin': 'miter'
			});
		/*
		group.child(Haeckel.SVG_NS, 'path')
			.attrs(Haeckel.SVG_NS, {
				'd': 'M' + [rectangle.centerX, rectangle.top].join(' ')
					+ 'Q' + [rectangle.centerX, rectangle.centerY, rectangle.right, rectangle.centerY].join(' ')
					+ 'Q' + [rectangle.centerX, rectangle.centerY, rectangle.centerX, rectangle.bottom].join(' ')
					+ 'Q' + [rectangle.centerX, rectangle.centerY, rectangle.left, rectangle.centerY].join(' ')
					+ 'Q' + [rectangle.centerX, rectangle.centerY, rectangle.centerX, rectangle.top].join(' ')
					+ 'Z',
				'fill': Haeckel.BLACK.hex,
				'stroke': Haeckel.BLACK.hex,
				'stroke-width': '1px',
				'stroke-linejoin': 'miter'
			});
		*/
		group.child(Haeckel.SVG_NS, 'text')
			.text('inferred ancestor')
			.attrs(Haeckel.SVG_NS, {
				'x': (area.left + area.width / 4) + 'px',
				'y': (area.top + offset + rowHeight * 5 / 8) + 'px',
				'text-anchor': 'left',
				'font-family': 'Myriad Pro',
				'font-size': fontSize
			});
		offset += rowHeight;
	}

	if (settings.lineages)
	{
		group.child(Haeckel.SVG_NS, 'path')
			.attrs(Haeckel.SVG_NS, {
				'd': 'M' + [area.left + area.width / 8, area.top + offset + rowHeight / 4].join(' ')
					+ 'v' + (rowHeight / 2),
				'stroke': Haeckel.BLACK.hex,
				'fill': 'none',
				'stroke-linecap': 'round',
				'stroke-dasharray': '2 4',
				'stroke-width': '2px'
			});
		group.child(Haeckel.SVG_NS, 'text')
			.text('inferred lineage')
			.attrs(Haeckel.SVG_NS, {
				'x': (area.left + area.width / 4) + 'px',
				'y': (area.top + offset + rowHeight * 5 / 8) + 'px',
				'text-anchor': 'left',
				'font-family': 'Myriad Pro',
				'font-size': fontSize
			});
		//offset += rowHeight;
	}
}

function background(builder: Haeckel.ElementBuilder)
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


