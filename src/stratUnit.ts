/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>

interface Ellipse
{
	c: Haeckel.Point;
	r: Haeckel.Point;
}

function stratUnit(
	settings: {
		area: Haeckel.Rectangle;
		areaPerOccurrence?: number;
		builder: Haeckel.ElementBuilder;
		nomenclature: Haeckel.Nomenclature;
		occurrences: Haeckel.CharacterMatrix<Haeckel.Set>;
		spacing?: number;
		taxonNames: string[];
		time: Haeckel.Range;
	}
)
{
	function createEllipse(x: number, y: Haeckel.Range, area: number): Ellipse
	{
		var ry = y.size / 2;
		var rx = area / (Math.PI * ry);
		return {
			c: Haeckel.pt.create(x, y.mean),
			r: Haeckel.pt.create(rx, ry)
		};
	}

	function ellipseWidthAt(ellipse: Ellipse, y: number): number
	{
		if (ellipse && ellipse.c.y - ellipse.r.y < y && y < ellipse.c.y + ellipse.r.y)
		{
			var y2 = (ellipse.c.y  - y) * ellipse.r.x / ellipse.r.y + ellipse.c.y;
			return Math.sqrt(Math.pow(ellipse.r.x, 2) - Math.pow(ellipse.c.y - y2, 2));
		}
		return 0;
	}

	function snap(x: number)
	{
		return Math.round(x * 100) / 100;
	}

	var RESOLUTION = 1;

	var spacing = isFinite(settings.spacing) ? settings.spacing : 10;
	var areaPerOccurrence = isFinite(settings.areaPerOccurrence) ? settings.areaPerOccurrence : 32;
	var columnWidth = settings.area.width / settings.taxonNames.length;
	var timeSize = Math.max(1, settings.time.size);
	settings.taxonNames.forEach((name: string, index: number) =>
	{
		var taxonTimes: Haeckel.Range[] = [];
		var taxon = settings.nomenclature.nameMap[name];
		if (!taxon)
		{
			throw new Error("No taxon named \"" + name + "\".");
		}
		var left =  settings.area.left +  index      * columnWidth + spacing / 2;
		var right = settings.area.left + (index + 1) * columnWidth - spacing / 2;
		var center = (left + right) / 2;
		var occurrences = <Haeckel.ExtSet<Haeckel.Occurrence>> Haeckel.chr.states(settings.occurrences, taxon, Haeckel.OCCURRENCE_CHARACTER);
		var ellipses: Ellipse[] = [];
		Haeckel.ext.each(occurrences, occurrence =>
		{
			taxonTimes.push(occurrence.time);
			var yRange = Haeckel.rng.add(Haeckel.rng.multiply(Haeckel.rng.add(occurrence.time, -settings.time.max), -settings.area.height / settings.time.size), settings.area.top);
			if (yRange.size < 2 * RESOLUTION)
			{
				yRange = Haeckel.rng.create(yRange.mean - RESOLUTION, yRange.mean + RESOLUTION);
			}
			ellipses.push(createEllipse(center, yRange, occurrence.count.min * areaPerOccurrence));
		});
		if (ellipses.length)
		{
			var taxonTime = Haeckel.rng.combine(taxonTimes);
			var y1 = Math.max(settings.area.top, settings.area.bottom - (settings.area.height * (taxonTime.max - settings.time.min) / timeSize));
			var y2 = Math.min(settings.area.bottom, settings.area.bottom - (settings.area.height * (taxonTime.min - settings.time.min) / timeSize));
			var bridges: {
				bottom?: number;
				top: number;
			}[] = [{ top: y1 }];
			var pathLeft = new Haeckel.PathBuilder();
			var pathRight = new Haeckel.PathBuilder();
			var paths: string[] = [];
			var inEllipse = false;
			var inThickEllipse = false;
			var bridgeValid = false;
			for (var y = settings.area.top; y <= settings.area.bottom; y += RESOLUTION)
			{
				var width = 0;
				ellipses.forEach(ellipse => width += ellipseWidthAt(ellipse, y));
				if (width < 0.5)
				{
					if (inThickEllipse)
					{
						bridges.unshift({top: y});
						inThickEllipse = bridgeValid = false;
					}
				}
				else if (!inThickEllipse)
				{
					if (bridgeValid)
					{
						bridges[0].bottom = y;
					}
					else
					{
						bridges.shift();
					}
					inThickEllipse = true;
				}
				if (Haeckel.precisionEqual(width, 0))
				{
					if (!inThickEllipse && y > y1 && y < y2)
					{
						bridgeValid = true;
					}
					if (inEllipse)
					{
						pathLeft.add(snap(center), y - RESOLUTION);
						pathRight.add(snap(center), y - RESOLUTION);
						paths.push(pathLeft.build());
						paths.push(pathRight.build());
						pathLeft.reset();
						pathRight.reset();
						inEllipse = false;;
					}
				}
				else
				{
					if (!inEllipse)
					{
						pathLeft.add(snap(center), y);
						pathRight.add(snap(center), y);
						inEllipse = true;
					}
					pathLeft.add(snap(Math.max(left, center - width)), y);
					pathRight.add(snap(Math.min(right, center + width)), y);
				}
			}
			if (inEllipse)
			{
				pathLeft.add(snap(center), settings.area.bottom);
				pathRight.add(snap(center), settings.area.bottom);
				paths.push(pathLeft.build());
				paths.push(pathRight.build());
			}
			if (!inThickEllipse && bridgeValid && !Haeckel.precisionEqual(bridges[0].top, y1) && bridges[0].top < y2 - RESOLUTION)
			{
				bridges[0].bottom = y2;
			}
			pathLeft = pathRight = null;
			paths.forEach(path =>
			{
				settings.builder
					.child(Haeckel.SVG_NS, 'path')
					.attrs(Haeckel.SVG_NS,
					{
						d: path,
						fill: Haeckel.BLACK.hex
					});
			});
			bridges.forEach(bridge => {
				if (bridge.bottom !== undefined)
				{
					settings.builder
						.child(Haeckel.SVG_NS, 'line')
						.attrs(Haeckel.SVG_NS,
						{
							x1: center + 'px',
							x2: center + 'px',
							y1: bridge.top + 'px',
							y2: bridge.bottom + 'px',
							stroke: Haeckel.BLACK.hex,
							"stroke-width": "1px",
							"stroke-linecap": "butt",
							"stroke-dasharray": "1 2"
						});
				}
			});
		}
	});
}
