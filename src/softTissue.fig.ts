/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>
/// <reference path="distanceChart.ts"/>

var FIGURE_HEIGHT = 400;

var FIGURE_WIDTH = 600;

var BOTTOM_MARGIN = 100;

var LEFT_MARGIN = 60;

var RIGHT_MARGIN = 10;

var TOP_MARGIN = 10;

var NAME_ENTRIES = Haeckel.ext.create<NameEntry>([
    { name: "slender lorises" },
    { name: "slow lorises" },
    { name: "ring-tailed lemurs" },
    { name: "sifakas" },
    { name: "tarsiers" },
    { name: "sakis" },
    { name: "owl monkeys" },
    { name: "marmosets" },
    { name: "squirrel monkeys" },
    { name: "colobus monkeys" },
    { name: "guenons" },
    { name: "macaques" },
    { name: "baboons" },
    { name: "common gibbons" },
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

		var characterMatrix =
            sources.sources["data/2011 - Diogo & Wood.json"]
            .characterMatrices["Table1"];

		distanceChart(builder, sources.nomenclature, defs, characterMatrix, NAME_ENTRIES, AREA);
	}
};