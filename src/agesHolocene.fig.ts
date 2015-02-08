/// <reference path="ageFigure.ts"/>

var FIGURE_WIDTH = 750;

var TAXA: AgeFigureTaxon[] = [
	{
		name: 'orangutans',
		silhouette: 'assets/silhouettes/Pongo pygmaeus (male, bipedal).svg'
	},
	{
		name: 'gorillas',
		silhouette: 'assets/silhouettes/Gorilla gorilla (male, bipedal).svg'
	},
	{
		name: 'chimpanzees',
		silhouette: 'assets/silhouettes/Pan troglodytes (bipedal).svg'
	},
	{
		name: 'modern humans',
		silhouette: 'assets/silhouettes/Homo sapiens sapiens (male, standing).svg',
		specialMap: 'assets/worldmap_popdensity.png'
	}
];

var FIGURE_HEIGHT = ageFigureHeight(FIGURE_WIDTH, TAXA.length, true);

var FIGURE_TO_RENDER: Haeckel.Figure = 
{
	width: FIGURE_WIDTH,
	height: FIGURE_HEIGHT,
	sources: ['data/2014 - ICS.json', 'data/compiled/characters.json', 'data/compiled/nomenclature.json'],
	assets: {
		png: ['assets/worldmap_popdensity.png'],
		svg: ['assets/worldmap.svg'].concat(TAXA.map(taxon => taxon.silhouette))
	},
	render: (builder: Haeckel.ElementBuilder, sources: Haeckel.DataSources, defs: () => Haeckel.ElementBuilder, pngAssets: Haeckel.PNGAssets) =>
	{
		var area = Haeckel.rec.create(0, 0, FIGURE_WIDTH, FIGURE_HEIGHT);
		ageFigure({
			area: area,
			builder: builder,
			defs: defs(),
			noStrat: true,
			nomenclature: sources.nomenclature,
			occurrencesSource: sources.sources['data/compiled/characters.json'],
			pngAssets: pngAssets,
			strataSource: sources.sources['data/2014 - ICS.json'],
			taxa: TAXA,
			timeUnitName: 'Holocene'
		});
		return builder;
	}
};