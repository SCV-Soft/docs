import React, { useState } from 'react';
import clsx from 'clsx';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
import Translate from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { usePrismTheme } from '@docusaurus/theme-common';
import styles from './styles.module.css';

function Header({ children }) {
  return <div className={clsx(styles.playgroundHeader)}>{children}</div>;
}
function LivePreviewLoader() {
  // Is it worth improving/translating?
  // eslint-disable-next-line @docusaurus/no-untranslated-text
  return <div>Loading...</div>;
}
function ResultWithHeader() {
  return (
    <>
      <Header>
        <Translate
          id="theme.Playground.result"
          description="The result label of the live codeblocks"
        >
          Result
        </Translate>
      </Header>
      {/* https://github.com/facebook/docusaurus/issues/5747 */}
      <div className={styles.playgroundPreview}>
        <BrowserOnly fallback={<LivePreviewLoader />}>
          {() => (
            <>
              <LivePreview />
              <LiveError />
            </>
          )}
        </BrowserOnly>
      </div>
    </>
  );
}
function ThemedLiveEditor() {
  const isBrowser = useIsBrowser();
  return (
    <LiveEditor
      // We force remount the editor on hydration,
      // otherwise dark prism theme is not applied
      key={String(isBrowser)}
      className={styles.playgroundEditor}
    />
  );
}
function EditorWithHeader() {
  return (
    <>
      <Header>
        <Translate
          id="theme.Playground.liveEditor"
          description="The live editor label of the live codeblocks"
        >
          Live Editor
        </Translate>
      </Header>
      <ThemedLiveEditor />
    </>
  );
}

export default function Playground({ children, transformCode, ...props }) {
  const {
    siteConfig: { themeConfig },
  } = useDocusaurusContext();
  const {
    liveCodeBlock: { playgroundPosition },
  } = themeConfig;
  const prismTheme = usePrismTheme();
  const noInline = props.metastring?.includes('noInline') ?? false;
  const [code, setCode] = useState(children.replace(/\n$/, ''));

  transformCode =
    transformCode ??
    (() => {
      const importLines = /^import\s*(?:(?:(?:[\w*\s{},]*)\s*from)?\s*['"].+['"])?.*?(?:;|$)/gm;
      const removedImports = code.replace(importLines, '');
      return `
  (async () => {
    const oldConsole = console;
    const renders = [];
    console = {
      log: (...args) => {
        for(const arg of args) {
          renders.push(<div>{JSON.stringify(arg)}</div>);
        }
      }
    };
    ${removedImports}; 
    console = oldConsole;
    render(<div>{renders}</div>);
  })();`;
    });
  const hidden = {};

  const runCode = e => {
    e.preventDefault();
    const code = e.target.parentNode.childNodes[0].childNodes[1].childNodes[0].innerHTML;
    setCode(code.replace(/\n$/, ''));
  };

  return (
    <div className={styles.playgroundContainer}>
      {/* @ts-expect-error: type incompatibility with refs */}
      <LiveProvider
        code={code}
        noInline={noInline}
        transformCode={transformCode}
        theme={prismTheme}
        {...props}
      >
        <div>
          <EditorWithHeader />
        </div>
        <div style={hidden}>
          <ResultWithHeader />
        </div>
      </LiveProvider>
      <button id="my-button" onClick={runCode}>
        Run this Code!
      </button>
    </div>
  );
}
