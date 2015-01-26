/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>

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
	function snap(x: number)
	{
		return Math.round(x * 10) / 10;
	}

	settings.builder
		.child(Haeckel.SVG_NS, 'rect')
		.attrs(Haeckel.SVG_NS, {
			x: settings.area.left + 'px',
			y: settings.area.top + 'px',
			width: settings.area.width + 'px',
			height: settings.area.height + 'px',
			fill: Haeckel.WHITE.hex,
			stroke: Haeckel.BLACK.hex,
			'stroke-width': '1px',
			'stroke-linejoin': 'miter'
		});
	var spacing = isFinite(settings.spacing) ? settings.spacing : 10;
	var areaPerOccurrence = isFinite(settings.areaPerOccurrence) ? settings.areaPerOccurrence : 10;
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
		var left =  settings.area.left  + index       * columnWidth + spacing / 2;
		var right = settings.area.left + (index + 1) * columnWidth - spacing / 2;
		var center = (left + right) / 2;
		var occurrences = <Haeckel.ExtSet<Haeckel.Occurrence>> Haeckel.chr.states(settings.occurrences, taxon, Haeckel.OCCURRENCE_CHARACTER);
		var hasOccurrences = false;
		var moments = new Haeckel.ExtSetBuilder<number>();
		var occurrenceWidths: {
			time: Haeckel.Range;
			width: number;
		}[] = [];
		Haeckel.ext.each(occurrences, occurrence =>
		{
			taxonTimes.push(occurrence.time);
			var occTime = Haeckel.rng.intersect(occurrence.time, settings.time);
			if (!occTime.empty)
			{
				hasOccurrences = true;
				var ratio = occurrence.time.size === 0 ? 1 : occTime.size / occurrence.time.size;
				var count = occurrence.count.min * ratio;
				var topAllOcc = settings.area.bottom - (settings.area.height * (occurrence.time.max - settings.time.min) / timeSize);
				var bottomAllOcc = settings.area.bottom - (settings.area.height * (occurrence.time.min - settings.time.min) / timeSize);
				var width = Math.max(1, Math.min(columnWidth - spacing, areaPerOccurrence * count / Math.max(1, bottomAllOcc - topAllOcc)));
				moments.add(occTime.max);
				moments.add(occTime.mean);
				moments.add(occTime.min);
				occurrenceWidths.push({
					time: occurrence.time,
					width: width
				});
			}
		});
		if (hasOccurrences)
		{
			var points: {
				width: number;
				y: number;
			}[] = [];
			Haeckel.ext.list(moments.build()).sort().forEach(moment =>
			{
				var width = 0;
				var y = settings.area.bottom - (settings.area.height * (moment - settings.time.min) / timeSize);
				occurrenceWidths.forEach(ow =>
				{
					if (Haeckel.rng.contains(ow.time, moment))
					{
						width += ow.width;
					}
				});
				width = Math.min(width, columnWidth - spacing);
				points.push({ width: width, y: y });
			});
			points.sort((a: { y: number; }, b: { y: number; }) => b.y - a.y);
			var pathLeft = new Haeckel.PathBuilder();
			var pathRight = new Haeckel.PathBuilder();
			pathLeft.add(snap(center), snap(points[0].y));
			pathRight.add(snap(center), snap(points[0].y));
			var last: {
				width: number;
				y: number;
			} = {
				width: 0,
				y: points[0].y
			};
			points.forEach(point => {
				if (last.width < point.width)
				{
					pathLeft.add(snap(center - last.width / 2), snap(point.y));
					pathRight.add(snap(center + last.width / 2), snap(point.y));
				}
				else
				{
					pathLeft.add(snap(center - point.width / 2), snap(last.y));
					pathRight.add(snap(center + point.width / 2), snap(last.y));
				}
				pathLeft.add(snap(center - point.width / 2), snap(point.y));
				pathRight.add(snap(center + point.width / 2), snap(point.y));
				last = point;
			});
			pathLeft.add(snap(center), snap(last.y));
			pathRight.add(snap(center), snap(last.y));
			pathLeft.add(snap(center), snap(points[0].y));
			pathRight.add(snap(center), snap(points[0].y));
			settings.builder
				.child(Haeckel.SVG_NS, 'path')
				.attrs(Haeckel.SVG_NS,
				{
					d: pathLeft.build(),
					fill: Haeckel.BLACK.hex/*,
					stroke: Haeckel.BLACK.hex,
					"stroke-width": "1px",
					"stroke-linejoin": "round"*/
				});
			settings.builder
				.child(Haeckel.SVG_NS, 'path')
				.attrs(Haeckel.SVG_NS,
				{
					d: pathRight.build(),
					fill: Haeckel.BLACK.hex/*,
					stroke: Haeckel.BLACK.hex,
					"stroke-width": "1px",
					"stroke-linejoin": "round"*/
				});
			var taxonTime = Haeckel.rng.combine(taxonTimes);
			if (!taxonTime.empty)
			{
				var y1 = Math.max(settings.area.top, settings.area.bottom - (settings.area.height * (taxonTime.max - settings.time.min) / timeSize));
				var y2 = Math.min(settings.area.bottom, settings.area.bottom - (settings.area.height * (taxonTime.min - settings.time.min) / timeSize));
				settings.builder
					.child(Haeckel.SVG_NS, 'line')
					.attrs(Haeckel.SVG_NS,
					{
						x1: center + 'px',
						x2: center + 'px',
						y1: y1 + 'px',
						y2: y2 + 'px',
						stroke: Haeckel.BLACK.hex,
						"stroke-width": "0.25px",
						"stroke-linecap": "butt",
						"stroke-dasharray": "1 1"
					});
			}
			settings.builder
				.child(Haeckel.SVG_NS, 'text')
				.attrs(Haeckel.SVG_NS,
				{
					'text-anchor': 'middle',
					x: center + 'px',
					y: (settings.spacing + 10 * index)+ 'px',
					'font-size': '8px',
					"font-family": "Myriad Pro"
				})
				.text(name);
		}
	});
}
