/// <reference path="ageFigure.ts"/>

var FIGURE_WIDTH = 1000;

var TAXA: AgeFigureTaxon[] = [
	{
		name: 'Gigantopithecus',
		italics: true,
		silhouette: 'assets/silhouettes/Gigantopithecus blacki.svg'
	},
	{
		name: 'Australopithecus',
		italics: true,
		silhouette: 'assets/silhouettes/Australopithecus africanus.svg'
	},
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
		label: 'Near-Humans',
		silhouette: 'assets/silhouettes/Homo heidelbergensis antecessor.svg'
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
			timeUnitName: 'Calabrian'
		});
		return builder;
	}
};