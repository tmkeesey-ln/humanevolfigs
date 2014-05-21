/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>
/// <reference path="../bower_components/dt-node/node.d.ts"/>

var NAMES: string[] = ['Pongo pygmaeus', 'Gorilla gorilla', 'Pan troglodytes', 'Homo sapiens'];

var NAMES2: string[] = ['Hominidae', 'Homininae', 'Hominini', 'Homo sapiens'];

var SOURCE_LIST: string[][] = [
	['data/compiled/nomenclature.json'],
	['data/2002 - Gibbs & al.json', 'Fig1'],
	['data/2003 - Mallegni & al.json', 'Fig. 4b (simplified)'],
	['data/2009 - Argue & al.json', 'Fig1Tree2'],
	['data/2010 - Berger & al.json', 'Figure S3 (ordered consensus)'],
	['data/2010 - Harrison.json', 'Fig2approx'],
	['data/2011 - Cruciani & al.json', 'lineage'],
	['data/2012 - ICS.json'],
	['data/2012 - Langergraber & al.json']
];

var OTU_NAMES = [
	'Dryopithecinae',
	'Lufengpithecus',
	"Ankarapithecus",
	"Gigantopithecus",
	"Sivapithecus",
	"Khoratpithecus",
	'Pongo',
	'Gorilla',
	"Chororapithecus",
	"Nakalipithecus",
	"Orrorin",
	"Ouranopithecus",
	"Sahelanthropus",
	"Samburupithecus",
	"Udabnopithecus",
	"Ardipithecus",
	"Orrorin",
	"Sahelanthropus",
	"Gorilla",
	'Pan troglodytes',
	'Pan paniscus',
	'Pan sp.',
	'Australopithecus',
	'Kenyanthropus',
	'Paranthropus',
	'Homo habilis',
	'Homo rudolfensis',
	'Homo floresiensis',
	'Homo ergaster',
	'Homo erectus',
	'Homo heidelbergensis',
	'Homo neanderthalensis',
	'Homo sp. (Denisova)',
	'Homo sapiens',
	// :TODO: Population X?
];

var OTU_NAMES_SET = Haeckel.ext.create(OTU_NAMES);

var fs = require('fs');

var files: Haeckel.FileCache = {
		base64: {},
		text: {}
	};

SOURCE_LIST.map((source: string[]) => console.log('>', source));
SOURCE_LIST.map((source: string[]) => files.text[source[0]] = fs.readFileSync('./src/' + source[0], "utf8"));

var dataSources: Haeckel.DataSources = new Haeckel.DataSourcesReader().read(files, SOURCE_LIST.map((source: string[]) => source[0]));

var otusBuilder = new Haeckel.ExtSetBuilder<Haeckel.Taxic>();

for (var i = 0, n = OTU_NAMES.length; i < n; ++i)
{
	otusBuilder.add(dataSources.nomenclature.nameMap[OTU_NAMES[i]]);
}

var OTUS = otusBuilder.build();

var HOMINIDAE = dataSources.nomenclature.nameMap['Hominidae'];

var builder = new Haeckel.PhyloBuilder();

for (i = 0, n = SOURCE_LIST.length; i < n; ++i)
{
	var source = SOURCE_LIST[i];
	if (source.length >= 2)
	{
		builder.addPhylogeny(dataSources.sources[source[0]].phylogenies[source[1]])
	}
}

builder.mergePredecessors(HOMINIDAE);

// :TODO: Remove non-hominids

var phylogeny = builder.buildCoarser(OTUS);

var output: { arcs: string[][]; } = {
	arcs: []
};

var arcs: string[][] = output["arcs"] = [];

var tempNames: { [hash: string]: string; } = {};

var nextNameIndex = 0;

var getName = (taxon: Haeckel.Taxic) =>
{
	var hash = taxon.hash;
	var tempName = tempNames[hash];
	if (tempName)
	{
		return tempName;
	}
	var names = Haeckel.nom.forTaxon(dataSources.nomenclature, taxon);
	if (!names.empty)
	{
		var canonical = Haeckel.ext.intersect(names, OTU_NAMES_SET);
		if (!canonical.empty)
		{
			return tempNames[hash] = Haeckel.ext.list(canonical)[0];
		}
		return tempNames[hash] = Haeckel.ext.list(canonical).join('/');
	}
	names = Haeckel.nom.forSubtaxa(dataSources.nomenclature, taxon);
	if (!names.empty)
	{
		return tempNames[hash] = Haeckel.ext.list(canonical).join('/');
	}
	return tempNames[hash] = String(nextNameIndex++);
};

Haeckel.ext.each(phylogeny.arcs, (arc: Haeckel.Arc<Haeckel.Taxic>) => output.arcs.push([ getName(arc[0]), getName(arc[1]) ]));

console.log(JSON.stringify(output, null, '\t'));