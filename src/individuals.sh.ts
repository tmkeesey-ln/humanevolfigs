/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>
/// <reference path="../bower_components/dt-node/node.d.ts"/>

interface Individual
{
    coords: [number, number];
    flipped: boolean;
    image: string;
    time: [number, number];
}

interface SilhouetteMap {
	[taxonName: string]: string[];
}

const SILHOUETTES: SilhouetteMap = {
	'ardipithecines': [
		'Ardipithecus kadabba'
	],
	'Sahelanthropus': [
		'Sahelanthropus tchadensis'
	],
	'Orrorin': [
		'Orrorin tugenensis'
	],
	'Ardipithecus ramidus': [
		'Ardipithecus ramidus'
	],
	'Australopithecus': [
		'Australopithecus africanus',
		'Australopithecus garhi'
	],
	'Australopithecus anamensis': [
		'Praeanthropus anamensis'
	],
	'Australopithecus aff. afarensis': [
		'Praeanthropus afarensis (female)',
		'Praeanthropus afarensis (male)'
	],
	'Australopithecus afarensis': [
		'Praeanthropus afarensis (female)',
		'Praeanthropus afarensis (male)'
	],
	'Kenyanthropus': [
		'Kenyanthropus platyops'
	],
	'Australopithecus garhi': [
		'Australopithecus garhi'
	],
	'Australopithecus africanus': [
		'Australopithecus africanus'
	],
	'Australopithecus sediba': [
		'Australopithecus sediba'
	],
	'Hominina indet. A': [
		'Australopithecus africanus',
		'Australopithecus sediba',
		'Paranthropus aethiopicus'
	],
	'Paranthropus': [
		'Paranthropus aethiopicus',
		'Paranthropus boisei (female)'
	],
	'Paranthropus aethiopicus': [
		'Paranthropus aethiopicus'
	],
	'Paranthropus boisei': [
		'Paranthropus boisei (female)',
		'Paranthropus boisei (male)'
	],
	'Paranthropus robustus': [
		'Paranthropus robustus'
	],
	'Homo': [
		'Australopithecus sediba',
		'Homo habilis',
		'Homo rudolfensis'
	],
	'Homo floresiensis': [
		'Homo floresiensis'
	],
	'Homo habilis': [
		'Homo habilis'
	],
	'Homo rudolfensis': [
		'Homo rudolfensis'
	],
	'Homo naledi': [
		'Homo rudolfensis'
	],
	'erectines': [
		'Homo ergaster ergaster',
		'Homo ergaster georgicus'
	],
	'Homo ergaster': [
		'Homo ergaster ergaster',
		'Homo ergaster georgicus'
	],
	'Homo erectus': [
		'Homo erectus pekinensis'
	],
	'Homo heidelbergensis': [
		'Homo heidelbergensis antecessor',
		'Homo heidelbergensis daliensis',
		'Homo heidelbergensis rhodesiensis'
	],
	'Homo heidelbergensis antecessor': [
		'Homo heidelbergensis antecessor'
	],
	'Homo heidelbergensis daliensis': [
		'Homo heidelbergensis daliensis'
	],
	'Homo heidelbergensis rhodesiensis': [
		'Homo heidelbergensis rhodesiensis'
	],
	'Homo sapiens': [
		'Homo sapiens idaltu',
		'Homo sapiens njarasensis'
	],
	'Homo sapiens idaltu': [
		'Homo sapiens idaltu'
	],
	'Homo sapiens njarasensis': [
		'Homo sapiens njarasensis'
	],
	'Homo sapiens sapiens': [
		'Homo sapiens sapiens (female, walking)',
		'Homo sapiens sapiens (female, walking)',
		'Homo sapiens sapiens (female, walking)',
		'Homo sapiens sapiens (male, running)',
		'Homo sapiens sapiens (male, standing)',
		'Homo sapiens sapiens (male, walking)'
	],
	'Homo sp. (Denisova)': [
		'Homo heidelbergensis daliensis',
		'Homo neanderthalensis (female)'
	],
	'Homo heidelbergensis steinheimensis': [
		'Homo neanderthalensis (female)'
	],
	'Homo neanderthalensis': [
		'Homo neanderthalensis (female)',
		'Homo neanderthalensis (male)'
	]
};

const SOURCE_LIST: string[] = [
    'data/compiled/characters.json',
    'data/compiled/nomenclature.json'
];

const fs = require('fs');

const files: Haeckel.FileCache = {
	base64: {},
	text: {}
};

SOURCE_LIST.map((source: string) => files.text[source] = fs.readFileSync('./src/' + source, "utf8"));

const dataSources: Haeckel.DataSources = new Haeckel.DataSourcesReader().read(files, SOURCE_LIST);

function getNames(nomenclature: Haeckel.Nomenclature, taxon: Haeckel.Taxic) {
	return Haeckel.ext.list<string>(nomenclature.names)
		.filter(name => Haeckel.tax.includes(nomenclature.nameMap[name], taxon))
		.sort((a, b) => {
			var taxonA = nomenclature.nameMap[a];
			var taxonB = nomenclature.nameMap[b];
			if (taxonA === taxonB) {
				return 0;
			}
			if (Haeckel.tax.prIncludes(taxonA, taxonB)) {
				return 1;
			}
			if (Haeckel.tax.prIncludes(taxonB, taxonA)) {
				return -1;
			}
			return 0;
		});
}

const individuals: Individual[] = [];

const occurrences = dataSources.sources['data/compiled/characters.json'].occurrences;

const random = Haeckel.seedRandom('A');

const taxon = dataSources.nomenclature.nameMap['Hominina'];

Haeckel.ext.each(taxon.units, unit => {
    const count = Haeckel.chr.states(occurrences, unit, Haeckel.COUNT_CHARACTER) as Haeckel.Range;
    if (!count || count.empty) {
        return;
    }
    const n = count.min;

    const regions = Haeckel.chr.states(occurrences, unit, Haeckel.GEO_CHARACTER) as Haeckel.ExtSet<Haeckel.GeoCoords[]>;
    if (!regions || regions.empty) {
        return;
    }
    const areas = Haeckel.geo.project(regions, Haeckel.DEFAULT_PROJECTOR);

    const time = Haeckel.chr.states(occurrences, unit, Haeckel.TIME_CHARACTER) as Haeckel.Range;
    const timeArray: [number, number] = [time.min, time.max];

    const names = getNames(dataSources.nomenclature, unit);
    let images = [];
    names.some(name => {
        const silhouettes = SILHOUETTES[name];
        if (silhouettes) {
            images = silhouettes;
            return true;
        }
    });
   
    const imagesLength = images.length;
    if (!imagesLength) {
        throw new Error(`Could not find images for ${Haeckel.ext.list(Haeckel.nom.forTaxon(dataSources.nomenclature, unit)).join('/')}.`);
    }
    for (let i = 0; i < n; ++i) {
        const pt = Haeckel.pt.random(areas, null, random);
        individuals.push({
            coords: [pt.x, pt.y],
            flipped: random() < 0.5,
            image: images[Math.floor(random() * imagesLength)],
            time: timeArray, 
        });
    }
});

console.log(JSON.stringify(individuals, null, '\t'));