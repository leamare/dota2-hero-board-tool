'use strict';

angular.module('editMode', [
  'heroesList',
  'cats',
  'semantic-ui-modal',
  'ngRoute',
  'layout',
  'settings',
  'menu',
  'pascalprecht.translate',
]);


angular.
module('editMode').
component('editMode', {
  templateUrl: globalPrefix + 'templates/edit-mode/edit-mode.template.html?v=' + __buildId__,
  controller: ['MenuService', '$rootScope',
  function editMode(menu, $rootScope) {
    menu.activeLink = 'edit';

    $('.ui.dimmer.modals.page').remove();
  }
  ]
});
