# Урок 3. Re-render: как React обновляет уже смонтированное дерево

Статья: [How does React re-render internally?](https://jser.dev/2023-07-18-how-react-rerenders/). Сигнатуры сверены с исходниками facebook/react v19.2.0 (react-reconciler) и подтверждены через актуальную документацию/сорсы react.dev (context7, `/react/react/v19.2.7`).

## Теория

Ре-рендер отличается от монтажа (Урок 2) одним фактом: у React уже есть **current-дерево** с настоящим DOM. Задача теперь не «построить с нуля», а «понять, что изменилось».

**Trigger.** `dispatchSetState(fiber, queue, action)` берёт приоритет через `requestUpdateLane(fiber)` (клик -> `SyncLane`, высокий приоритет) и кладёт update в очередь файбера. Дальше как в Уроке 1: `scheduleUpdateOnFiber`.

**Double buffering: alternate.** Вместо новых файберов React переиспользует память через `createWorkInProgress(current, pendingProps)`:

```js
let workInProgress = current.alternate;
if (workInProgress === null) {
  workInProgress = createFiber(current.tag, pendingProps, current.key, current.mode);
  workInProgress.alternate = current;
  current.alternate = workInProgress;
} else {
  workInProgress.pendingProps = pendingProps;
  workInProgress.flags = NoFlags;
}
```

Файберов на дерево всегда максимум два: current и его alternate. Ни разу больше двух версий одного узла аллоцировать не нужно.

**beginWork на обновлении: сравнение по ссылке.** Ключевой момент всего урока:

```js
if (current !== null) {
  const oldProps = current.memoizedProps;
  const newProps = workInProgress.pendingProps;
  if (oldProps !== newProps || hasLegacyContextChanged()) {
    didReceiveUpdate = true;               // считаем, что обновление есть
  } else {
    const hasScheduledUpdateOrContext = checkScheduledUpdateOrContext(current, renderLanes);
    if (!hasScheduledUpdateOrContext) {
      didReceiveUpdate = false;
      return attemptEarlyBailoutIfNoScheduledUpdate(current, workInProgress, renderLanes); // BAILOUT
    }
  }
}
```

Сравнение `oldProps !== newProps` **по ссылке**, не shallow-equal. А JSX при каждом рендере родителя создаёт новые объекты props. Значит: если родитель перерендерился, у всех его прямых детей `pendingProps` окажется новым объектом, и bailout не сработает, даже если содержимое такое же. Отсюда и берётся смысл `React.memo` (см. ниже) и Урок модуля 4 про bailout.

**Bailout: почему непричастные соседи не рендерятся.** У каждого файбера есть `lanes` (своя работа) и `childLanes` (есть ли работа у поддерева). Если `childLanes` не пересекается с `renderLanes` — `attemptEarlyBailoutIfNoScheduledUpdate` возвращает `null`, и React даже не спускается в это поддерево. Так соседние компоненты, не связанные с обновившимся состоянием, вообще не участвуют в этом рендере.

**React.memo уточняет правило.** `updateMemoComponent` / `updateSimpleMemoComponent` сравнивают `prevProps`/`nextProps` через `shallowEqual` (или свой `compare`), а не по ссылке. Если поверхностно равны и `ref` тот же — вызывается тот же `bailoutOnAlreadyFinishedWork`. Но подтверждённый нюанс из исходников: bailout всё равно блокируется, если у файбера есть своё запланированное обновление (`checkScheduledUpdateOrContext`) — свой `useState` или изменившийся Context пробьют memo насквозь.

**reconcileChildren: diff детей.** Для обновления (`current !== null`) работает `reconcileChildFibers` (в отличие от «немого» `mountChildFibers` при монтаже). Для каждого элемента:
- тип совпал с существующим файбером -> переиспользуть (`useFiber`), пометить `Update`, если поменялись props/текст;
- тип не совпал -> старый файбер в `deletions` родителя (флаг `ChildDeletion`), новый файбер с флагом `Placement`.

**completeWork на обновлении: где теперь считается diff.** Здесь важное отличие v19.2.0 от статьи (React 18). В 18-й версии `completeWork` сам вызывал `prepareUpdate`/`diffProperties` и складывал готовый `updatePayload` в `updateQueue`. В 19.2.0 `updateHostComponent` в completeWork делает **только** дешёвую проверку `oldProps === newProps` (по ссылке) и, если не равны, просто ставит флаг `markUpdate` (`flags |= Update`) без вычисления diff. Сам diff свойств (`updateProperties`) переехал в **commit-фазу**, в `commitUpdate(domElement, type, oldProps, newProps, internalInstanceHandle)` (react-dom-bindings). Итог для понимания архитектуры не меняется: «что нужно обновить» решает Render, а «как именно» вычисляется и применяется в Commit; изменилось только то, в какой момент Commit-фазы происходит сам diff атрибутов.

**Commit.** Порядок `commitMutationEffectsOnFiber`: сначала удаления (`commitDeletionEffects`, вызывает `componentWillUnmount`/cleanup эффектов), затем дети рекурсивно, затем сам узел. Для новых/перемещённых элементов — `commitPlacement`, для изменённых — `commitUpdate` (атрибуты) или `commitTextUpdate` (текст).

## В нашем магазине

Покупатель на странице `/products` кликает свотч «olive» на карточке Element Sofa. В гриде рядом лежат ещё 11 карточек `ProductCard`.

1. **Trigger**: `setSelectedColor('olive')` в этой конкретной карточке -> `dispatchSetState` на её файбере, `lanes` помечен `SyncLane`.
2. **workInProgress через alternate**: React не создаёт новый файбер `ProductCard`, а переиспользует alternate этой карточки.
3. **beginWork**: `oldProps !== newProps`? У `ProductCard` реально новых props от родителя нет (родитель не перерендеривался), но `current.memoizedState` (сам `selectedColor`) изменился -> `hasScheduledUpdateOrContext` = true из-за собственного lane. Компонент рендерится: `selected` пересчитывается на «olive».
4. **reconcileChildren внутри ProductCard**: сравниваются старые и новые дети. `img.src` и текст `PriceTag` изменились -> `markUpdate` на этих файберах. Структура `article > Link > ...` не поменялась, значит `Placement`/`Deletion` не нужны, только `Update`.
5. **Соседние 11 карточек**: их файберы вообще не были помечены (никто не вызывал на них `dispatchSetState`), значит их `childLanes` пусты. `attemptEarlyBailoutIfNoScheduledUpdate` останавливает React ещё до входа в их поддерево. React их не рендерит, не диффит, не трогает — вот источник производительности.
6. **Commit**: `commitUpdate` обновляет `src` у `img` и текст цены; в DOM за пределами этой карточки не меняется ничего.

Если бы вместо `ProductCard` рендерился весь грид товаров заново (например, родительский компонент страницы перерендерился из-за смены сортировки), у всех 12 карточек `pendingProps` стали бы новыми объектами по ссылке — и без `React.memo` каждая карточка прошла бы `beginWork` заново, даже если её данные не изменились. Это ровно тот сценарий, который разберём подробно в модуле 4 (`React.memo`, `key`, bailout).

## Практика руками

1. В Storybook или dev-сборке открыть страницу с гридом (`routes/products/index.tsx`).
2. React DevTools -> Profiler -> Highlight updates when components render.
3. Кликнуть свотч на одной карточке: подсветится только эта карточка, соседние — нет. Это bailout вживую.
4. В обычных DevTools (Sources) поставить брейкпоинт в `updateHostComponent` (react-dom dev-сборка) и в `commitUpdate`: убедиться, что они срабатывают только для файберов `img`/`span` внутри кликнутой карточки.
5. Эксперимент: временно оберните родителя грида в лишний `key={Date.now()}` или пересоздайте массив товаров при каждом рендере — посмотрите в Profiler, как подсвечиваются уже ВСЕ карточки при любом клике (последствие сравнения по ссылке).

## Карточки

| Вопрос | Ответ |
|---|---|
| Чем ре-рендер отличается от монтажа по данным? | Есть current-дерево с DOM; строится workInProgress против него, а не с нуля |
| Что такое alternate? | Переиспользуемая пара файбера; на узел никогда не больше двух версий (current + workInProgress) |
| Как beginWork сравнивает props при обновлении? | По ссылке (`oldProps !== newProps`), не shallow-equal |
| Почему JSX почти всегда даёт didReceiveUpdate=true у детей? | Каждый рендер создаёт новые объекты props для потомков |
| Что решает, войдёт ли React в поддерево при обновлении? | childLanes файбера: пересекаются ли с renderLanes |
| Что делает bailoutOnAlreadyFinishedWork? | Ранний выход без рендера, если нет ни своего update, ни work в childLanes |
| Чем React.memo сравнивает props? | shallowEqual (или свой compare), а не по ссылке |
| Что пробивает bailout даже под React.memo? | Собственное запланированное обновление файбера или изменившийся Context |
| Где в v19.2.0 вычисляется diff атрибутов DOM? | В commit-фазе, в commitUpdate (react-dom-bindings), не в completeWork |
| Какие три флага расставляет reconcileChildren? | Update (сам элемент изменился), Placement (новый/перемещённый), ChildDeletion (у родителя, при удалении) |
| В каком порядке commit применяет мутации? | Сначала удаления, потом дети рекурсивно, потом сам узел |

## Самопроверка

1. У ProductCard нет пропсов, зависящих от родителя, поэтому что именно заставляет React всё равно зайти в beginWork этой карточки при клике?
2. Если бы `ColorSwatches` был обёрнут в `React.memo`, а `ProductCard` перерендерился из-за клика по своему же свотчу, отрендерится ли `ColorSwatches` заново? Почему?
3. Почему в статье (React 18) diff атрибутов происходил в completeWork, а в 19.2.0 переехал в commitUpdate? Какую проблему это решает (подсказка: completeWork это ещё прерываемая Render-фаза)?

Далее: Урок 4 (модуль 1), обход Fiber-дерева в деталях, либо, если хотите держаться сюжета, можно заглянуть в модуль 4 — bailout и React.memo — раз мы уже коснулись темы. Скажите, какой порядок предпочитаете.
