"""Development preview with cache-free responses and safe live reload."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import json
import os

ROOT = Path(__file__).resolve().parent
INDEX = ROOT / 'index.html'
os.chdir(ROOT)

def version():
    stat = INDEX.stat()
    return f'{stat.st_mtime_ns}-{stat.st_size}'

class PreviewHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        super().end_headers()

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == '/__version':
            content = version().encode('ascii')
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return
        if path in ('/', '/index.html'):
            initial_version = json.dumps(version())
            content = INDEX.read_text(encoding='utf-8')
            # A running match is not interrupted. A visible banner lets the player
            # reload, while returning to the lobby applies the update automatically.
            client = '''<script>(function(){const initial=VERSION;let changed=false;
function notice(){if(document.getElementById('preview-update'))return;
const bar=document.createElement('div');bar.id='preview-update';bar.setAttribute('role','status');
bar.style.cssText='position:fixed;z-index:2147483646;top:8px;left:50%;transform:translateX(-50%);background:#ffdf42;color:#25213e;padding:10px 14px;font:bold 13px Arial,sans-serif;box-shadow:0 3px 10px #0008';
bar.textContent='Nouvelle version disponible. ';const b=document.createElement('button');
b.textContent='Actualiser';b.style.cssText='background:#292f69;color:white;border:0;padding:6px 9px;font-weight:bold;cursor:pointer';
b.onclick=function(){location.reload()};bar.appendChild(b);document.body.appendChild(bar)}
setInterval(async function(){try{if(!changed){const response=await fetch('/__version',{cache:'no-store'});if(response.ok&&await response.text()!==initial)changed=true}
if(changed){const game=document.getElementById('game');if(!game||game.classList.contains('hidden'))location.reload();else notice()}}catch(e){}},2500)})();</script>'''.replace('VERSION', initial_version)
            payload = content.replace('</body>', client + '</body>').encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        super().do_GET()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', '8000'))
    print(f'Last Signal preview: http://0.0.0.0:{port}', flush=True)
    ThreadingHTTPServer(('0.0.0.0', port), PreviewHandler).serve_forever()
