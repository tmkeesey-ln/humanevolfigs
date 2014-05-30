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

var MT_NAME_ENTRIES: { [name: string]: NameEntry; } = {
	"Pongo pygmaeus": {
		name: "Bornean orangutan mtDNA",
		column: 19
	},
	"mt-Pongo*": {
		column: 19.5,
		ancestral: true
	},
	"Pongo abelii": {
		name: "Sumatran orangutan mtDNA",
		column: 20
	},
	"mt-Hominidae*": {
		column: 21.375,
		ancestral: true
	},
	"Gorilla gorilla": {
		name: "western gorilla mtDNA",
		column: 21
	},
	"mt-Homininae*": {
		column: 23.25,
		ancestral: true
	},
	"mt-Gorilla*": {
		column: 21.5,
		ancestral: true
	},
	"Gorilla beringei": {
		name: "eastern gorilla mtDNA",
		column: 22
	},
	"mt-Hominini*": {
		column: 25,
		ancestral: true
	},
	"Pan paniscus": {
		name: "bonobo chimpanzee mtDNA",
		column: 23
	},
	"mt-Pan*": {
		column: 23.5,
		ancestral: true
	},
	"Pan troglodytes": {
		name: "common chimpanzee mtDNA",
		column: 24
	},
	"mt-Homo*": {
		column: 26.5,
		ancestral: true
	},
	"mt-HomoA*": {
		column: 25.5,
		ancestral: true
	},
	"mt-HomoB*": {
		column: 27.5,
		ancestral: true
	},
	"Homo heidelbergensis heidelbergensis (Sima de los Huesos)": {
		name: "mtDNA from Sima de los Huesos",
		column: 25
	},
	"Homo sp. (Denisova)": {
		name: "Denisovan mtDNA",
		column: 26
	},
	"Homo neanderthalensis neanderthalensis": {
		name: "Neandertal mtDNA",
		column: 27
	},
	"mt-MRCA": {
		column: 28,
		name: "mitochondrial \"Eve\"",
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
		column: 4
	},
	"Homininae*": {
		column: 5,
		ancestral: true
	},
	"Gorilla*": {
		column: 5,
		ancestral: true
	},
	"eastern gorillas": {
		column: 5
	},
	"Hominini*": {
		column: 6,
		ancestral: true
	},
	"Pan*": {
		column: 6,
		ancestral: true
	},
	"fossil chimpanzees": {
		column: 6
	},
	"bonobo chimpanzees": {
		column: 7
	},
	"common chimpanzees": {
		column: 8
	},
	"Hominina*": {
		column: 7,
		ancestral: true
	},
	"Sahelanthropus": {
		column: 7,
		italic: true
	},
	"Hominina2*": {
		column: 8,
		ancestral: true
	},
	"Ardipithecus": {
		column: 8,
		italic: true
	},
	"Paranthropus": {
		column: 9,
		italic: true
	},
	"Australopithecus": {
		column: 10,
		italic: true
	},
	"Homo rudolfensis": {
		column: 11,
		italic: true
	},
	"Homo*": {
		column: 12,
		ancestral: true
	},
	"Homo habilis": {
		column: 12,
		italic: true
	},
	"Floresian \"hobbits\"": {
		column: 13,
		italic: false
	},
	"Homo ergaster": {
		column: 14,
		italic: true
	},
	"Homo2*": {
		column: 15,
		ancestral: true
	},
	"Homo erectus": {
		column: 15,
		italic: true
	},
	"Neandertals": {
		column: 16
	},
	"Homo heidelbergensis": {
		column: 17,
		italic: true
	},
	"humans": {
		column: 18
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
						name: entry.name || name,
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

			function morphChart()
			{
				var phylogeny = sources.sources['data/compiled/phylogeny.json'].phylogenies['morphology'];
				var solver = new Haeckel.PhyloSolver(phylogeny);
				var chart = new Haeckel.PhyloChart();

				var occurrences = sources.sources['data/compiled/characters.json'].occurrences;
				var cmBuilder = new Haeckel.CharacterMatrixBuilder<Haeckel.Range>();
				addToCharacterMatrix(cmBuilder, solver, [
					['data/2012 - Langergraber & al.json', 'synthesis-apes'],
					['data/2006 - Steiper & Young.json', 'Fig1-abridged']
				]);
				Haeckel.ext.each(phylogeny.vertices, (taxon: Haeckel.Taxic) => 
				{
					cmBuilder.states(taxon, Haeckel.TIME_CHARACTER, <Haeckel.Range> Haeckel.chr.states(occurrences, taxon, Haeckel.TIME_CHARACTER));
				});

				chart.area = AREA;
				chart.time = TIME;
				chart.minPrcTime = Haeckel.rng.create(-100000, -100000);
				chart.characterMatrix = cmBuilder.build();
				chart.horizontalRatioMap = createHorizontalRatioMap(morphTaxonEntries, solver);
				chart.phylogeny = phylogeny;
				chart.arcRenderer = (builder: Haeckel.ElementBuilder, taxon: Haeckel.Arc<Haeckel.Taxic>, sourceRect: Haeckel.Rectangle, targetRect: Haeckel.Rectangle) =>
				{
					var data = 'M';
					if (Haeckel.precisionEqual(targetRect.centerX, sourceRect.centerX))
					{
						data += [sourceRect.centerX, sourceRect.bottom].join(' ')
							+ 'V' + targetRect.bottom;
					}
					else
					{
						var sourceY = Math.max(sourceRect.centerY, targetRect.bottom);
						data += [sourceRect.centerX, sourceRect.bottom].join(' ')
							+ 'V' + sourceY
							+ 'H' + targetRect.centerX
							+ 'V' + targetRect.centerY;
					}
					builder.child(Haeckel.SVG_NS, 'path')
						.attrs(Haeckel.SVG_NS, {
							'd': data,
							'stroke': Haeckel.BLACK.hex,
							'stroke-linejoin': 'round',
							'stroke-width': '2px',
							'fill': 'none'
						});
				};
				chart.vertexRenderer = (builder: Haeckel.ElementBuilder, taxon: Haeckel.Taxic, rectangle: Haeckel.Rectangle) =>
				{
					var entry = morphTaxonEntries[Haeckel.hash(taxon)];
					if (entry !== undefined && !entry.ancestral)
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
				chart.arcRenderer = (builder: Haeckel.ElementBuilder, taxon: Haeckel.Arc<Haeckel.Taxic>, sourceRect: Haeckel.Rectangle, targetRect: Haeckel.Rectangle) =>
				{
					var data = 'M';
					if (Haeckel.precisionEqual(targetRect.centerX, sourceRect.centerX))
					{
						data += [sourceRect.centerX, sourceRect.top].join(' ')
							+ 'V' + targetRect.bottom;
					}
					else
					{
						data += [targetRect.centerX < sourceRect.centerX ? sourceRect.left : sourceRect.right, sourceRect.centerY].join(' ')
							+ 'Q' + [targetRect.centerX, sourceRect.centerY, targetRect.centerX, Math.min(targetRect.bottom, sourceRect.centerY)]
					}
					builder.child(Haeckel.SVG_NS, 'path')
						.attrs(Haeckel.SVG_NS, {
							'd': data,
							'stroke': '#808080',
							'fill': 'none',
							'stroke-dasharray': '3 2',
							'stroke-width': '2px'
						});
				};
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
								'fill': '#808080',
								'stroke': 'none'
							});
						labelTaxon(group, entry, rectangle);
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
								'fill': '#808080',
								'stroke': '#808080',
								'stroke-width': '2px',
								'stroke-linejoin': 'miter'
							});
						if (entry.showName)
						{
							labelTaxon(group, entry, rectangle);
						}
					}
				};

				chart.render(builder.child(Haeckel.SVG_NS, 'g'));
			}

			function times()
			{
				var group = builder.child(Haeckel.SVG_NS, 'g');
				var chart = new Haeckel.ChronoChart();
				chart.area = AREA;
				chart.time = TIME;
				var top = chart.getTimeY(Haeckel.RANGE_0);
				group.child(Haeckel.SVG_NS, 'rect')
					.attrs({
						fill: '#000000',
						'fill-opacity': '0.25',
						stroke: 'none',
						x: '0px',
						y: (top.min - 1) + 'px',
						width: FIGURE_WIDTH + 'px',
						height: '1px'
					});
				Haeckel.ext.each(sources.sources['data/2014 - ICS.json'].strata, (stratum: Haeckel.Stratum) =>
				{
					if (stratum && stratum.type === 'series/epoch')
					{
						var startY = chart.getTimeY(stratum.start);
						var endY = chart.getTimeY(stratum.end);
						if (endY.mean <= FIGURE_HEIGHT && (startY.mean - endY.mean) > 2)
						{
							group.child(Haeckel.SVG_NS, 'rect')
								.attrs({
									fill: '#000000',
									'fill-opacity': '0.25',
									stroke: 'none',
									x: '0px',
									y: (startY.mean - 0.5) + 'px',
									width: FIGURE_WIDTH + 'px',
									height: '1px'
								});
							var text = group.child(Haeckel.SVG_NS, 'text')
								.text(stratum.name.toUpperCase())
								.attrs(Haeckel.SVG_NS, {
									'fill': Haeckel.BLACK.hex,
									'fill-opacity': '0.333',
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
			}

			builder.child(Haeckel.SVG_NS, 'rect')
				.attrs(Haeckel.SVG_NS, {
					fill: Haeckel.WHITE.hex,
					stroke: 'none',
					x: '0px',
					y: '0px',
					width: FIGURE_WIDTH + 'px',
					height: FIGURE_HEIGHT + 'px'
				});
			times();
			mtChart();
			morphChart();
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