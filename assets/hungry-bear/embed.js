(function () {
  'use strict';
  var egg = document.getElementById('bear-easter-egg');
  if (!egg) return;
  var frame = egg.querySelector('iframe');
  egg.addEventListener('toggle', function () {
    if (egg.open) {
      if (!frame.getAttribute('src')) frame.setAttribute('src', frame.getAttribute('data-src'));
    } else if (frame.contentWindow) {
      frame.contentWindow.postMessage('hungry-bear:pause', window.location.origin === 'null' ? '*' : window.location.origin);
    }
  });
})();
