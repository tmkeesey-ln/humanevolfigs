/// <reference path="ageFigure.ts"/>

var FIGURE_WIDTH = 1000;

var TAXA: AgeFigureTaxon[] = [
	{
		name: 'orangutans',
		silhouette: 'assets/silhouettes/Pongo pygmaeus (female, climbing).svg'
	},
	{
		name: 'Gigantopithecus',
		italics: true,
		silhouette: 'assets/silhouettes/Gigantopithecus blacki.svg'
	},
	{
		name: 'chimpanzees',
		silhouette: 'assets/silhouettes/Pan paniscus.svg'
	},
	{
		name: 'Homo erectus',
		italics: true,
		silhouette: 'assets/silhouettes/Homo erectus pekinensis.svg'
	},
	{
		name: 'Neandertals',
		silhouette: 'assets/silhouettes/Homo neanderthalensis (female).svg'
	},
	{
		name: 'other archaics',
		label: 'Other Near-Humans',
		silhouette: 'assets/silhouettes/Homo heidelbergensis rhodesiensis.svg'
	},
	{
		name: 'humans',
		label: 'robust humans',
		silhouette: 'assets/silhouettes/Homo sapiens idaltu.svg'
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
			timeUnitName: 'Middle Pleistocene'
		});
		return builder;
	}
};