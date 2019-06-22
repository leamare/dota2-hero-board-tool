'use strict';

angular.
module('layout').
component('layoutImportModal', {
  templateUrl: globalPrefix + 'templates/layout-loader/layout-import-modal.template.html?v=' + __BUILDID__,
  controller: ['LayoutService', '$rootScope', '$q', 
  function layoutImportModal(LayoutService, $scope, $q) {
    this.layoutsRewrite = false;
    this.saveAfterwards = true;
    this.LayoutService = LayoutService;
    
    
    this.readImport = () => {
      var file = $('.layout-file-input').prop('files')[0];
      if (!file) {
        return;
      }
      let reader = new FileReader();
      reader.onload = (e) => {
        this.LayoutService.loadLayouts(e.target.result, this.layoutsRewrite);
        if(this.layoutsRewrite)
          this.LayoutService.applyLayout(0);
        if(this.saveAfterwards)
          this.LayoutService.saveLayouts();
        $scope.$apply();
      };
      reader.readAsText(file);
    }
  }
  ]
});
