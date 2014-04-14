/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>
/// <reference path="distanceChart.ts"/>

var FIGURE_HEIGHT = 400;

var FIGURE_WIDTH = 600;

var BOTTOM_MARGIN = 100;

var LEFT_MARGIN = 60;

var RIGHT_MARGIN = 10;

var TOP_MARGIN = 10;

var NAME_ENTRIES = Haeckel.ext.create<NameEntry>([
    { name: "Homo sapiens", scientific: true },
    { name: "Homo ergaster", scientific: true },
    { name: "Homo habilis", scientific: true },
    { name: "Homo rudolfensis", scientific: true },
    { name: "guereza colobus monkeys" },
    { name: "common chimpanzees" },
    { name: "Bornean orangutans" },
    { name: "baboons" },
    { name: "western gorillas" },
    { name: "Sahelanthropus tchadensis", scientific: true },
    { name: "gibbons" },
    { name: "Ardipithecus ramidus", scientific: true },
    { name: "Australopithecus anamensis", scientific: true },
    { name: "Australopithecus afarensis", scientific: true },
    { name: "Australopithecus platyops", scientific: true },
    { name: "Australopithecus africanus", scientific: true },
    { name: "Australopithecus garhi", scientific: true },
    { name: "Paranthropus aethiopicus", scientific: true },
    { name: "Paranthropus robustus", scientific: true },
    { name: "Paranthropus boisei", scientific: true }
]);

var FIGURE_TO_RENDER: Haeckel.Figure = 
{
	height: FIGURE_HEIGHT,
	width: FIGURE_WIDTH,

	sources: [
        'data/2004 - Strait & Grine.json',
        'data/compiled/nomenclature.json'
	],

	render: (builder: Haeckel.ElementBuilder, sources: Haeckel.DataSources, defs: () => Haeckel.ElementBuilder, pngAssets: Haeckel.PNGAssets) =>
	{
        var AREA = Haeckel.rec.createFromCoords(
            LEFT_MARGIN,
            TOP_MARGIN,
            FIGURE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN,
            FIGURE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN
        );

		var cmBuilder = new Haeckel.CharacterMatrixBuilder<Haeckel.Set>(),
			source = sources.sources["data/2004 - Strait & Grine.json"];
		cmBuilder.addMatrix(source.characterMatrices["Table3"]);
		cmBuilder.addMatrix(source.characterMatrices["AppendixC"]);
		var characterMatrix = cmBuilder.build();

		distanceChart(builder, sources.nomenclature, defs, characterMatrix, NAME_ENTRIES, AREA);
	}
};