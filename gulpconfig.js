'use strict';

var src   = './src/',
    build = './build/';

var modRewrite  = require('connect-modrewrite');

module.exports = {
  clean: {
    src: [build+'**/*', '!'+build+'app/**']
  },

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  styles: {
    src: [
      './node_modules/semantic-ui-css/semantic.min.css',
      src + 'res/*.css'
    ],
    dest: build + 'css/',
    name: 'bundle.min.css',
    // cssnano compress
    // See: http://cssnano.co/optimisations/
    cssnano: {
      zindex: false
    }
  },

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  vendor: {
    src: [
      './node_modules/jquery/dist/jquery.min.js',
      './node_modules/semantic-ui-css/semantic.min.js',
      './node_modules/angular/angular.min.js',
      './node_modules/angular-route/angular-route.min.js',
      './node_modules/angular-dnd-module/dist/angular-dnd.min.js',
      './node_modules/semantic-ui-angular-jquery/angular-semantic-ui.min.js',
      './node_modules/angular-translate/dist/angular-translate.min.js',
    ],
    dest: build + 'js/',
    name: 'vendor.js'
  },

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  scripts: {
    src: [
      src + 'app/app.constants.js',
      src + 'app/app.module.js',
      src + 'app/**/**/*.module.js',
      src + 'app/**/**/*.service.js',
      src + 'app/**/**/*.component.js',
      src + 'app/modules/**/*.js',
      src + 'app/app.config.js',
      src + 'app/pages/**/*.js',
    ],
    dest: build + 'js/',
    name: 'bundle.js'
  },

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  templates: {
    src: [
      src + 'app/modules/**/*.html',
      src + 'app/pages/**/*.html'
    ],
    dest: build + 'templates/',

    // HTMLMinifier
    // See: https://github.com/kangax/html-minifier
    htmlmin: {
      collapseWhitespace: true
    }
  },

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  images: {
    src: [
      src + 'res/**/*.{png,jpg,gif,svg}',
      './node_modules/semantic-ui-css/themes/default/assets/images/*.*'
    ],
    dest: build + 'res/'
  },

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  copy: [
    // root dir
    {
      src: [
        src + '*.*',
        src + '.*',
      ],
      dest: build
    },
    {
      src: [
        src + 'data/*.*',
      ],
      dest: build + 'data/'
    },
    {
      src: [
        src + 'data/locales/*.json',
      ],
      dest: build + 'locales/'
    },
    // fonts
    {
      src: [
        src + 'fonts/**/*.{woff2,woff,ttf}',
        './node_modules/semantic-ui-css/themes/default/assets/fonts/*.{woff2,woff,ttf}',
      ],
      dest: build + 'res/fonts/'
    },
  ],

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  revision: {
    assets: {
      src: [
        build + 'css/*.min.css',
        build + 'js/*.min.js'
      ],
      base: build,
      dest: build,
      manifest: {path: 'rev-manifest.json'}
    },
    rename: {
      src: build + '/*.html',
      dest: build,
      manifestSrc: build + 'rev-manifest.json',
    }
  },

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  watch: {
    // BrowserSync. See more: https://www.browsersync.io/docs/options/
    browserSync: {
      // notify: true, // browser notification box (default: true)
      open: false, // open browser after start (default: true)
      // proxy: 'domain.ru' // wrap for real website (default: undefined)
      server: {
        baseDir: build,
        middleware: [
            modRewrite([
                '!\\.\\w+$ /index.html [L]'
            ])
        ]
      },
    },

    // Watch this directories
    src: {
      styles: [
        './node_modules/semantic-ui-css/semantic.min.css',
        src + 'res/*.css'
      ],
      scripts: [
        src + 'app/app.module.js',
        src + 'app/**/**/*.module.js',
        src + 'app/**/**/*.service.js',
        src + 'app/**/**/*.component.js',
        //src + 'app/app.config.js',
        src + 'app/modules/**/*.js',
        src + 'app/app.config.js',
        src + 'app/pages/**/*.js',
      ],
      templates: [
        src + 'app/modules/**/*.html',
        src + 'app/pages/**/*.html'
      ],
      images: src + [
        src + 'res/**/*.{png,jpg,gif,svg}',
        './node_modules/semantic-ui-css/themes/default/assets/images/*.*'
      ],
      copy: [
        src + 'index.html',
        src + '*.*',
        src + '.*',
        src + 'data/*.*',
        src + 'data/locales/*.json',
      ],
    }
  }
};
