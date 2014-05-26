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

var NAME_ENTRIES: { [name: string]: NameEntry; } = {
	"Hominidae*": {
		column: 4,
		ancestral: true
	},
	"fossil orangutans": {
		column: 1
	},
	"Bornean orangutans": {
		column: 0
	},
	"Sumatran orangutans": {
		column: 2
	},
	"stem-orangutans": {
		column: 3
	},
	"Dryopithecinae": {
		column: 4,
		italic: true
	},
	"Homininae*": {
		column: 5,
		ancestral: true
	},
	"Gorilla*": {
		column: 5,
		ancestral: true
	},
	"western gorillas": {
		column: 4
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
	"Pan troglodytes*": {
		column: 8,
		ancestral: true
	},
	"central chimpanzees": {
		column: 8
	},
	"western chimpanzees": {
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
	"Australopithecus": {
		column: 11,
		italic: true
	},
	"Paranthropus": {
		column: 10,
		italic: true
	},
	"Homo*": {
		column: 13,
		ancestral: true
	},
	"Floresian \"hobbits\"": {
		column: 14,
		italic: false
	},
	"Homo habilis": {
		column: 13,
		italic: true
	},
	"Homo rudolfensis": {
		column: 12,
		italic: true
	},
	"Homo ergaster": {
		column: 15,
		italic: true
	},
	"Homo2*": {
		column: 16,
		ancestral: true
	},
	"Homo erectus": {
		column: 16,
		italic: true
	},
	"Homo heidelbergensis": {
		column: 19,
		italic: true
	},
	"Denisovans": {
		column: 17
	},
	"Neandertals": {
		column: 18
	},
	"humans": {
		column: 20
	},
	"mt-MRCA": {
		column: 20,
		name: "mitochondrial Eve"
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
		'data/2012 - ICS.json',
		'data/2012 - Langergraber & al.json'
		//'data/2012 - van Oven.json'
	],

	render: (builder: Haeckel.ElementBuilder, sources: Haeckel.DataSources, defs: () => Haeckel.ElementBuilder, pngAssets: Haeckel.PNGAssets) =>
	{
		var taxonEntries: { [taxonHash: string]: TaxonEntry; } = {};
		var maxColumn = 1;
		var name: string;
		var phylogeny = sources.sources['data/compiled/phylogeny.json'].phylogenies['morphology'];
		var solver = new Haeckel.PhyloSolver(phylogeny);
		var chart = new Haeckel.PhyloChart();
		var defaultVertexRenderer = chart.vertexRenderer;

		function createHorizontalRatioMap(offset: number = 0): (taxon: Haeckel.Taxic) => Haeckel.Range
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
					for (name in NAME_ENTRIES)
					{
						var subtaxon = sources.nomenclature.nameMap[name];
						if (subtaxon && Haeckel.tax.includes(clade, subtaxon))
						{
							column += NAME_ENTRIES[name].column;
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
				return Haeckel.rng.create((column + 0.85) / (maxColumn + 2) + offset, (column + 1.15) / (maxColumn + 2) + offset);
			};
		}

		function vertexRenderer(builder: Haeckel.ElementBuilder, taxon: Haeckel.Taxic, rectangle: Haeckel.Rectangle)
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
		}

		for (name in NAME_ENTRIES)
		{
			var entry = NAME_ENTRIES[name];
			maxColumn = Math.max(maxColumn, entry.column);
			var taxon = sources.nomenclature.nameMap[name];
			taxonEntries[Haeckel.hash(taxon)] = {
				ancestral: !!entry.ancestral,
				column: entry.column,
				name: name,
				italic: !!entry.italic,
				taxon: taxon
			};
		}

		var cmBuilder = Haeckel.dat.toCharacterMatrixBuilder(sources.sources['data/2012 - Langergraber & al.json'].datings['synthesis'], solver);
		var occurrences = sources.sources['data/compiled/characters.json'].occurrences;
		Haeckel.ext.each(phylogeny.vertices, (taxon: Haeckel.Taxic) => 
		{
			cmBuilder.states(taxon, Haeckel.TIME_CHARACTER, <Haeckel.Range> Haeckel.chr.states(occurrences, taxon, Haeckel.TIME_CHARACTER));
		});

		chart.minPrcTime = Haeckel.rng.create(-250000, -250000);
		chart.horizontalRatioMap = createHorizontalRatioMap();
		chart.phylogeny = phylogeny;
		chart.area = Haeckel.rec.create(MARGIN, TOP_MARGIN, FIGURE_WIDTH - MARGIN * 2, FIGURE_HEIGHT - MARGIN - TOP_MARGIN);
		chart.time = Haeckel.rng.create(-20000000, 0);
		chart.characterMatrix = cmBuilder.build();
		chart.vertexRenderer = vertexRenderer;
		chart.render(builder);

		/*
		phylogeny = sources.sources['data/compiled/phylogeny.json'].phylogenies['mtDNA'];

		chart.horizontalRatioMap = createHorizontalRatioMap(0.5 / maxColumn);
		chart.phylogeny = phylogeny;
		chart.time = Haeckel.rng.create(-20000000, 0);
		chart.characterMatrix = cmBuilder.build();
		chart.vertexRenderer = vertexRenderer;
		chart.render(builder);		
		*/

		return builder;
	}
};