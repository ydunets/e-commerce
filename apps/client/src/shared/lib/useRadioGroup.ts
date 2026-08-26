import { type KeyboardEvent, useRef } from 'react';

export type TRadioOption = {
  value: string;
  disabled?: boolean;
};

const NOTHING_SELECTED = -1;

const IN_TAB_SEQUENCE = 0;
const OUT_OF_TAB_SEQUENCE = -1;

/**
 * The WAI-ARIA radiogroup keyboard contract shared by the kit's composite radio
 * groups: one tab stop, arrows moving the selection with wrapping, Home and End
 * for the extremes, disabled options skipped, focus following the selection.
 */
export function useRadioGroup(
  options: TRadioOption[],
  value: string | null,
  onChange: (value: string) => void,
) {
  const buttons = useRef(new Map<string, HTMLButtonElement>());

  const selectable = options.filter((option) => !option.disabled);
  const tabStop =
    selectable.find((option) => option.value === value) ?? selectable[0];

  const select = (optionValue: string) => {
    onChange(optionValue);
    buttons.current.get(optionValue)?.focus({ preventScroll: true });
  };

  const selectFrom = (from: number, step: number) => {
    const count = options.length;
    for (let hop = 1; hop <= count; hop += 1) {
      const option = options[(((from + step * hop) % count) + count) % count];
      if (!option.disabled) return select(option.value);
    }
  };

  const moveSelection = (step: number) => {
    const current = options.findIndex((option) => option.value === value);
    // With nothing selected, a backward step should land on the last option,
    // which is where index 0 wraps to.
    const from = current === NOTHING_SELECTED && step < 0 ? 0 : current;
    selectFrom(from, step);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        moveSelection(1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        moveSelection(-1);
        break;
      // Home and End are a single step wrapping around from the far end.
      case 'Home':
        selectFrom(options.length - 1, 1);
        break;
      case 'End':
        selectFrom(0, -1);
        break;
      default:
        return;
    }

    event.preventDefault();
  };

  const optionRef =
    (optionValue: string) => (node: HTMLButtonElement | null) => {
      if (node) buttons.current.set(optionValue, node);
      else buttons.current.delete(optionValue);
    };

  const tabIndexFor = (optionValue: string) =>
    optionValue === tabStop?.value ? IN_TAB_SEQUENCE : OUT_OF_TAB_SEQUENCE;

  return { handleKeyDown, optionRef, select, tabIndexFor };
}
