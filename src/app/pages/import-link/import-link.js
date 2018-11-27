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
    let layout = $routeParams.l || '';
    console.log($routeParams.l);
    layout = Base64Decode(layout);
    let loadId = 0;

    try {
      let parsedLayout = JSON.parse(layout);
      parsedLayout[0].active = false;
      let search = LayoutService.hashSearchId(parsedLayout[0]);
      console.log(search);
      if (search !== false && search !== undefined) {
        loadId = search;
      } else {
        loadId = LayoutService.loadLayouts(layout);
        LayoutService.saveLayouts();
      }
    } finally {
      console.log(loadId);
      $window.location.href = globalPrefix + 'view-' + loadId;
    }
  }
  ]
});
