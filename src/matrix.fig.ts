/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>

var CHARACTER_LABEL_WIDTH = 100;

var FIGURE_HEIGHT = 950;

var FIGURE_WIDTH = 950;

var MARGIN_BOTTOM = 12;

var STATES_LABEL_WIDTH = 100;

var TAXON_LABEL_HEIGHT = 100;

var FIGURE_TO_RENDER: Haeckel.Figure = 
{
	height: FIGURE_HEIGHT,
	width: FIGURE_WIDTH,

	sources: [
		'data/compiled/characters.json',
		'data/compiled/nomenclature.json'
	],

	render: (builder: Haeckel.ElementBuilder, sources: Haeckel.DataSources, defs: () => Haeckel.ElementBuilder, pngAssets: Haeckel.PNGAssets) =>
	{
		/*
		defs()
			.child(Haeckel.SVG_NS, 'linearGradient')
			.attrs(Haeckel.SVG_NS, {
				id: "leftFade",
				x1: "0%",
				y1: "0%",
				x2: "100%",
				y2: "0%",
			})
			.child(Haeckel.SVG_NS, 'stop')
			.attrs(Haeckel.SVG_NS, {
				offset: "0%",
				style: "stop-color: rgb(255, 255, 255); stop-opacity: 0"
			})
			.parent()
			.child(Haeckel.SVG_NS, 'stop')
			.attrs(Haeckel.SVG_NS, {
				offset: "100%",
				style: "stop-color: rgb(255, 255, 255); stop-opacity: 1"
			});
		defs()
			.child(Haeckel.SVG_NS, 'linearGradient')
			.attrs(Haeckel.SVG_NS, {
				id: "rightFade",
				x1: "0%",
				y1: "0%",
				x2: "100%",
				y2: "0%",
			})
			.child(Haeckel.SVG_NS, 'stop')
			.attrs(Haeckel.SVG_NS, {
				offset: "0%",
				style: "stop-color: rgb(255, 255, 255); stop-opacity: 1"
			})
			.parent()
			.child(Haeckel.SVG_NS, 'stop')
			.attrs(Haeckel.SVG_NS, {
				offset: "100%",
				style: "stop-color: rgb(255, 255, 255); stop-opacity: 0"
			});
		*/
		builder.child(Haeckel.SVG_NS, 'rect')
			.attrs(Haeckel.SVG_NS, {
				fill: '#FFFFFF',
				x: '0',
				y: '0',
				width: FIGURE_WIDTH + 'px',
				height: FIGURE_HEIGHT + 'px'
			});
		var chartGroup = builder.child(Haeckel.SVG_NS, 'g');
		var chart = new Haeckel.CharacterMatrixChart();
		chart.area = Haeckel.rec.create(CHARACTER_LABEL_WIDTH, TAXON_LABEL_HEIGHT,
			FIGURE_WIDTH - CHARACTER_LABEL_WIDTH - STATES_LABEL_WIDTH, FIGURE_HEIGHT - TAXON_LABEL_HEIGHT - MARGIN_BOTTOM);
		chart.matrix = <Haeckel.CharacterMatrix<Haeckel.BitSet>> sources.sources['data/compiled/characters.json'].characterMatrices['examples'];
		chart.characters = [2, 1, 3, 10, 7, 6, 5, 8, 9, 4, 0]
			.reverse()
			.map(index => chart.matrix.characterList[index]);
		chart.taxa = ['Pongo', 'Gorilla', 'Pan', 'Ardipithecus', 'Praeanthropus', 'Australopithecus',
			'Homo habilis & rudolfensis', 'Homo erectus & ergaster', 'Homo heidelbergensis', 'Homo neanderthalensis',
			'Homo sapiens'].map(name => sources.nomenclature.nameMap[name]);
		chart.render(chartGroup);
		return builder;
	}
};