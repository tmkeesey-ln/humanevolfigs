/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>

function haploMap(builder: Haeckel.ElementBuilder,
	defs: Haeckel.ElementBuilder,
	nomenclature: Haeckel.Nomenclature,
	phylogeny: Haeckel.DAGSolver<Haeckel.Taxic>,
	occurrences: Haeckel.CharacterMatrix<Haeckel.Set>,
	worldMapAssetID: string,
	mapArea: Haeckel.Rectangle,
	extensions: boolean = true)
{
	var MARGIN = 50;

	var OFFSET = -150;

	var XLINK_NS = "http://www.w3.org/1999/xlink";

	function wrapLongitude(lat: number): number
	{
		lat += OFFSET;
		while (lat <= -180)
		{
			lat += 360;
		}
		while (lat > 180)
		{
			lat -= 360;
		}
		return lat;
	}

	mapArea = Haeckel.rec.create(mapArea.x + MARGIN, mapArea.y + MARGIN, mapArea.width - MARGIN * 2, mapArea.height - MARGIN * 2);
	var mapAOffset = mapArea.width * OFFSET / 360,
		mapBOffset = mapArea.width * (OFFSET + 360) / 360;

	defs.child(Haeckel.SVG_NS, 'clipPath')
		.attr(Haeckel.SVG_NS, 'id', 'mask')
		.child(Haeckel.SVG_NS, 'rect')
		.attrs(Haeckel.SVG_NS, {
				x: mapArea.x + 'px',
				y: mapArea.y + 'px',
				width: mapArea.width + 'px',
				height: mapArea.height + 'px'
			})
	defs.child(Haeckel.SVG_NS, 'marker')
		.attrs(Haeckel.SVG_NS, {
				id: 'arrowhead-fill',
      			viewBox: "0 0 10 10",
      			refX: "5",
      			refY: "5",
      			markerUnits: "strokeWidth",
      			markerWidth: "5",
      			markerHeight: "4",
      			orient: "auto",
      			fill: '#ffffff'
  			})
		.child(Haeckel.SVG_NS, 'path')
			.attr(Haeckel.SVG_NS, 'd', "M0 0L10 5L0 10Z");
	defs.child(Haeckel.SVG_NS, 'marker')
		.attrs(Haeckel.SVG_NS, {
				id: 'arrowhead-stroke',
      			viewBox: "0 0 10 10",
      			refX: "4.5",
      			refY: "5",
      			markerUnits: "strokeWidth",
      			markerWidth: "4",
      			markerHeight: "3",
      			orient: "auto"
  			})
		.child(Haeckel.SVG_NS, 'path')
			.attr(Haeckel.SVG_NS, 'd', "M0 0L10 5L0 10Z");
	var main = builder
		.child(Haeckel.SVG_NS, 'g')
		.attr(Haeckel.SVG_NS, 'clip-path', 'url(#mask)');
	main
		.child(Haeckel.SVG_NS, 'rect')
		.attrs(Haeckel.SVG_NS, {
				x: mapArea.x + 'px',
				y: mapArea.y + 'px',
				width: mapArea.width + 'px',
				height: mapArea.height + 'px',
				fill: '#c0c0c0'
			});
	var maps = main
		.child(Haeckel.SVG_NS, 'g')
		.attr(Haeckel.SVG_NS, 'id', 'maps');
	maps.child(Haeckel.SVG_NS, 'use')
		.attrs(Haeckel.SVG_NS, {
				x: (mapArea.x + mapAOffset) + 'px',
				y: mapArea.y + 'px',
				width: mapArea.width + 'px',
				height: mapArea.height + 'px'
			})
		.attr('xlink:href', '#' + worldMapAssetID);
	maps.child(Haeckel.SVG_NS, 'use')
		.attrs(Haeckel.SVG_NS, {
				x: (mapArea.x + mapBOffset) + 'px',
				y: mapArea.y + 'px',
				width: mapArea.width + 'px',
				height: mapArea.height + 'px'
			})
		.attr('xlink:href', '#' + worldMapAssetID);

	var chartGroup = main
		.child(Haeckel.SVG_NS, 'g')
		.attr(Haeckel.SVG_NS, 'id', 'chart');
	var chart = new Haeckel.GeoPhyloChart(),
		root = Haeckel.ext.singleMember(phylogeny.sources),
		maxDistance = 1;
	Haeckel.ext.each(phylogeny.sinks, (sink: Haeckel.Taxic) =>
	{
		maxDistance = Math.max(maxDistance, phylogeny.distance(root, sink));
	});

	/*
	chart.lineAttrs = function(source: Haeckel.Taxic, target: Haeckel.Taxic, solver: Haeckel.DAGSolver<Haeckel.Taxic>): { [name: string]: any; }
	{
		function getRegions()
		{
			if (regionsChecked)
			{
				return regions;
			}
			regionsChecked = true;
			return regions = <Haeckel.ExtSet<Haeckel.GeoCoords[]>> Haeckel.chr.states(occurrences, target, Haeckel.GEO_CHARACTER);
		}

		var attrs: { [name: string]: string; } = {
				'fill': '#fffff',
				'stroke': '#000000',
				'stroke-linecap': 'round',
				'stroke-width': '2px'
			},
			regions: Haeckel.ExtSet<Haeckel.GeoCoords[]>,
			regionsChecked = false;
		if (source === target || (Haeckel.ext.contains(solver.sinks, target) && (getRegions() === null || getRegions().size === 1)))
		{
			attrs['marker-end'] = "url(#arrowhead)";
		}
		return attrs;
	};
	*/
	chart.extensions = extensions;
	chart.mapArea = mapArea;
	chart.nomenclature = nomenclature;
	chart.occurrenceMatrix = occurrences;
	chart.paddingY = 12;
	chart.projector = (coords: Haeckel.GeoCoords) => Haeckel.pt.create((wrapLongitude(coords.lon) + 180) / 360, (90 - coords.lat) / 180);
	chart.solver = phylogeny;
	chart.render(chartGroup);

	main.child(Haeckel.SVG_NS, 'rect')
		.attrs(Haeckel.SVG_NS, {
				x: mapArea.x + 'px',
				y: mapArea.y + 'px',
				width: mapArea.width + 'px',
				height: mapArea.height + 'px',
				fill: 'none',
				stroke: '#000000',
				opacity: '1',
				"stroke-width": '2px',
				"stroke-linejoin": 'miter'
			});
}