# Урок 1. Общая картина: как React работает внутри

Источник: [The Overview of React internals](https://jser.dev/2023-07-11-overall-of-react-internals) (jser.dev, серия React Internals Deep Dive).
Сигнатуры функций сверены с исходниками facebook/react v19.2.0.
Диаграммы: `../react-internals-diagrams/` (overview, trigger-schedule, render-phase, commit-phase).

## Главная мысль урока

`setState` не перерисовывает компонент. Он запускает конвейер из четырёх фаз:

```
Trigger  ->  Schedule  ->  Render  ->  Commit
(что)        (когда)      (вычислить)  (применить к DOM)
```

Эта схема - каркас всего курса: каждый следующий урок раскрывает одну из её частей.

## Четыре фазы

### 1. Trigger: что обновить

- Два входа: первый монтаж (`root.render()` -> `updateContainer`) и обновление состояния (`setState` -> `dispatchSetState`).
- Обе дороги сходятся в `scheduleUpdateOnFiber(root, fiber, lane)`: пометить, что корню нужна работа.
- `ensureRootIsScheduled(root)` ставит микротаск. На этой фазе ничего не рендерится, только создаётся задача.

### 2. Schedule: когда выполнить

- В React 19 фаза двухступенчатая:
  1. **Микротаск**: `processRootScheduleInMicrotask()` в конце текущего события собирает все обновления вместе. Так работает автоматический батчинг: три `setState` подряд дают один рендер.
  2. **Scheduler**: `unstable_scheduleCallback(priorityLevel, callback)` кладёт задачу в очередь с приоритетами (min-heap).
- Задача запускается через `MessageChannel.port.postMessage(null)`: это новая макрозадача, поэтому между «запланировали» и «начали рендерить» браузер успевает обработать ввод и отрисовку. Не `setTimeout` (у него зажим 4 мс).
- `workLoop` разбирает очередь по приоритету и вызывает callback задачи.

### 3. Render: вычислить изменения

- `performWorkOnRoot` -> `renderRootConcurrent` -> `workLoopConcurrent`: «человечек» обходит Fiber-дерево и решает, кому нужен ре-рендер.
- Обход: `beginWork` (спуск, рендер компонента, создание детей) и `completeWork` (подъём, создание DOM-узлов в памяти). Порядок: есть ребёнок - вниз, нет - completeWork и к sibling.
- **Вся работа идёт в памяти над копией дерева (workInProgress), реальный DOM не трогается. Поэтому фазу можно прервать, выбросить или начать заново - пользователь ничего не заметит.**
- Прерывание: цикл уступает главный поток по тайм-слайсам (в 19.2: 25 мс, для Idle 5 мс; вариант через `shouldYield()`). Недоделанная работа продолжается в новой задаче Scheduler.

### 4. Commit: применить к DOM

- **Синхронно и атомарно, прервать нельзя**: иначе пользователь увидел бы полуобновлённый интерфейс.
- `commitRoot` выполняет три шага по порядку:
  1. before-mutation (`commitBeforeMutationEffects`): снимки до изменений (getSnapshotBeforeUpdate);
  2. mutation (`commitMutationEffects`): собственно мутации реального DOM; в конце `root.current = finishedWork` - переключение деревьев;
  3. layout (`commitLayoutEffects`): `useLayoutEffect`, синхронно, ДО отрисовки кадра.
- После commit браузер рисует кадр, и только потом отдельной задачей Scheduler выполняется `flushPassiveEffects`: это `useEffect`.

## Что нужно запомнить

1. `setState` ставит задачу, а не рендерит (Trigger).
2. Батчинг обеспечивает микротаск, приоритеты - Scheduler, неблокирующесть - postMessage (Schedule).
3. Render работает в памяти и прерываем; отсюда правило: тело компонента может выполниться несколько раз для одного обновления, поэтому оно должно быть чистым.
4. Commit синхронный и непрерываемый; сайд-эффекты живут здесь: `useLayoutEffect` до paint, `useEffect` после paint.
5. Fiber-дерево - это внутреннее представление приложения (состояние, эффекты, приоритеты каждого узла), а не просто «виртуальный DOM». Деревьев два: current и workInProgress, после commit они меняются местами.

## Вопросы для самопроверки

1. Почему Render можно прерывать, а Commit нельзя?
   (Render работает с копией в памяти, DOM не трогает; Commit мутирует реальный DOM, остановка на середине показала бы полуобновлённый UI.)
2. Почему три `setState` подряд вызывают один рендер?
   (Обновления копятся, а обработка расписания происходит в микротаске в конце события.)
3. Когда выполняется `useEffect`, а когда `useLayoutEffect`?
   (`useLayoutEffect` синхронно в commit до paint; `useEffect` асинхронно отдельной задачей после paint.)
4. Что делает пара `beginWork` / `completeWork`?
   (Спуск с рендером компонентов и созданием детей / подъём с созданием DOM-узлов в памяти.)

## Ключевые функции (v19.2.0), по фазам

| Фаза | Функции |
|---|---|
| Trigger | `dispatchSetState`, `updateContainer`, `scheduleUpdateOnFiber(root, fiber, lane)`, `ensureRootIsScheduled(root)` |
| Schedule | `processRootScheduleInMicrotask()`, `scheduleTaskForRootDuringMicrotask`, `unstable_scheduleCallback`, `workLoop(initialTime)` |
| Render | `performWorkOnRoot(root, lanes, forceSync)`, `renderRootConcurrent`, `workLoopConcurrent(nonIdle)`, `performUnitOfWork`, `beginWork`, `completeWork` |
| Commit | `commitRoot` (14 параметров), `commitBeforeMutationEffects`, `commitMutationEffects`, `commitLayoutEffects`, `flushPassiveEffects` |

Далее: Урок 2, Initial Mount - как React строит первое Fiber-дерево и реальный DOM с нуля.
