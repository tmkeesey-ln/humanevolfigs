/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>

var FIGURE_WIDTH = 36 * 300;
var FIGURE_HEIGHT = 24 * 300;
var MARGIN = 0.5 * 300;
var MAX_COUNT = 100;

interface SilhouetteMap {
	[taxonName: string]: string[];
}

var SILHOUETTES: SilhouetteMap = {
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

interface Entry {
	flipped: boolean;
	scale: number;
	silhouette: string;
	x: number;
	y: number;
}

function placeOccurrence(names: string[], occurrence: Haeckel.Occurrence, yRange: Haeckel.Range, scale: Haeckel.Range, random: () => number): Entry {
	var silhouette: string;
	names.some(name => {
		var silhouettes = SILHOUETTES[name];
		if (silhouettes) {
			silhouette = silhouettes[Math.floor(random() * silhouettes.length)];
			return true;
		}
	});
	if (!silhouette) {
		throw new Error('Could not find silhouette ("' + names.join('", "') + '").');
	}
	var yAngle = random() * Haeckel.TAU;
	return {
		flipped: random() < 0.5,
		scale: random() * scale.size + scale.min,
		silhouette: silhouette,
		x: NaN,
		y: Math.round(Math.sin(yAngle) * (yRange.size / 2) + yRange.mean)
	};
}

function getTimeY(area: Haeckel.Rectangle, time: Haeckel.Range): Haeckel.Range {
	var size = Math.max(1, time.size);
	var y1 = area.bottom - (area.height * (time.max - time.min) / size) - 0.5;
	var y2 = area.bottom - (area.height * (time.min - time.min) / size) + 0.5;
	return Haeckel.rng.create(y1, y2);
}

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

function placeOccurrences(matrix: Haeckel.CharacterMatrix<any>, taxon: Haeckel.Taxic, nomenclature: Haeckel.Nomenclature, area: Haeckel.Rectangle, time: Haeckel.Range, scale: Haeckel.Range, random: () => number, spacingY: number): Entry[] {
	var result: Entry[] = [];
	var lastX: {
		[row: string]: number;
	} = {};
	var maxX = NaN;
	var areaYRange = Haeckel.rng.create(area.top, area.bottom);
	Haeckel.ext.each(taxon.units, unit => {
		var occurrences: Haeckel.ExtSet<Haeckel.Occurrence> = Haeckel.chr.states(matrix, unit, Haeckel.OCCURRENCE_CHARACTER);
		if (!occurrences) {
			return;
		}
		var names = getNames(nomenclature, unit);
		Haeckel.ext.each(occurrences, occurrence => {
			var yRange = getTimeY(area, time);
			var count = Math.max(MAX_COUNT, occurrence.count.min);
			if (!Haeckel.rng.includes(areaYRange, yRange))
			{
				var intersect = Haeckel.rng.intersect(areaYRange, yRange);
				if (intersect.empty) {
					return;
				}
			}
			for (var i = 0; i < count; ++i) {
				var entry = placeOccurrence(names, occurrence, yRange, scale, random);
				if (!Haeckel.rng.contains(areaYRange, entry.y)) {
					continue;
				}
				var row = Math.floor(entry.y / spacingY);
				entry.x = lastX[row];
				if (entry.x === undefined) {
					entry.x = lastX[row] = entry.scale / 2;
				} else {
					lastX[row] = entry.x += entry.scale;
				}
				if (isNaN(maxX) || entry.x > maxX) {
					maxX = entry.x;
				}
				result.push(entry);
			}
		});
	});
	maxX += scale.mean / 2;
	var xFactor = area.width / maxX;
	result.forEach(entry => entry.x = entry.x * xFactor + area.left);
	return result;
}

function drawEntry(builder: Haeckel.ElementBuilder, entry: Entry) {
	return builder
		.child(Haeckel.SVG_NS, 'circle')
		.attrs(Haeckel.SVG_NS, {
			x: entry.x + 'px',
			y: entry.y + 'px',
			radius: '2px'
		});
}

var FIGURE_TO_RENDER: Haeckel.Figure = 
{
	width: FIGURE_WIDTH,
	height: FIGURE_HEIGHT,
	sources: ['data/compiled/characters.json', 'data/compiled/nomenclature.json'],
	render: (builder: Haeckel.ElementBuilder, sources: Haeckel.DataSources, defs: () => Haeckel.ElementBuilder) =>
	{
		var matrix = sources.sources["data/compiled/characters.json"].occurrences;
		var taxon = sources.nomenclature.nameMap['Hominina'];
		var nomenclature = sources.nomenclature;
		var area = Haeckel.rec.create(MARGIN, MARGIN, FIGURE_WIDTH - MARGIN * 2, FIGURE_HEIGHT - MARGIN * 2);
		var time = Haeckel.rng.create(-7000000, -11700);
		var scale = Haeckel.rng.create(0.07, 0.13);
		var random = Haeckel.seedRandom('A');
		var spacingY = 40;
		placeOccurrences(matrix, taxon, nomenclature, area, time, scale, random, spacingY)
			.forEach(entry => drawEntry(builder, entry));
		return builder;
	}
};