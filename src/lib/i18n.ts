import { createContext, useContext } from 'react';

export type LocaleCode = 'en' | 'ru' | 'zh' | 'uk' | 'pt';

export const LOCALES: { code: LocaleCode; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'zh', label: '中文' },
  { code: 'uk', label: 'Українська' },
  { code: 'pt', label: 'Português (BR)' },
];

type Dict = Record<string, string>;

const en: Dict = {
  'nav.view': 'View',
  'nav.edit': 'Edit',
  'nav.layouts': 'Layouts',
  'nav.about': 'About',

  'common.save': 'Save',
  'common.saveAs': 'Save as…',
  'common.share': 'Share',
  'common.clear': 'Clear board',
  'common.load': 'Load',
  'common.update': 'Update',
  'common.rename': 'Rename',
  'common.export': 'Export',
  'common.delete': 'Delete',
  'common.import': 'Import',
  'common.cancel': 'Cancel',
  'common.newGrid': 'New grid',
  'common.category': 'Category',
  'common.search': 'Search…',

  'sidebar.title': 'Grids & settings',
  'sidebar.pin': 'Pin',
  'sidebar.currentGrid': 'Current grid',
  'sidebar.gridName': 'Grid name',
  'sidebar.autosave': 'Autosave',
  'sidebar.display': 'Display',
  'sidebar.uiScale': 'UI scale',
  'sidebar.uiScaleDown': 'Decrease UI scale',
  'sidebar.uiScaleUp': 'Increase UI scale',
  'sidebar.columns': 'Columns',
  'sidebar.portraits': 'Portraits',
  'sidebar.size': 'Size',
  'sidebar.items': 'Items',
  'sidebar.colorfulLabels': 'Colourful labels',
  'sidebar.centered': 'Centered',
  'sidebar.darken': 'Darken',
  'sidebar.palette': 'Heroes & items',
  'sidebar.savedGrids': 'Saved grids',
  'sidebar.noGrids': 'No saved grids yet.',

  'picker.add': 'Add to category',
  'picker.heroes': 'Heroes',
  'picker.items': 'Items',
  'picker.empty': 'Empty',

  'view.empty': 'This grid is empty. Switch to Edit to add categories.',
  'edit.addCategoryHint': 'Add a category to start building your grid.',

  'lang.label': 'Language',
};

const ru: Dict = {
  'nav.view': 'Просмотр',
  'nav.edit': 'Редактор',
  'nav.layouts': 'Раскладки',
  'nav.about': 'О сайте',

  'common.save': 'Сохранить',
  'common.saveAs': 'Сохранить как…',
  'common.share': 'Поделиться',
  'common.clear': 'Очистить',
  'common.load': 'Загрузить',
  'common.update': 'Обновить',
  'common.rename': 'Переименовать',
  'common.export': 'Экспорт',
  'common.delete': 'Удалить',
  'common.import': 'Импорт',
  'common.cancel': 'Отмена',
  'common.newGrid': 'Новая сетка',
  'common.category': 'Категория',
  'common.search': 'Поиск…',

  'sidebar.title': 'Сетки и настройки',
  'sidebar.pin': 'Закрепить',
  'sidebar.currentGrid': 'Текущая сетка',
  'sidebar.gridName': 'Название сетки',
  'sidebar.autosave': 'Автосохранение',
  'sidebar.display': 'Отображение',
  'sidebar.uiScale': 'Масштаб интерфейса',
  'sidebar.uiScaleDown': 'Уменьшить масштаб',
  'sidebar.uiScaleUp': 'Увеличить масштаб',
  'sidebar.columns': 'Столбцы',
  'sidebar.portraits': 'Портреты',
  'sidebar.size': 'Размер',
  'sidebar.items': 'Предметы',
  'sidebar.colorfulLabels': 'Цветные заголовки',
  'sidebar.centered': 'По центру',
  'sidebar.darken': 'Затемнить',
  'sidebar.palette': 'Герои и предметы',
  'sidebar.savedGrids': 'Сохранённые сетки',
  'sidebar.noGrids': 'Пока нет сохранённых сеток.',

  'picker.add': 'Добавить в категорию',
  'picker.heroes': 'Герои',
  'picker.items': 'Предметы',
  'picker.empty': 'Пусто',

  'view.empty': 'Сетка пуста. Перейдите в Редактор, чтобы добавить категории.',
  'edit.addCategoryHint': 'Добавьте категорию, чтобы начать.',

  'lang.label': 'Язык',
};

const zh: Dict = {
  'nav.view': '查看',
  'nav.edit': '编辑',
  'nav.layouts': '布局',
  'nav.about': '关于',

  'common.save': '保存',
  'common.saveAs': '另存为…',
  'common.share': '分享',
  'common.clear': '清空',
  'common.load': '载入',
  'common.update': '更新',
  'common.rename': '重命名',
  'common.export': '导出',
  'common.delete': '删除',
  'common.import': '导入',
  'common.cancel': '取消',
  'common.newGrid': '新建网格',
  'common.category': '类别',
  'common.search': '搜索…',

  'sidebar.title': '网格与设置',
  'sidebar.pin': '固定',
  'sidebar.currentGrid': '当前网格',
  'sidebar.gridName': '网格名称',
  'sidebar.autosave': '自动保存',
  'sidebar.display': '显示',
  'sidebar.uiScale': '界面缩放',
  'sidebar.uiScaleDown': '缩小界面',
  'sidebar.uiScaleUp': '放大界面',
  'sidebar.columns': '列数',
  'sidebar.portraits': '头像',
  'sidebar.size': '大小',
  'sidebar.items': '物品',
  'sidebar.colorfulLabels': '彩色标题',
  'sidebar.centered': '居中',
  'sidebar.darken': '变暗',
  'sidebar.palette': '英雄和物品',
  'sidebar.savedGrids': '已保存网格',
  'sidebar.noGrids': '还没有保存的网格。',

  'picker.add': '添加到类别',
  'picker.heroes': '英雄',
  'picker.items': '物品',
  'picker.empty': '空白',

  'view.empty': '此网格为空。切换到编辑以添加类别。',
  'edit.addCategoryHint': '添加一个类别开始构建你的网格。',

  'lang.label': '语言',
};

const uk: Dict = {
  'nav.view': 'Перегляд',
  'nav.edit': 'Редактор',
  'nav.layouts': 'Розкладки',
  'nav.about': 'Про сайт',

  'common.save': 'Зберегти',
  'common.saveAs': 'Зберегти як…',
  'common.share': 'Поділитися',
  'common.clear': 'Очистити',
  'common.load': 'Завантажити',
  'common.update': 'Оновити',
  'common.rename': 'Перейменувати',
  'common.export': 'Експорт',
  'common.delete': 'Видалити',
  'common.import': 'Імпорт',
  'common.cancel': 'Скасувати',
  'common.newGrid': 'Нова сітка',
  'common.category': 'Категорія',
  'common.search': 'Пошук…',

  'sidebar.title': 'Сітки та налаштування',
  'sidebar.pin': 'Закріпити',
  'sidebar.currentGrid': 'Поточна сітка',
  'sidebar.gridName': 'Назва сітки',
  'sidebar.autosave': 'Автозбереження',
  'sidebar.display': 'Відображення',
  'sidebar.uiScale': 'Масштаб інтерфейсу',
  'sidebar.uiScaleDown': 'Зменшити масштаб',
  'sidebar.uiScaleUp': 'Збільшити масштаб',
  'sidebar.columns': 'Стовпці',
  'sidebar.portraits': 'Портрети',
  'sidebar.size': 'Розмір',
  'sidebar.items': 'Предмети',
  'sidebar.colorfulLabels': 'Кольорові заголовки',
  'sidebar.centered': 'По центру',
  'sidebar.darken': 'Затемнити',
  'sidebar.palette': 'Герої та предмети',
  'sidebar.savedGrids': 'Збережені сітки',
  'sidebar.noGrids': 'Поки немає збережених сіток.',

  'picker.add': 'Додати до категорії',
  'picker.heroes': 'Герої',
  'picker.items': 'Предмети',
  'picker.empty': 'Порожньо',

  'view.empty': 'Сітка порожня. Перейдіть у Редактор, щоб додати категорії.',
  'edit.addCategoryHint': 'Додайте категорію, щоб почати.',

  'lang.label': 'Мова',
};

const pt: Dict = {
  'nav.view': 'Ver',
  'nav.edit': 'Editar',
  'nav.layouts': 'Layouts',
  'nav.about': 'Sobre',

  'common.save': 'Salvar',
  'common.saveAs': 'Salvar como…',
  'common.share': 'Compartilhar',
  'common.clear': 'Limpar',
  'common.load': 'Carregar',
  'common.update': 'Atualizar',
  'common.rename': 'Renomear',
  'common.export': 'Exportar',
  'common.delete': 'Excluir',
  'common.import': 'Importar',
  'common.cancel': 'Cancelar',
  'common.newGrid': 'Nova grade',
  'common.category': 'Categoria',
  'common.search': 'Buscar…',

  'sidebar.title': 'Grades e ajustes',
  'sidebar.pin': 'Fixar',
  'sidebar.currentGrid': 'Grade atual',
  'sidebar.gridName': 'Nome da grade',
  'sidebar.autosave': 'Salvar automaticamente',
  'sidebar.display': 'Exibição',
  'sidebar.uiScale': 'Escala da interface',
  'sidebar.uiScaleDown': 'Diminuir escala',
  'sidebar.uiScaleUp': 'Aumentar escala',
  'sidebar.columns': 'Colunas',
  'sidebar.portraits': 'Retratos',
  'sidebar.size': 'Tamanho',
  'sidebar.items': 'Itens',
  'sidebar.colorfulLabels': 'Rótulos coloridos',
  'sidebar.centered': 'Centralizado',
  'sidebar.darken': 'Escurecer',
  'sidebar.palette': 'Heróis e itens',
  'sidebar.savedGrids': 'Grades salvas',
  'sidebar.noGrids': 'Nenhuma grade salva ainda.',

  'picker.add': 'Adicionar à categoria',
  'picker.heroes': 'Heróis',
  'picker.items': 'Itens',
  'picker.empty': 'Vazio',

  'view.empty': 'Esta grade está vazia. Vá para Editar para adicionar categorias.',
  'edit.addCategoryHint': 'Adicione uma categoria para começar.',

  'lang.label': 'Idioma',
};

export const DICTS: Record<LocaleCode, Dict> = { en, ru, zh, uk, pt };

export const LOCALE_KEY = 'hgt.locale';

export function detectLocale(): LocaleCode {
  const saved = (typeof localStorage !== 'undefined' && localStorage.getItem(LOCALE_KEY)) as LocaleCode | null;
  if (saved && DICTS[saved]) return saved;
  const nav = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'en';
  if (nav.startsWith('ru')) return 'ru';
  if (nav.startsWith('zh')) return 'zh';
  if (nav.startsWith('uk')) return 'uk';
  if (nav.startsWith('pt')) return 'pt';
  return 'en';
}

interface I18nCtx {
  locale: LocaleCode;
  setLocale: (l: LocaleCode) => void;
  t: (key: string) => string;
}

export const I18nContext = createContext<I18nCtx>({
  locale: 'en',
  setLocale: () => {},
  t: (k) => en[k] ?? k,
});

export const useI18n = () => useContext(I18nContext);
export const useT = () => useContext(I18nContext).t;
