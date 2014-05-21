/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>
/// <reference path="distanceChart.ts"/>

var FIGURE_HEIGHT = 400;

var FIGURE_WIDTH = 300;

var BOTTOM_MARGIN = 100;

var LEFT_MARGIN = 60;

var RIGHT_MARGIN = 10;

var TOP_MARGIN = 10;

var NAME_ENTRIES = Haeckel.ext.create<NameEntry>([
    { name: "Homo sapiens", scientific: true },
    { name: "guereza colobus monkeys" },
    { name: "common chimpanzees" },
    { name: "Bornean orangutans" },
    { name: "baboons" },
    { name: "western gorillas" },
    { name: "gibbons" }
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
		cmBuilder.addMatrix(source.characterMatrices["Table3-modified"]);
		//cmBuilder.addMatrix(source.characterMatrices["AppendixC-modified"]);
		var characterMatrix = cmBuilder.build(),
            distanceMatrix = Haeckel.chr.toDistanceMatrix(characterMatrix)
		distanceChart(builder, sources.nomenclature, defs, distanceMatrix, NAME_ENTRIES, AREA);
	}
};