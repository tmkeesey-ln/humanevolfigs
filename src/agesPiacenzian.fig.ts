/// <reference path="ageFigure.ts"/>

var FIGURE_HEIGHT = 5 * 300;

var TAXA: AgeFigureTaxon[] = [
	{
		name: 'Indopithecus',
		italics: true,
		silhouette: 'assets/silhouettes/Gigantopithecus blacki.svg' // :TODO: Indopithecus image
	},
	{
		name: 'Praeanthropus',
		italics: true,
		silhouette: 'assets/silhouettes/Praeanthropus afarensis (male).svg'
	},
	{
		name: 'Kenyanthropus',
		italics: true,
		silhouette: 'assets/silhouettes/Kenyanthropus platyops.svg'
	},
	{
		name: 'Australopithecus',
		italics: true,
		silhouette: 'assets/silhouettes/Australopithecus africanus.svg'
	},
	{
		name: 'Paranthropus',
		italics: true,
		silhouette: 'assets/silhouettes/Paranthropus aethiopicus.svg'
	}
];

var FIGURE_WIDTH = 250 * TAXA.length + 25;

var FIGURE_TO_RENDER: Haeckel.Figure = 
{
	width: FIGURE_WIDTH,
	height: FIGURE_HEIGHT,
	sources: ['data/2014 - ICS.json', 'data/compiled/characters.json', 'data/compiled/nomenclature.json'],
	assets: {
		//png: ['assets/worldmap_popdensity.png'],
		svg: /*['assets/worldmap.svg'].concat(*/TAXA.map(taxon => taxon.silhouette)//)
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
			timeUnitName: 'Piacenzian'
		});
		return builder;
	}
};