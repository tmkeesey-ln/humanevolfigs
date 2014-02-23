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
      }
    }
    // :TODO: watch tasks
  });

  grunt.registerTask('default', ['clean', 'typescript']); // :TODO: make task to generate all figures
};
