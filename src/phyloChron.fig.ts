/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>

var XLINK_NS = "http://www.w3.org/1999/xlink";

var FIGURE_HEIGHT = 1100;

var FIGURE_WIDTH = 850;

var MARGIN = 50;

var TOP_MARGIN = 150;

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
		column: 1
	},
	"mt-Pongo*": {
		column: 3,
		ancestral: true
	},
	"Pongo abelii": {
		name: "Sumatran orangutan mtDNA",
		column: 5
	},
	"mt-Hominidae*": {
		column: 15,
		ancestral: true
	},
	"Gorilla gorilla": {
		name: "western gorilla mtDNA",
		column: 8
	},
	"mt-Homininae*": {
		column: 15,
		ancestral: true
	},
	"mt-Gorilla*": {
		column: 10,
		ancestral: true
	},
	"Gorilla beringei": {
		name: "eastern gorilla mtDNA",
		column: 10
	},
	"mt-Hominini*": {
		column: 25,
		ancestral: true
	},
	"mt-Pan*": {
		column: 15,
		ancestral: true
	},
	"Pan paniscus": {
		name: "bonobo chimpanzee mtDNA",
		column: 13
	},
	"Pan troglodytes": {
		name: "common chimpanzee mtDNA",
		column: 15
	},
	"mt-Homo*": {
		column: 25,
		ancestral: true
	},
	"mt-HomoA*": {
		column: 25,
		ancestral: true
	},
	"mt-HomoB*": {
		column: 29,
		ancestral: true
	},
	"Homo heidelbergensis heidelbergensis (Sima de los Huesos)": {
		name: "mtDNA from Sima de los Huesos",
		column: 25
	},
	"Homo sp. (Denisova)": {
		name: "Denisovan mtDNA",
		column: 23
	},
	"Homo neanderthalensis neanderthalensis": {
		name: "Neandertal mtDNA",
		column: 27
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
		column: 2
	},
	"Sumatran orangutans": {
		column: 4
	},
	"stem-orangutans": {
		column: 6
	},
	"Hominidae*": {
		column: 7,
		ancestral: true
	},
	"Dryopithecinae": {
		column: 7,
		italic: true
	},
	"western gorillas": {
		column: 7
	},
	"Homininae*": {
		column: 9,
		ancestral: true
	},
	"Gorilla*": {
		column: 9,
		ancestral: true
	},
	"eastern gorillas": {
		column: 9
	},
	"Hominini*": {
		column: 11,
		ancestral: true
	},
	"Pan*": {
		column: 11,
		ancestral: true
	},
	"fossil chimpanzees": {
		column: 11
	},
	"bonobo chimpanzees": {
		column: 12
	},
	"common chimpanzees": {
		column: 14
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
		column: 26
	},
	"Homo heidelbergensis": {
		column: 24,
		italic: true
	},
	"humans": {
		column: 28
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
		'data/2012 - ICS.json',
		'data/2012 - Langergraber & al.json',
		'data/2013 - Fu & al.json'
		//'data/2012 - van Oven.json'
	],

	render: (builder: Haeckel.ElementBuilder, sources: Haeckel.DataSources, defs: () => Haeckel.ElementBuilder, pngAssets: Haeckel.PNGAssets) =>
	{
		try
		{
			var maxColumn = 1;
			var morphTaxonEntries: { [taxonHash: string]: TaxonEntry; } = toTaxonEntries(MORPH_NAME_ENTRIES);
			var mtTaxonEntries: { [taxonHash: string]: TaxonEntry; } = toTaxonEntries(MT_NAME_ENTRIES);

			var phylogeny = sources.sources['data/compiled/phylogeny.json'].phylogenies['morphology'];
			var solver = new Haeckel.PhyloSolver(phylogeny);
			var chart = new Haeckel.PhyloChart();
			var defaultVertexRenderer = chart.vertexRenderer;

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

			function createVertexRenderer(taxonEntries: { [hash: string]: TaxonEntry; })
			{
				return (builder: Haeckel.ElementBuilder, taxon: Haeckel.Taxic, rectangle: Haeckel.Rectangle) =>
				{
					var entry = taxonEntries[Haeckel.hash(taxon)];
					if (entry !== undefined && !entry.ancestral)
					{
						var group = builder.child(Haeckel.SVG_NS, 'g');
						defaultVertexRenderer(group, taxon, rectangle);
						group.child(Haeckel.SVG_NS, 'text')
							.text(entry.name)
							.attrs(Haeckel.SVG_NS, {
								'font-style': entry.italic ? 'italic' : 'normal',
								'font-size': '12px',
								'font-family': "Myriad Pro",
								transform: 'translate(' + (rectangle.centerX + 3) + ', ' + (rectangle.top - 6) + ') rotate(-90)'
							});
					}
				};
			}

			function addToCharacterMatrix(builder: Haeckel.CharacterMatrixBuilder<Haeckel.Range>, solver: Haeckel.PhyloSolver, datingSources: string[][])
			{
				Haeckel.arr.each(datingSources, (source: string[]) =>
				{
					builder.addMatrix(Haeckel.dat.toCharacterMatrixBuilder(sources.sources[source[0]].datings[source[1]], solver).build());
				});
				return builder;
			}

			var cmBuilder = new Haeckel.CharacterMatrixBuilder<Haeckel.Range>();
			addToCharacterMatrix(cmBuilder, solver, [
				['data/2012 - Langergraber & al.json', 'synthesis-apes'],
				['data/1996 - Zhi & al.json', 'Abstract']
			]);
			var occurrences = sources.sources['data/compiled/characters.json'].occurrences;
			Haeckel.ext.each(phylogeny.vertices, (taxon: Haeckel.Taxic) => 
			{
				cmBuilder.states(taxon, Haeckel.TIME_CHARACTER, <Haeckel.Range> Haeckel.chr.states(occurrences, taxon, Haeckel.TIME_CHARACTER));
			});

			chart.area = Haeckel.rec.create(MARGIN, TOP_MARGIN, FIGURE_WIDTH - MARGIN * 2, FIGURE_HEIGHT - MARGIN - TOP_MARGIN);
			chart.time = Haeckel.rng.create(-20000000, 0);

			chart.minPrcTime = Haeckel.rng.create(-250000, -250000);
			chart.characterMatrix = cmBuilder.build();
			chart.horizontalRatioMap = createHorizontalRatioMap(morphTaxonEntries, solver);
			chart.phylogeny = phylogeny;
			chart.vertexRenderer = createVertexRenderer(morphTaxonEntries);
			chart.render(builder.child(Haeckel.SVG_NS, 'g'));

			phylogeny = sources.sources['data/compiled/phylogeny.json'].phylogenies['mtDNA'];
			solver = new Haeckel.PhyloSolver(phylogeny);
			cmBuilder = new Haeckel.CharacterMatrixBuilder<Haeckel.Range>();
			var occurrences = sources.sources['data/compiled/characters.json'].occurrences;
			Haeckel.ext.each(phylogeny.vertices, (taxon: Haeckel.Taxic) => 
			{
				cmBuilder.states(taxon, Haeckel.TIME_CHARACTER, <Haeckel.Range> Haeckel.chr.states(occurrences, taxon, Haeckel.TIME_CHARACTER));
			});
			addToCharacterMatrix(cmBuilder, solver, [
				['data/2012 - Langergraber & al.json', 'synthesis'],
				['data/1996 - Zhi & al.json', 'Abstract'],
				['data/2013 - Fu & al.json', 'Fig1-abridged']
			]);

			chart.pathStyle =  {
				fill: "none",
				stroke: Haeckel.BLACK.hex,
				"stroke-opacity": "0.5"
			};
			chart.minPrcTime = Haeckel.rng.create(-10000, -10000);
			chart.phylogeny = phylogeny;
			chart.characterMatrix = cmBuilder.build();
			chart.horizontalRatioMap = createHorizontalRatioMap(mtTaxonEntries, solver);
			chart.vertexRenderer = createVertexRenderer(mtTaxonEntries);
			chart.render(builder.child(Haeckel.SVG_NS, 'g'));
		}
		catch (e)
		{
			builder.child(Haeckel.SVG_NS, 'text')
				.attrs(Haeckel.SVG_NS, 
				{
					'font-size': '12px',
					'color': 'red'
				})
				.text("ERROR!\n" + String(e));
		}

		return builder;
	}
};