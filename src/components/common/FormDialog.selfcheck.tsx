import { StrictMode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { FormDialog } from './FormDialog';

export const formDialogSelfCheck = async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  let closeEvents = 0;
  try {
    flushSync(() => root.render(
      <StrictMode>
        <FormDialog open title="QA dialog lifecycle" onClose={() => { closeEvents++; }}>QA</FormDialog>
      </StrictMode>,
    ));
    await new Promise(resolve => setTimeout(resolve, 100));
    const dialog = host.querySelector('dialog');
    console.assert(dialog?.open, 'Dialog must remain open after StrictMode effect replay');
    console.assert(closeEvents === 0, 'Effect cleanup must not report a user close when the dialog has reopened');
    dialog?.close();
    await new Promise(resolve => setTimeout(resolve, 100));
    console.assert(closeEvents === 1, 'A real close must notify the parent once');
  } finally {
    root.unmount();
    host.remove();
  }
};
