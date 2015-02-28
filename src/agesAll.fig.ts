/// <reference path="ageFigure.ts"/>

var FIGURE_WIDTH = 10000;

var TAXA: AgeFigureTaxon[] = [
	{
		name: 'Pongo',
		italics: true,
		maskMap: true,
		silhouette: 'assets/silhouettes/Pongo pygmaeus (male, quadrupedal).svg'
	},
	{
		name: 'Khoratpithecus',
		italics: true,
		silhouette: 'assets/silhouettes/Pongo pygmaeus (female, climbing).svg'
	},
	{
		name: 'Gigantopithecus',
		italics: true,
		silhouette: 'assets/silhouettes/Gigantopithecus blacki.svg'
	},
	{
		name: 'Indopithecus',
		italics: true,
		silhouette: 'assets/silhouettes/Indopithecus giganteus.svg'
	},
	{
		name: 'Lufengpithecus',
		italics: true,
		silhouette: 'assets/silhouettes/Lufengpithecus hudienensis.svg'
	},
	{
		name: 'Oreopithecus',
		italics: true,
		silhouette: 'assets/silhouettes/Oreopithecus bambolii.svg'
	},
	{
		name: 'Gorilla',
		italics: true,
		maskMap: true,
		silhouette: 'assets/silhouettes/Gorilla gorilla (female, quadrupedal).svg'
	},
	{
		name: 'Pan',
		italics: true,
		maskMap: true,
		silhouette: 'assets/silhouettes/Pan paniscus.svg'
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
		silhouette: 'assets/silhouettes/Ardipithecus ramidus.svg'
	},
	{
		name: '"Australopithecus" praegens',
		label: "Hominina praegens",
		italics: true,
		silhouette: 'assets/silhouettes/Ardipithecus kadabba.svg'
	},
	{
		name: 'Praeanthropus anamensis',
		label: 'Pr. anamensis',
		italics: true,
		silhouette: 'assets/silhouettes/Praeanthropus anamensis.svg'
	},
	{
		name: 'Praeanthropus aff. afarensis',
		label: 'Pr. aff. afarensis',
		italics: true,
		silhouette: 'assets/silhouettes/Praeanthropus afarensis (female).svg'
	},
	{
		name: 'Praeanthropus afarensis',
		label: 'Pr. afarensis',
		italics: true,
		silhouette: 'assets/silhouettes/Praeanthropus afarensis (male).svg'
	},
	{
		name: 'Hominina indet. A',
		label: 'Hominina indet.',
		italics: true,
		silhouette: 'assets/silhouettes/Australopithecus africanus.svg'
	},
	{
		name: 'Australopithecus sp.',
		label: 'Au. sp.',
		italics: true,
		silhouette: 'assets/silhouettes/Australopithecus garhi.svg'
	},
	{
		name: 'Australopithecus garhi',
		label: 'Au. garhi',
		italics: true,
		silhouette: 'assets/silhouettes/Australopithecus garhi.svg'
	},
	{
		name: 'Australopithecus africanus',
		label: 'Au. africanus',
		italics: true,
		silhouette: 'assets/silhouettes/Australopithecus africanus.svg'
	},
	{
		name: 'Australopithecus sediba',
		label: 'Au. sediba',
		italics: true,
		silhouette: 'assets/silhouettes/Australopithecus sediba.svg'
	},
	{
		name: 'Kenyanthropus',
		italics: true,
		silhouette: 'assets/silhouettes/Kenyanthropus platyops.svg'
	},
	{
		name: 'Paranthropus boisei',
		label: 'Pa. boisei',
		italics: true,
		silhouette: 'assets/silhouettes/Paranthropus boisei (male).svg'
	},
	{
		name: 'Paranthropus robustus',
		label: 'Pa. robustus',
		italics: true,
		silhouette: 'assets/silhouettes/Paranthropus robustus.svg'
	},
	{
		name: 'Paranthropus indet.',
		label: 'Pa. indet.',
		italics: true,
		silhouette: 'assets/silhouettes/Paranthropus boisei (female).svg'
	},
	{
		name: 'Paranthropus aethiopicus',
		label: 'Pa. aethiopicus',
		italics: true,
		silhouette: 'assets/silhouettes/Paranthropus aethiopicus.svg'
	},
	{
		name: 'Homo aff. habilis',
		label: 'H. aff. habilis',
		italics: true,
		silhouette: 'assets/silhouettes/Homo habilis.svg'
	},
	{
		name: 'indeterminate habilines',
		label: 'H. indet.',
		italics: true,
		silhouette: 'assets/silhouettes/Homo rudolfensis.svg'
	},
	{
		name: 'Homo rudolfensis',
		label: 'H. rudolfensis',
		italics: true,
		silhouette: 'assets/silhouettes/Homo rudolfensis.svg'
	},
	{
		name: 'Homo habilis',
		label: 'H. habilis',
		italics: true,
		silhouette: 'assets/silhouettes/Homo habilis.svg'
	},
	{
		name: 'Homo floresiensis',
		label: 'H. floresiensis',
		italics: true,
		silhouette: 'assets/silhouettes/Homo floresiensis.svg'
	},
	{
		name: 'Homo ergaster ergaster',
		label: 'H. erg. ergaster',
		italics: true,
		silhouette: 'assets/silhouettes/Homo ergaster ergaster.svg'
	},
	{
		name: 'Homo ergaster georgicus',
		label: 'H. erg. georgicus',
		italics: true,
		silhouette: 'assets/silhouettes/Homo ergaster georgicus.svg'
	},
	{
		name: 'indeterminate erectines',
		label: 'H. (H.) indet.',
		italics: true,
		silhouette: 'assets/silhouettes/Homo ergaster georgicus.svg'
	},
	{
		name: 'Homo modjokertensis',
		label: 'H. modjokertensis',
		italics: true,
		silhouette: 'assets/silhouettes/Homo ergaster ergaster.svg'
	},
	{
		name: 'Homo yuanmouensis',
		label: 'H. yuanmouensis',
		italics: true,
		silhouette: 'assets/silhouettes/Homo ergaster ergaster.svg'
	},
	{
		name: 'Homo lantianensis',
		label: 'H. lantianensis',
		italics: true,
		silhouette: 'assets/silhouettes/Homo ergaster ergaster.svg'
	},
	{
		name: 'Homo erectus palaeojavanicus',
		label: 'H. ere. palaeojavanicus',
		italics: true,
		silhouette: 'assets/silhouettes/Homo erectus pekinensis.svg'
	},
	{
		name: 'Homo erectus erectus',
		label: 'H. ere. erectus',
		italics: true,
		silhouette: 'assets/silhouettes/Homo erectus pekinensis.svg'
	},
	{
		name: 'Homo erectus soloensis',
		label: 'H. ere. soloensis',
		italics: true,
		silhouette: 'assets/silhouettes/Homo erectus pekinensis.svg'
	},
	{
		name: 'Homo erectus ssp. (Vietnam)',
		label: 'H. ere. ssp.',
		italics: true,
		silhouette: 'assets/silhouettes/Homo erectus pekinensis.svg'
	},
	{
		name: 'Homo erectus nankinensis',
		label: 'H. ere. nankinensis',
		italics: true,
		silhouette: 'assets/silhouettes/Homo erectus pekinensis.svg'
	},
	{
		name: 'Homo erectus pekinensis',
		label: 'H. ere. pekinensis',
		italics: true,
		silhouette: 'assets/silhouettes/Homo erectus pekinensis.svg'
	},
	{
		name: 'Homo erectus hexianensis',
		label: 'H. ere. hexianensis',
		italics: true,
		silhouette: 'assets/silhouettes/Homo erectus pekinensis.svg'
	},
	{
		name: 'Homo erectus ssp. (Taiwan)',
		label: 'H. ere. ssp.',
		italics: true,
		silhouette: 'assets/silhouettes/Homo erectus pekinensis.svg'
	},
	{
		name: 'Homo heidelbergensis antecessor',
		label: 'H. h. antecessor',
		italics: true,
		silhouette: 'assets/silhouettes/Homo heidelbergensis antecessor.svg'
	},
	{
		name: 'Homo heidelbergensis ssp. (Kacabas)',
		label: 'H. h. ssp.',
		italics: true,
		silhouette: 'assets/silhouettes/Homo heidelbergensis antecessor.svg'
	},
	{
		name: 'Homo heidelbergensis narmadensis',
		label: 'H. h. narmadensis',
		italics: true,
		silhouette: 'assets/silhouettes/Homo heidelbergensis antecessor.svg'
	},
	{
		name: 'Homo heidelbergensis daliensis',
		label: 'H. h. daliensis',
		italics: true,
		silhouette: 'assets/silhouettes/Homo heidelbergensis daliensis.svg'
	},
	{
		name: 'Homo heidelbergensis mabaensis',
		label: 'H. h. mabaensis',
		italics: true,
		silhouette: 'assets/silhouettes/Homo heidelbergensis daliensis.svg'
	},
	{
		name: 'Homo sp. (Denisova)',
		label: 'H. sp.',
		italics: true,
		silhouette: 'assets/silhouettes/Homo heidelbergensis daliensis.svg'
	},
	{
		name: 'Homo heidelbergensis heidelbergensis',
		label: 'H. h. heidelbergensis',
		italics: true,
		silhouette: 'assets/silhouettes/Homo neanderthalensis (female).svg'
	},
	{
		name: 'Homo heidelbergensis steinheimensis',
		label: 'H. h. steinheimensis',
		italics: true,
		silhouette: 'assets/silhouettes/Homo neanderthalensis (female).svg'
	},
	{
		name: 'Homo neanderthalensis',
		label: 'H. neanderthalensis',
		italics: true,
		maskMap: true,
		silhouette: 'assets/silhouettes/Homo neanderthalensis (male).svg'
	},
	{
		name: 'Homo heidelbergensis aff. cepranensis',
		label: 'H. h. aff. cepranensis',
		italics: true,
		silhouette: 'assets/silhouettes/Homo heidelbergensis rhodesiensis.svg'
	},
	{
		name: 'Homo heidelbergensis cepranensis',
		label: 'H. h. cepranensis',
		italics: true,
		silhouette: 'assets/silhouettes/Homo heidelbergensis rhodesiensis.svg'
	},
	{
		name: 'Homo heidelbergensis mauritanicus',
		label: 'H. h. mauritanicus',
		italics: true,
		silhouette: 'assets/silhouettes/Homo heidelbergensis rhodesiensis.svg'
	},
	{
		name: 'Homo heidelbergensis rhodesiensis',
		label: 'H. h. rhodesiensis',
		italics: true,
		silhouette: 'assets/silhouettes/Homo heidelbergensis rhodesiensis.svg'
	},
	{
		name: 'Homo sapiens ssp.',
		label: 'H. s. ssp.',
		italics: true,
		silhouette: 'assets/silhouettes/Homo sapiens njarasensis.svg'
	},
	{
		name: 'Homo sapiens helmei',
		label: 'H. s. helmei',
		italics: true,
		silhouette: 'assets/silhouettes/Homo sapiens njarasensis.svg'
	},
	{
		name: 'Homo sapiens njarasensis',
		label: 'H. s. njarasensis',
		italics: true,
		silhouette: 'assets/silhouettes/Homo sapiens njarasensis.svg'
	},
	{
		name: 'Homo sapiens idaltu',
		label: 'H. s. idaltu',
		italics: true,
		silhouette: 'assets/silhouettes/Homo sapiens idaltu.svg'
	},
	{
		name: 'Homo sapiens sapiens',
		label: 'H. s. sapiens',
		italics: true,
		maskMap: true,
		silhouette: 'assets/silhouettes/Homo sapiens sapiens (female, walking).svg',
		specialMap: 'assets/worldmap_popdensity.png'
	}
];

var EXTRA_STRATUM_HEIGHT = 1000;

var FIGURE_HEIGHT = ageFigureHeight(FIGURE_WIDTH, TAXA.length) + EXTRA_STRATUM_HEIGHT;

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
			nomenclature: sources.nomenclature,
			occurrencesSource: sources.sources['data/compiled/characters.json'],
			pngAssets: pngAssets,
			strataSource: sources.sources['data/2014 - ICS.json'],
			stratumHeight: STRATUM_HEIGHT + EXTRA_STRATUM_HEIGHT,
			taxa: TAXA,
			timeUnitName: 'Messinian to Recent'
		});
		var stratChart = new Haeckel.StratChart();
		stratChart.area = Haeckel.rec.create(0, TIME_LABEL_FONT_SIZE + TIME_LABEL_SPACING + STRATUM_LINE_THICKNESS,
			FIGURE_WIDTH, STRATUM_HEIGHT + EXTRA_STRATUM_HEIGHT);
		stratChart.minStrokeWidth = 1;
		stratChart.strata = sources.sources['data/2014 - ICS.json'].strata;
		stratChart.time = Haeckel.rng.create(-7246000, 0);
		stratChart.type = "stage/age";
		stratChart.render(builder);
		return builder;
	}
};