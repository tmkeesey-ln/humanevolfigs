/// <reference path="../bower_components/haeckel/lib/haeckel.d.ts"/>
/// <reference path="haploMap.ts"/>

var figure: Haeckel.Figure = 
{
	width: '5000px',
	height: '3000px',
	sources: ['data/2012 - van Oven.json', 'data/compiled/haplogroup-locations.json'],
	assets: {
		svg: ['assets/worldmap.svg']
	},
	render: (builder: Haeckel.ElementBuilder, sources: Haeckel.DataSources, assets: Haeckel.AssetData) =>
	{
		var phyloSource = sources['data/2012 - van Oven.json'],
			phylogeny = new Haeckel.DAGSolver<Haeckel.Taxic>(phyloSource.phylogenies['v14']),
			occurrences = sources['data/compiled/haplogroup-locations.json'].occurrences,
			area = Haeckel.rec.create(0, 0, 5000, 3000);
		haploMap(builder, phyloSource.nomenclature, phylogeny, occurrences, assets['assets/worldmap.svg'], area);
	}
};
figure;