'use strict';

module.exports = function(grunt)
{
	var TYPESCRIPT_OPTIONS =
	{
		target: 'es5',
		basePath: 'src',
		declaration: false,
		sourceMap: false,
		noImplicitAny: true
	};

	// Show elapsed time at the end
	require('time-grunt')(grunt);

	// Load all grunt tasks
	require('load-grunt-tasks')(grunt);

	grunt.registerMultiTask('render', 'Renders SVG and PNG files for a figure.', function()
	{
		var done = this.async(),
			name = this.target,
			msg = 'Rendering "' + name + '"...';
		grunt.verbose.write(msg);
		grunt.util.spawn({
			cmd: 'phantomjs',
			args: ['bower_components/haeckel/bin/render.js', 'src/' + name + '.fig.js', 'bin/']
		}, function (error, result, code)
		{
			if (error)
			{
				grunt.verbose.or.write(msg).error().error('Error #' + code);
				grunt.fail.warn('Error rendering "' + name + '".');
				done(false);
			}
			else
			{
				grunt.verbose.ok();
				done(true);
			}
		});
	});

	grunt.registerMultiTask('figure', 'Compiles and renders a figure', function()
	{
		grunt.task.run('typescript:' + this.target);
		grunt.task.run('render:' + this.target);
	});

    grunt.registerMultiTask('analyze', 'Runs an analysis', function()
    {
        var done = this.async(),
            name = this.target,
            msg = 'Analyzing "' + name + '"...';
        grunt.verbose.write(msg);
        grunt.task.run('typescript:' + name);
        grunt.util.spawn({
            cmd: './analyze.sh',
            args: [ name ]
        }, function (error, result, code)
        {
            if (error)
            {
                grunt.verbose.or.write(msg).error().error('Error #' + code);
                grunt.fail.warn('Error analyzing "' + name + '".');
                done(false);
            }
            else
            {
                grunt.verbose.ok();
                done(true);
            }
        });
    });

	// Project configuration.
	grunt.initConfig(
	{
		clean:
		{
			bin: ['bin/'],
			lib: ['src/*.js']
		},
		typescript:
		{
			ageTaxa:
			{
				src: [ 'src/ageTaxa.sh.ts' ],
				dest: 'src/ageTaxa.sh.js',
				options: TYPESCRIPT_OPTIONS
			},
			ccChron:
			{
				src: [ 'src/ccChron.fig.ts' ],
				dest: 'src/ccChron.fig.js',
				options: TYPESCRIPT_OPTIONS
			},
			craniodental:
			{
				src: [ 'src/distanceChart.ts',	'src/craniodental.fig.ts' ],
				dest: 'src/craniodental.fig.js',
				options: TYPESCRIPT_OPTIONS
			},
			craniodentalChron:
			{
				src: [ 'src/craniodentalChron.fig.ts' ],
				dest: 'src/craniodentalChron.fig.js',
				options: TYPESCRIPT_OPTIONS
			},
			craniodentalExtant:
			{
				src: [ 'src/distanceChart.ts',	'src/craniodentalExtant.fig.ts' ],
				dest: 'src/craniodentalExtant.fig.js',
				options: TYPESCRIPT_OPTIONS
			},
			distanceDetails:
			{
				src: [ 'src/distanceDetails.sh.ts' ],
				dest: 'src/distanceDetails.sh.js',
				options: TYPESCRIPT_OPTIONS
			},
			extant:
			{
				src: [ 'src/distanceChart.ts',	'src/extant.fig.ts' ],
				dest: 'src/extant.fig.js',
				options: TYPESCRIPT_OPTIONS
			},
			geoChron:
			{
				src: [ 'src/geoChron.fig.ts' ],
				dest: 'src/geoChron.fig.js',
				options: TYPESCRIPT_OPTIONS
			},
			matrix:
			{
				src: [ 'src/matrix.fig.ts' ],
				dest: 'src/matrix.fig.js',
				options: TYPESCRIPT_OPTIONS
			},
			matrixExtant:
			{
				src: [ 'src/matrixExtant.fig.ts' ],
				dest: 'src/matrixExtant.fig.js',
				options: TYPESCRIPT_OPTIONS
			},
			mtDNA:
			{
				src: [ 'src/haploMap.ts', 'src/mtDNA.fig.ts' ],
				dest: 'src/mtDNA.fig.js',
				options: TYPESCRIPT_OPTIONS
			},
			phyloChron:
			{
				src: [ 'src/phyloChron.fig.ts' ],
				dest: 'src/phyloChron.fig.js',
				options: TYPESCRIPT_OPTIONS
			},
			phylogeny:
			{
				src: [ 'src/phylogeny.fig.ts' ],
				dest: 'src/phylogeny.fig.js',
				options: TYPESCRIPT_OPTIONS
			},
			softTissue:
			{
				src: [ 'src/distanceChart.ts',	'src/softTissue.fig.ts' ],
				dest: 'src/softTissue.fig.js',
				options: TYPESCRIPT_OPTIONS
			},
			synapomorphies:
			{
				src: [ 'src/synapomorphies.sh.ts' ],
				dest: 'src/synapomorphies.sh.js',
				options: TYPESCRIPT_OPTIONS
			},
			YDNA:
			{
				src: [ 'src/haploMap.ts', 'src/YDNA.fig.ts' ],
				dest: 'src/YDNA.fig.js',
				options: TYPESCRIPT_OPTIONS
			}
		},
		mkdir:
		{
			bin: {
				options:
				{
					create: ['bin']
				}
			}
		},
		render:
		{
			ccChron: {},
			craniodental: {},
			craniodentalChron: {},
			craniodentalExtant: {},
			extant: {},
			geoChron: {},
			matrix: {},
			matrixExtant: {},
			mtDNA: {},
			phyloChron: {},
			softTissue: {},
			YDNA: {}
		},
		figure:
		{
			ccChron: {},
			craniodental: {},
			craniodentalChron: {},
			craniodentalExtant: {},
			extant: {},
			geoChron: {},
			matrix: {},
			matrixExtant: {},
			mtDNA: {},
			phyloChron: {},
			softTissue: {},
			YDNA: {}
		},
        analyze:
        {
            ageTaxa: {},
            distanceDetails: {},
            phylogeny: {},
            synapomorphies: {}
        }
		// :TODO: watch tasks
	});

	grunt.registerTask('default', ['clean', 'mkdir', 'figure', 'analyze']);
};
