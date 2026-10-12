import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { SelectField } from './Field';

export const selectFieldSelfCheck = () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    flushSync(() => root.render(
      <dialog>
        <SelectField label="QA select" value="" onChange={() => {}}>
          <option value="">Choose</option>
          <option value="1">First</option>
        </SelectField>
      </dialog>,
    ));
    const dialog = host.querySelector('dialog')!;
    const trigger = host.querySelector<HTMLButtonElement>('[role="combobox"]')!;
    dialog.showModal();
    flushSync(() => trigger.click());
    const menuEscape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    flushSync(() => trigger.dispatchEvent(menuEscape));
    console.assert(menuEscape.defaultPrevented, 'Escape must close an open select without closing its parent dialog');
    console.assert(trigger.getAttribute('aria-expanded') === 'false', 'Escape must close the select');
    const dialogEscape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    trigger.dispatchEvent(dialogEscape);
    console.assert(!dialogEscape.defaultPrevented, 'A closed select must allow Escape to close its parent dialog');
    dialog.close();
  } finally {
    root.unmount();
    host.remove();
  }
};
