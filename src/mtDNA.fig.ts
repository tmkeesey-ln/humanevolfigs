/// <reference path="haploMap.ts"/>

var FIGURE_TO_RENDER: Haeckel.Figure = 
{
	width: 1000,
	height: 500,
	sources: ['data/2012 - van Oven.json', 'data/compiled/haplogroup-locations.json'],
	assets: {
		svg: ['assets/worldmap.svg']
	},
	render: (builder: Haeckel.ElementBuilder, sources: Haeckel.DataSources, defs: () => Haeckel.ElementBuilder) =>
	{
		var phyloSource = sources.sources['data/2012 - van Oven.json'],
			phylogeny = new Haeckel.DAGSolver<Haeckel.Taxic>(phyloSource.phylogenies['v14']),
			occurrences = sources.sources['data/compiled/haplogroup-locations.json'].occurrences,
			area = Haeckel.rec.create(0, 0, 1000, 500);
		haploMap(builder, defs(), phyloSource.nomenclature, phylogeny, occurrences, 'assets/worldmap.svg', area);
	}
};