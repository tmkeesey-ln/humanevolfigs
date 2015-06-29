/// <reference path="chron.ts"/>

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
		name: "Dryopithecines",
		column: 4
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
		column: 8,
		ancestral: true
	},
	"Pan*": {
		column: 8,
		ancestral: true
	},
	"bonobo chimpanzees": {
		column: 7
	},
	"fossil chimpanzees": {
		column: 8
	},
	"common chimpanzees": {
		column: 9
	},
	"ardipithecines": {
		column: 9
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
	"erectines": {
		column: 13
	},
	"archaics": {
		column: 14
	},
	"humans": {
		column: 15
	}
};

function morphChart(builder: Haeckel.ElementBuilder, sources: Haeckel.DataSources, taxonEntries: { [taxonHash: string]: TaxonEntry; }, area: Haeckel.Rectangle, time: Haeckel.Range, maxColumn: number)
{
	var phylogeny = sources.sources['data/compiled/phylogeny.json'].phylogenies['morphology'];
	var solver = new Haeckel.PhyloSolver(phylogeny);
	var chart = new Haeckel.PhyloChart();

	var occurrences = sources.sources['data/compiled/characters.json'].occurrences;
	var cmBuilder = new Haeckel.CharacterMatrixBuilder<Haeckel.Range>();
	addToCharacterMatrix(sources.sources, cmBuilder, solver, [
		['data/2006 - Steiper & Young.json', 'Fig1-abridged'],
		['data/2012 - Langergraber & al.json', 'synthesis']
	]);
	// :KLUDGE: autosomal ancestors extend Homo sapiens' range. This fixes it.
	cmBuilder.removeStates(sources.nomenclature.nameMap['Homo sapiens'], Haeckel.TIME_CHARACTER);
	Haeckel.ext.each(phylogeny.vertices, (taxon: Haeckel.Taxic) => 
	{
		cmBuilder.states(taxon, Haeckel.TIME_CHARACTER, <Haeckel.Range> Haeckel.chr.states(occurrences, taxon, Haeckel.TIME_CHARACTER));
	});

	chart.area = area;
	chart.time = time;
	chart.minPrcTime = Haeckel.rng.create(-350000, -350000);
	chart.characterMatrix = cmBuilder.build();
	chart.horizontalRatioMap = createHorizontalRatioMap(sources.nomenclature, MORPH_NAME_ENTRIES, taxonEntries, solver, maxColumn);
	chart.phylogeny = phylogeny;
	chart.arcRenderer = createArcRenderer();
	chart.vertexRenderer = (builder: Haeckel.ElementBuilder, taxon: Haeckel.Taxic, rectangle: Haeckel.Rectangle) =>
	{
		var entry = taxonEntries[Haeckel.hash(taxon)];
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
						'fill': Haeckel.WHITE.hex,
						'stroke': Haeckel.BLACK.hex,
						'stroke-width': '1px',
						'stroke-linejoin': 'miter'
					});
				var taxonOccurrences = <Haeckel.ExtSet<Haeckel.Occurrence>> Haeckel.chr.states(occurrences, taxon, Haeckel.OCCURRENCE_CHARACTER);
				Haeckel.ext.each(taxonOccurrences, occurrence => {
					var timeY = chart.getTimeY(occurrence.time);
					group.child(Haeckel.SVG_NS, 'rect')
						.attrs(Haeckel.SVG_NS, {
							'x': rectangle.left + 'px',
							'y': timeY.min + 'px',
							'width': rectangle.width + 'px',
							'height': timeY.size + 'px',
							'fill': Haeckel.BLACK.hex,
							'stroke': 'none'
						});
				});
				labelTaxon(group, entry, rectangle, true);
			}
		}
	};

	chart.render(builder.child(Haeckel.SVG_NS, 'g'));
}

