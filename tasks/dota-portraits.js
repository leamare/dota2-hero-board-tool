'use strict';

var gulp        = require('gulp'),
    fs          = require('fs'),
    http        = require('http'),
    config      = require('../gulpconfig').API;


gulp.task('dota-heroes', function(cb) {
  if (!fs.existsSync('./dota')){
    fs.mkdirSync('./dota');
  }
  let file = fs.createWriteStream('./dota/heroes.json');
  http.get('http://api.steampowered.com/IEconDOTA2_570/GetHeroes/v1?language=en&key='+config.key, (response) => {
    response.pipe(file);
  });

  cb();
});

gulp.task('dota-portraits', function(cb) {
  let heroes = require('../dota/heroes').result.heroes;
  try {
    if (!fs.existsSync('./dota/portraits')){
      fs.mkdirSync('./dota/portraits');
    }

    for (let hero of heroes) {
      let tag = hero.name.replace('npc_dota_hero_', '');
      console.log(`\tPortrait for: ${hero.name} - ${tag}`)
      let file = fs.createWriteStream('./dota/portraits/' + tag + '.png');
      http.get(config.heroLink.replace('%name%', tag), (response) => {
        response.pipe(file);
      });
    }
  } catch (e) {
    console.error(e.message);
  }

  cb();
});

gulp.task('dota', (done) => {
  gulp.series(
    'dota-heroes',
    'dota-portraits'
  )(done);
});