module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    coffee: {
      dist: {
        files: {
          'dist/uximage.js': 'src/uximage.coffee'
        }
      }
    },

    uglify: {
      options: {
        preserveComments: 'some',
        banner: '/* @preserve Minified on <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        sourceMap: true,
        compress: {
          drop_console: true
        }
      },
      dist: {
        files: {
          'dist/uximage.min.js': ['dist/uximage.js']
        }
      }
    },

    jshint: {
      files: ['dist/uximage.js'],
      options: {
        globals: {
          document: true
        }
      }
    },

    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    }
  });

  require('load-grunt-tasks')(grunt);

  grunt.registerTask('test', ['jshint']);

  grunt.registerTask('default', ['coffee', 'jshint', 'uglify']);

};