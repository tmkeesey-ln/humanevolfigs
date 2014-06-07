/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>
/// <reference path="../bower_components/dt-node/node.d.ts"/>

interface TaxonEntry
{
  names: string[];
  count: number[];
  timeRatio: number[];
}

interface Entry
{
  stratum: string;
  time: number[];
  taxa: TaxonEntry[];
}

var MIN_COUNT = 0.5;

var SOURCE_LIST: string[] = [
  'data/compiled/characters.json',
  'data/compiled/nomenclature.json',
  'data/2014 - ICS.json'
];

var fs = require('fs');

var files: Haeckel.FileCache = {
	base64: {},
	text: {}
};

SOURCE_LIST.map((source: string) => files.text[source] = fs.readFileSync('./src/' + source, "utf8"));

var dataSources: Haeckel.DataSources = new Haeckel.DataSourcesReader().read(files, SOURCE_LIST);

var output: Entry[] = [];

var ages = Haeckel.ext.list(dataSources.sources['data/2014 - ICS.json'].strata)
  .filter((stratum: Haeckel.Stratum) => stratum.type === 'stage/age')
  .sort((a: Haeckel.Stratum, b: Haeckel.Stratum) => b.start.mean - a.start.mean);

ages.unshift({
  name: 'Recent',
  start: ages[0].end,
  end: Haeckel.RANGE_0,
  type: 'stage/age',
  hash: '(stratum:stage/age:Recent)'
});
  
var occurrences = dataSources.sources['data/compiled/characters.json'].occurrences;

Haeckel.arr.each(ages, (age: Haeckel.Stratum) =>
{
  var ageTime = Haeckel.rng.create(age.start.mean, age.end.mean);
  var entry: Entry = {
    stratum: age.name,
    time: [ageTime.min, ageTime.max],
    taxa: []
  };
  Haeckel.ext.each(occurrences.taxon.units, (unit: Haeckel.Taxic) =>
  {
    var ageOccurrences: Haeckel.Occurrence[] = [];
    var taxonOccurrences = <Haeckel.ExtSet<Haeckel.Occurrence>> Haeckel.chr.states(occurrences, unit, Haeckel.OCCURRENCE_CHARACTER);
    Haeckel.ext.each(taxonOccurrences, (occurrence: Haeckel.Occurrence) =>
    {
      if (Haeckel.rng.overlap(ageTime, occurrence.time))
      {
        ageOccurrences.push(occurrence);
      }
    });
    if (ageOccurrences.length)
    {
      var names = Haeckel.ext.list(Haeckel.nom.forTaxon(dataSources.nomenclature, unit)).sort();
      var counts: Haeckel.Range[] = [];
      var times: Haeckel.Range[] = [];
      Haeckel.arr.each(ageOccurrences, (occurrence: Haeckel.Occurrence) =>
      {
        var intersectTime = Haeckel.rng.intersect(ageTime, occurrence.time);
        var ratio = occurrence.time.size === 0 ? 1.0 : intersectTime.size / occurrence.time.size;
        counts.push(Haeckel.rng.multiply(occurrence.count, ratio));
        times.push(intersectTime);
      });
      if (times.length > 0)
      {
        var count = Haeckel.rng.sum(counts);
        if (count.max >= MIN_COUNT)
        {
          var time = Haeckel.rng.combine(times);
          var timeRatio = Haeckel.rng.multiply(Haeckel.rng.add(time, -ageTime.min), 1 / ageTime.size);
          entry.taxa.push({
            names: names,
            count: [count.min, count.max],
            timeRatio: [timeRatio.min, timeRatio.max]
          });
        }
      }
    }
  });
  entry.taxa.sort((a: TaxonEntry, b: TaxonEntry) =>
  {
    var aName = a.names.length ? a.names[0] : '';
    var bName = b.names.length ? b.names[0] : '';
    return aName < bName ? -1 : (aName > bName ? 1 : 0);
  });
  output.push(entry);
});

console.log(JSON.stringify(output, null, '\t'));