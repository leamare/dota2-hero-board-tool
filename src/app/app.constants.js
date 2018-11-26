const globalPrefix = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/")+1);
const currentVer = [1,0,1];

String.prototype.hashCode = function() {
    var hash = 0;
    if (this.length == 0) {
        return hash;
    }
    for (var i = 0; i < this.length; i++) {
        var char = this.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash;
    }
    return hash;
}

const LOAD_LOCALES = ['en', 'ru'];

const PRESET_NAMES = [
  { value: 1, label: 'PN_1_EMPTY' },
  { value: 2, label: 'PN_2_SAFE' },
  { value: 3, label: 'PN_3_MID' },
  { value: 4, label: 'PN_4_OFF' },
  { value: 5, label: 'PN_5_POS4' },
  { value: 6, label: 'PN_6_POS5' },
  { value: 7, label: 'PN_7_MIXED' },
  { value: 8, label: 'PN_8_GREEDY' },
  { value: 9, label: 'PN_9_PUSH' },
  { value: 10, label: 'PN_10_AGGRO' },
  { value: 11, label: 'PN_11_PASSIVE' },
  { value: 12, label: 'PN_12_NOSTUN' },
  { value: 13, label: 'PN_13_ROAM' },
  { value: 14, label: 'PN_14_SQUISHY' },
  { value: 15, label: 'PN_15_NUKES' },
  { value: 16, label: 'PN_16_STUNS' },
  { value: 17, label: 'PN_17_TANK' },
  { value: 18, label: 'PN_18_ESC' },
  { value: 19, label: 'PN_19_INIT' },
  { value: 20, label: 'PN_20_COMPLEX' },
  { value: 21, label: 'PN_21_FR' },
  { value: 22, label: 'PN_ROLE_CORE' },
  { value: 23, label: 'PN_ROLE_SUP' },
  { value: 24, label: 'PN_ATK_MELEE' },
  { value: 25, label: 'PN_ATK_RNG' },
  { value: 26, label: 'PN_LANE_SOLO' },
  { value: 27, label: 'PN_LANE_DUO' },
  { value: 28, label: 'PN_LANE_TRIO' },
  { value: 29, label: 'PN_MISC_META' },
  { value: 30, label: 'PN_TIME_EARLY' },
  { value: 31, label: 'PN_TIME_MID' },
  { value: 32, label: 'PN_TIME_LATE' },
  { value: 33, label: 'PN_SITUATIONAL' }
];

const CONST_COLORS = [
  { value: '', label: 'CLR_NONE' },
  { value: 'red', label: 'CLR_RED' },
  { value: 'orange', label: 'CLR_ORANGE' },
  { value: 'yellow', label: 'CLR_YELLOW' },
  { value: 'olive', label: 'CLR_OLIVE' },
  { value: 'green', label: 'CLR_GREEN' },
  { value: 'teal', label: 'CLR_TEAL' },
  { value: 'blue', label: 'CLR_BLUE' },
  { value: 'violet', label: 'CLR_VIOLET' },
  { value: 'purple', label: 'CLR_PURPLE' },
  { value: 'pink', label: 'CLR_PINK' },
  { value: 'brown', label: 'CLR_BROWN' },
  { value: 'grey', label: 'CLR_GREY' },
  { value: 'black', label: 'CLR_BLACK' }
];

const CONST_WIDENESS = [
  { value: 0, label: 'WIDE_DEFAULT' },
  { value: 1, label: 'WIDE_FULL' },
  { value: 2, label: 'WIDE_HALF' },
  { value: 3, label: 'WIDE_THIRD' },
  { value: 4, label: 'WIDE_FOURTH' },
  { value: 5, label: 'WIDE_TWO_THIRDS' },
  { value: 6, label: 'WIDE_THREE_FOURTH' },
];

const CONST_WIDENESS_CSS = [
  '',
  'sixteen_wide',
  'eight_wide',
  'third_wide',
  'four_wide',
  'two_third_wide',
  'twelve_wide'
];

const COLUMN_VALUES = [
  { name: '1', value: 'one' },
  { name: '2', value: 'two' },
  { name: '3', value: 'three' },
  { name: '4', value: 'four' },
  { name: '5', value: 'five' },
  { name: '6', value: 'six' }
];
