/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>

var FIGURE_HEIGHT = 6 * 300;

var FIGURE_WIDTH = 5 * 300;

var RIGHT_MARGIN = 355;

var SILHOUETTE_SCALE = 1;

var TAXON_LABEL_FONT_SIZE = 32;

var TAXON_LABEL_MARGIN = TAXON_LABEL_FONT_SIZE / 2;

var TAXON_SIZE = 30;

var TRANSITION_LABEL_FONT_SIZE = 25;

var TRANSITION_LABEL_MARGIN = TRANSITION_LABEL_FONT_SIZE / 2;

var TRANSITION_RADIUS = 15;

var OTUS = ['gibbons', 'orangutans', 'gorillas', 'chimpanzees', 'humans'];

interface PhyloTransition {
    arc: string[];
    transitions: string[];
}

var TRANSITIONS: PhyloTransition[] = [
    {
        arc: ['ancestral hominoid', 'gibbons'],
        transitions: [
            'arms lengthen'
        ]
    },
    {
        arc: ['ancestral hominoid', 'ancestral hominid'],
        transitions: [
            'body size increases',
            'brain size increases',
            'spindle neurons become fully developed',
            'canines shrink in females',
            'apical lingual glands are acquired',
            'terminal hairs become sparse'
        ]
    },
    {
        arc: ['ancestral hominid', 'orangutans'],
        transitions: [
            'fist-walking\nis acquired'
        ]
    },
    {
        arc: ['ancestral hominid', 'ancestral hominine'],
        transitions: [
            'spindle neurons proliferate',
            'supraorbital torus is acquired',
            'orientation of semicircular canals changes',
            'risorius muscle is acquired',
            'superior thoracic artery is acquired',
            'axillary organ replaces sternal glands',
            'hands become more compact',
            'branches from tibial nerve control small toes'
        ]
    },
    {
        arc: ['ancestral hominine', 'gorillas'],
        transitions: [
            'columnar\nknuckle-walking\nis acquired'
        ]
    },
    {
        arc: ['ancestral hominine', 'chimpanzee–\nhuman\nancestor'],
        transitions: [
            'canines shrink slightly in males',
            'dorsalis pollicis artery is lost',
            'terminal hairs become sparser',
            'gangliform enlargement at junction of radial and\nposterior interosseous nerves is acquired'
        ]
    },
    {
        arc: ['chimpanzee–\nhuman\nancestor', 'chimpanzees'],
        transitions: [
            'flexed knuckle-\nwalking\nis acquired'
        ]
    },
    {
        arc: ['chimpanzee–\nhuman\nancestor', 'humans'],
        transitions: [
            'supraorbital torus is lost',
            'foreheads become round*',
            'chin is acquired',
            'rib cage acquires barrel shape',
            'brain size increases even more',
            'terminal hairs become even sparser',
            'proportions of semicircular canals change',
            'bar–glenoid angle becomes over 135°*',
            'trapezoid bone acquires boot shape',
            'jaw acquires parabolic shape',
            'quadrupedality is lost*',
            'parietal tuber is acquired',
            'opposable big toe is lost',
            'precision grip is acquired',
            'arms shrink and legs lengthen',
            'canines shrink to same size in both sexes',
            'hip bones become short and wide'
        ]
    }
];

var SILHOUETTE_MAP: {
    [taxon: string]: string;
} = {
        'chimpanzees': 'assets/silhouettes/Pan troglodytes (bipedal).svg',
        'humans': 'assets/silhouettes/Homo sapiens sapiens (male, standing).svg',
        'gibbons': 'assets/silhouettes/Hylobates lar (standing).svg',
        'gorillas': 'assets/silhouettes/Gorilla gorilla (male, bipedal).svg',
        'orangutans': 'assets/silhouettes/Pongo pygmaeus (male, bipedal).svg'
    };

var SILHOUETTES = (() => {
    var silhouettes: string[] = [];
    for (var name in SILHOUETTE_MAP) {
        silhouettes.push(SILHOUETTE_MAP[name]);
    }
    return silhouettes;
})();

function buildNomenclature(): Haeckel.Nomenclature {
    var builder = new Haeckel.NomenclatureBuilder();
    TRANSITIONS.forEach(transition => {
        builder.addName(transition.arc[0]);
        builder.addName(transition.arc[1]);
    });
    return builder.build();
}

interface PhyloData {
    arcTransitionsMap: {
        [arcHash: string]: string[];
    };
    solver: Haeckel.PhyloSolver;
}

function buildPhyloData(nomenclature: Haeckel.Nomenclature): PhyloData {
    var phyloBuilder = new Haeckel.PhyloBuilder();
    var phyloData: PhyloData = {
        arcTransitionsMap: {},
        solver: null
    }
    TRANSITIONS.forEach(transition => {
        var prc = nomenclature.nameMap[transition.arc[0]];
        var suc = nomenclature.nameMap[transition.arc[1]];
        phyloBuilder.addPrecedence(prc, suc);
        phyloData.arcTransitionsMap[Haeckel.hash([prc, suc])] = transition.transitions;
    });
    phyloData.solver = new Haeckel.PhyloSolver(phyloBuilder.build());
    return phyloData;
}

interface Placements {
    [taxonHash: string]: Haeckel.Point;
}

function buildPlacements(phyloData: PhyloData, nomenclature: Haeckel.Nomenclature, area: Haeckel.Rectangle): Placements {
    var placements: Placements = {};
    var xPositions: {
        [taxonHash: string]: number;
    } = {};
    function getUnitX(unit: Haeckel.Taxic): number {
        var hash = Haeckel.hash(unit);
        var existing = xPositions[hash];
        if (existing) {
            return existing;
        }
        var x = 0;
        var imSucs = phyloData.solver.dagSolver.imSucs(unit);
        Haeckel.ext.each(imSucs, suc => x += getUnitX(suc));
        x /= imSucs.size;
        return xPositions[hash] = x;
    }
    var depths: {
        [taxonHash: string]: number;
    } = {};
    var maxDepth = 0;
    function getDepth(unit: Haeckel.Taxic): number {
        var hash = Haeckel.hash(unit);
        var existing = depths[hash];
        if (existing) {
            return existing;
        }
        var depth = 0;
        var imSucs = phyloData.solver.dagSolver.imSucs(unit);
        Haeckel.ext.each(imSucs, suc => {
            var arcHash = Haeckel.hash([unit, suc]);
            depth = Math.max(depth, getDepth(suc) + phyloData.arcTransitionsMap[arcHash].length);
        });
        maxDepth = Math.max(maxDepth, depth);
        return depths[hash] = depth;
    }
    function placeHTU(htu: Haeckel.Taxic): void {
        var hash = Haeckel.hash(htu);
        var x = getUnitX(htu);
        var depth = getDepth(htu);
        placements[hash] = Haeckel.pt.create(x, area.top + area.height * depth / maxDepth);
    }
    OTUS.forEach((value: string, index: number) => {
        var taxon = nomenclature.nameMap[value];
        var hash = Haeckel.hash(taxon);
        var x = area.left + area.width * (index + 0.5) / OTUS.length;
        xPositions[hash] = x;
        depths[hash] = 0;
        placements[hash] = Haeckel.pt.create(x, area.top);
    });
    var htus = Haeckel.tax.setDiff(phyloData.solver.universal, phyloData.solver.max(phyloData.solver.universal)).units;
    Haeckel.ext.each(htus, htu => placeHTU(htu));
    return placements;
}

function drawOTUSymbol(builder: Haeckel.ElementBuilder, center: number, top: number) {
    builder
        .child(Haeckel.SVG_NS, 'rect')
        .attrs(Haeckel.SVG_NS, {
            x: (center - TAXON_SIZE / 2) + 'px',
            y: top + 'px',
            width: TAXON_SIZE + 'px',
            height: TAXON_SIZE + 'px',
            fill: Haeckel.BLACK.hex
        });
}

function drawOTUs(builder: Haeckel.ElementBuilder, placements: Placements, phyloData: PhyloData, nomenclature: Haeckel.Nomenclature) {
    var g = builder
        .child(Haeckel.SVG_NS, 'g')
        .attr('id', 'operationalTaxonomicUnits');
    OTUS.forEach((name: string) => {
        var taxon = nomenclature.nameMap[name];
        var taxonHash = Haeckel.hash(taxon);
        var position = placements[taxonHash];
        var taxonG = g
            .child(Haeckel.SVG_NS, 'g')
            .attr('id', 'otu-' + name);
        drawOTUSymbol(taxonG, position.x, position.y);
        taxonG
            .child(Haeckel.SVG_NS, 'text')
            .attrs(Haeckel.SVG_NS, {
                x: position.x + 'px',
                y: (position.y - TAXON_LABEL_MARGIN) + 'px',
                'text-anchor': 'middle',
                'font-size': TAXON_LABEL_FONT_SIZE + 'px',
                'font-family': "Myriad Pro",
                'font-weight': 'bold'
            })
            .text(name);
        taxonG
            .child(Haeckel.SVG_NS, 'use')
            .attrs(Haeckel.SVG_NS, {
                x: (position.x - 100 * SILHOUETTE_SCALE) + 'px',
                y: '0',
                width: (200 * SILHOUETTE_SCALE) + 'px',
                height: (200 * SILHOUETTE_SCALE) + 'px'
            })
            .attr('xlink:href', '#' + SILHOUETTE_MAP[name]);
    });
}

function drawHTUSymbol(builder: Haeckel.ElementBuilder, x: number, y: number) {
    builder
        .child(Haeckel.SVG_NS, 'circle')
        .attrs(Haeckel.SVG_NS, {
            'cx': x + 'px',
            'cy': y + 'px',
            'r': (TAXON_SIZE / 2) + 'px',
            'fill': '#D0D0D0',
            'stroke': Haeckel.BLACK.hex,
            'stroke-dasharray': '4 2',
            'stroke-width': '2px',
            'stroke-linejoin': 'miter'
        });
}

function drawHTUs(builder: Haeckel.ElementBuilder, placements: Placements, phyloData: PhyloData, nomenclature: Haeckel.Nomenclature) {
    var g = builder
        .child(Haeckel.SVG_NS, 'g')
        .attr('id', 'hypotheticalTaxonomicUnits');
    var htus = Haeckel.ext.list(nomenclature.names).filter(name => OTUS.indexOf(name) < 0);
    htus.forEach(name => {
        var taxon = nomenclature.nameMap[name];
        var taxonHash = Haeckel.hash(taxon);
        var position = placements[taxonHash];
        var taxonG = g
            .child(Haeckel.SVG_NS, 'g')
            .attr('id', 'htu-' + name);
        drawHTUSymbol(taxonG, position.x, position.y);
        var parts = name.split('\n');
        var n = parts.length;
        var label = taxonG
            .child(Haeckel.SVG_NS, 'text')
            .attrs(Haeckel.SVG_NS, {
                x: position.x + 'px',
                y: (position.y - TAXON_LABEL_MARGIN - TAXON_SIZE / 2 - (n - 1) * TAXON_LABEL_FONT_SIZE) + 'px',
                'text-anchor': 'middle',
                'font-size': TAXON_LABEL_FONT_SIZE + 'px',
                'font-family': "Myriad Pro",
                'font-weight': 'bold',
            });
        for (var i = 0; i < n; ++i) {
            var span = label
                .child(Haeckel.SVG_NS, 'tspan')
                .text(parts[i]);
            if (i) {
                span.attrs(Haeckel.SVG_NS, {
                    x: position.x + 'px',
                    dy: TAXON_LABEL_FONT_SIZE + 'px'
                });
            };
        }
    });
}

function drawTransitionSymbol(builder: Haeckel.ElementBuilder, x: number, y: number) {
    var data = 'M' + [x - TRANSITION_RADIUS, y].join(' ')
        + 'L' + [x, y - TRANSITION_RADIUS].join(' ')
        + 'L' + [x + TRANSITION_RADIUS, y].join(' ')
        //+ 'L' + [x, y + TRANSITION_RADIUS].join(' ')
        + 'Z';
    builder
        .child(Haeckel.SVG_NS, 'path')
        .attrs(Haeckel.SVG_NS, {
            d: data,
            'fill': Haeckel.WHITE.hex,
            'stroke': Haeckel.BLACK.hex,
            'stroke-dasharray': '4 2',
            'stroke-width': '2px',
            'stroke-linejoin': 'miter'
        });
}

function drawArcs(builder: Haeckel.ElementBuilder, placements: Placements, phyloData: PhyloData, nomenclature: Haeckel.Nomenclature) {
    var g = builder
        .child(Haeckel.SVG_NS, 'g')
        .attr('id', 'arcs');

    Haeckel.ext.each(phyloData.solver.min(phyloData.solver.universal).units, taxon => {
        var placement = placements[Haeckel.hash(taxon)];
        g
            .child(Haeckel.SVG_NS, 'line')
            .attrs(Haeckel.SVG_NS, {
                x1: placement.x + 'px',
                x2: placement.x + 'px',
                y1: (placement.y + TAXON_SIZE / 2) + 'px',
                y2: FIGURE_HEIGHT + 'px',
                'stroke': Haeckel.BLACK.hex,
                'stroke-linecap': 'round',
                'stroke-dasharray': '2 4',
                'stroke-width': '2px'
            });
    });

    Haeckel.ext.each(phyloData.solver.graph.arcs, arc => {
        var hash = Haeckel.hash(arc);
        var arcID = Haeckel.ext.singleMember(Haeckel.nom.forTaxon(nomenclature, arc[0])) + '-' + Haeckel.ext.singleMember(Haeckel.nom.forTaxon(nomenclature, arc[1]));
        var arcG = g
            .child(Haeckel.SVG_NS, 'g')
            .attr('id', 'arc-' + arcID);
        var source = placements[Haeckel.hash(arc[0])];
        var target = placements[Haeckel.hash(arc[1])];
        var data = 'M' + [source.x + (target.x < source.x ? -1 : 1) * TAXON_SIZE / 2, source.y].join(' ');
        data += 'H' + (target.x + (target.x > source.x ? -1 : 1) * TAXON_SIZE);
        data += 'Q' + [target.x, source.y, target.x, source.y - TAXON_SIZE].join(' ');
        data += 'V' + (target.y + TAXON_SIZE / 2);
        arcG
            .child(Haeckel.SVG_NS, 'path')
            .attrs(Haeckel.SVG_NS, {
                d: data,
                fill: 'none',
                'stroke': Haeckel.BLACK.hex,
                'stroke-linecap': 'round',
                'stroke-dasharray': '2 4',
                'stroke-width': '2px'
            });
        var transitions = phyloData.arcTransitionsMap[hash];
        var top = target.y + TAXON_SIZE;
        var bottom = source.y - TAXON_SIZE / 2;
        var n = transitions.length;
        transitions.forEach((transition: string, index: number) => {
            var tg = arcG
                .child(Haeckel.SVG_NS, 'g')
                .attr('id', 'transition-' + arcID + '-' + index);
            var y = top + (index + 0.5) * (bottom - top) / n;
            drawTransitionSymbol(tg, target.x, y);
            var parts = transition.split('\n');
            var x = target.x + TRANSITION_LABEL_MARGIN + TRANSITION_RADIUS;
            var label = tg
                .child(Haeckel.SVG_NS, 'text')
                .attrs(Haeckel.SVG_NS, {
                    x: x + 'px',
                    y: y + 'px',
                    'text-anchor': 'start',
                    'font-size': TRANSITION_LABEL_FONT_SIZE + 'px',
                    'font-family': "Myriad Pro"
                });
            for (var i = 0; i < parts.length; ++i) {
                var span = label
                    .child(Haeckel.SVG_NS, 'tspan')
                    .text(parts[i]);
                if (i) {
                    span.attrs(Haeckel.SVG_NS, {
                        x: x + 'px',
                        dy: TRANSITION_LABEL_FONT_SIZE + 'px'
                    });
                };
            }
        });
    });
}

function drawLegend(builder: Haeckel.ElementBuilder) {

}

var FIGURE_TO_RENDER: Haeckel.Figure =
    {
        height: FIGURE_HEIGHT,
        width: FIGURE_WIDTH,

        assets: {
            png: [],
            svg: SILHOUETTES
        },

        sources: [
        ],

        render: (builder: Haeckel.ElementBuilder, sources: Haeckel.DataSources, defs: () => Haeckel.ElementBuilder, pngAssets: Haeckel.PNGAssets) => {
            var cladogramArea = Haeckel.rec.createFromCoords(
                0,
                200 * SILHOUETTE_SCALE + TAXON_LABEL_FONT_SIZE + TAXON_LABEL_MARGIN,
                FIGURE_WIDTH - RIGHT_MARGIN,
                FIGURE_HEIGHT - TAXON_SIZE / 2 - TAXON_LABEL_FONT_SIZE - TAXON_LABEL_MARGIN);
            var nomenclature = buildNomenclature();
            var phyloData = buildPhyloData(nomenclature);
            var placements = buildPlacements(phyloData, nomenclature, cladogramArea);
            builder
                .child(Haeckel.SVG_NS, 'rect')
                .attrs(Haeckel.SVG_NS, {
                    id: 'background',
                    fill: Haeckel.WHITE.hex,
                    x: '0',
                    y: '0',
                    width: FIGURE_WIDTH + 'px',
                    height: FIGURE_HEIGHT + 'px'
                });
            drawOTUs(builder, placements, phyloData, nomenclature);
            drawHTUs(builder, placements, phyloData, nomenclature);
            drawArcs(builder, placements, phyloData, nomenclature);
            drawLegend(builder);
            builder
                .child(Haeckel.SVG_NS, 'text')
                .attrs({
                    x: (FIGURE_WIDTH - TRANSITION_LABEL_MARGIN) + 'px',
                    y: (FIGURE_HEIGHT - TRANSITION_LABEL_MARGIN) + 'px',
                    'text-anchor': 'end',
                    'font-size': TRANSITION_LABEL_FONT_SIZE + 'px',
                    'font-family': "Myriad Pro"
                })
                .text('* in adults');
            return builder;
        }
    };