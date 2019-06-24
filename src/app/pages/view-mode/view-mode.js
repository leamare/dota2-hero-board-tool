'use strict';

angular.module('viewMode', [
  'cats',
  'semantic-ui-modal',
  'ngRoute',
  'layout',
  'settings',
  'menu',
  'ngRoute',
  'pascalprecht.translate',
]);


angular.
module('viewMode').
component('viewMode', {
  templateUrl: globalPrefix + 'templates/view-mode/view-mode.template.html?v=' + __buildId__,
  controller: ['MenuService', 'LayoutService', '$rootScope', '$location',
  function viewMode(menu, LayoutService, $rootScope, $location) {
    menu.activeLink = 'view';
    this.LayoutService = LayoutService;

    if (LayoutService.layouts.length < 2 && (!LayoutService.layouts[0].categories || !LayoutService.layouts[0].categories.length)) {
      $location.path( "/edit" );
    }

    this.showSidebar = () => {
      $('view-mode .ui.sidebar').sidebar('toggle');
    };

    $('.ui.dimmer.modals.page').remove();
  }
  ]
});
