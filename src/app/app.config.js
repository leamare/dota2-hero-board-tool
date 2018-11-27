'use strict';

angular.
module('heroesGrid').
config(['$locationProvider', '$routeProvider', '$translateProvider', '$sceProvider',
       function config($locationProvider, $routeProvider, $translateProvider, $sceProvider) {
         $locationProvider.hashPrefix('');
         $locationProvider.html5Mode(true);
         $sceProvider.enabled(false);

         for (let index in LOAD_LOCALES) {
           $.getJSON(`locales/${LOAD_LOCALES[index]}.json`).done(
             (json) => $translateProvider.translations(LOAD_LOCALES[index], json)
           );
         }

         $translateProvider.fallbackLanguage('en')
          .preferredLanguage(localStorage.lang || 'en')
          .useSanitizeValueStrategy('sce');

         $routeProvider.
         when('/', {
           template: '<view-mode class="pushable"></view-mode>'
         }).
         when('/view', {
           template: '<view-mode class="pushable"></view-mode>'
         }).
         when('/view-:layout', {
           template: '<view-mode class="pushable"></view-mode>'
         }).
         when('/edit', {
           template: '<edit-mode></edit-mode>'
         }).
         when('/edit-:layout', {
           template: '<edit-mode></edit-mode>'
         }).
         when('/import', {
           template: '<import-link></import-link>'
         }).
         when('/about', {
           template: '<about></about>'
         }).
         when('/changelog', {
           template: '<changelog></changelog>'
         }).
         otherwise({
           redirectTo: '/view'
         });
       }
]);
