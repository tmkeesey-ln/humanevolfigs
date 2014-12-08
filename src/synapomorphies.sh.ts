/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>
/// <reference path="../bower_components/dt-node/node.d.ts"/>

var NAMES: string[] = ['Pongo pygmaeus', 'Gorilla gorilla', 'Pan troglodytes', 'Homo sapiens'];

var NAMES2: string[] = ['Hominidae', 'Homininae', 'Hominini', 'Homo sapiens'];

var SOURCES: string[] = [ 'compiled/nomenclature.json', '2004 - Strait & Grine.json', '2009 - Argue & al.json', '2011 - Diogo & Wood.json' , '2002 - Gibbs & al.json' ];

var fs = require('fs');

var files: Haeckel.FileCache = {
		base64: {},
		text: {}
	};

for (var i = 0, n = SOURCES.length; i < n; ++i)
{
	var filename = SOURCES[i];
	files.text[filename] = fs.readFileSync('./src/data/' + filename, "utf8");
}

var dataSources = new Haeckel.DataSourcesReader().read(files, SOURCES);

var taxa: Haeckel.Taxic[] = [];

for (i = 0, n = NAMES.length; i < n; ++i)
{
	var subtaxa: Haeckel.Taxic[] = [];
	for (var j = i; j < n; ++j)
	{
		subtaxa.push(dataSources.nomenclature.nameMap[NAMES[j]]);
	}
	taxa.push(Haeckel.tax.union(subtaxa));
}

var output: any = {};

for (filename in dataSources.sources)
{
	var source = dataSources.sources[filename];
	var sourceOutput: any = output[filename] = {};
	for (var matrixName in source.characterMatrices)
	{
		var matrix = source.characterMatrices[matrixName];
		var matrixOutput: any = sourceOutput[matrixName] = {};
		var m = matrix.characterList.length;
		for (i = 0, n = taxa.length; i < n; ++i)
		{
			var taxon = taxa[i];
			var taxonName = NAMES2[i];
			var taxonOutput: any = matrixOutput[taxonName] = {};
			var outgroup = Haeckel.tax.setDiff(matrix.taxon, dataSources.nomenclature.nameMap[taxonName]);
			for (j = 0; j < m; ++j)
			{
				var character = matrix.characterList[j];
				if (character.distance)
				{
					var inStates = Haeckel.chr.states(matrix, taxon, character);
					var outStates = Haeckel.chr.states(matrix, outgroup, character);
					if (!character.overlap(inStates, outStates))
					{
						taxonOutput[character.label || String(j + 1)]
							= character.labelStates ? character.labelStates(inStates) : Haeckel.hash(inStates);
					}
				}
			}
		}
	}
}

console.log(JSON.stringify(output, null, '\t'));