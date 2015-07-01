/// <reference path="chron.ts"/>

var MORPH_NAME_ENTRIES: { [name: string]: NameEntry; } = {
	"orangutans": {
		column: 0
	},
	"stem-orangutans": {
		column: 1
	},
	"Hominidae*": {
		column: 2,
		ancestral: true
	},
	"Dryopithecinae": {
		name: "Dryopithecines",
		column: 2
	},
	"Pan-Homininae*": {
		column: 3,
		ancestral: true
	},
	"stem-hominines": {
		column: 3
	},
	"Homininae*": {
		column: 4,
		ancestral: true
	},
	"gorillas": {
		column: 4
	},
	"Hominini*": {
		column: 5,
		ancestral: true
	},
	"chimpanzees": {
		column: 5
	},
	"ardipithecines": {
		column: 6
	},
	"australopithecines": {
		column: 7
	},
	"habilines": {
		column: 8
	},
	"Floresian \"hobbits\"": {
		column: 9,
		italic: false
	},
	"erectines": {
		column: 10
	},
	"archaics": {
		column: 11
	},
	"humans": {
		column: 12
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

				/*
				group.child(Haeckel.SVG_NS, 'rect')
					.attrs(Haeckel.SVG_NS, {
						'x': rectangle.left + 'px',
						'y': rectangle.top + 'px',
						'width': rectangle.width + 'px',
						'height': rectangle.height + 'px',
						'fill': Haeckel.BLACK.hex,
						'stroke': 'none'
					});
				*/
				//var yMin = NaN;
				var taxonOccurrences = <Haeckel.ExtSet<Haeckel.Occurrence>> Haeckel.chr.states(occurrences, taxon, Haeckel.OCCURRENCE_CHARACTER);
				Haeckel.ext.each(taxonOccurrences, occ => {
					var y = chart.getTimeY(occ.time);
					var height = occ.count.min;
					y = Haeckel.rng.intersect(y, Haeckel.rng.create(y.mean - height / 2, y.mean + height / 2));
					if (y.size < 2)
					{
						y = Haeckel.rng.create(Math.max(0, y.mean - 1), y.mean + 1);
					}
					if (y.empty)
					{
						return;
					}
					//yMin = isNaN(yMin) ? y.mean : Math.min(yMin, y.mean);
					group.child(Haeckel.SVG_NS, 'rect')
						.attrs(Haeckel.SVG_NS, {
							'x': rectangle.left + 'px',
							'y': y.min + 'px',
							'width': rectangle.width + 'px',
							'height': y.size + 'px',
							'fill': Haeckel.BLACK.hex,
							'stroke': 'none'
						});
				});
				group.child(Haeckel.SVG_NS, 'path')
					.attrs(Haeckel.SVG_NS, {
						'd': 'M' + rectangle.centerX + ' ' + (rectangle.top + 1) + 'V' + rectangle.bottom,
						'stroke': Haeckel.BLACK.hex,
						'stroke-dasharray': '2 4',
						'stroke-width': '2px',
						'stroke-linecap': 'round',
						'fill': 'none'
					});

				/*
				group.child(Haeckel.SVG_NS, 'rect')
					.attrs(Haeckel.SVG_NS, {
						'x': rectangle.left + 'px',
						'y': rectangle.top + 'px',
						'width': rectangle.width + 'px',
						'height': rectangle.height + 'px',
						'fill': Haeckel.BLACK.hex,
						'stroke': 'none'
					});
				*/
				labelTaxon(group, entry, rectangle, true);
			}
		}
	};

	chart.render(builder.child(Haeckel.SVG_NS, 'g'));
}

