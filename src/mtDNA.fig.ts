/// <reference path="../bower_components/haeckel/lib/haeckel.d.ts"/>
/// <reference path="haploMap.ts"/>

var figure: Haeckel.Figure = 
{
	width: '10in',
	height: '5in',
	sources: ['data/2012 - van Oven.json', 'data/compiled/haplogroup-locations.json'],
	assets: {
		svg: ['assets/worldmap.svg']
	},
	render: (builder: Haeckel.ElementBuilder, sources: Haeckel.DataSources, assets: Haeckel.AssetData) =>
	{
		var phyloSource = sources['data/2012 - van Oven.json'],
			phylogeny = new Haeckel.DAGSolver<Haeckel.Taxic>(phyloSource.phylogenies['v14']),
			occurrences = sources['data/compiled/haplogroup-locations.json'].occurrences;
		haploMap(builder, phyloSource.nomenclature, phylogeny, occurrences, assets['assets/worldmap.svg']);
	}
};
figure;