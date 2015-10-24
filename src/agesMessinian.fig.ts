/// <reference path="ageFigure.ts"/>

var FIGURE_WIDTH = 500;

var TAXA: AgeFigureTaxon[] = [
	{
		name: 'Sahelanthropus',
		italics: true,
		silhouette: 'assets/silhouettes/Sahelanthropus tchadensis.svg'
	},
	{
		name: 'Orrorin',
		italics: true,
		silhouette: 'assets/silhouettes/Orrorin tugenensis.svg'
	},
	{
		name: 'Ardipithecus',
		italics: true,
		silhouette: 'assets/silhouettes/Ardipithecus kadabba.svg'
	}
];

var FIGURE_HEIGHT = ageFigureHeight(FIGURE_WIDTH, TAXA.length);

var FIGURE_TO_RENDER: Haeckel.Figure = 
{
	width: FIGURE_WIDTH,
	height: FIGURE_HEIGHT,
	sources: ['data/2014 - ICS.json', 'data/compiled/characters.json', 'data/compiled/nomenclature.json'],
	assets: {
		//png: ['assets/worldmap_popdensity.png'],
		svg: ['assets/worldmap.svg'].concat(TAXA.map(taxon => taxon.silhouette))
	},
	render: (builder: Haeckel.ElementBuilder, sources: Haeckel.DataSources, defs: () => Haeckel.ElementBuilder) =>
	{
		var area = Haeckel.rec.create(0, 0, FIGURE_WIDTH, FIGURE_HEIGHT);
		ageFigure({
			area: area,
			builder: builder,
			defs: defs(),
			nomenclature: sources.nomenclature,
			occurrencesSource: sources.sources['data/compiled/characters.json'],
			strataSource: sources.sources['data/2014 - ICS.json'],
			taxa: TAXA,
			timeUnitName: 'Messinian'
		});
		return builder;
	}
};