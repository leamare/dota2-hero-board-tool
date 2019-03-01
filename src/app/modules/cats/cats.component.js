'use strict';

function CatsController(CatsService, HeroListService, $rootScope, $translate) {
  this.globalPrefix = globalPrefix;
  this.cats = CatsService;
  this.herolist = HeroListService;
  this.rscope = $rootScope;

  if (this.forcedBig === undefined)
    this.forcedBig = localStorage.settingsForcedBig == 'true';

  if (this.centeredView === undefined)
    this.centeredView = localStorage.settingsCenteredView == 'true';

  if (this.darkenedBg === undefined)
    this.darkenedBg = localStorage.settingsDarkenedBg == 'true';

  if (this.colorfulLabels === undefined)
    this.colorfulLabels = localStorage.settingsColorfulLabels == 'true';

  this.columns = $rootScope.columns;
  $rootScope.$watch('columns', (newValue, oldValue) => {
    $('.cats').removeClass(this.columns).removeClass('column');
    this.columns = newValue;
    $('.cats').addClass(this.columns + ' column');
  });

  this.checkFirstCat = (newValue, oldValue) => {
    this.forcedBig = newValue;

    if(newValue) {
      $('.cats').children().first().addClass('sixteen_wide').children('.heroes-container').removeClass('small-portraits');
    } else if (this.cats.cats[0] !== undefined) {
      if(!this.cats.cats[0].wide)
        $('.cats').children().first().removeClass('sixteen_wide');

      if(!this.cats.cats[0].bigger)
        $('.cats .heroes-container').first().addClass('small-portraits');
    }
  }

  this.rscope.$watch('forcedBig', this.checkFirstCat);

  this.rscope.checkFirstCat = this.checkFirstCat;

  this.rscope.$watch('centeredView', (newValue, oldValue) => {
    this.centeredView = newValue;
  });

  this.rscope.$watch('darkenedBg', (newValue, oldValue) => {
    this.darkenedBg = newValue;
  });

  this.rscope.$watch('colorfulLabels', (newValue, oldValue) => {
    this.colorfulLabels = newValue;
  });

  this.wideCat = (id) => {
    let wideness;
    if (id == 0 && this.forcedBig)
      wideness = 1;
    else
      wideness = this.cats.cats[id].wide;

    return this.wideness[wideness];
  };

  this.biggerCat = (id) => this.cats.cats[id].bigger || id == 0 && this.forcedBig;

  this.delAnimation = (id, index) => {
    this.cats.removeElement(id, index)
  };

  this.showAddHeroModal = (id) => {
    $('.heroes-modal').attr('cat', id);
    $('.heroes-modal').toggleClass('visible');
    $('.heroes-modal').toggleClass('active');
    $('.heroes-modal').removeClass('hidden');
  }
  this.showCatSettingsModal = (id) => {

    $('.cat-modal').attr('cat', id);

    $('.cat-modal').removeClass('hidden');

    $('.color-mark').dropdown('set selected', this.cats.cats[id].mark);
    $('.bigger-cat').checkbox('set ' + (CatsService.cats[id].bigger ? '' : 'un') + 'checked');
    $('.wide-cat').checkbox('set ' + (CatsService.cats[id].wide ? '' : 'un') + 'checked');
  }

  this.wideness = CONST_WIDENESS_CSS;
}

angular.
module('cats').
component('cats', {
  templateUrl: globalPrefix + 'templates/cats/cats.template.html',
  controller: ['CatsService', 'HeroListService', '$rootScope', '$translate',
    CatsController
  ]
});

angular.
module('cats').
component('catsView', {
  templateUrl: globalPrefix + 'templates/cats/cats-view.template.html',
  controller: ['CatsService', 'HeroListService', '$rootScope',
    CatsController
  ]
});

angular.
module('cats').
component('catSettingsModal', {
  templateUrl: globalPrefix + 'templates/cats/cat-settings-modal.template.html',
  controller: ['CatsService', 'HeroListService', '$scope', '$compile',
  function CatsModalController(CatsService, HeroListService, $scope, $compile) {
    this.CatsService = CatsService;
    this.HeroListService = HeroListService;
    this.PRESET_NAMES = PRESET_NAMES;
    this.delAnimation = (id, index) => {
      this.cats.removeElement(id, index)
    };
    this.onModalShow = () => {
      this.catId = +$('.cat-modal').attr('cat');
      if(!isNaN(this.catId)) {
        this.tempCat = CatsService.cats[this.catId];
      }
    };

    this.names = [];

    this.updateCatName = () => {
      let label = $('.cat-modal .cat-name .selected').attr('data-value');
      if (label === undefined)
        label = $('.cat-modal .cat-name input').val();
      for (let i in this.names) {
        if(this.names[i].value == this.catId)
          this.names[i].label = label;
      }
      console.log(this.names);
    }

    this.colors = CONST_COLORS;

    this.nameTypes = [
      { value: 0, label: 'CAT_NAME_TEXT' },
      { value: 1, label: 'CAT_NAME_PRESET' }
    ];

    this.wideness = CONST_WIDENESS;

    for (let cat in this.CatsService.cats) {
      this.names.push({
        value: this.CatsService.cats[cat].id,
        label: this.CatsService.cats[cat].name
      });
    }
    for (let cat in this.CatsService.names) {
      this.names.push(this.CatsService.names[cat]);
    }
  }
  ]
});
