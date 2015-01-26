/// <reference path="stratUnit.ts"/>

var FIGURE_TO_RENDER: Haeckel.Figure = 
{
	width: 450,
	height: 250,
	sources: ['data/2014 - ICS.json', 'data/compiled/characters.json', 'data/compiled/nomenclature.json'],
	assets: {
		//svg: ['assets/worldmap.svg']
	},
	render: (builder: Haeckel.ElementBuilder, sources: Haeckel.DataSources, defs: () => Haeckel.ElementBuilder) =>
	{
		var TAXON_NAMES: string[] = [
			"orangutans",
			"Floresian \"hobbits\"",
			"Homo heidelbergensis daliensis",
			"Denisovans",
			"Neandertals",
			"Homo sapiens njarasensis",
			"Homo sapiens sapiens"
		];

		var strata = sources.sources['data/2014 - ICS.json'].strata;

		function findStratumTime(name: string)
		{
			var stratum = Haeckel.ext.singleMember(Haeckel.ext.where(strata, stratum => stratum.name === name));
			return Haeckel.rng.create(stratum.start.mean, stratum.end.mean);
		}

		var area = Haeckel.rec.create(10, 10, 430, 230);
		var occurrences = sources.sources['data/compiled/characters.json'].occurrences;
		var time = findStratumTime("Upper Pleistocene");
		stratUnit({
			area: area,
			builder: builder.child(Haeckel.SVG_NS, 'g'),
			nomenclature: sources.nomenclature,
			occurrences: occurrences,
			spacing: 10,
			taxonNames: TAXON_NAMES,
			time: time
		});
		return builder;
	}
};