/// <reference path="stratUnit.ts"/>

interface AgeFigureTaxon
{
	name: string;
	italics?: boolean;
	label?: string;
	mapImage?: string;
	silhouette?: string;
}

function ageFigure(
	settings: {
		area: Haeckel.Rectangle;
		builder: Haeckel.ElementBuilder;
		defs: Haeckel.ElementBuilder;
		nomenclature: Haeckel.Nomenclature;
		occurrencesSource: Haeckel.DataSource;
		strataSource: Haeckel.DataSource;
		taxa: AgeFigureTaxon[];
		timeUnitName: string;
	}
)
{
	function capitalize(s: string)
	{
		return s.replace(/(^([a-zA-Z\p{M}]))|([ -][a-zA-Z\p{M}])/g, c => c.toUpperCase());
	}

	function getCountLabel(count: Haeckel.Range): string
	{
		if (count.min > 1000000000)
		{
			return "billions";
		}
		if (count.min > 1000000)
		{
			return "millions";
		}
		if (count.min > 1000)
		{
			return "thousands";
		}
		var precise = count.size === 0;
		var whole = Math.floor(count.min) === count.min;
		if (whole)
		{
			if (precise)
			{
				return String(count.min);
			}
			return "≥" + count.min;
		}
		if (count.min > 100)
		{
			return ">" + (Math.floor(count.min / 100) * 100);
		}
		if (count.min < 2)
		{
			return "1?";
		}
		if (precise)
		{
			return '~' + Math.round(count.min);
		}
		return ">" + Math.floor(count.min);
	}

	var STRATUM_HEIGHT = 400;
	var SILHOUETTE_HEIGHT = 200;
	var MAP_HEIGHT = 320; // 500;
	var SECTION_SPACING = 8;
	var STRAT_UNIT_SPACING = 4;
	var TAXON_LABEL_FONT_SIZE = 24;
	var TAXON_LABEL_STYLE: { [name: string]: string; } = {
		'font-size': TAXON_LABEL_FONT_SIZE + 'px',
		'font-family': 'Myriad Pro'
	};
	var TIME_LABEL_FONT_SIZE = 40;
	var TIME_LABEL_STYLE: { [name: string]: string; } = {
		'font-size': TIME_LABEL_FONT_SIZE + 'px',
		'font-weight': 'bold',
		'font-family': 'Myriad Pro'
	};
	var SURROUNDING_STRATUM_HEIGHT = 75;
	var SURROUNDING_STRATUM_LABEL_SIZE = 24;
	var SURROUNDING_STRATUM_LABEL_STYLE: { [name: string]: string; } = {
		'font-size': SURROUNDING_STRATUM_LABEL_SIZE + 'px',
		'font-family': 'Myriad Pro'
	};

	var occurrences = settings.occurrencesSource.occurrences;
	var strata = settings.strataSource.strata;
	var SVG_NS = Haeckel.SVG_NS;
	var XLINK_NS = "http://www.w3.org/1999/xlink";

	function findStratum(name: string)
	{
		return Haeckel.ext.singleMember(Haeckel.ext.where(strata, stratum => stratum.name === name));
	}

	function findNextStratum(start: number, type: string)
	{
		if (start >= 0) {
			return null;
		}
		try 
		{
			return Haeckel.ext.singleMember(Haeckel.ext.where(strata,
				stratum => Haeckel.precisionEqual(start, stratum.start.mean) && stratum.type === type));
		}
		catch (e)
		{
			return {
				name: 'Holocene',
				type: 'age',
				start: Haeckel.rng.create(start, start),
				end: Haeckel.RANGE_0
			};
		}
		return null;
	}

	function findPrevStratum(end: number, type: string)
	{
		return Haeckel.ext.singleMember(Haeckel.ext.where(strata,
			stratum => Haeckel.precisionEqual(end, stratum.end.mean) && stratum.type === type));
	}

	var stratum = findStratum(settings.timeUnitName);
	var time = Haeckel.rng.create(stratum.start.mean, stratum.end.mean);
	var nextStratum = findNextStratum(time.max, stratum.type);
	var prevStratum = findPrevStratum(time.min, stratum.type);

	// Background
	settings.builder
		.child(SVG_NS, 'rect')
		.attrs(SVG_NS, {
			x: settings.area.left + 'px',
			y: settings.area.top + 'px',
			width: settings.area.width + 'px',
			height: settings.area.height + 'px',
			fill: Haeckel.WHITE.hex
		});

	var numTaxa = settings.taxa.length;
	var columnWidth = (settings.area.width - TIME_LABEL_FONT_SIZE) / numTaxa;

	// Columns (background)
	(() => {
		var g = settings.builder.child(SVG_NS, 'g');
		for (var i = 0; i < numTaxa; ++i)
		{
			/*
			g
				.child(SVG_NS, 'rect')
				.attrs(SVG_NS, {
					x: (TIME_LABEL_FONT_SIZE + columnWidth * i) + 'px',
					y: '0px',
					width: columnWidth + 'px',
					height: (settings.area.height - TIME_LABEL_FONT_SIZE - SECTION_SPACING) + 'px',
					fill: i % 2 ? Haeckel.WHITE.hex : '#d0d0d0'
				});
			*/
			if (i) {
				g
					.child(SVG_NS, 'line')
					.attrs(SVG_NS, {
						x1: (TIME_LABEL_FONT_SIZE + columnWidth * i) + 'px',
						y1: settings.area.top + 'px',
						x2: (TIME_LABEL_FONT_SIZE + columnWidth * i) + 'px',
						y2: settings.area.bottom + 'px',
						stroke: Haeckel.BLACK.hex,
						'stroke-width': '1px',
						'stroke-dasharray': '4 4'
					});
			}
		}
	})();

	// Strat chart
	(() => {
		var stratArea = Haeckel.rec.create(settings.area.left + TIME_LABEL_FONT_SIZE, 0,
			settings.area.width - TIME_LABEL_FONT_SIZE, STRATUM_HEIGHT + SURROUNDING_STRATUM_HEIGHT * 2);
		var timePerPixel = time.size / STRATUM_HEIGHT;
		var marginTime = SURROUNDING_STRATUM_HEIGHT * timePerPixel; 
		var g = settings.builder.child(SVG_NS, 'g');
		/*
		g
			.child(SVG_NS, 'rect')
			.attrs(SVG_NS, {
				x: settings.area.left + 'px',
				y: stratArea.top + 'px',
				width: settings.area.width + 'px',
				height: stratArea.height + 'px',
				fill: Haeckel.WHITE.hex,
				opacity: '0.33'
			});
		*/
		g
			.child(SVG_NS, 'line')
			.attrs(SVG_NS, {
				x1: settings.area.left + 'px',
				y1: (stratArea.top + SURROUNDING_STRATUM_HEIGHT - 2) + 'px',
				x2: settings.area.width + 'px',
				y2: (stratArea.top + SURROUNDING_STRATUM_HEIGHT - 2) + 'px',
				stroke: Haeckel.BLACK.hex,
				'stroke-width': '2px',
				'stroke-opacity': '1',
				'stroke-linejoin': 'miter'
			});
		g
			.child(SVG_NS, 'line')
			.attrs(SVG_NS, {
				x1: settings.area.left + 'px',
				y1: (stratArea.top + SURROUNDING_STRATUM_HEIGHT + STRATUM_HEIGHT + 2) + 'px',
				x2: settings.area.width + 'px',
				y2: (stratArea.top + SURROUNDING_STRATUM_HEIGHT + STRATUM_HEIGHT + 2) + 'px',
				stroke: Haeckel.BLACK.hex,
				'stroke-width': '2px',
				'stroke-opacity': '1',
				'stroke-linejoin': 'miter'
			});
		/*
		settings.defs
			.child(SVG_NS, 'clipPath')
			.attr('id', 'strat-clip-path')
			.child(SVG_NS, 'rect')
			.attrs(SVG_NS, {
				x: stratArea.left + 'px',
				y: SURROUNDING_STRATUM_HEIGHT + 'px',
				width: stratArea.width + 'px',
				height: STRATUM_HEIGHT + 'px'
			});
		*/
		var stratDef = settings.defs
			.child(SVG_NS, 'g')
			.attr('id', 'strat-chart');
		stratUnit({
			area: Haeckel.rec.create(0, 0, stratArea.width, stratArea.height),
			areaPerOccurrence: 64,
			builder: stratDef,
			nomenclature: settings.nomenclature,
			occurrences: occurrences,
			spacing: STRAT_UNIT_SPACING,
			taxonNames: settings.taxa.map(taxon => taxon.name),
			time: Haeckel.rng.create(time.min - marginTime, time.max + marginTime)
		});
		g
			.child(SVG_NS, 'use')
			.attrs(SVG_NS, {
				x: stratArea.left + 'px',
				y: stratArea.top + 'px',
				width: stratArea.width + 'px',
				height: stratArea.height + 'px'//,
				//opacity: '0.2'
			})
			.attr('xlink:href', '#strat-chart');
		/*
		g
			.child(SVG_NS, 'use')
			.attrs(SVG_NS, {
				x: stratArea.left + 'px',
				y: stratArea.top + 'px',
				width: stratArea.width + 'px',
				height: stratArea.height + 'px',
				'clip-path': 'url(#strat-clip-path)'
			})
			.attr('xlink:href', '#strat-chart');
		*/
	})();

	// Stratum labels
	(() => {
		settings.builder
			.child(SVG_NS, 'text')
			.text(settings.timeUnitName.toUpperCase())
			.attrs(SVG_NS, TIME_LABEL_STYLE)
			.attrs(SVG_NS, {
				'text-anchor': 'middle',
				transform: 'translate(' + (TIME_LABEL_FONT_SIZE - 4) + ','
					+ (SURROUNDING_STRATUM_HEIGHT + (STRATUM_HEIGHT / 2)) + ')rotate(-90)'
			});
		/*
		if (nextStratum)
		{
			settings.builder
				.child(SVG_NS, 'text')
				.text(nextStratum.name.toUpperCase())
				.attrs(SVG_NS, SURROUNDING_STRATUM_LABEL_STYLE)
				.attrs(SVG_NS, {
					'text-anchor': 'start',
					x: '0px',
					y: (SURROUNDING_STRATUM_HEIGHT - 4) + 'px'
				});
		}
		if (prevStratum)
		{
			settings.builder
				.child(SVG_NS, 'text')
				.text(prevStratum.name.toUpperCase())
				.attrs(SVG_NS, SURROUNDING_STRATUM_LABEL_STYLE)
				.attrs(SVG_NS, {
					'text-anchor': 'start',
					x: '0px',
					y: (SURROUNDING_STRATUM_HEIGHT + STRATUM_HEIGHT + SURROUNDING_STRATUM_LABEL_SIZE) + 'px'
				});
		}
		*/
	})();

	// Taxon labels
	(() => {
		var g = settings.builder.child(SVG_NS, 'g');
		var y = SURROUNDING_STRATUM_HEIGHT * 2 + STRATUM_HEIGHT + SILHOUETTE_HEIGHT;
		for (var i = 0; i < numTaxa; ++i)
		{
			var taxon = settings.taxa[i];
			var label = taxon.label || taxon.name;
			var x = TIME_LABEL_FONT_SIZE + columnWidth * (i + 0.5);
			g
				.child(SVG_NS, 'text')
				.text(taxon.italics ? label : capitalize(label))
				.attrs(SVG_NS, TAXON_LABEL_STYLE)
				.attrs(SVG_NS, {
					'font-style': (taxon.italics ? 'italic' : 'normal'),
					'text-anchor': 'middle',
					x: x + 'px',
					y: y + 'px'
				});
		}
	})();

	// Specimen counts
	(() => {
		var g = settings.builder.child(SVG_NS, 'g');
		var y = SURROUNDING_STRATUM_HEIGHT * 2 + STRATUM_HEIGHT + SILHOUETTE_HEIGHT + TAXON_LABEL_FONT_SIZE;
		for (var i = 0; i < numTaxa; ++i)
		{
			var figureTaxon = settings.taxa[i];
			var taxon = settings.nomenclature.nameMap[figureTaxon.name];
			var taxonOccurences = <Haeckel.ExtSet<Haeckel.Occurrence>> Haeckel.chr.states(occurrences, taxon, Haeckel.OCCURRENCE_CHARACTER);
			var min = 0;
			var max = 0;
			Haeckel.ext.each(taxonOccurences, occurrence =>
			{
				if (Haeckel.rng.overlap(occurrence.time, time))
				{
					if (Haeckel.rng.includes(time, occurrence.time))
					{
						min += occurrence.count.min;
						max += occurrence.count.max;
					}
					else
					{
						var ratio = Haeckel.rng.intersect(occurrence.time, time).size / occurrence.time.size;
						min += ratio * occurrence.count.min;
						max += ratio * occurrence.count.max;
					}
				}
			});
			var label = getCountLabel(Haeckel.rng.create(min, max));
			var x = TIME_LABEL_FONT_SIZE + columnWidth * (i + 0.5);
			g
				.child(SVG_NS, 'text')
				.text('(' + label + ')')
				.attrs(SVG_NS, TAXON_LABEL_STYLE)
				.attrs(SVG_NS, {
					'text-anchor': 'middle',
					x: x + 'px',
					y: y + 'px'
				});
		}
	})();

	// Taxon silhouettes
	(() => {
		var g = settings.builder.child(SVG_NS, 'g');
		var y = SURROUNDING_STRATUM_HEIGHT * 2 + STRATUM_HEIGHT;
		for (var i = 0; i < numTaxa; ++i)
		{
			var taxon = settings.taxa[i];
			g
				.child(Haeckel.SVG_NS, 'use')
				.attrs(Haeckel.SVG_NS, {
					x: (TIME_LABEL_FONT_SIZE + columnWidth * (i + 0.5) - SILHOUETTE_HEIGHT / 2)	 + 'px',
					y: y + 'px',
					width: SILHOUETTE_HEIGHT + 'px',
					height: SILHOUETTE_HEIGHT + 'px'
				})
				.attr('xlink:href', '#' + taxon.silhouette);
		}
	})();

	// Maps
	// :TODO:
}
