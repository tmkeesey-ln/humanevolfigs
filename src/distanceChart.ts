/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>

interface NameEntry
{
	name: string;
	scientific?: boolean;
}

function distanceChart(builder: Haeckel.ElementBuilder,
	nomenclature: Haeckel.Nomenclature,
	defs: () => Haeckel.ElementBuilder,
	characterMatrix: Haeckel.CharacterMatrix<Haeckel.Set>,
	nameEntries: Haeckel.ExtSet<NameEntry>,
	area: Haeckel.Rectangle): void
{
	function label(bar: Haeckel.ProximityBar, rectangle: Haeckel.Rectangle, builder: Haeckel.ElementBuilder): void
	{
		if (!bar || !bar.taxon)
		{
			return;
		}
		var nameEntry = nameEntryMap[bar.taxon.hash];
		if (!nameEntry)
		{
			return;
		}
		var label = builder.child(Haeckel.SVG_NS, 'text')
				.text(nameEntry.name)
				.attrs(Haeckel.SVG_NS, {
					'text-anchor': 'end',
					x: rectangle.x + 'px',
					y: rectangle.bottom + 'px',
					transform: 'rotate(-45 ' + rectangle.x + ' ' + rectangle.bottom + ') translate(0 12)',
					'font-size': '12px',
					'font-family': "Myriad Pro"
				});
		if (nameEntry.scientific)
		{
			label.attr(Haeckel.SVG_NS, 'font-style', 'italic');
		}
	}

	var taxaBuilder = new Haeckel.ExtSetBuilder<Haeckel.Taxic>(),
		nameEntryMap: { [taxonHash: string]: NameEntry; } = {};
	Haeckel.ext.each(nameEntries, (entry: NameEntry) =>
	{
		var taxon = nomenclature.nameMap[entry.name];
		if (taxon)
		{
			nameEntryMap[taxon.hash] = entry;
			taxaBuilder.add(taxon);
		}
	});
	var taxa = taxaBuilder.build(),
		distanceMatrix = Haeckel.chr.toDistanceMatrix(characterMatrix),
		focus = nomenclature.nameMap["Homo sapiens"];
	
	var chart = new Haeckel.ProximityBarChart('distanceChart');
	chart.area = area;
	chart.focus = focus;
	chart.labeler = label;
	chart.nomenclature = nomenclature;
	chart.taxa = taxa;
	chart.distanceMatrix = distanceMatrix;
	chart.spacing = 8;
	var chartGroup = chart.render(builder, defs);
	
	builder.child(Haeckel.SVG_NS, 'path')
		.attrs(Haeckel.SVG_NS, {
				'd': "M" + area.left + " " + (area.bottom - 0.5) + "H" + area.right,
				'fill': 'none',
				'stroke': '#000000',
				'stroke-opacity': '0.25',
				'stroke-width': '1',
				"stroke-linejoin": "miter",
				"stroke-linecap": "square"
			});

	builder.child(Haeckel.SVG_NS, 'text')
		.text('100%')
		.attrs(Haeckel.SVG_NS, {
				'text-anchor': 'start',
				x: area.right + 'px',
				y: area.top + 'px',
				'font-size': '12px',
				'font-family': "Myriad Pro"
			});
}
