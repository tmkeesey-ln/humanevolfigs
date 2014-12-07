/// <reference path="anatomy.ts"/>

var FIGURE_TO_RENDER: Haeckel.Figure = 
{
	width: 1000,
	height: 500,
	sources: [],
	assets: {
		json: ['assets/apes_synapomorphy_coords.json'],
		png: ['assets/apes.png']
	},
	render: (builder: Haeckel.ElementBuilder, sources: Haeckel.DataSources,
		defs: () => Haeckel.ElementBuilder, pngAssets: Haeckel.PNGAssets,
		jsonAssets: Haeckel.JSONAssets) =>
	{
		//pngAssets.image(defs(), 'assets/apes.png')
		//	.attr(Haeckel.SVG_NS, 'id', 'apes');

		var chart = new humanevolfigs.anatomy.Chart();
		chart.area = Haeckel.rec.create(25, 25, 419, 450);
		chart.characterCodes = ['CW1', 'CW79', 'CW89', 'CW41', 'SG49', 'CW43', 'DW18', 'DW55', 'GCW5',
			'CW9', 'CW11', 'CW17', 'CW22', 'CW64', 'CW52', 'CW54', 'CW50', 'DW16', 'DW22', 'DW67', 'GCW7',
			'CW35', 'CW40', 'CW42', 'CW92', 'CW60', 'CW61', 'DW61'];
		chart.collapsibleDistance = {
			behind: 50,
			front: 25
		};
		chart.defs = defs;
		chart.id = 'Homo-sapiens';
		chart.imageArea = Haeckel.rec.create(8699, 299, 644, 692);
		chart.imageID = 'apes';
		chart.imageSize = {
			width: 100008,
			height: 4000
		};
		chart.rawData = <humanevolfigs.anatomy.ChartRawData> jsonAssets['assets/apes_synapomorphy_coords.json'];
		chart.taxonName = 'Homo sapiens';
		chart.render(builder);
	}
};
