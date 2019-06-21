angular.module('layout')
       .service('LayoutService', ['$q', 'CatsService',
        function($q, CatsService) {
          this.layouts = [];
          this.loadedLayout = null;

          this.emptyLayout = () => {
            return {
              name: 'New Layout',
              tag: 'file',
              categories: [],
              active: false
            };
          };

          this.wrapCurrentLayout = () => {
            let layout = {
              name: this.loadedLayout.name,
              tag: this.loadedLayout.tag,
              categories: [],
              active: true
            };

            let cat;
            for (let i in CatsService.cats) {
              cat = {
                name: CatsService.cats[i].name,
                nameType: CatsService.cats[i].nameType,
                bigger: CatsService.cats[i].bigger,
                wide: CatsService.cats[i].wide,
                mark: CatsService.cats[i].mark,
                heroes: []
              };
              for (let j in CatsService.cats[i].heroes) {
                cat.heroes.push(CatsService.cats[i].heroes[j].value);
              }
              layout.categories.push(cat);
            }

            return layout;
          };

          this.unwrapLayout = (data) => {
            if(data === null)
              throw new Error('.');


            let layout = {
              name: data.name,
              tag: data.tag,
              categories: [],
              active: false
            };

            let cat;
            for (let i in data.categories) {
              cat = {
                id: i,
                name: data.categories[i].name,
                nameType: data.categories[i].nameType !== undefined ? data.categories[i].nameType : 0,
                bigger: data.categories[i].bigger,
                wide: +data.categories[i].wide,
                mark: data.categories[i].mark,
                heroes: []
              };
              for (let j in data.categories[i].heroes) {
                cat.heroes.push({
                  id: j,
                  value: data.categories[i].heroes[j]
                });
              }
              layout.categories.push(cat);
            }

            return layout;
          };

          this.loadLayouts = (data, rewrite) => {
            if (data === undefined)
              data = localStorage.layouts;
            let result = [];
            let startsFrom = 0;

            try {
              result = JSON.parse(data);
            } catch (e) {
              result = [];
            } finally {
              result = result.map((value, index, array) => {
                value.active = false;
                return value;
              });

              if(!rewrite) {
                startsFrom = this.layouts.length;
                this.layouts = this.layouts.concat(result);
              } else {
                this.layouts = result;
              }
            }

            return startsFrom;
          };

          this.saveLayouts = () => {
            let layouts = [];
            this.layouts.map((value, index, array) => {
              layouts[index] = Object.assign({}, value);
              delete layouts[index].active;
              return value;
            });
            localStorage.layouts = JSON.stringify(layouts);
          };

          this.getExportString = (layout) => {
            let layouts = [];
            layouts.push(layout);
            layouts = JSON.stringify(layouts);
            return layouts;
          };

          this.getExportFile = (layout) => {
            let layouts = [];
            if (layout === undefined) {
              this.layouts.map((value, index, array) => {
                if (value.active)
                  layouts[index] = this.wrapCurrentLayout();
                else
                  layouts[index] = Object.assign({}, value);
                delete layouts[index].active;
                return value;
              });
            } else {
              layouts.push(layout);
            }
            layouts = JSON.stringify(layouts);
            let file = new Blob([layouts], {type: 'text/json'});
            return file;
          };

          this.isLayout = (index) => {
            if (index < this.layouts.length)
              return true;
            return false;
          }

          this.newLayout = (data) => {
            if (data === undefined)
              data = this.emptyLayout();

            return this.layouts.push(data);
          }

          this.rewriteLayout = (index, apply = true) => {
            if (index === undefined) {
              index = this.layouts.indexOf( this.loadedLayout );
            } else if (!this.isLayout(index))
                throw new Error('.');

            let layout = this.wrapCurrentLayout();

            this.loadedLayout = layout;
            this.layouts[index] = layout;
            if (apply)
              this.applyLayout(index);
          };

          this.applyLayout = async (index) => {
            if(index === undefined)
              index = this.layouts.indexOf( this.loadedLayout );

            let loadedIndex = this.layouts.indexOf( this.loadedLayout );

            if(this.loadedLayout && index != loadedIndex)
              this.loadedLayout.active = false;

            this.loadedLayout = this.getLayoutByIndex(index);

            let unwrappedLayout = this.unwrapLayout( this.loadedLayout );
            CatsService.cats = unwrappedLayout.categories;
            if (index != loadedIndex)
              this.loadedLayout.active = true;

            return this.loadedLayout;
          };

          this.removeLayout = (index) => {
            if(!this.isLayout(index))
              throw new Error('.');

            this.layouts.splice(index, 1);

            if (this.loadedLayout > index)
              this.loadedLayout--;

            else if (this.loadedLayout == index)
              this.loadedLayout = null;

            if(!this.layouts.length) {
              this.newLayout();
              this.applyLayout(0);
            }
          }

          this.getLayoutByIndex = (index) => {
            return this.layouts[index];
          };

          this.getLayoutsList = () => {
            let list = [];
            for (let i in this.layouts) {
              list.push({
                name: this.layouts[i].name,
                tag: this.layouts[i].tag
              });
            }
            return list;
          };

          this.clearCurrent = () => {
            CatsService.cats = [];
          }

          this.searchId = (target) => {
            let result = this.layouts.indexOf(target);
            if (result >= 0)
              return result;
            return false;
          }

          this.hashSearchId = (target) => {
            let hash = JSON.stringify(target).hashCode();
            let compare_hash = 0;
            for (let i in this.layouts) {
              compare_hash = JSON.stringify(this.layouts[i]).hashCode();
              if (hash === compare_hash)
                return i;
            }
          }

          try {
            this.loadLayouts();
          } finally {
            if (this.layouts.length == 0) {
              this.newLayout();
            }
          }
        }
      ]);
