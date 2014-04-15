'use strict';

module.exports = function(grunt)
{
  var TYPESCRIPT_OPTIONS =
  {
    target: 'es5',
    base_path: 'src',
    declaration: false,
    sourcemap: false,
    noImplicitAny: true
  };

  // Show elapsed time at the end
  require('time-grunt')(grunt);

  // Load all grunt tasks
  require('load-grunt-tasks')(grunt);
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-typescript');
  grunt.loadNpmTasks('grunt-mkdir');

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
      craniodental:
      {
        src: [ 'src/distanceChart.ts',  'src/craniodental.fig.ts' ],
        dest: 'src/craniodental.fig.js',
        options: TYPESCRIPT_OPTIONS
      },
      craniodentalExtant:
      {
        src: [ 'src/distanceChart.ts',  'src/craniodentalExtant.fig.ts' ],
        dest: 'src/craniodentalExtant.fig.js',
        options: TYPESCRIPT_OPTIONS
      },
      extant:
      {
        src: [ 'src/distanceChart.ts',  'src/extant.fig.ts' ],
        dest: 'src/extant.fig.js',
        options: TYPESCRIPT_OPTIONS
      },
      geoChron:
      {
        src: [ 'src/geoChron.fig.ts' ],
        dest: 'src/geoChron.fig.js',
        options: TYPESCRIPT_OPTIONS
      },
      mtDNA:
      {
        src: [ 'src/haploMap.ts', 'src/mtDNA.fig.ts' ],
        dest: 'src/mtDNA.fig.js',
        options: TYPESCRIPT_OPTIONS
      },
      softTissue:
      {
        src: [ 'src/distanceChart.ts',  'src/softTissue.fig.ts' ],
        dest: 'src/softTissue.fig.js',
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
      craniodental: {},
      craniodentalExtant: {},
      extant: {},
      geoChron: {},
      mtDNA: {},
      softTissue: {},
      YDNA: {}
    },
    figure:
    {
      craniodental: {},
      craniodentalExtant: {},
      extant: {},
      geoChron: {},
      mtDNA: {},
      softTissue: {},
      YDNA: {}
    }
    // :TODO: watch tasks
  });

  grunt.registerTask('default', ['clean', 'mkdir', 'figure']);
};
