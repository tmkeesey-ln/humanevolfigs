/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>

var FIGURE_HEIGHT = 6 * 300;

var FIGURE_WIDTH = 5 * 300;

var LEGEND_LABEL_FONT_SIZE = 32;

var LEGEND_LABEL_MARGIN = 12;

var LEGEND_MARGIN = 24;

var RIGHT_MARGIN = 360;

var SILHOUETTE_SCALE = 1;

var TAXON_LABEL_FONT_SIZE = 32;

var TAXON_LABEL_MARGIN = 32;

var TAXON_SIZE = 40;

var TRANSITION_LABEL_MARGIN = 6;

var TRANSITION_RADIUS = 10;

var OTUS = ['gibbons', 'orangutans', 'gorillas', 'chimpanzees', 'humans'];

interface PhyloTransition {
    arc: string[];
    transitions: string[];
}

var TRANSITIONS: PhyloTransition[] = [
    {
        arc: ['ancestral hominoid', 'gibbons'],
        transitions: [
            'Arms\nlengthen.'
        ]
    },
    {
        arc: ['ancestral hominoid', 'ancestral hominid'],
        transitions: [
            'Body size increases.',
            'Brain size increases.',
        //'spindle neurons become fully developed',
            'Canine teeth shrink in females.',
            //'apical lingual glands are acquired',
            //'terminal hairs become sparse'
        ]
    },
    {
        arc: ['ancestral hominid', 'orangutans'],
        transitions: [
            'Fist-walking\nis acquired.'
        ]
    },
    {
        arc: ['ancestral hominid', 'ancestral hominine'],
        transitions: [
        //'spindle neurons proliferate',
            'Supraorbital torus is acquired.',
            'Orientation of semicircular canals changes.'
            //'risorius muscle is acquired',
            //'superior thoracic artery is acquired',
            //'axillary organ replaces sternal glands',
            //'hands become more compact',
            //'branches from tibial nerve control small toes'
        ]
    },
    {
        arc: ['ancestral hominine', 'gorillas'],
        transitions: [
            'Columnar\nknuckle-\nwalking\nis acquired.'
        ]
    },
    {
        arc: ['ancestral hominine', 'chimpanzee–\nhuman\nancestor'],
        transitions: [
            'Canine teeth shrink slightly in males.',
            //'dorsalis pollicis artery is lost',
            //'terminal hairs become sparser',
            //'gangliform enlargement at junction of radial and\nposterior interosseous nerves is acquired'
        ]
    },
    {
        arc: ['chimpanzee–\nhuman\nancestor', 'chimpanzees'],
        transitions: [
            'Flexed\nknuckle-\nwalking\nis acquired.'
        ]
    },
    {
        arc: ['chimpanzee–\nhuman\nancestor', 'humans'],
        transitions: [
            'Supraorbital torus is lost.',
            'Foreheads become round.',
            'Chin is acquired.',
            'Rib cage acquires barrel shape.',
            'Brain size increases even more.',
        //'terminal hairs become even sparser',
            'Semicircular canal proportions\nchange.',
            null,
            'Shoulder orientation changes.',
            'Trapezoid acquires boot shape.',
            'Jaw acquires parabolic shape.',
            'Quadrupedality is lost.',
            'Parietal tuber is acquired.',
            'Opposable big toe is lost.',
        //'precision grip is acquired',
            'Arms shrink and legs lengthen.',
            'Canine teeth shrink (both sexes).',
            'Hip bones become short and wide.'
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

function capitalize(s: string) {
    return s.replace(/(^([a-zA-Z\p{M}]))|([ -][a-zA-Z\p{M}])/g, c => c.toUpperCase());
}

interface PhyloData {
    arcTransitionsMap: {
        [arcHash: string]: string[];
    };
    solver: Haeckel.PhyloSolver;
}

function getTransitionLines(transitions: string[]) {
    var length = 0;
    transitions.forEach(value => {
        if (value) {
            length += value.split('\n').length + 1;
        }
    });
    return length;
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

var lineHeight = 0;

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
    var linesAbove: {
        [taxonHash: string]: number;
    } = {};
    var taxaAbove: {
        [taxonHash: string]: number;
    } = {};
    var maxLinesAbove = 0;
    var maxTaxaAbove = 0;
    function getLinesAbove(unit: Haeckel.Taxic): number {
        var hash = Haeckel.hash(unit);
        var existing = linesAbove[hash];
        if (existing) {
            return existing;
        }
        var lines = 0;
        var imSucs = phyloData.solver.dagSolver.imSucs(unit);
        Haeckel.ext.each(imSucs, suc => {
            var arcHash = Haeckel.hash([unit, suc]);
            lines = Math.max(lines, getLinesAbove(suc) + getTransitionLines(phyloData.arcTransitionsMap[arcHash]));
        });
        maxLinesAbove = Math.max(maxLinesAbove, lines);
        return linesAbove[hash] = lines;
    }
    function getTaxaAbove(unit: Haeckel.Taxic): number {
        var hash = Haeckel.hash(unit);
        var existing = taxaAbove[hash];
        if (existing) {
            return existing;
        }
        var taxa = 0;
        var imSucs = phyloData.solver.dagSolver.imSucs(unit);
        Haeckel.ext.each(imSucs, suc => {
            taxa = Math.max(taxa, getTaxaAbove(suc) + 1);
        });
        maxTaxaAbove = Math.max(maxTaxaAbove, taxa);
        return taxaAbove[hash] = taxa;
    }
    function placeHTU(htu: Haeckel.Taxic): void {
        var hash = Haeckel.hash(htu);
        var x = getUnitX(htu);
        var lines = getLinesAbove(htu);
        var taxa = getTaxaAbove(htu);
        placements[hash] = Haeckel.pt.create(x, area.top + taxa * TAXON_SIZE + lines * lineHeight);
    }
    OTUS.forEach((value: string, index: number) => {
        var taxon = nomenclature.nameMap[value];
        var hash = Haeckel.hash(taxon);
        var x = area.left + area.width * (index + 0.5) / OTUS.length;
        xPositions[hash] = x;
        linesAbove[hash] = taxaAbove[hash] = 0;
        placements[hash] = Haeckel.pt.create(x, area.top);
    });
    var htus = Haeckel.tax.setDiff(phyloData.solver.universal, phyloData.solver.max(phyloData.solver.universal)).units;
    Haeckel.ext.each(htus, htu => {
        getLinesAbove(htu);
        getTaxaAbove(htu);
    });
    lineHeight = (area.height - TAXON_SIZE * (maxTaxaAbove + 1)) / maxLinesAbove;
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
            .text(capitalize(name));
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
                'font-size': (TAXON_LABEL_FONT_SIZE - 1) + 'px',
                'font-family': "Myriad Pro",
                'font-weight': 'bold',
            });
        for (var i = 0; i < n; ++i) {
            var span = label
                .child(Haeckel.SVG_NS, 'tspan')
                .text(capitalize(parts[i]));
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
            'fill': '#D0D0D0',
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
        var y = top + lineHeight;
        transitions.forEach((transition: string, index: number) => {
            if (!transition) {
                return;
            }
            var tg = arcG
                .child(Haeckel.SVG_NS, 'g')
                .attr('id', 'transition-' + arcID + '-' + index);
            drawTransitionSymbol(tg, target.x, y);
            var parts = transition.split('\n');
            var x = target.x + TRANSITION_LABEL_MARGIN + TRANSITION_RADIUS;
            var label = tg
                .child(Haeckel.SVG_NS, 'text')
                .attrs(Haeckel.SVG_NS, {
                    x: x + 'px',
                    y: (y + lineHeight / 4) + 'px',
                    'text-anchor': 'start',
                    'font-size': lineHeight + 'px',
                    'font-family': "Myriad Pro"
                });
            y += (parts.length + 1) * lineHeight;
            for (var i = 0; i < parts.length; ++i) {
                var span = label
                    .child(Haeckel.SVG_NS, 'tspan')
                    .text(parts[i]);
                if (i) {
                    span.attrs(Haeckel.SVG_NS, {
                        x: x + 'px',
                        dy: lineHeight + 'px'
                    });
                };
            }
        });
    });
}

function drawLegend(builder: Haeckel.ElementBuilder) {
    var rowSize = TAXON_SIZE * 1.5;
    var h = rowSize * 5;
    var w = h * 1.15;
    var area = Haeckel.rec.create(FIGURE_WIDTH - w - 2 - LEGEND_MARGIN, FIGURE_HEIGHT - h - 2 - LEGEND_MARGIN, w, h);
    var g = builder
        .child(Haeckel.SVG_NS, 'g')
        .attr('id', 'legend');
    g
        .child(Haeckel.SVG_NS, 'rect')
        .attrs(Haeckel.SVG_NS, {
            fill: Haeckel.BLACK.hex,
            stroke: 'none',
            x: (area.left - 2) + 'px',
            y: (area.top - 2) + 'px',
            width: (w + 4) + 'px',
            height: (h + 4) + 'px'
        });
    g
        .child(Haeckel.SVG_NS, 'rect')
        .attrs(Haeckel.SVG_NS, {
            fill: Haeckel.WHITE.hex,
            stroke: 'none',
            x: area.left + 'px',
            y: area.top + 'px',
            width: w + 'px',
            height: h + 'px'
        });
    g
        .child(Haeckel.SVG_NS, 'text')
        .attrs(Haeckel.SVG_NS, {
            x: area.centerX + 'px',
            y: (area.top + rowSize / 2 + LEGEND_LABEL_FONT_SIZE / 2) + 'px',
            'text-anchor': 'middle',
            'font-family': "Myriad Pro",
            'font-size': LEGEND_LABEL_FONT_SIZE + 'px',
            'font-weight': 'bold'
        })
        .text('LEGEND');
    drawOTUSymbol(g, area.left + rowSize / 2, area.top + rowSize * 1.5 - TAXON_SIZE / 2);
    g
        .child(Haeckel.SVG_NS, 'text')
        .attrs(Haeckel.SVG_NS, {
            x: (area.left + rowSize / 2 + TAXON_SIZE / 2 + LEGEND_LABEL_MARGIN) + 'px',
            y: (area.top + rowSize * 1.5 + LEGEND_LABEL_FONT_SIZE / 2) + 'px',
            'text-anchor': 'start',
            'font-size': LEGEND_LABEL_FONT_SIZE + 'px',
            'font-family': "Myriad Pro"
        })
        .text('group');
    drawTransitionSymbol(g, area.left + rowSize / 2, area.top + rowSize * 2.5 + TRANSITION_RADIUS / 2);
    g
        .child(Haeckel.SVG_NS, 'text')
        .attrs(Haeckel.SVG_NS, {
            x: (area.left + rowSize / 2 + TAXON_SIZE / 2 + LEGEND_LABEL_MARGIN) + 'px',
            y: (area.top + rowSize * 2.5 + LEGEND_LABEL_FONT_SIZE / 2) + 'px',
            'text-anchor': 'start',
            'font-size': LEGEND_LABEL_FONT_SIZE + 'px',
            'font-family': "Myriad Pro"
        })
        .text('inferred trait change');
    drawHTUSymbol(g, area.left + rowSize / 2, area.top + rowSize * 3.5);
    g
        .child(Haeckel.SVG_NS, 'text')
        .attrs(Haeckel.SVG_NS, {
            x: (area.left + rowSize / 2 + TAXON_SIZE / 2 + LEGEND_LABEL_MARGIN) + 'px',
            y: (area.top + rowSize * 3.5 + LEGEND_LABEL_FONT_SIZE / 2) + 'px',
            'text-anchor': 'start',
            'font-size': LEGEND_LABEL_FONT_SIZE + 'px',
            'font-family': "Myriad Pro"
        })
        .text('inferred ancestor');
    g
        .child(Haeckel.SVG_NS, 'line')
        .attrs(Haeckel.SVG_NS, {
            x1: (area.left + rowSize / 2) + 'px',
            x2: (area.left + rowSize / 2) + 'px',
            y1: (area.top + rowSize * 4.5 - TAXON_SIZE / 2) + 'px',
            y2: (area.top + rowSize * 4.5 + TAXON_SIZE / 2) + 'px',
            'stroke': Haeckel.BLACK.hex,
            'stroke-linecap': 'round',
            'stroke-dasharray': '2 4',
            'stroke-width': '2px'
        });
    g
        .child(Haeckel.SVG_NS, 'text')
        .attrs(Haeckel.SVG_NS, {
            x: (area.left + rowSize / 2 + TAXON_SIZE / 2 + LEGEND_LABEL_MARGIN) + 'px',
            y: (area.top + rowSize * 4.5 + LEGEND_LABEL_FONT_SIZE / 2) + 'px',
            'text-anchor': 'start',
            'font-size': LEGEND_LABEL_FONT_SIZE + 'px',
            'font-family': "Myriad Pro"
        })
        .text('inferred lineage');
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
            return builder;
        }
    };