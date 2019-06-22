'use strict';

angular.module('about', [
  'menu',
  'pascalprecht.translate',
]);


angular.
module('about').
component('about', {
  templateUrl: globalPrefix + 'templates/about/about.template.html?v=' + __BUILDID__,
  controller: ['MenuService', '$rootScope',
  function aboutController(menu, $rootScope) {
    menu.activeLink = 'about';

    this.html = "";

    menu.menu[2].label = undefined;

    $('.ui.dimmer.modals.page').remove();
  }
  ]
});
