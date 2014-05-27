/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>

var XLINK_NS = "http://www.w3.org/1999/xlink";

var FIGURE_HEIGHT = 1100;

var FIGURE_WIDTH = 850;

var MARGIN = 25;

var TOP_MARGIN = 175;

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
}

var MT_NAME_ENTRIES: { [name: string]: NameEntry; } = {
	"Pongo pygmaeus": {
		name: "Bornean orangutan mtDNA",
		column: 3
	},
	"mt-Pongo*": {
		column: 3.5,
		ancestral: true
	},
	"Pongo abelii": {
		name: "Sumatran orangutan mtDNA",
		column: 4
	},
	"mt-Hominidae*": {
		column: 8,
		ancestral: true
	},
	"Gorilla gorilla": {
		name: "western gorilla mtDNA",
		column: 8
	},
	"mt-Homininae*": {
		column: 12,
		ancestral: true
	},
	"mt-Gorilla*": {
		column: 8.5,
		ancestral: true
	},
	"Gorilla beringei": {
		name: "eastern gorilla mtDNA",
		column: 9
	},
	"mt-Hominini*": {
		column: 15.5,
		ancestral: true
	},
	"Pan paniscus": {
		name: "bonobo chimpanzee mtDNA",
		column: 13
	},
	"mt-Pan*": {
		column: 13.5,
		ancestral: true
	},
	"Pan troglodytes": {
		name: "common chimpanzee mtDNA",
		column: 14
	},
	"mt-Homo*": {
		column: 27.5,
		ancestral: true
	},
	"mt-HomoA*": {
		column: 26.5,
		ancestral: true
	},
	"mt-HomoB*": {
		column: 28.5,
		ancestral: true
	},
	"Homo heidelbergensis heidelbergensis (Sima de los Huesos)": {
		name: "mtDNA from Sima de los Huesos",
		column: 26
	},
	"Homo sp. (Denisova)": {
		name: "Denisovan mtDNA",
		column: 27
	},
	"Homo neanderthalensis neanderthalensis": {
		name: "Neandertal mtDNA",
		column: 28
	},
	"mt-MRCA": {
		column: 29,
		name: "mitochondrial \"Eve\""
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
		column: 5
	},
	"Hominidae*": {
		column: 6,
		ancestral: true
	},
	"Dryopithecinae": {
		column: 6,
		italic: true
	},
	"western gorillas": {
		column: 6
	},
	"Homininae*": {
		column: 7,
		ancestral: true
	},
	"Gorilla*": {
		column: 7,
		ancestral: true
	},
	"eastern gorillas": {
		column: 7
	},
	"Hominini*": {
		column: 10,
		ancestral: true
	},
	"Pan*": {
		column: 10,
		ancestral: true
	},
	"fossil chimpanzees": {
		column: 10
	},
	"bonobo chimpanzees": {
		column: 11
	},
	"common chimpanzees": {
		column: 12
	},
	"Hominina*": {
		column: 14,
		ancestral: true
	},
	"Sahelanthropus": {
		column: 14,
		italic: true
	},
	"Hominina2*": {
		column: 15,
		ancestral: true
	},
	"Ardipithecus": {
		column: 15,
		italic: true
	},
	"Paranthropus": {
		column: 16,
		italic: true
	},
	"Australopithecus": {
		column: 17,
		italic: true
	},
	"Homo rudolfensis": {
		column: 18,
		italic: true
	},
	"Homo*": {
		column: 19,
		ancestral: true
	},
	"Homo habilis": {
		column: 19,
		italic: true
	},
	"Floresian \"hobbits\"": {
		column: 20,
		italic: false
	},
	"Homo ergaster": {
		column: 21,
		italic: true
	},
	"Homo2*": {
		column: 22,
		ancestral: true
	},
	"Homo erectus": {
		column: 22,
		italic: true
	},
	"Neandertals": {
		column: 23
	},
	"Homo heidelbergensis": {
		column: 24,
		italic: true
	},
	"humans": {
		column: 25
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
		'data/2012 - ICS.json',
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

			function labelTaxon(group: Haeckel.ElementBuilder, entry: TaxonEntry, rectangle: Haeckel.Rectangle, color: string = '#000000')
			{
				group.child(Haeckel.SVG_NS, 'text')
					.text(entry.name)
					.attrs(Haeckel.SVG_NS, {
						'fill': color,
						'font-style': entry.italic ? 'italic' : 'normal',
						'font-size': '12px',
						'font-family': "Myriad Pro",
						transform: 'translate(' + (rectangle.centerX + 3) + ',' + (rectangle.top - 6) + ') rotate(-90)'
					});
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
							'stroke-width': '1px',
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
						labelTaxon(group, entry, rectangle);
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
							'stroke-width': '1.5px'
						});
				};
				chart.vertexRenderer = (builder: Haeckel.ElementBuilder, taxon: Haeckel.Taxic, rectangle: Haeckel.Rectangle) =>
				{
					var entry = mtTaxonEntries[Haeckel.hash(taxon)];
					if (entry !== undefined && !entry.ancestral)
					{
						var group = builder.child(Haeckel.SVG_NS, 'g');
						group.child(Haeckel.SVG_NS, 'rect')
							.attrs(Haeckel.SVG_NS, {
								'x': rectangle.left + 'px',
								'y': rectangle.top + 'px',
								'width': rectangle.width + 'px',
								'height': rectangle.height + 'px',
								'fill': '#808080',
								'stroke': 'none'
							});
						labelTaxon(group, entry, rectangle, '#808080');
					}
					else
					{
						var data = 'M' + [rectangle.centerX, rectangle.top].join(' ')
							+ 'Q' + [rectangle.centerX, rectangle.centerY, rectangle.right, rectangle.centerY].join(' ')
							+ 'Q' + [rectangle.centerX, rectangle.centerY, rectangle.centerX, rectangle.bottom].join(' ')
							+ 'Q' + [rectangle.centerX, rectangle.centerY, rectangle.left, rectangle.centerY].join(' ')
							+ 'Q' + [rectangle.centerX, rectangle.centerY, rectangle.centerX, rectangle.top].join(' ')
							+ 'Z';
						builder.child(Haeckel.SVG_NS, 'path')
							.attrs(Haeckel.SVG_NS, {
								'd': data,
								'fill': '#808080',
								'stroke': '#808080',
								'stroke-width': '1px',
								'stroke-linejoin': 'miter'
							});
					}
				};

				chart.render(builder.child(Haeckel.SVG_NS, 'g'));
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
			mtChart();
			morphChart();
		}
		catch (e)
		{
			builder.child(Haeckel.SVG_NS, 'text')
				.attrs(Haeckel.SVG_NS, 
				{
					'font-size': '12px',
					'fill': 'red'
				})
				.text("ERROR!\n" + String(e));
		}

		return builder;
	}
};