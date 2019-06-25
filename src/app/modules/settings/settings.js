'use strict';

angular.module('settings', [
  'pascalprecht.translate',
]);


angular.
module('settings').
component('viewSettings', {
  templateUrl: globalPrefix + 'templates/settings/settings-main.template.html?v=' + __buildId__,
  controller: ['$rootScope',
  function viewSettings($rootScope) {
    this.rscope = $rootScope;

    this.columnsValues = COLUMN_VALUES;

    this.setColumns = (id) => {
      $rootScope.columns = id;
      localStorage.settingsColumns = id;
    }
    if (!localStorage.settingsColumns)
      localStorage.settingsColumns = 'three';
    else
      this.setColumns( localStorage.settingsColumns );

    if (localStorage.settingsAutoSave === undefined) localStorage.settingsAutoSave = 'true';
    this.rscope.autoSave = localStorage.settingsAutoSave == 'true';
    $rootScope.$watch('autoSave', (newValue, oldValue) => {
      $('.settings .toggle.auto-save').checkbox('set ' + (newValue ? '' : 'un') + 'checked');
      localStorage.settingsAutoSave = newValue;
    });

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

    if (localStorage.settingsDarkenedBg === undefined) localStorage.settingsDarkenedBg = 'true';
    this.rscope.darkenedBg = localStorage.settingsDarkenedBg == 'true';
    $rootScope.$watch('darkenedBg', (newValue, oldValue) => {
      $('.settings .toggle.darkened-bg').checkbox('set ' + (newValue ? '' : 'un') + 'checked');
      localStorage.settingsDarkenedBg = newValue;
    });

    if (localStorage.settingsColorfulLabels === undefined) localStorage.settingsColorfulLabels = 'true';
    this.rscope.colorfulLabels = localStorage.settingsColorfulLabels == 'true';
    $rootScope.$watch('colorfulLabels', (newValue, oldValue) => {
      $('.settings .toggle.colorful-labels').checkbox('set ' + (newValue ? '' : 'un') + 'checked');
      localStorage.settingsColorfulLabels = newValue;
    });
  }
  ]
});
