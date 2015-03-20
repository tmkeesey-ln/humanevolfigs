/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>

var XLINK_NS = "http://www.w3.org/1999/xlink";

var FIGURE_HEIGHT = 1100;

var FIGURE_WIDTH = 850;

var MARGIN = 25;

var TOP_MARGIN = 200;

var KEY_WIDTH = 600;

var KEY_HEIGHT = 600;

interface NameEntry
{
	ancestral?: boolean;
	column: number;
	name?: string;
	italic?: boolean;
}

interface TaxonEntry extends NameEntry
{
	taxon: Haeckel.Taxic;
	name: string;
	showName?: boolean;
}

function capitalize(s: string)
{
	return s.replace(/(^([a-zA-Z\p{M}]))|([ \-"][a-zA-Z\p{M}])/g, c => c.toUpperCase());
}

var DIVIDER_COLUMN = 18;

var MT_NAME_ENTRIES: { [name: string]: NameEntry; } = {
	"Bornean orangutans": {
		column: 18
	},
	"mt-Pongo*": {
		column: 18.5,
		ancestral: true
	},
	"Sumatran orangutans": {
		column: 19
	},
	"mt-Hominidae*": {
		column: 20.375,
		ancestral: true
	},
	"western gorillas": {
		column: 20
	},
	"mt-Homininae*": {
		column: 22.25,
		ancestral: true
	},
	"mt-Gorilla*": {
		column: 20.5,
		ancestral: true
	},
	"eastern gorillas": {
		column: 21
	},
	"mt-Hominini*": {
		column: 24,
		ancestral: true
	},
	"bonobo chimpanzees": {
		column: 22
	},
	"mt-Pan*": {
		column: 22.5,
		ancestral: true
	},
	"common chimpanzees": {
		column: 23
	},
	"mt-Homo*": {
		column: 25.5,
		ancestral: true
	},
	"mt-HomoA*": {
		column: 24.5,
		ancestral: true
	},
	"mt-HomoB*": {
		column: 26.5,
		ancestral: true
	},
	"Homo heidelbergensis heidelbergensis (Sima de los Huesos)": {
		name: "Sima de los Huesos",
		column: 24
	},
	"Homo sp. (Denisova)": {
		name: "Denisova",
		column: 25
	},
	"Homo neanderthalensis neanderthalensis": {
		name: "Neandertals",
		column: 26
	},
	"mt-MRCA": {
		column: 27,
		name: "Mitochondrial \"Eve\"",
		ancestral: true
	}
};

var MORPH_NAME_ENTRIES: { [name: string]: NameEntry; } = {
	"Bornean orangutans": {
		column: 0
	},
	"fossil orangutans": {
		column: 1
	},
	"Sumatran orangutans": {
		column: 2
	},
	"stem-orangutans": {
		column: 3
	},
	"Hominidae*": {
		column: 4,
		ancestral: true
	},
	"Dryopithecinae": {
		column: 4,
		italic: true
	},
	"western gorillas": {
		column: 5
	},
	"stem-hominines": {
		column: 5
	},
	"pan-Homininae*": {
		column: 5,
		ancestral: true
	},
	"Homininae*": {
		column: 6,
		ancestral: true
	},
	"Gorilla*": {
		column: 6,
		ancestral: true
	},
	"eastern gorillas": {
		column: 6
	},
	"Hominini*": {
		column: 7,
		ancestral: true
	},
	"Pan*": {
		column: 7,
		ancestral: true
	},
	"fossil chimpanzees": {
		column: 7
	},
	"bonobo chimpanzees": {
		column: 8
	},
	"common chimpanzees": {
		column: 9
	},
	"Hominina*": {
		column: 8,
		ancestral: true
	},
	"Sahelanthropus": {
		column: 8,
		italic: true
	},
	"Hominina2*": {
		column: 9,
		ancestral: true
	},
	"Ardipithecus": {
		column: 9,
		italic: true
	},
	"australopithecines": {
		column: 10
	},
	"habilines": {
		column: 11
	},
	"Floresian \"hobbits\"": {
		column: 12,
		italic: false
	},
	"Homo ergaster": {
		column: 13,
		italic: true
	},
	"Homo2*": {
		column: 14,
		ancestral: true
	},
	"Homo erectus": {
		column: 14,
		italic: true
	},
	"Neandertals": {
		column: 15
	},
	"Homo heidelbergensis": {
		column: 16,
		italic: true
	},
	"humans": {
		column: 17
	}
};

var FIGURE_TO_RENDER: Haeckel.Figure = 
{
	height: FIGURE_HEIGHT,
	width: FIGURE_WIDTH,

	sources: [
		'data/compiled/characters.json',
		'data/compiled/nomenclature.json',
		'data/compiled/phylogeny.json',
		'data/1996 - Zhi & al.json',
		'data/2006 - Steiper & Young.json',
		'data/2014 - ICS.json',
		'data/2012 - Langergraber & al.json',
		'data/2013 - Fu & al.json',
		'data/2014 - Meyer & al.json'
	],

	render: (builder: Haeckel.ElementBuilder, sources: Haeckel.DataSources, defs: () => Haeckel.ElementBuilder, pngAssets: Haeckel.PNGAssets) =>
	{
		var AREA = Haeckel.rec.create(MARGIN, TOP_MARGIN, FIGURE_WIDTH - MARGIN * 2, FIGURE_HEIGHT - MARGIN - TOP_MARGIN);
		var TIME = Haeckel.rng.create(-20000000, 0);

		try
		{
			var bgGroup: Haeckel.ElementBuilder;
			var timesGroup: Haeckel.ElementBuilder;
			var dividerX: number;
			var maxColumn = 1;
			var morphTaxonEntries: { [taxonHash: string]: TaxonEntry; } = toTaxonEntries(MORPH_NAME_ENTRIES);
			var mtTaxonEntries: { [taxonHash: string]: TaxonEntry; } = toTaxonEntries(MT_NAME_ENTRIES);

			function addToCharacterMatrix(builder: Haeckel.CharacterMatrixBuilder<Haeckel.Range>, solver: Haeckel.PhyloSolver, datingSources: string[][])
			{
				Haeckel.arr.each(datingSources, (source: string[]) =>
				{
					builder.addMatrix(Haeckel.dat.toCharacterMatrixBuilder(sources.sources[source[0]].datings[source[1]], solver).build());
				});
				return builder;
			}

			function toTaxonEntries(nameEntries: { [name: string]: NameEntry; }): { [taxonHash: string]: TaxonEntry; }
			{
				var name: string;
				var taxonEntries: { [taxonHash: string]: TaxonEntry; } = {};
				for (name in nameEntries)
				{
					var entry = nameEntries[name];
					maxColumn = Math.max(maxColumn, entry.column);
					var taxon = sources.nomenclature.nameMap[name];
					taxonEntries[Haeckel.hash(taxon)] = {
						ancestral: !!entry.ancestral,
						column: entry.column,
						name: entry.name || (entry.italic ? name : capitalize(name)),
						italic: !!entry.italic,
						showName: !!entry.name || !entry.ancestral,
						taxon: taxon
					};
				}
				return taxonEntries;
			}

			function createHorizontalRatioMap(taxonEntries: { [hash: string]: TaxonEntry; }, solver: Haeckel.PhyloSolver): (taxon: Haeckel.Taxic) => Haeckel.Range
			{
				return (taxon: Haeckel.Taxic) =>
				{
					var entry = taxonEntries[Haeckel.hash(taxon)];
					var column = 0;
					if (entry)
					{
						column = entry.column;
					}
					else
					{
						var total = 0;
						try
						{
							var clade = solver.clade(taxon);
						}
						catch (e)
						{
							clade = taxon;
						}
						for (name in MORPH_NAME_ENTRIES)
						{
							var subtaxon = sources.nomenclature.nameMap[name];
							if (subtaxon && Haeckel.tax.includes(clade, subtaxon))
							{
								column += MORPH_NAME_ENTRIES[name].column;
								++total;
							}
						}
						if (total === 0)
						{
							column = maxColumn / 2;
						}
						else
						{
							column /= total;
						}
					}
					return Haeckel.rng.create((column + 0.75) / (maxColumn + 2), (column + 1.25) / (maxColumn + 2));
				};
			}

			function labelTaxon(group: Haeckel.ElementBuilder, entry: TaxonEntry, rectangle: Haeckel.Rectangle, bold?: boolean)
			{
				//var rect = group.child(Haeckel.SVG_NS, 'rect');
				var text = group.child(Haeckel.SVG_NS, 'text')
					.text(entry.name)
					.attrs(Haeckel.SVG_NS, {
						'fill': Haeckel.BLACK.hex,
						'font-style': entry.italic ? 'italic' : 'normal',
						'font-size': '14px',
						'font-weight': bold ? 'bolder' : 'lighter',
						'font-family': "Myriad Pro",
						transform: 'translate(' + (rectangle.centerX + 4) + ',' + (rectangle.top - 6) + ') rotate(-90)'
					});
				/*
				var box = Haeckel.rec.createFromBBox(<SVGTextElement> text.build());
				rect.attrs(Haeckel.SVG_NS, {
					fill: '#FFFFFF',
					stroke: 'none',
					x: rectangle.left + 'px',
					y: (rectangle.top - 6 - box.width) + 'px',
					width: rectangle.width + 'px',
					height: (box.width + 6) + 'px'
				});
				*/
			}

			function getSourceY(sourceRect: Haeckel.Rectangle, targetRect: Haeckel.Rectangle)
			{
				return Math.max(sourceRect.centerY, targetRect.bottom);
			}

			function createArcRenderer(useSides?: boolean)
			{
				return (builder: Haeckel.ElementBuilder, arc: Haeckel.Arc<Haeckel.Taxic>, sourceRect: Haeckel.Rectangle, targetRect: Haeckel.Rectangle) =>
				{
					var data = 'M';
					if (Haeckel.precisionEqual(targetRect.centerX, sourceRect.centerX))
					{
						data += [sourceRect.centerX, useSides ? sourceRect.top : sourceRect.centerY].join(' ')
							+ 'V' + targetRect.bottom;
					}
					else
					{
						var startX = useSides
							? (targetRect.centerX < sourceRect.centerX ? sourceRect.left : sourceRect.right)
							: sourceRect.centerX;
						var sourceY = getSourceY(sourceRect, targetRect);
						var targetY = Math.min(targetRect.bottom, sourceY);
						data += [startX, sourceY].join(' ')
							+ 'Q' + [targetRect.centerX, sourceY, targetRect.centerX, targetY];
					}
					builder.child(Haeckel.SVG_NS, 'path')
						.attrs(Haeckel.SVG_NS, {
							'd': data,
							'stroke': Haeckel.BLACK.hex,
							'fill': 'none',
							'stroke-linecap': 'round',
							'stroke-dasharray': '2 4',
							'stroke-width': '2px'
						});
				};
			}

			function morphChart()
			{
				var phylogeny = sources.sources['data/compiled/phylogeny.json'].phylogenies['morphology'];
				var solver = new Haeckel.PhyloSolver(phylogeny);
				var chart = new Haeckel.PhyloChart();

				var occurrences = sources.sources['data/compiled/characters.json'].occurrences;
				var cmBuilder = new Haeckel.CharacterMatrixBuilder<Haeckel.Range>();
				addToCharacterMatrix(cmBuilder, solver, [
					['data/2006 - Steiper & Young.json', 'Fig1-abridged'],
					['data/2012 - Langergraber & al.json', 'synthesis']
				]);
				Haeckel.ext.each(phylogeny.vertices, (taxon: Haeckel.Taxic) => 
				{
					cmBuilder.states(taxon, Haeckel.TIME_CHARACTER, <Haeckel.Range> Haeckel.chr.states(occurrences, taxon, Haeckel.TIME_CHARACTER));
				});

				chart.area = AREA;
				chart.time = TIME;
				chart.minPrcTime = Haeckel.rng.create(-350000, -350000);
				chart.characterMatrix = cmBuilder.build();
				chart.horizontalRatioMap = createHorizontalRatioMap(morphTaxonEntries, solver);
				chart.phylogeny = phylogeny;
				chart.arcRenderer = createArcRenderer();
				chart.vertexRenderer = (builder: Haeckel.ElementBuilder, taxon: Haeckel.Taxic, rectangle: Haeckel.Rectangle) =>
				{
					var entry = morphTaxonEntries[Haeckel.hash(taxon)];
					if (entry)
					{
						if (entry.ancestral)
						{
							var sourceY = rectangle.centerY;
							/*
							Haeckel.ext.each(solver.dagSolver.imSucs(taxon), (imSuc: Haeckel.Taxic) =>
							{
								var imSucY = getSourceY(rectangle, chart.getTaxonRect(imSuc));
								if (imSucY > sourceY) 
								{
									sourceY = imSucY;
								}
							});
							*/
							builder.child(Haeckel.SVG_NS, 'path')
								.attrs(Haeckel.SVG_NS, {
									'd': 'M' + rectangle.centerX + ' ' + rectangle.bottom + 'V' + sourceY,
									'stroke': Haeckel.BLACK.hex,
									'stroke-dasharray': '2 4',
									'stroke-width': '2px',
									'stroke-linecap': 'round',
									'fill': 'none'
								});
						}
						else
						{
							var group = builder.child(Haeckel.SVG_NS, 'g');
							group.child(Haeckel.SVG_NS, 'rect')
								.attrs(Haeckel.SVG_NS, {
									'x': rectangle.left + 'px',
									'y': rectangle.top + 'px',
									'width': rectangle.width + 'px',
									'height': rectangle.height + 'px',
									'fill': Haeckel.BLACK.hex,
									'stroke': 'none'
								});
							labelTaxon(group, entry, rectangle, true);
						}
					}
				};

				chart.render(builder.child(Haeckel.SVG_NS, 'g'));
			}

			function mtChart()
			{
				var phylogeny = sources.sources['data/compiled/phylogeny.json'].phylogenies['mtDNA'];
				var solver = new Haeckel.PhyloSolver(phylogeny);
				var chart = new Haeckel.PhyloChart();

				var cmBuilder = new Haeckel.CharacterMatrixBuilder<Haeckel.Range>();
				var occurrences = sources.sources['data/compiled/characters.json'].occurrences;
				var fossilTaxa = [
					sources.nomenclature.nameMap['Homo sp. (Denisova)'],
					sources.nomenclature.nameMap['Homo neanderthalensis neanderthalensis'],
					sources.nomenclature.nameMap['Pan paniscus'],
					sources.nomenclature.nameMap['Pan troglodytes'],
					sources.nomenclature.nameMap['Gorilla beringei'],
					sources.nomenclature.nameMap['Gorilla gorilla'],
					sources.nomenclature.nameMap['Pongo abelii'],
					sources.nomenclature.nameMap['Pongo pygmaeus']
				];
				Haeckel.arr.each(fossilTaxa, (taxon: Haeckel.Taxic) => 
				{
					cmBuilder.states(taxon, Haeckel.TIME_CHARACTER, <Haeckel.Range> Haeckel.chr.states(occurrences, taxon, Haeckel.TIME_CHARACTER));
				});
				addToCharacterMatrix(cmBuilder, solver, [
					['data/2012 - Langergraber & al.json', 'synthesis'],
					['data/1996 - Zhi & al.json', 'Abstract'],
					['data/2013 - Fu & al.json', 'Fig1-abridged'],
					['data/2014 - Meyer & al.json', 'Table1-strict-enriched'],
					['data/2006 - Steiper & Young.json', 'Fig1-abridged']
				]);

				chart.area = AREA;
				chart.time = TIME;
				chart.minPrcTime = Haeckel.rng.create(-10000, -10000);
				chart.phylogeny = phylogeny;
				chart.characterMatrix = cmBuilder.build();
				chart.horizontalRatioMap = createHorizontalRatioMap(mtTaxonEntries, solver);
				chart.arcRenderer = createArcRenderer(true);
				chart.vertexRenderer = (builder: Haeckel.ElementBuilder, taxon: Haeckel.Taxic, rectangle: Haeckel.Rectangle) =>
				{
					var entry = mtTaxonEntries[Haeckel.hash(taxon)];
					var group = builder.child(Haeckel.SVG_NS, 'g');
					if (entry !== undefined && !entry.ancestral)
					{
						group.child(Haeckel.SVG_NS, 'rect')
							.attrs(Haeckel.SVG_NS, {
								'x': rectangle.left + 'px',
								'y': rectangle.top + 'px',
								'width': rectangle.width + 'px',
								'height': rectangle.height + 'px',
								'fill': Haeckel.BLACK.hex,
								'stroke': 'none'
							});
						labelTaxon(group, entry, rectangle, true);
					}
					else
					{
						var data = 'M' + [rectangle.centerX, rectangle.top].join(' ')
							+ 'Q' + [rectangle.centerX, rectangle.centerY, rectangle.right, rectangle.centerY].join(' ')
							+ 'Q' + [rectangle.centerX, rectangle.centerY, rectangle.centerX, rectangle.bottom].join(' ')
							+ 'Q' + [rectangle.centerX, rectangle.centerY, rectangle.left, rectangle.centerY].join(' ')
							+ 'Q' + [rectangle.centerX, rectangle.centerY, rectangle.centerX, rectangle.top].join(' ')
							+ 'Z';
						group.child(Haeckel.SVG_NS, 'path')
							.attrs(Haeckel.SVG_NS, {
								'd': data,
								'fill': Haeckel.BLACK.hex,
								'stroke': Haeckel.BLACK.hex,
								'stroke-width': '1px',
								'stroke-linejoin': 'miter'
							});
						if (entry.showName)
						{
							labelTaxon(group, entry, rectangle, true);
						}
					}
				};

				chart.render(builder.child(Haeckel.SVG_NS, 'g'));
			}

			function times()
			{
				var group = timesGroup;
				var chart = new Haeckel.ChronoChart();
				chart.area = AREA;
				chart.time = TIME;
				var top = chart.getTimeY(Haeckel.RANGE_0);
				group.child(Haeckel.SVG_NS, 'rect')
					.attrs({
						fill: Haeckel.BLACK.hex,
						'fill-opacity': '0.333',
						stroke: 'none',
						x: '0px',
						y: (top.min - 1) + 'px',
						width: FIGURE_WIDTH + 'px',
						height: '1px'
					});
				var strata = Haeckel.ext.list(sources.sources['data/2014 - ICS.json'].strata);
				strata.sort((a: Haeckel.Stratum, b: Haeckel.Stratum) =>
				{
					return b.start.mean - a.start.mean;
				});
				var fillStratum = false;
				Haeckel.arr.each(strata, (stratum: Haeckel.Stratum) =>
				{
					if (stratum && stratum.type === 'series/epoch')
					{
						var startY = chart.getTimeY(stratum.start);
						var endY = chart.getTimeY(stratum.end);
						if (fillStratum)
						{
							if (endY.mean <= FIGURE_HEIGHT)
							{
								group.child(Haeckel.SVG_NS, 'rect')
									.attrs({
										fill: Haeckel.BLACK.hex,
										'fill-opacity': '0.1',
										stroke: 'none',
										x: '0px',
										y: endY.mean + 'px',
										width: FIGURE_WIDTH + 'px',
										height: (startY.mean - endY.mean) + 'px'
									});
							}
						}
						fillStratum = !fillStratum;
						if ((startY.mean - endY.mean) > 16)
						{
							var text = group.child(Haeckel.SVG_NS, 'text')
								.text(stratum.name.toUpperCase())
								.attrs(Haeckel.SVG_NS, {
									'fill': Haeckel.BLACK.hex,
									'fill-opacity': '0.5',
									'font-size': '16px',
									'font-weight': 'bold',
									'font-family': "Myriad Pro",
									'text-anchor': 'middle'
								});
							var box = Haeckel.rec.createFromBBox(<SVGTextElement> text.build());
							var y = (startY.mean + endY.mean) / 2;
							if (y + box.width / 2 > FIGURE_HEIGHT - MARGIN)
							{
								y = FIGURE_HEIGHT - MARGIN - box.width / 2;
							}
							text.attr(Haeckel.SVG_NS, 'transform',
								'translate(' + (MARGIN + 8) + ',' + y + ') rotate(-90)');
						}
					}
				});
				var TIME_INCREMENT = -1000000;
				for (var time = TIME.max + TIME_INCREMENT; time >= TIME.min; time += TIME_INCREMENT)
				{
					var y = chart.getTimeY(Haeckel.rng.create(time, time)).mean;
					group.child(Haeckel.SVG_NS, 'rect')
						.attrs({
							fill: Haeckel.BLACK.hex,
							'fill-opacity': '0.15',
							stroke: 'none',
							x: '0px',
							y: (y - 0.5) + 'px',
							width: FIGURE_WIDTH + 'px',
							height: '1px'
						});
					group.child(Haeckel.SVG_NS, 'text')
						.text(Math.round(time / -1000000) + ' Mya')
						.attrs(Haeckel.SVG_NS, {
							x: (FIGURE_WIDTH - MARGIN + 7) + 'px',
							y: (y - 1) + 'px',
							'font-weight': 'bold',
							'fill': Haeckel.BLACK.hex,
							'fill-opacity': '0.5',
							'font-size': '14px',
							'font-family': "Myriad Pro",
							'text-anchor': 'end'
						});
				}
			}

			function legend()
			{
				var height = FIGURE_HEIGHT / 8;
				var width = height * 1.618034; // :TODO: Add golden ratio to Haeckel
				var area = Haeckel.rec.create((FIGURE_WIDTH - width) / 2 - 20, FIGURE_HEIGHT - MARGIN * 2 - height, width, height);
				var group = builder.child(Haeckel.SVG_NS, 'g');
				group.child(Haeckel.SVG_NS, 'rect')
					.attrs(Haeckel.SVG_NS, {
						'x': area.left + 'px',
						'y': area.top + 'px',
						'width': area.width + 'px',
						'height': area.height + 'px',
						'fill': Haeckel.WHITE.hex,
						'stroke': Haeckel.BLACK.hex,
						'stroke-width': '2px',
						'stroke-linejoin': 'miter'
					});
				group.child(Haeckel.SVG_NS, 'text')
					.text('LEGEND')
					.attrs(Haeckel.SVG_NS, {
						'x': area.centerX + 'px',
						'y': (area.top + height * 3 / 16) + 'px',
						'text-anchor': 'middle',
						'font-weight': 'bolder',
						'font-family': 'Myriad Pro',
						'font-size': (height / 8) + 'px'
					});
				var rectangle = Haeckel.rec.create(area.left + area.width / 12, area.top + area.height * 5 / 16,
						area.width / 12, area.height / 8);
				group.child(Haeckel.SVG_NS, 'rect')
					.attrs(Haeckel.SVG_NS, {
						'x': rectangle.left + 'px',
						'y': rectangle.top + 'px',
						'width': rectangle.width + 'px',
						'height': rectangle.height + 'px',
						'fill': Haeckel.BLACK.hex,
						'stroke': 'none'
					});
				rectangle = Haeckel.rec.create(area.left + area.width * 3 / 32, area.top + area.height * 17 / 32,
						area.width / 16, area.height * 3 / 16)
				group.child(Haeckel.SVG_NS, 'path')
					.attrs(Haeckel.SVG_NS, {
						'd': 'M' + [rectangle.centerX, rectangle.top].join(' ')
							+ 'Q' + [rectangle.centerX, rectangle.centerY, rectangle.right, rectangle.centerY].join(' ')
							+ 'Q' + [rectangle.centerX, rectangle.centerY, rectangle.centerX, rectangle.bottom].join(' ')
							+ 'Q' + [rectangle.centerX, rectangle.centerY, rectangle.left, rectangle.centerY].join(' ')
							+ 'Q' + [rectangle.centerX, rectangle.centerY, rectangle.centerX, rectangle.top].join(' ')
							+ 'Z',
						'fill': Haeckel.BLACK.hex,
						'stroke': Haeckel.BLACK.hex,
						'stroke-width': '1px',
						'stroke-linejoin': 'miter'
					});
				group.child(Haeckel.SVG_NS, 'path')
					.attrs(Haeckel.SVG_NS, {
						'd': 'M' + [area.left + area.width / 8, area.top + area.height * 13 / 16].join(' ')
							+ 'V' + (area.top + area.height * 15 / 16),
						'stroke': Haeckel.BLACK.hex,
						'fill': 'none',
						'stroke-linecap': 'round',
						'stroke-dasharray': '2 4',
						'stroke-width': '2px'
					});
				group.child(Haeckel.SVG_NS, 'text')
					.text('specimens')
					.attrs(Haeckel.SVG_NS, {
						'x': (area.left + area.width / 4) + 'px',
						'y': (area.top + height * 13 / 32) + 'px',
						'text-anchor': 'left',
						'font-family': 'Myriad Pro',
						'font-size': (height / 8) + 'px'
					});
				group.child(Haeckel.SVG_NS, 'text')
					.text('inferred ancestor')
					.attrs(Haeckel.SVG_NS, {
						'x': (area.left + area.width / 4) + 'px',
						'y': (area.top + height * 21 / 32) + 'px',
						'text-anchor': 'left',
						'font-family': 'Myriad Pro',
						'font-size': (height / 8) + 'px'
					});
				group.child(Haeckel.SVG_NS, 'text')
					.text('inferred lineage')
					.attrs(Haeckel.SVG_NS, {
						'x': (area.left + area.width / 4) + 'px',
						'y': (area.top + height * 29 / 32) + 'px',
						'text-anchor': 'left',
						'font-family': 'Myriad Pro',
						'font-size': (height / 8) + 'px'
					});
			}

			function background()
			{
				bgGroup = builder.child(Haeckel.SVG_NS, 'g');
				bgGroup.child(Haeckel.SVG_NS, 'rect')
					.attrs(Haeckel.SVG_NS, {
						fill: Haeckel.WHITE.hex,
						stroke: 'none',
						x: '0px',
						y: '0px',
						width: FIGURE_WIDTH + 'px',
						height: FIGURE_HEIGHT + 'px'
					});
			}

			function divider()
			{
				bgGroup.child(Haeckel.SVG_NS, 'rect')
					.attrs(Haeckel.SVG_NS, {
						'x': dividerX + 'px',
						'y': '0px',
						'width': (FIGURE_WIDTH - dividerX) + 'px',
						'height': FIGURE_HEIGHT + 'px',
						'fill': Haeckel.BLACK.hex,
						'opacity': '0.1',
						'stroke': 'none'
					});
				bgGroup.child(Haeckel.SVG_NS, 'line')
					.attrs(Haeckel.SVG_NS, {
						x1: dividerX + 'px',
						x2: dividerX + 'px',
						y1: '0px',
						y2: FIGURE_HEIGHT + 'px',
						'opacity': '0.25',
						'stroke': Haeckel.BLACK.hex,
						'stroke-linecap': 'square',
						'stroke-width': '2px'
					});
			}

			function sectionTitles()
			{
				var STYLE: { [name: string]: string; } = {
					'text-anchor': 'middle',
					'font-size': '20px',
					'font-weight': 'bolder',
					'font-family': 'Myriad Pro',
					y: MARGIN + 'px'
				};
				bgGroup.child(Haeckel.SVG_NS, 'text')
					.text('ANATOMY')
					.attr(Haeckel.SVG_NS, 'x', (dividerX / 2) + 'px')
					.attrs(Haeckel.SVG_NS, STYLE);
				bgGroup.child(Haeckel.SVG_NS, 'text')
					.text('MITOCHONDRIAL DNA')
					.attr(Haeckel.SVG_NS, 'x', ((dividerX + FIGURE_WIDTH) / 2) + 'px')
					.attrs(Haeckel.SVG_NS, STYLE);
			}

			background();
			timesGroup = builder.child(Haeckel.SVG_NS, 'g');
			mtChart();
			morphChart();
			dividerX = AREA.left + AREA.width * (DIVIDER_COLUMN + 0.5) / (maxColumn + 2);
			times();
			divider();
			sectionTitles();
			legend();
		}
		catch (e)
		{
			builder.child(Haeckel.SVG_NS, 'text')
				.attrs(Haeckel.SVG_NS, 
				{
					'font-size': '12px',
					fill: 'red',
					x: '10px',
					y: '10px'
				})
				.text("ERROR!\n" + String(e));
		}

		return builder;
	}
};