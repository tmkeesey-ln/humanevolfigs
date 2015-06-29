/// <reference path="chron.ts"/>

var MT_NAME_ENTRIES: { [name: string]: NameEntry; } = {
	"Bornean orangutans": {
		column: 0
	},
	"mt-Pongo*": {
		column: 0.5,
		ancestral: true
	},
	"Sumatran orangutans": {
		column: 1
	},
	"mt-Hominidae*": {
		column: 2.375,
		ancestral: true
	},
	"western gorillas": {
		column: 2
	},
	"mt-Homininae*": {
		column: 4.25,
		ancestral: true
	},
	"mt-Gorilla*": {
		column: 2.5,
		ancestral: true
	},
	"eastern gorillas": {
		column: 3
	},
	"mt-Hominini*": {
		column: 6,
		ancestral: true
	},
	"bonobo chimpanzees": {
		column: 4
	},
	"mt-Pan*": {
		column: 4.5,
		ancestral: true
	},
	"common chimpanzees": {
		column: 5
	},
	"mt-Homo*": {
		column: 7.5,
		ancestral: true
	},
	"mt-HomoA*": {
		column: 6.5,
		ancestral: true
	},
	"mt-HomoB*": {
		column: 8.5,
		ancestral: true
	},
	"Homo heidelbergensis steinheimensis (Sima de los Huesos)": {
		name: "Sima de los Huesos",
		column: 6
	},
	"Homo sp. (Denisova)": {
		name: "Denisova",
		column: 7
	},
	"Homo neanderthalensis neanderthalensis": {
		name: "Neandertals",
		column: 8
	},
	"mt-MRCA": {
		column: 9,
		name: "Mitochondrial \"Eve\"",
		ancestral: true
	}
};

function mtChart(builder: Haeckel.ElementBuilder, sources: Haeckel.DataSources, taxonEntries: { [taxonHash: string]: TaxonEntry; }, area: Haeckel.Rectangle, time: Haeckel.Range, maxColumn: number)
{
	var phylogeny = sources.sources['data/compiled/phylogeny.json'].phylogenies['mtDNA'];
	var solver = new Haeckel.PhyloSolver(phylogeny);
	var chart = new Haeckel.PhyloChart();

	var cmBuilder = new Haeckel.CharacterMatrixBuilder<Haeckel.Range>();
	var occurrences = sources.sources['data/compiled/characters.json'].occurrences;
	var fossilTaxa = [
		sources.nomenclature.nameMap['Homo sp. (Denisova)'],
		sources.nomenclature.nameMap['Homo neanderthalensis neanderthalensis'],
		sources.nomenclature.nameMap['Homo heidelbergensis steinheimensis (Sima de los Huesos)'],
		sources.nomenclature.nameMap['Pan paniscus'],
		sources.nomenclature.nameMap['Pan troglodytes'],
		sources.nomenclature.nameMap['Gorilla beringei'],
		sources.nomenclature.nameMap['Gorilla gorilla'],
		sources.nomenclature.nameMap['Pongo abelii'],
		sources.nomenclature.nameMap['Pongo pygmaeus']
	];
	addToCharacterMatrix(sources.sources, cmBuilder, solver, [
		['data/2006 - Steiper & Young.json', 'Fig1-abridged'],
		['data/1996 - Zhi & al.json', 'Table4'],
		['data/2012 - Langergraber & al.json', 'synthesis'],
		['data/2013 - Fu & al.json', 'Fig1-abridged'],
		['data/2014 - Meyer & al.json', 'Table1-strict-enriched']
	]);
	// :KLUDGE: autosomal ancestors extend some ancestors' range. This fixes it.
	cmBuilder.removeStates(Haeckel.tax.union(fossilTaxa), Haeckel.TIME_CHARACTER);
	Haeckel.arr.each(fossilTaxa, (taxon: Haeckel.Taxic) => 
	{
		cmBuilder.states(taxon, Haeckel.TIME_CHARACTER, <Haeckel.Range> Haeckel.chr.states(occurrences, taxon, Haeckel.TIME_CHARACTER));
	});

	chart.area = area;
	chart.time = time;
	chart.minPrcTime = Haeckel.rng.create(-10000, -10000);
	chart.phylogeny = phylogeny;
	chart.characterMatrix = cmBuilder.build();
	chart.horizontalRatioMap = createHorizontalRatioMap(sources.nomenclature, MT_NAME_ENTRIES, taxonEntries, solver, maxColumn);
	chart.arcRenderer = createArcRenderer(true);
	chart.vertexRenderer = (builder: Haeckel.ElementBuilder, taxon: Haeckel.Taxic, rectangle: Haeckel.Rectangle) =>
	{
		var entry = taxonEntries[Haeckel.hash(taxon)];
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