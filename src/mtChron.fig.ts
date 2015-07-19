/// <reference path="mtChron.ts"/>

var XLINK_NS = "http://www.w3.org/1999/xlink";

var FIGURE_HEIGHT = 800;

var FIGURE_WIDTH = 600;

var MARGIN = 25;

var TOP_MARGIN = 175;

var FIGURE_TO_RENDER: Haeckel.Figure = 
{
    height: FIGURE_HEIGHT,
    width: FIGURE_WIDTH,

    sources: SOURCES,

    render: (builder: Haeckel.ElementBuilder, sources: Haeckel.DataSources, defs: () => Haeckel.ElementBuilder, pngAssets: Haeckel.PNGAssets) =>
    {

        try
        {
            var AREA = Haeckel.rec.create(MARGIN, TOP_MARGIN, FIGURE_WIDTH - MARGIN * 2, FIGURE_HEIGHT - MARGIN - TOP_MARGIN);
            var FIGURE_AREA = Haeckel.rec.create(0, 0, FIGURE_WIDTH, FIGURE_HEIGHT);

            var timesGroup: Haeckel.ElementBuilder;
            var colTracker = { max: 1 };
            var taxonEntries: { [taxonHash: string]: TaxonEntry; } = toTaxonEntries(sources.nomenclature, MT_NAME_ENTRIES, colTracker);

            function legendArea()
            {
                var height = FIGURE_HEIGHT / 8;
                var width = height * 1.618034;
                height *= 5 / 4;
                return Haeckel.rec.create(AREA.right - width - 60, FIGURE_HEIGHT - MARGIN * 2 - height, width, height);
            }

            background(builder);
            timesGroup = builder.child(Haeckel.SVG_NS, 'g');
            mtChart(builder, sources, taxonEntries, AREA, TIME, colTracker.max);
            times(timesGroup, [], FIGURE_AREA, AREA, TIME, TIME_INCREMENT);
            legend(
                builder.child(Haeckel.SVG_NS, 'g'),
                legendArea(),
                {
                    specimens: true,
                    ancestors: true,
                    lineages: true
                });
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