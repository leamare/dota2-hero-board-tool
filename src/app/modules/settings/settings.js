'use strict';

angular.module('settings', [
  'pascalprecht.translate',
]);


angular.
module('settings').
component('viewSettings', {
  templateUrl: globalPrefix + 'templates/settings/settings-main.template.html',
  controller: ['$rootScope',
  function viewSettings($rootScope) {
    this.rscope = $rootScope;

    this.columnsValues = COLUMN_VALUES;

    this.setColumns = (id) => {
      $rootScope.columns = id;
      localStorage.settingsColumns = id;
    }
    if (localStorage.settingsColumns === undefined)
      localStorage.settingsColumns = 'three';
    else
      this.setColumns( localStorage.settingsColumns );

    this.rscope.forcedBig = localStorage.settingsForcedBig == 'true';

    $rootScope.$watch('forcedBig', (newValue, oldValue) => {
      $('.settings .toggle.forced-big').checkbox('set ' + (newValue ? '' : 'un') + 'checked');
      localStorage.settingsForcedBig = newValue;
      if(this.rscope.checkFirstCat !== undefined)
        this.rscope.checkFirstCat(newValue, oldValue);
    });

    this.rscope.centeredView = localStorage.settingsCenteredView == 'true';

    $rootScope.$watch('centeredView', (newValue, oldValue) => {
      $('.settings .toggle.centered-view').checkbox('set ' + (newValue ? '' : 'un') + 'checked');
      localStorage.settingsCenteredView = newValue;
    });
  }
  ]
});
