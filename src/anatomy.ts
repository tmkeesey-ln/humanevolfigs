/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>

module humanevolfigs.anatomy
{

	export interface CharacterEntry
	{
		behind?: boolean;
		coords: number[];
		sideSpecific?: boolean;
	}

	export interface ChartRawData
	{
		taxa: {
			[taxonName: string]: TaxonEntry;
		};
	}

	export interface TaxonEntry
	{
		axis: number;
		characters:
		{
			[characterCode: string]: CharacterEntry;
		};
	}

	interface ChartEntry
	{
		angle: number;
		characters:
		{
			[characterCode: string]: CharacterEntry;
		};
		radius: number;
		source: Haeckel.Point;
		target: Haeckel.Point;
	}

	interface ChartData
	{
		behind: ChartEntry[];
		front: ChartEntry[];
	}

	export class Chart implements Haeckel.Renderer
	{
		area: Haeckel.Rectangle;
		characterCodes: string[];
		collapsibleDistance:
		{
			behind: number;
			front: number;
		};
		defs: () => Haeckel.ElementBuilder;
		id: string;
		imageArea: Haeckel.Rectangle;
		imageID: string;
		imageSize: { width: number; height: number; };
		rawData: ChartRawData;
		taxonName: string;
		project(coords: number[]): number[]
		{
			var x = coords[0];
			var y = coords[1];
			x -= this.imageArea.x;
			y -= this.imageArea.y;
			x *= this.area.width / this.imageArea.width;
			y *= this.area.height / this.imageArea.height;
			x += this.area.x;
			y += this.area.y;
			return [x, y];
		}
		render(parent: Haeckel.ElementBuilder): Haeckel.ElementBuilder
		{
			var taxon = this.rawData.taxa[this.taxonName];
			var data: ChartData = {
				behind: [],
				front: []
			};
			var g = parent.child(Haeckel.SVG_NS, 'g');

			var collapse = (entries: ChartEntry[], distance: number) =>
			{
				function collapseClosest()
				{
					var closest = findClosest();
					if (!isNaN(closest.distance) && closest.distance <= distance)
					{
						entries.splice(entries.indexOf(closest.b), 1);
						closest.a.source = Haeckel.pt.create((closest.a.source.x + closest.b.source.x) / 2, (closest.a.source.y + closest.b.source.y) / 2);
						for (var code in closest.b.characters)
						{
							closest.a.characters[code] = closest.b.characters[code];
						}
						return true;
					}
					return false;
				}

				function findClosest(): { distance: number; a: ChartEntry; b: ChartEntry; }
				{
					var result: { distance: number; a: ChartEntry; b: ChartEntry; } = {
						distance: NaN,
						a: null, 
						b: null
					};
					for (var i = 0, n = entries.length; i < n - 1; ++i)
					{
						var a = entries[i];
						for (var j = i + 1; j < n; ++j)
						{
							var b = entries[j];
							var d = Haeckel.pt.distance(a.source, b.source);
							if (isNaN(result.distance) || result.distance > d)
							{
								result.distance = d;
								result.a = a;
								result.b = b;
							}
						}
					}
					return result;
				}

				while (collapseClosest())
				{
				}
			};

			var distributeSides = (entries: ChartEntry[]) =>
			{
				function isSideSpecific(entry: ChartEntry)
				{
					for (var code in entry.characters)
					{
						if (entry.characters[code].sideSpecific)
						{
							return true;
						}
					}
					return false;
				}

				function getCoords(entry: ChartEntry): number[]
				{
					for (var code in entry.characters)
					{
						return entry.characters[code].coords;
					}
					return [NaN, NaN];
				}

				var side = -1;
				entries.forEach((entry: ChartEntry) =>
				{
					if (!isSideSpecific(entry))
					{
						var coords = getCoords(entry);
						var distanceFromAxis = Math.abs(taxon.axis - coords[0]);
						coords[0] = taxon.axis + side * distanceFromAxis;
						coords = this.project(coords);
						entry.source = Haeckel.pt.create(coords[0], coords[1]);
						side = (side < 0) ? 1 : -1;
					}
				});
			}

			var populateData = () =>
			{
				this.characterCodes.forEach((code: string) =>
				{
					var characterEntry = taxon.characters[code];
					if (characterEntry)
					{
						var coords = this.project(characterEntry.coords);
						var source = Haeckel.pt.create(coords[0], coords[1]);
						if (Haeckel.rec.contains(this.area, source))
						{
							var entry: ChartEntry = {
								angle: NaN,
								characters: {},
								radius: NaN,
								source: source,
								target: null
							};
							entry.characters[code] = characterEntry;
							(characterEntry.behind ? data.behind : data.front).push(entry);
						}
					}
				});
			};

			var renderEntries = (entries: ChartEntry[], useRadii: boolean) =>
			{
				var group = g.child(Haeckel.SVG_NS, 'g');
				entries.forEach((entry: ChartEntry, index: number) =>
				{
					/*
					var quadrant = 2;
					if (entry.angle < Math.PI / 4 || entry.angle >= Math.PI * 7 / 4)
					{
						quadrant = 0;
					}
					else if (entry.angle < Math.PI * 3 / 4)
					{
						quadrant = 1;
					}
					else if (entry.angle < Math.PI * 5 / 4)
					{
						quadrant = 2;
					}
					var xOffset = (quadrant === 1 || quadrant === 3) ? 1 : 0;
					var yOffset = (quadrant === 0 || quadrant === 2) ? 1 : 0;
					*/
					var useFullCircle = useRadii && entry.radius > 2;

					if (useFullCircle)
					{
						group.child(Haeckel.SVG_NS, 'circle')
							.attrs(Haeckel.SVG_NS, {
								cx: entry.source.x + 'px',
								cy: entry.source.y + 'px',
								r: entry.radius + 'px',
								fill: 'none',
								stroke: Haeckel.BLACK.hex,
								'stroke-width': '2px'
							});

						this.defs().child(Haeckel.SVG_NS, 'clipPath')
							.attr(Haeckel.SVG_NS, 'id', this.id + '-line-mask-' + index)

							.child(Haeckel.SVG_NS, 'circle')
							.attrs(Haeckel.SVG_NS, {
								cx: entry.source.x + 'px',
								cy: entry.source.y + 'px',
								r: (entry.radius - 2) + 'px',
								fill: Haeckel.BLACK.hex,
								stroke: 'none'
							});
					}
					/*
					else if (useRadii)
					{
						group.child(Haeckel.SVG_NS, 'circle')
							.attrs(Haeckel.SVG_NS, {
								cx: entry.source.x + 'px',
								cy: entry.source.y + 'px',
								r: '2px',
								fill: Haeckel.BLACK.hex
							});
					}
					var line = group.child(Haeckel.SVG_NS, 'path')
						.attrs(Haeckel.SVG_NS, {
							d: 'M' + (entry.source.x + xOffset) + ' ' + (entry.source.y + yOffset)
								+ 'L' + (entry.target.x + xOffset) + ' ' + (entry.target.y + yOffset)
								+ 'L' + (entry.target.x - xOffset) + ' ' + (entry.target.y - yOffset)
								+ 'L' + (entry.source.x - xOffset) + ' ' + (entry.source.y - yOffset)
								+ 'Z',
							stroke: Haeckel.BLACK.hex,
							'stroke-width': '2px',
							fill: Haeckel.BLACK.hex
						});
					*/
					/*
					var cx = this.area.centerX + Math.cos(entry.angle) * this.area.width / 2;
					var cy = this.area.centerY + Math.sin(entry.angle) * this.area.height / 2;
					*/
					var line = group.child(Haeckel.SVG_NS, 'path')
						.attrs(Haeckel.SVG_NS, {
							d: 'M' + [entry.source.x, entry.source.y].join(' ')
								//+ 'Q' + [cx, cy, entry.target.x, entry.target.y].join(' '),
								+ 'L' + [entry.target.x, entry.target.y].join(' '),
							stroke: Haeckel.BLACK.hex,
							'stroke-width': '2px',
							'stroke-linecap': 'round',
							fill: 'none'
						});
					if (useFullCircle)
					{
						line.attr(Haeckel.SVG_NS, 'clip-path', 'url(#' + this.id + '-line-mask-' + index + ')');
					}
					// :TODO: label
				});
			}

			var renderImage = () =>
			{
				this.defs().child(Haeckel.SVG_NS, 'clipPath')
					.attr(Haeckel.SVG_NS, 'id', this.id + '-image-mask')

					.child(Haeckel.SVG_NS, 'rect')
					.attrs(Haeckel.SVG_NS, {
						x: this.area.x + 'px',
						y: this.area.y + 'px',
						width: this.area.width + 'px',
						height: this.area.height + 'px',
						fill: Haeckel.BLACK.hex,
						stroke: 'none'
					});
				var wFactor = this.area.width / this.imageArea.width;
				var hFactor = this.area.height / this.imageArea.height;
				var width = this.imageSize.width * wFactor;
				var height = this.imageSize.height * hFactor;
				var x = this.area.x - this.imageArea.x * wFactor;
				var y = this.area.y - this.imageArea.y * hFactor;
				g.child(Haeckel.SVG_NS, 'use')
					.attrs(Haeckel.SVG_NS, {
							//'clip-path': 'url(#' + this.id + '-image-mask)',
							x: x + 'px',
							y: y + 'px',
							width: width + 'px',
							height: height + 'px'
						})
					.attr('xlink:href', '#' + this.imageID);
			};

			var setRadii = (entries: ChartEntry[]) =>
			{
				entries.forEach((entry: ChartEntry) =>
				{
					var radius = 0;
					for (var code in entry.characters)
					{
						var coords = entry.characters[code].coords;
						radius = Math.max(radius, Haeckel.pt.distance(entry.source, Haeckel.pt.create(coords[0], coords[1])));
					}
					entry.radius = radius;
				});
			};

			var setTargets = (entries: ChartEntry[]) =>
			{
				var coords = this.project([ taxon.axis, this.imageArea.centerY ]);
				var center = Haeckel.pt.create(coords[0], coords[1]);
				var w2 = this.area.width / 2;
				var h2 = this.area.height / 2;
				var x = this.area.centerX;
				var y = this.area.centerY;
				entries.forEach((entry: ChartEntry) =>
				{
					entry.angle = Haeckel.pt.angle(center, entry.source);
					//entry.target = Haeckel.pt.create(x + Math.cos(entry.angle) * w2, y + Math.sin(entry.angle) * h2);
				});
				entries.sort((a: ChartEntry, b: ChartEntry) => a.angle - b.angle);
				var factor = Haeckel.TAU / entries.length;
				entries.forEach((entry: ChartEntry, index: number) =>
				{
					var angle = Haeckel.trg.normalize(index * factor);
					var cos = (Math.cos(angle) + Math.cos(entry.angle)) / 2;
					var sin = (Math.sin(angle) + Math.sin(entry.angle)) / 2;
					angle = Math.atan2(sin, cos);
					entry.target = Haeckel.pt.create(x + Math.cos(angle) * w2, y + Math.sin(angle) * h2);
				});
			};

			populateData();
			distributeSides(data.behind.concat(data.front));
			collapse(data.behind, this.collapsibleDistance.behind);
			collapse(data.front, this.collapsibleDistance.front);
			setRadii(data.front);
			setTargets(data.behind.concat(data.front));
			renderEntries(data.behind, false);
			renderImage();
			renderEntries(data.front, true);
			return parent;
		}
	}
}