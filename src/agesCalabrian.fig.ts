/// <reference path="ageFigure.ts"/>

var FIGURE_HEIGHT = 5 * 300;

var TAXA: AgeFigureTaxon[] = [
	{
		name: 'Paranthropus',
		italics: true,
		silhouette: 'assets/silhouettes/Paranthropus boisei (male).svg'
	},
	{
		name: 'habilines',
		silhouette: 'assets/silhouettes/Homo habilis.svg'
	},
	{
		name: 'erectines',
		silhouette: 'assets/silhouettes/Homo ergaster ergaster.svg'
	},
	{
		name: 'archaics',
		silhouette: 'assets/silhouettes/Homo heidelbergensis rhodesiensis.svg' // :TODO: antecessor
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
			timeUnitName: 'Calabrian'
		});
		return builder;
	}
};