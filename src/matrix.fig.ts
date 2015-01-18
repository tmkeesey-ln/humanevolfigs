/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>

var CHARACTER_LABEL_WIDTH = 100;

var FIGURE_HEIGHT = 950;

var FIGURE_WIDTH = 950;

var MARGIN_BOTTOM = 12;

var SILHOUETTE_SCALE = 1 / 3;

var STATES_LABEL_WIDTH = 100;

var TAXON_LABEL_HEIGHT = 100;

var TAXON_NAMES: string[] = ['orangutans', 'gorillas', 'chimpanzees',
	'Ardipithecus', 'Praeanthropus', 'Australopithecus',
	'Homo habilis & rudolfensis', 'Homo erectus & ergaster', 'near-humans',
	'humans'];

var TAXON_SILHOUETTES: string[] = [
		'assets/silhouettes/Pongo pygmaeus (male, bipedal).svg',
		'assets/silhouettes/Gorilla gorilla (male, bipedal).svg',
		'assets/silhouettes/Pan troglodytes (bipedal).svg',
		'assets/silhouettes/Ardipithecus ramidus.svg',
		'assets/silhouettes/Praeanthropus anamensis.svg',
		'assets/silhouettes/Australopithecus africanus.svg',
		'assets/silhouettes/Homo rudolfensis.svg',
		'assets/silhouettes/Homo ergaster ergaster.svg',
		'assets/silhouettes/Homo neanderthalensis (male).svg',
		'assets/silhouettes/Homo sapiens sapiens (male, standing).svg'
	];

var FIGURE_TO_RENDER: Haeckel.Figure = 
{
	height: FIGURE_HEIGHT,
	width: FIGURE_WIDTH,

	assets: {
		png: [],
		svg: TAXON_SILHOUETTES
	},

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
		var labelsGroup = builder.child(Haeckel.SVG_NS, 'g');
		var silhouettesGroup = builder.child(Haeckel.SVG_NS, 'g');
		var chart = new Haeckel.CharacterMatrixChart();

		chart.area = Haeckel.rec.create(CHARACTER_LABEL_WIDTH, TAXON_LABEL_HEIGHT,
			FIGURE_WIDTH - CHARACTER_LABEL_WIDTH - STATES_LABEL_WIDTH, FIGURE_HEIGHT - TAXON_LABEL_HEIGHT - MARGIN_BOTTOM);
		chart.matrix = <Haeckel.CharacterMatrix<Haeckel.BitSet>> sources.sources['data/compiled/characters.json'].characterMatrices['examples'];
		chart.characters = [2, 1, 6, 3, 10, 5, 8, 9, 7, 11, 4, 0]
			.reverse()
			.map(index => chart.matrix.characterList[index]);
		chart.taxa = TAXON_NAMES.map(name => sources.nomenclature.nameMap[name]);
		chart.render(chartGroup);

		chart.characters.forEach((character: Haeckel.Character<Haeckel.BitSet>, index: number) =>
		{
			var area = chart.getArea(index, 0);
			var label = labelsGroup
				.child(Haeckel.SVG_NS, 'text')
				.attrs(Haeckel.SVG_NS, {
					x: (area.left - 12) + 'px',
					y: (area.top + 16) + 'px',
					'text-anchor': 'end',
					'font-size': '16px',
					'font-family': "Myriad Pro",
					'font-weight': 'bold'
				});
			character.label
				.replace(/(\-|\/)(\S)/g, '$1 $2')
				.split(/\s+/g)
				.forEach((word: string, index: number) =>
				{
					label
						.child(Haeckel.SVG_NS, 'tspan')
						.text(word)
						.attrs(Haeckel.SVG_NS, {
							x: (area.left - 12) + 'px',
							dy: (index > 0) ? '16px' : '0'
						});
				});
		});

		TAXON_NAMES.forEach((name: string, index: number) =>
		{
			var italicize = name.charAt(0) === name.charAt(0).toUpperCase();
			var area = chart.getArea(0, index);
			var label = labelsGroup
				.child(Haeckel.SVG_NS, 'text')
				.attrs(Haeckel.SVG_NS, {
					x: area.centerX + 'px',
					y: '12px',
					'text-anchor': 'middle',
					'font-size': '12px',
					'font-family': "Myriad Pro"
				});
			var ampPos = name.indexOf('&');
			if (ampPos < 0)
			{
				label.text(name);
			}
			else
			{
				label
					.child(Haeckel.SVG_NS, 'tspan')
					.text(name.substr(0, ampPos - 1))
					.attrs(Haeckel.SVG_NS, {
						x: area.centerX + 'px',
						dy: '0'
					});
				label
					.child(Haeckel.SVG_NS, 'tspan')
					.text(name.substr(ampPos))
					.attrs(Haeckel.SVG_NS, {
						x: area.centerX + 'px',
						dy: '12px'
					});
			}
			if (italicize)
			{
				label.attr(Haeckel.SVG_NS, 'font-style', 'italic');
			}
			silhouettesGroup
				.child(Haeckel.SVG_NS, 'use')
				.attrs(Haeckel.SVG_NS, {
					x: (area.centerX - 100 * SILHOUETTE_SCALE) + 'px',
					y: (area.y - 200 * SILHOUETTE_SCALE) + 'px',
					width: (200 * SILHOUETTE_SCALE) + 'px',
					height: (200 * SILHOUETTE_SCALE) + 'px'
				})
				.attr('xlink:href', '#' + TAXON_SILHOUETTES[index]);
		});

		return builder;
	}
};