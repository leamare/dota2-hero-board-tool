'use strict';

function layoutsManager(LayoutService, $rootScope, $translate, $routeParams, $location) {
  let component = $location.path().indexOf('edit') > -1 ? 'edit' : 'view';
  this.LayoutService = LayoutService;
  this.rscope = $rootScope;

  this.applied = +$routeParams.layout || LayoutService.searchId( LayoutService.loadedLayout ) || 0;

  this.save = () => {
    LayoutService.rewriteLayout();
    LayoutService.saveLayouts();
    this.apply();
  };

  this.rscope.$watch('checkFirstCat', (newValue) => {
    this.checkFirstCat = newValue;
  });

  this.apply = (id, silent) => {
    if (!silent && id !== undefined && this.applied !== null && this.applied != id) {
      let target = LayoutService.wrapCurrentLayout();
      let target_hash = LayoutService.getExportString(target).hashCode();
      if (target_hash !== this.applied_hash && !confirm($translate.instant('PROMPT_UNSAVED')))
        return false;
    }

    if (id === undefined) {
      id == LayoutService.searchId( LayoutService.loadedLayout );
    } else if (id > 0) {
      $location.path(`/${component}-${id}`);
    } else {
      $location.path(`/${component}`);
    }

    LayoutService.applyLayout(id)
      .then((layout) => {
        this.applied = id;
        this.applied_hash = LayoutService.getExportString(layout).hashCode();
      });
  };

  this.remove = (id) => {
    if (!confirm($translate.instant('PROMPT_UNSAFE')))
      return false;
    let layout = LayoutService.getLayoutByIndex(id);
    LayoutService.removeLayout(id);
    if(layout.active)
      this.apply(0);
    LayoutService.saveLayouts();
  };

  this.saveAsNew = () => {
    let id = LayoutService.newLayout( LayoutService.wrapCurrentLayout() );
    LayoutService.saveLayouts();
    this.apply(id, true);
  };

  this.clearBoard = () => {
    LayoutService.clearCurrent();
  };

  this.export = (e) => {
    let file = LayoutService.getExportFile();
    e.target.href = URL.createObjectURL(file);
    window.open(URL.createObjectURL(file));
  };

  this.exportThis = (layout, e) => {
    let file = LayoutService.getExportFile(layout);
    e.target.href = URL.createObjectURL(file);
    window.open(URL.createObjectURL(file));
  };

  this.exportLink = () => {
    let target = LayoutService.wrapCurrentLayout();
    target.active = undefined;
    target = Base64Encode( LayoutService.getExportString(target) );
    prompt('Export Link', `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':'+window.location.port : ''}${globalPrefix}import?l=${target}`)
  };

  this.apply(this.applied, true);
}

angular.
module('layout').
component('layoutsManager', {
  templateUrl: globalPrefix + 'templates/layout-loader/layouts.template.html',
  controller: ['LayoutService', '$rootScope', '$translate', '$routeParams', '$location',
    layoutsManager
  ]
});


angular.
module('layout').
component('layoutsView', {
  templateUrl: globalPrefix + 'templates/layout-loader/layouts-view.template.html',
  controller: ['LayoutService', '$rootScope', '$translate', '$routeParams', '$location',
    layoutsManager
  ]
});
