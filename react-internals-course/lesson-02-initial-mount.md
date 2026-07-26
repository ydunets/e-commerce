# Урок 2. Initial Mount: как React строит DOM с нуля

Статья: [Initial Mount, how does it work?](https://jser.dev/2023-07-14-initial-mount/). Сигнатуры: v19.2.0 (в статье React 18: тег IndeterminateComponent из статьи в 19-й версии удалён, функциональные компоненты помечаются сразу).

## Теория

**Шаг 0, createRoot.** Создаются два объекта: `FiberRootNode` (владелец приложения: контейнер, очереди, указатель current) и пустой файбер `HostRoot`. Монтаж для React не спецрежим, а обычное обновление пустого дерева: «у HostRoot появился ребёнок».

**Trigger.** `root.render(element)` -> `updateContainer`: объект обновления с payload = элемент кладётся в очередь HostRoot -> `scheduleUpdateOnFiber`.

**Render (синхронный).** Первый рендер идёт на блокирующей DefaultLane, прерывать его незачем: работает `workLoopSync`. `prepareFreshStack` создаёт workInProgress-копию HostRoot, дальше обход:

- `beginWork` (спуск): создаёт файберы. HostRoot достаёт элемент из очереди; функциональный компонент исполняется через `renderWithHooks` (здесь работает useState); host-компонент создаёт файберы детей из props.children. DOM не создаётся.
- `completeWork` (подъём): создаёт DOM в памяти. `createInstance` -> `appendAllChildren` (прикрепить уже созданных DOM-детей) -> `finalizeInitialChildren` (атрибуты, события, текст). DOM-дерево собирается снизу вверх и до commit не видно.

**Два правила экономии:**
- `mountChildFibers`: при монтаже дети создаются без флагов; флаг `Placement` получает только прямой ребёнок HostRoot. В commit будет ОДИН `appendChild` всего дерева.
- Единственный ребёнок-строка (`<a>jser.dev</a>`) не получает своего файбера: текст запишут через textContent. Динамический текст (`{count}`) получает файбер, ему предстоит меняться отдельно.

**Commit.** `commitMutationEffects` находит Placement -> `commitPlacement` -> `appendChildToContainer`: одна вставка готового дерева. Затем `root.current = finishedWork`.

## В нашем магазине

Чистый initial mount у нас происходит в **Storybook**: там ProductCard монтируется через createRoot (в боевом клиенте вместо этого гидрация, `entry-client.tsx` -> hydrateRoot, это модуль 7).

Монтаж стори ProductCard:

1. beginWork спускается: `ProductCard` (исполняется функция, `useState(product.colors[0]?.color)` инициализирует state) -> `article` -> роутерный `Link` -> `img`, `span`-ы -> `ColorSwatches` -> `button`-свотчи.
2. completeWork поднимается: сначала создаются листовые DOM (`img`, `span`), потом `a` c прикреплёнными детьми, в конце `article`.
3. Файберы есть у всех, включая `ProductCard`, `Link`, `ColorSwatches`, `PriceTag`; DOM-узлы только у host-элементов: `article`, `a`, `img`, `span`, `button`.
4. Флаг Placement стоит на одном файбере у корня стори; вся карточка попадает на страницу одним appendChild.

## Практика руками

1. В Storybook открыть стори ProductCard, в DevTools поставить брейкпоинт в `completeWork` (react-dom dev-сборка).
2. Перезагрузить: на каждой остановке смотреть `workInProgress.type` и порядок: листья завершаются раньше родителей.
3. В консоли на паузе внутри completeWork для host-узла: у файбера появляется `stateNode` (настоящий DOM-элемент), но `document.querySelector('article')` ещё null: дерево в памяти.
4. Снять брейкпоинты, поставить один в `commitPlacement`: убедиться, что вставка происходит один раз.

## Карточки

| Вопрос | Ответ |
|---|---|
| Что создаёт createRoot до рендера? | FiberRootNode + пустой файбер HostRoot (current) |
| Чем монтаж отличается от обновления для React? | Ничем принципиально: это обновление пустого дерева |
| Почему первый рендер синхронный? | DefaultLane блокирующая; прерывать пустой экран незачем (workLoopSync) |
| Где создаются файберы? | beginWork, при спуске |
| Где создаётся DOM? | completeWork, при подъёме, в памяти (createInstance + appendAllChildren) |
| Когда DOM попадает на страницу? | Только в commit: commitPlacement -> appendChildToContainer |
| Почему Placement только на корне поддерева? | Дети уже прикреплены к родителю в памяти; достаточно одного appendChild |
| Какая разница mountChildFibers / reconcileChildFibers? | При монтаже дети создаются без флагов побочных эффектов |
| Когда строка не получает файбер? | Единственный ребёнок-строка: пишется через textContent |
| Зачем файбер компоненту без DOM (Link)? | Хранить хуки, props для сравнения, эффекты; DOM-дерево лишь проекция Fiber-дерева |

## Самопроверка

1. Почему Placement стоит только на корне? (пройдено: один appendChild, дети уже собраны)
2. Где создаётся `<a>` и когда он появляется на странице? (пройдено: completeWork в памяти / commit)
3. Почему у Link есть файбер, но нет DOM-узла? (пройдено: файбер = единица работы и хранилище хуков; DOM только у host-элементов)
4. В каком порядке completeWork создаст DOM для article, a, img из ProductCard? (пройдено: img -> a -> article, листья раньше родителей)
