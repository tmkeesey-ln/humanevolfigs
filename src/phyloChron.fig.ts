/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>
/// <reference path="morphChron.ts"/>
/// <reference path="mtChron.ts"/>

var XLINK_NS = "http://www.w3.org/1999/xlink";

var FIGURE_HEIGHT = 1100;

var FIGURE_WIDTH = 850;

var MARGIN = 25;

var TOP_MARGIN = 200;

var KEY_WIDTH = 600;

var KEY_HEIGHT = 600;

var DIVIDER_COLUMN = 16;

var FIGURE_TO_RENDER: Haeckel.Figure = 
{
	height: FIGURE_HEIGHT,
	width: FIGURE_WIDTH,

	sources: MT_SOURCES.concat(MORPH_SOURCES),

	render: (builder: Haeckel.ElementBuilder, sources: Haeckel.DataSources, defs: () => Haeckel.ElementBuilder, pngAssets: Haeckel.PNGAssets) =>
	{

		try
		{
			var AREA = Haeckel.rec.create(MARGIN, TOP_MARGIN, FIGURE_WIDTH - MARGIN * 2, FIGURE_HEIGHT - MARGIN - TOP_MARGIN);
			var FIGURE_AREA = Haeckel.rec.create(0, 0, FIGURE_WIDTH, FIGURE_HEIGHT);

			for (var prop in MT_NAME_ENTRIES)
			{
				var entry = MT_NAME_ENTRIES[prop];
				entry.column += DIVIDER_COLUMN;
			}

			var bgGroup: Haeckel.ElementBuilder;
			var timesGroup: Haeckel.ElementBuilder;
			var dividerX: number;
			var colTracker = { max: 1 };
			var morphTaxonEntries: { [taxonHash: string]: TaxonEntry; } = toTaxonEntries(sources.nomenclature, MORPH_NAME_ENTRIES, colTracker);
			var mtTaxonEntries: { [taxonHash: string]: TaxonEntry; } = toTaxonEntries(sources.nomenclature, MT_NAME_ENTRIES, colTracker);

			function legendArea()
			{
				var height = FIGURE_HEIGHT / 8;
				var width = height * 1.618034;
				height *= 5 / 4;
				return Haeckel.rec.create((FIGURE_WIDTH - width) / 2 - 50, FIGURE_HEIGHT - MARGIN * 2 - height, width, height);
			}

			function background()
			{
				bgGroup = builder.child(Haeckel.SVG_NS, 'g');
				bgGroup.child(Haeckel.SVG_NS, 'rect')
					.attrs(Haeckel.SVG_NS, {
						fill: Haeckel.WHITE.hex,
						stroke: 'none',
						x: '0px',
						y: '0px',
						width: FIGURE_WIDTH + 'px',
						height: FIGURE_HEIGHT + 'px'
					});
			}

			function divider()
			{
				bgGroup.child(Haeckel.SVG_NS, 'rect')
					.attrs(Haeckel.SVG_NS, {
						'x': '0px',
						'y': '0px',
						'width': dividerX + 'px',
						'height': FIGURE_HEIGHT + 'px',
						'fill': Haeckel.BLACK.hex,
						'opacity': '0.1',
						'stroke': 'none'
					});
				bgGroup.child(Haeckel.SVG_NS, 'line')
					.attrs(Haeckel.SVG_NS, {
						x1: dividerX + 'px',
						x2: dividerX + 'px',
						y1: '0px',
						y2: FIGURE_HEIGHT + 'px',
						'opacity': '0.25',
						'stroke': Haeckel.BLACK.hex,
						'stroke-linecap': 'square',
						'stroke-width': '2px'
					});
			}

			function sectionTitles()
			{
				var STYLE: { [name: string]: string; } = {
					'text-anchor': 'middle',
					'font-size': '20px',
					'font-weight': 'bolder',
					'font-family': 'Myriad Pro',
					y: MARGIN + 'px'
				};
				bgGroup.child(Haeckel.SVG_NS, 'text')
					.text('ANATOMY')
					.attr(Haeckel.SVG_NS, 'x', (dividerX / 2) + 'px')
					.attrs(Haeckel.SVG_NS, STYLE);
				bgGroup.child(Haeckel.SVG_NS, 'text')
					.text('MITOCHONDRIAL DNA')
					.attr(Haeckel.SVG_NS, 'x', ((dividerX + FIGURE_WIDTH) / 2) + 'px')
					.attrs(Haeckel.SVG_NS, STYLE);
			}
			
			background();
			timesGroup = builder.child(Haeckel.SVG_NS, 'g');
			mtChart(builder, sources, mtTaxonEntries, AREA, TIME, colTracker.max);
			morphChart(builder, sources, morphTaxonEntries, AREA, TIME, colTracker.max);
			dividerX = AREA.left + AREA.width * (DIVIDER_COLUMN + 0.5) / (colTracker.max + 2);
			times(timesGroup, Haeckel.ext.list(sources.sources['data/2014 - ICS.json'].strata), FIGURE_AREA, AREA, TIME, TIME_INCREMENT);
			divider();
			sectionTitles();
			legend(builder.child(Haeckel.SVG_NS, 'g'), legendArea(), true);
		}
		catch (e)
		{
			builder.child(Haeckel.SVG_NS, 'text')
				.attrs(Haeckel.SVG_NS, 
				{
					'font-size': '12px',
					fill: 'red',
					x: '10px',
					y: '10px'
				})
				.text("ERROR!\n" + String(e));
		}

		return builder;
	}
};