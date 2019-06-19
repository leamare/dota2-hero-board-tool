'use strict';

function layoutsManager(LayoutService, $rootScope, $translate, $routeParams, $location) {
  let component = $location.path().indexOf('edit') > -1 ? 'edit' : 'view';
  this.LayoutService = LayoutService;
  this.rscope = $rootScope;

  this.applied = +$routeParams.layout || LayoutService.searchId( LayoutService.loadedLayout ) || 0;
  
  this.lastSave

  this.save = (dontApply) => {
    LayoutService.rewriteLayout();
    LayoutService.saveLayouts();
    if (!dontApply) {
      this.apply();
    
      $('body')
        .toast({
          displayTime: 'auto',
          showProgress: 'bottom',
          classProgress: 'blue',
          position: 'bottom right',
          class: 'inverted blue',
          displayTime: 500,
          message: $translate.instant('SAVED_SUCCESS'),
        })
      ;
    }
  };

  this.autosaver = (restartFlag) => {
    if (component === 'view') return;
    if (restartFlag && this.saveIntervalParams) {
      clearInterval(this.saveIntervalParams.id);
    } else {
      if (this.saveIntervalParams && this.saveIntervalParams.id) return;
    }
    this.saveIntervalParams = {
      createdFrom: $location.path()
    };
    this.saveIntervalParams.id = setInterval(() => {
      let currentLoc = $location.path(); 
      if (currentLoc !== this.saveIntervalParams.createdFrom) {
        clearInterval(this.saveIntervalParams.id);
      } else {
        this.save(true);
      }
    }, 2500);
  };

  this.rscope.$watch('checkFirstCat', (newValue) => {
    this.checkFirstCat = newValue;
  });

  this.apply = (id, silent) => {
    //this.save(true);
    this.autosaver(true);

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
    let export_link = `${window.location.protocol}//${window.location.hostname}` +
                    (window.location.port ? ':'+window.location.port : '') + globalPrefix +'import?l='+target;
    console.log(export_link)
    console.log(export_link.length);
    $('#sharelink').text(export_link)
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
