'use strict';

angular.module('heroesList').component('heroesList', {
  templateUrl: globalPrefix + 'templates/heroes-list/heroes-list.template.html?v=' + __BUILDID__,
  controller: ['$http', 'HeroListService',  
    function HeroesListController($http, HeroListService) {
      this.HeroListService = HeroListService;
      HeroListService.get().then((response) => {
        this.heroes = HeroListService.heroes;
      });

      this.hui = (val) => {
        console.log( val );
      };
    }
  ]
});

angular.module('heroesList').component('heroesListModal', {
  templateUrl: globalPrefix + 'templates/heroes-list/heroes-list-modal.template.html?v=' + __BUILDID__,
  controller: ['$http', 'HeroListService', 'CatsService', 
    function HeroesListController($http, HeroListService, CatsService) {
      this.CatsService = CatsService;
      this.HeroListService = HeroListService;
      HeroListService.get().then((response) => {
        this.heroes = HeroListService.heroes;
      });
      this.addElement = (val) => {
        let id = $('.heroes-modal').attr('cat');
        CatsService.addElement(id, val);
      };
      
      this.onModalShow = () => {
        this.catId = +$('.heroes-modal').attr('cat');
        if(!isNaN(this.catId)) {
          this.tempCat = CatsService.cats[this.catId];
        }
      };
      this.delAnimation = (id, index) => {
        this.CatsService.removeElement(id, index)
      };
    }
  ]
});
