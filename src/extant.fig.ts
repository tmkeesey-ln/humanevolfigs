/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>
/// <reference path="distanceChart.ts"/>

var FIGURE_HEIGHT = 300;

var FIGURE_WIDTH = 300;

var BOTTOM_MARGIN = 70;

var LEFT_MARGIN = 30;

var RIGHT_MARGIN = 10;

var TOP_MARGIN = 10;

var NAME_ENTRIES = Haeckel.ext.create<NameEntry>([
    { name: "colobus monkeys" },
    { name: "baboons" },
    { name: "gibbons" },
    { name: "orangutans" },
    { name: "gorillas" },
    { name: "chimpanzees" },
    { name: "Homo sapiens", scientific: true }
]);

var FIGURE_TO_RENDER: Haeckel.Figure = 
{
	height: FIGURE_HEIGHT,
	width: FIGURE_WIDTH,

	sources: [
        'data/2004 - Strait & Grine.json',
        'data/2011 - Diogo & Wood.json',
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

        var cmBuilder = new Haeckel.CharacterMatrixBuilder<Haeckel.Set>();
        cmBuilder.addMatrix(sources.sources["data/2004 - Strait & Grine.json"].characterMatrices["Table3-modified"]);
        //cmBuilder.addMatrix(sources.sources["data/2004 - Strait & Grine.json"].characterMatrices["AppendixC-modified"]);
        cmBuilder.addMatrix(sources.sources["data/2011 - Diogo & Wood.json"].characterMatrices["Table1"]);
        var characterMatrix = cmBuilder.build(),
            distanceMatrix = Haeckel.chr.toDistanceMatrix(characterMatrix);

		distanceChart(builder, sources.nomenclature, defs, distanceMatrix, NAME_ENTRIES, AREA);
	}
};