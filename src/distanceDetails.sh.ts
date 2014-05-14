/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>
/// <reference path="../bower_components/dt-node/node.d.ts"/>

var FOCUS: string = 'Homo sapiens';

var COMPARISON: string[] = ['Pongo pygmaeus', 'Gorilla gorilla', 'Pan troglodytes'];

var MATRIX_SOURCE = '2004 - Strait & Grine.json';

var SOURCES: string[] = [ 'compiled/nomenclature.json', MATRIX_SOURCE ];

var MATRIX: string = "Table3-modified";

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

var output: any = {};

var matrix = dataSources.sources[MATRIX_SOURCE].characterMatrices[MATRIX];

var m = COMPARISON.length;

var focusTaxon = dataSources.nomenclature.nameMap[FOCUS];

for (i = 0, n = matrix.characterList.length; i < n; ++i)
{
	var character = matrix.characterList[i];
	var charOutput = output[character.label || String(i + 1)] = {};
	var focusStates = Haeckel.chr.states(matrix, focusTaxon, character);
	var labelStates: (states: Haeckel.Set) => string = character.labelStates || Haeckel.hash;
	charOutput[FOCUS] = labelStates(focusStates);
	for (var j = 0; j < m; ++j)
	{
		var name = COMPARISON[j];
		var taxon =  dataSources.nomenclature.nameMap[name];
		var taxonStates = Haeckel.chr.states(matrix, taxon, character);
		charOutput[name] = {
			"states": labelStates(taxonStates),
			"distance": Haeckel.hash(character.distance(focusStates, taxonStates))
		};
	}
}

console.log(JSON.stringify(output, null, '\t'));