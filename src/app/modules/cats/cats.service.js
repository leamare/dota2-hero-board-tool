'use strict';

angular.module('cats').service('CatsService', ['$q', '$translate',
  function($q, $translate) {
    this.cats = [];

    this.isCat = (id) => {
      return $q((resolve, reject) => {
        if (this.cats[id] === undefined || id === undefined) {
          reject(null);
        } else {
          resolve(this.cats[id]);
        }
      });
    };

    this.updateIds = () => {
      this.cats = this.cats.map((value, index, array) => {
        value.id = index;
        return value;
      });
    }

    this.updateHeroIds = (id) => {
      return this.isCat(id)
        .then(() => {
          this.cats[id].heroes = this.cats[id].heroes.map((value, index, array) => {
            value.id = index;
            return value;
          });
        });
    }

    this.create = () => {
      return $q((resolve, reject) => {
        let entry = {
          id: this.cats.length,
          name: 1,
          nameType: 1,
          heroes: [],
          mark: '',
          bigger: false,
          wide: 0,
        };

        resolve(this.cats.push(entry));
      });
    };

    this.remove = (id) => {
      return this.isCat(id).then((result) => {
        this.cats.splice(id, 1);

        this.updateIds();
      });
    };

    this.update = (id, name, heroes, mark, bigger) => {
      return this.isCat(id).then((result) => {
        if (name) {
          this.cats[id].name = name;
        }
        if (heroes !== undefined) {
          this.cats[id].heroes = [];
          heroes.forEach((val) => {
            this.cats[id].heroes.push({
              id: this.cats[id].heroes.length,
              value: val
            });
          });
        }
        if (mark !== undefined) {
          this.cats[id].mark = mark;
        }
        if (bigger !== undefined) {
          this.cats[id].bigger = bigger;
        }

        return this.cats[id];
      });
    };

    this.addElement = (id, el) => {
      if(typeof el === 'object') {
        return $q.resolve();
      }
      return this.isCat(id).then((result) => {
        if (el !== undefined) {
          if(+el < 0 || isNaN(el))
            throw new Error('Wrong hero ID');

          this.cats[id].heroes.push({
            id: this.cats[id].heroes.length,
            value: el
          });

          this.updateIds();
        } else {
          throw new Error('No element specified');
        }

        return this.cats[id];
      });
    };

    this.removeElement = (id, index) => {
      return this.isCat(id).then((result) => {
        if (index !== undefined) {
          if(+index < 0 || isNaN(index))
            throw new Error('Wrong hero ID');
          else if(this.cats[id].heroes[index] === undefined)
            throw new Error('Wrong hero ID');
          else {
            this.cats[id].heroes.splice(index, 1);
            this.cats[id].heroes.map((currentValue, arrIndex, array) => {
              if(arrIndex >= index) {
                currentValue.id--;
                array[arrIndex] = currentValue;
              }
            });
          }
        } else {
          throw new Error('No element specified');
        }

        return this.cats[id];
      });
    };

    this.getLabel = (id) => {
      if(!this.cats[id]) return '';

      if(this.cats[id].nameType == 0) {
        return this.cats[id].name;
      } else if(this.cats[id].nameType == 1) {
        for(let index in PRESET_NAMES) {
          if(PRESET_NAMES[index].value == +this.cats[id].name)
            return $translate.instant(PRESET_NAMES[index].label);
        }
      }
    }

    this.swap = (idl, idr) => {
      let tmp = this.cats[idl];
      this.cats[idl] = this.cats[idr];
      this.cats[idr] = tmp;

      console.log(this.cats);

      this.updateIds();
    }
  }
]);
