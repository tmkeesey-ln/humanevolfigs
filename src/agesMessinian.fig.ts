/// <reference path="ageFigure.ts"/>

var FIGURE_HEIGHT = 5 * 300;

var TAXA: AgeFigureTaxon[] = [
	{
		name: 'Khoratpithecus',
		italics: true,
		silhouette: 'assets/silhouettes/Pongo abelii.svg' // :TODO: Khoratpithecus image
	},
	{
		name: 'Indopithecus',
		italics: true,
		silhouette: 'assets/silhouettes/Gigantopithecus blacki.svg' // :TODO: Indopithecus image
	},
	{
		name: 'Lufengpithecus',
		italics: true,
		silhouette: 'assets/silhouettes/Lufengpithecus hudienensis.svg'
	},
	{
		name: 'Oreopithecus',
		italics: true,
		silhouette: 'assets/silhouettes/Dryopithecus brancoi.svg' // :TODO: Oreopithecus image
	},
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
			timeUnitName: 'Messinian'
		});
		return builder;
	}
};