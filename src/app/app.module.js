'use strict';

$('head').append(`<base href="${globalPrefix}" />`);

angular.module('heroesGrid', [
  //'ngAnimate',
  'semantic-ui-modal',
  'pascalprecht.translate',
  'ngRoute',
  'menu',
  'changelog',
  'editMode',
  'viewMode',
  'about',
  'import'
]).filter('trustAsHtml', ['$sce', function($sce){
  return function(text) {
      console.log(text);
      return $sce.trustAsHtml(text);
  };
}]);
