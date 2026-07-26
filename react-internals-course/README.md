# React Internals: курс на живом примере магазина

Цель: пройти все 39 статей серии [React Internals Deep Dive](https://jser.dev/series/react-source-code-walkthrough) и **запомнить** концепции, привязав каждую к реальному коду этого репозитория (apps/client, apps/storybook). Сигнатуры сверяем с facebook/react v19.2.0.

## Сквозной сюжет: «жизнь одного клика»

Все уроки объясняются через один сценарий, который есть в нашем приложении:

> Покупатель открывает каталог `/products` (SSR отдаёт HTML, клиент гидрируется).
> На карточке Element Sofa он кликает свотч цвета «olive».
> `ProductCard` вызывает `setSelectedColor('olive')`, картинка и цена меняются.
> Остальные 11 карточек грида не перерендериваются.

Один клик по свотчу проходит через ВСЕ темы курса: триггер, планировщик, рендер, коммит, хуки, bailout, диффинг. Когда концепция привязана к знакомой кнопке, она запоминается.

Ключевые файлы сюжета:

- `apps/client/src/entities/product/ui/ProductCard.tsx`: useState(selectedColor), свотчи
- `apps/client/src/routes/products/index.tsx`: грид Latest Arrivals (списки, key)
- `apps/client/src/entry-client.tsx`: hydrateRoot (гидрация)
- `apps/client/src/entry-server.tsx`: SSR
- `apps/storybook`: чистый монтаж компонентов через createRoot
- `apps/client/src/shared/ui/dialog/Dialog.tsx`, `tooltip/Tooltip.tsx`: эффекты, порталы

## Формат каждого урока

1. **Теория**: главные идеи статьи, кратко.
2. **В нашем магазине**: та же механика на коде ProductCard и соседей.
3. **Практика руками**: брейкпоинты в DevTools, эксперимент в Storybook или в dev-сборке.
4. **Карточки**: вопросы-ответы для повторения (формат Anki: вопрос | ответ).
5. **Самопроверка**: 2-4 открытых вопроса.

## Как повторять (система запоминания)

- После урока: прогнать карточки урока.
- Через день: карточки урока + 3 случайные из прошлых уроков.
- Через неделю: все карточки модуля.
- Раз в модуль: рассказать сюжет «жизнь одного клика» вслух, добавив новые звенья из пройденных уроков. Это главный тест: если звено выпадает, вернуться к уроку.

## Программа: 8 модулей и их место в сюжете

| # | Модуль | Событие в магазине | Уроки (статьи) |
|---|---|---|---|
| 1 | Фундамент | клик по свотчу от и до | overview (урок 1), initial mount (урок 2), re-render (урок 3), fiber traversal |
| 2 | Хуки состояния | selectedColor в ProductCard | useState, useRef, Context |
| 3 | Эффекты | Tooltip.visible, Dialog.shown, аналитика | useEffect, lifecycle of effects, useLayoutEffect, useInsertionEffect, effects и paint, useEffectEvent |
| 4 | Реконсиляция | почему соседние карточки не перерендерились | bailout, React.memo, key и диффинг списков (грид товаров), empty values |
| 5 | Планировщик и приоритеты | поиск по каталогу, не блокирующий ввод | Scheduler, Lanes, useTransition, useDeferredValue |
| 6 | Suspense | скелетоны и ленивая загрузка деталей товара | Suspense reconciling, Offscreen, SuspenseList, lazy |
| 7 | SSR и гидрация | entry-server -> HTML -> entry-client | basic hydration, hydration + Suspense, progressive hydration, RSC |
| 8 | Остальные API | Dialog через Portal, ErrorBoundary вокруг грида, useId в формах | useId, useSyncExternalStore, use(), useOptimistic, forwardRef, useImperativeHandle, Portal, ErrorBoundary, act |

## Пройдено

- [x] Урок 1: [Обзор: 4 фазы](lesson-01-overview.md)
- [x] Урок 2: [Initial Mount](lesson-02-initial-mount.md)
- [x] Урок 3: [Re-render](lesson-03-rerender.md)
- [ ] Урок 4: Fiber traversal, либо, по желанию, bailout/React.memo из модуля 4 (следующий)

Диаграммы с сигнатурами v19.2.0: `../react-internals-diagrams/`.
