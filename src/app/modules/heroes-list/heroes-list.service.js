'use strict';

angular.module('heroesList').service('HeroListService', ['$http',
  function($http) {
    this.heroes = [];

    this.update = () => //$http.get('https://api.steampowered.com/IEconDOTA2_570/GetHeroes/v1?key=766BB2E9B3343EF6D94851890EDADD1C&language=en').then((response) => {
      // CORS for  Valve API doesn't work for some reason, going to use dump for now
      $http.get(__metadataProvider__).then((response) => {
      this.heroes = response.data.result.heroes;
      this.heroes.map((hero) => {
        hero.name = hero.name.replace('npc_dota_hero_', '');
      });
      this.heroes.unshift({
        id: 0,
        name: '_none'
      });
      return this.heroes;
    }).then((heroes) => {
      $http.get(globalPrefix + 'data/heroes-aliases.json').then((response) => {
        heroes = heroes.map((value, index, array) => {
          if(response.data[value.id] !== undefined)
            value.aliases = response.data[value.id];
            return value;
        });
      });
    });

    this.get = () => {
      if (this.heroes.length) return Promise.resolve(() => this.heroes);
      return this.update();
    }

    this.heroNameById = (id) => {
      for (let hero of this.heroes) {
        if (hero.id == id) return hero.name;
      }
      return '';
    };

    this.portraitLinkById = (id) => {
      for (let hero of this.heroes) {
        if (hero.id == id)
          //return `http://cdn.dota2.com/apps/dota2/images/heroes/${hero.name}_lg.png`;
          return globalPrefix+`res/heroes/${hero.name}.png`;
      }
      return '';
    };

    this.update();
  }
]);
