'use strict';

angular.
module('menu').
component('topmenu', {
  templateUrl: globalPrefix + 'templates/menu/menu.template.html',
  controller: ['MenuService', '$translate',
  function layoutsManager(MenuService, $translate) {
    this.MenuService = MenuService;
    this.locales = LOAD_LOCALES;
    this.lang = localStorage.lang || 'en';

    let version = currentVer;
    let storedVersion = localStorage.lastVersion === undefined ? [0,0,0] : localStorage.lastVersion.split(',');

    if (localStorage.layouts === undefined) {
      MenuService.menu[2].label = 'ABOUT_LABEL';
    } else if (version > storedVersion) {
      MenuService.rightMenu[0].label = '';
    }

    this.changeLanguage = (index) => {
      $translate.use(index);
      localStorage.lang = index;
      this.lang = index;
    };
  }]
});
