/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>

interface NameEntry
{
	name: string;
	scientific?: boolean;
}

function distanceChart(builder: Haeckel.ElementBuilder,
	nomenclature: Haeckel.Nomenclature,
	characterMatrix: Haeckel.CharacterMatrix<Haeckel.Set>,
	nameEntries: Haeckel.ExtSet<NameEntry>,
	area: Haeckel.Rectangle): void
{
	var taxaBuilder = new Haeckel.ExtSetBuilder<Haeckel.Taxic>(),
		scientific: { [name: string]: boolean; } = {};
	Haeckel.ext.each(nameEntries, (entry: NameEntry) =>
	{
		var taxon = nomenclature.nameMap[entry.name];
		if (taxon)
		{
			scientific[entry.name] = !!entry.scientific;
			taxaBuilder.add(taxon);
		}
	});
	var taxa = taxaBuilder.build(),
		distanceMatrix = Haeckel.chr.toDistanceMatrix(characterMatrix),
		focus = nomenclature.nameMap["Homo sapiens"];
	
	var chart = new Haeckel.ProximityBarChart();
	chart.area = area;
	chart.focus = focus;
	chart.nomenclature = nomenclature;
	chart.taxa = taxa;
	chart.distanceMatrix = distanceMatrix;
	chart.spacing = 8;
	var chartGroup = chart.render(builder);
	
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

	/*
	//:TODO:
	var labeler = new H.BarLabeler();
	labeler.nomenclature = sources.nomenclature;
	labeler.degrees = -45;
	labeler.end = 'bottom';
	labeler.names = names;
	var labels = labeler.label(bars);
	labels.attr({'font-family': STYLE['font-family'], 'font-size': '16px'});
	labels.forEach(function(label) {
		var taxon = label.data("taxon");
		var name = H.ext.singleMember(H.ext.intersect(names, H.names(taxon)));
		console.log("Label", name);
		if (name.charAt(0) === name.charAt(0).toUpperCase() && name != "Bornean orangutans" && name != "Philippine colugos") // :KLUDGE: Should have a better way of determining name format
		{
			label.attr('font-style', 'italic');
		}
	});
	*/
}
