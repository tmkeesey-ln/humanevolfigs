'use strict';

module.exports = function(grunt)
{
  // Show elapsed time at the end
  require('time-grunt')(grunt);

  // Load all grunt tasks
  require('load-grunt-tasks')(grunt);
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-typescript');
  grunt.loadNpmTasks('grunt-svg2png');

  grunt.registerMultiTask('svg', 'Generates an SVG file for a figure.', function()
  {
    var done = this.async(),
      name = this.target;
    grunt.util.spawn({
      cmd: 'node',
      args: ['bower_components/haeckel/lib/haeckel.js', 'src/' + name + '.fig.js']
    }, function (error, result, code)
    {
      if (error)
      {
        grunt.log.error('Error #' + code);
        grunt.log.error(String(error));
        done(false);
      }
      else
      {
        try
        {
          grunt.file.write('bin/' + name + '.svg', result.stdout, {encoding: 'utf-8'});
        }
        catch (e)
        {
          grunt.log.error(String(e));
          done(false);
        }
        done(true);
      }
    });
  });

  grunt.registerMultiTask('figure', 'Compiles and renders a figure', function()
  {
    grunt.task.run('typescript:' + this.target);
    grunt.task.run('svg:' + this.target);
  });

  // Project configuration.
  grunt.initConfig(
  {
    clean:
    {
      lib: ['src/*.js']
    },
    typescript:
    {
      mtDNA:
      {
        src: [ 'src/haploMap.ts', 'src/mtDNA.fig.ts' ],
        dest: 'src/mtDNA.fig.js',
        options: 
        {
          target: 'es5',
          base_path: 'src',
          declaration: false,
          sourcemap: false,
          noImplicitAny: true
        }
      },
      YDNA:
      {
        src: [ 'src/haploMap.ts', 'src/YDNA.fig.ts' ],
        dest: 'src/YDNA.fig.js',
        options: 
        {
          target: 'es5',
          base_path: 'src',
          declaration: false,
          sourcemap: false,
          noImplicitAny: true
        }
      }
    },
    svg2png:
    {
      all:
      {
        files: [{ src: ['bin/*.svg'], dest: 'bin/' }]
      }
    },
    svg:
    {
      mtDNA: {},
      YDNA: {}
    },
    figure:
    {
      mtDNA: {},
      YDNA: {}
    }
    // :TODO: watch tasks
  });

  grunt.registerTask('vector', ['clean', 'figure']);

  grunt.registerTask('default', ['vector', 'svg2png']);
};
