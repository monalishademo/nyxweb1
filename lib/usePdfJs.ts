import { useEffect, useState } from 'react';

/**
 * Loads pdfjs-dist once and returns the module.
 * Every tool component that needs to render PDF page previews
 * should call this hook instead of loading pdfjs itself.
 */
export function usePdfJs() {
  const [pdfjs, setPdfjs] = useState<any>(null);

  useEffect(() => {
    import('pdfjs-dist').then((pdfjsModule) => {
      pdfjsModule.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsModule.version}/pdf.worker.min.mjs`;
      setPdfjs(pdfjsModule);
    });
  }, []);

  return pdfjs;
}
