// Ajoute le manifeste et le service worker à la page exportée par Expo
const fs = require('fs');
const f = process.argv[2];
let h = fs.readFileSync(f, 'utf8');
if (!h.includes('manifest.webmanifest')) {
  const head = '<link rel="manifest" href="/cap-infirmier/manifest.webmanifest">' +
    '<meta name="apple-mobile-web-app-capable" content="yes">' +
    '<meta name="apple-mobile-web-app-title" content="CAP Infirmier">' +
    '<link rel="apple-touch-icon" href="/cap-infirmier/icon.png">' +
    '<meta name="theme-color" content="#0B1F3A">';
  const reg = '<script>if("serviceWorker" in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("/cap-infirmier/sw.js",{scope:"/cap-infirmier/"}).catch(function(){});});}</script>';
  h = h.replace('</head>', head + '</head>').replace('</body>', reg + '</body>');
  fs.writeFileSync(f, h);
}
console.log('PWA ok');
