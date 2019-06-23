'use strict';

angular.module('menu', [
  'pascalprecht.translate',
]);


angular.
module('menu').
service('MenuService', [
  function() {
    this.title = 'APP_NAME';
    this.globalPrefix = globalPrefix;
    this.activeLink = '';

    this.menu  = [
      { title: 'VIEW', link: 'view', icon: 'th' },
      { title: 'EDIT', link: 'edit', icon: 'edit' },
      { title: 'ABOUT', link: 'about', icon: 'info circle' },
    ];
    this.rightMenu  = [
      //{ title: 'GitHub', link: '#', icon:'github' },
      { title: '', link: 'changelog', icon: 'newspaper' },
      { title: '', link: 'https://github.com/leamare/dota2-hero-board-tool', icon: 'github' },
      { title: 'Spectral', link: 'https://spectral.gg/' }
    ];
  }
]);
