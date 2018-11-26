'use strict';

angular.module('changelog', [
  'menu'
]);


angular.
module('changelog').
component('changelog', {
  templateUrl: globalPrefix + 'templates/changelog/changelog.template.html',
  controller: ['MenuService', '$rootScope', 
  function changelogController(menu, $rootScope) {
    menu.activeLink = 'changelog';
    
    this.version = currentVer;
    
    let storedVersion = localStorage.lastVersion === undefined ? [0,0,0] : localStorage.lastVersion.split(',');
    
    //if version < then show modal, rewrite version in local storage
    
    if (this.version > storedVersion) {
      localStorage.lastVersion = this.version.join();
      menu.menu[3].label = undefined;
    }
    
    $('.ui.dimmer.modals.page').remove();
  }
  ]
});
