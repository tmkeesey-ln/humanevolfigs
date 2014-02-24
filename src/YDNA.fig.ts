/// <reference path="../bower_components/haeckel/lib/haeckel.d.ts"/>
/// <reference path="haploMap.ts"/>

var figure: Haeckel.Figure = 
{
	width: '1000px',
	height: '500px',
	sources: ['data/2014 - ISoGG.json', 'data/compiled/haplogroup-locations.json'],
	assets: {
		svg: ['assets/worldmap.svg']
	},
	render: (builder: Haeckel.ElementBuilder, sources: Haeckel.DataSources, assets: Haeckel.AssetData) =>
	{
		var phyloSource = sources.sources['data/2014 - ISoGG.json'],
			phylogeny = new Haeckel.DAGSolver<Haeckel.Taxic>(phyloSource.phylogenies['v7.54']),
			occurrences = sources.sources['data/compiled/haplogroup-locations.json'].occurrences,
			area = Haeckel.rec.create(0, 0, 1000, 500);
		haploMap(builder, phyloSource.nomenclature, phylogeny, occurrences, assets['assets/worldmap.svg'], area);
	}
};
figure;