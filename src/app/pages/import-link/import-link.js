'use strict';

angular.module('import', [
  'layout'
]);


angular.
module('import').
component('importLink', {
  template: '',
  controller: ['LayoutService', '$routeParams', '$window',
  function importLinkController(LayoutService, $routeParams, $window) {
    const layout = $routeParams.layout || '';
    let loadId = 0;

    try {
      var parsedLayout = JSON.parse(layout);
      parsedLayout[0].active = false;
      var search = LayoutService.hashSearchId(parsedLayout[0]);
      if (search !== false) {
        loadId = search;
      } else {
        loadId = LayoutService.loadLayouts(layout);
        LayoutService.saveLayouts();
      }
    } finally {
      console.log(loadId);
      console.log(parsedLayout[0]);
      console.log(LayoutService.layouts[2]);
      $window.location.href = '/view-' + loadId;
    }
  }
  ]
});
