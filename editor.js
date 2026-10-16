const source = document.getElementById('source');

window.flyerEditor = typeof CodeMirror === 'function'
  ? CodeMirror.fromTextArea(source, {
    mode: 'javascript',
    theme: 'tomorrow-night-eighties',
    lineWrapping: true,
    viewportMargin: Infinity,
    tabSize: 2,
    styleSelectedText: true
  })
  : null;

if (!window.flyerEditor) {
  source.style.visibility = 'visible';
}
