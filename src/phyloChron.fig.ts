/// <reference path="../bower_components/haeckel/bin/haeckel.d.ts"/>

var XLINK_NS = "http://www.w3.org/1999/xlink";

var FIGURE_HEIGHT = 700;

var FIGURE_WIDTH = 950;

var FIGURE_TO_RENDER: Haeckel.Figure = 
{
	height: FIGURE_HEIGHT,
	width: FIGURE_WIDTH,

	sources: [
		'data/compiled/nomenclature.json',
		'data/2002 - Gibbs & al.json',
		'data/2003 - Mallegni & al.json',
		'data/2009 - Argue & al.json',
		'data/2010 - Berger & al.json',
		'data/2010 - Harrison.json',
		'data/2011 - Cruciani & al.json',
		'data/2012 - ICS.json',
		'data/2012 - Langergraber & al.json'
	],

	render: (builder: Haeckel.ElementBuilder, sources: Haeckel.DataSources, defs: () => Haeckel.ElementBuilder, pngAssets: Haeckel.PNGAssets) =>
	{
		// :TODO:
	}
};