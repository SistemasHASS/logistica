# -*- coding: utf-8 -*-
"""
Visor de Documentacion - Sistema Logistica
=========================================
Servidor local autocontenido. Sirve la carpeta del proyecto en
http://localhost:8791 y abre el portal de documentacion.

Raiz del servidor (se busca en este orden):
  1. Carpeta que contiene docs/manuales-roles/index.html
     (exe junto a docs/ -> sirve la raiz del proyecto, asi los
      documentos sueltos de la raiz tambien son accesibles)
  2. Carpeta "proj" embebida dentro del .exe (docs/ + archivos raiz)
  3. Carpeta que contiene manuales-roles/index.html (docs/ suelto)

Para detener: cerrar esta ventana.
"""
import functools
import http.server
import os
import socket
import sys
import threading
import time
import webbrowser

PORT = 8791
PORTAL = 'manuales-roles/index.html'


def _has(root, rel):
    return root and os.path.isfile(os.path.join(root, rel.replace('/', os.sep)))


def find_root():
    """Devuelve (raiz_a_servir, entrada_relativa)."""
    exe_dir = (os.path.dirname(os.path.abspath(sys.executable))
               if getattr(sys, 'frozen', False)
               else os.path.dirname(os.path.abspath(__file__)))
    meipass = getattr(sys, '_MEIPASS', None)
    candidatos = [
        os.path.dirname(exe_dir),          # script/exe dentro de docs/ -> raiz proyecto
        exe_dir,                            # exe en la raiz del proyecto
        os.getcwd(),                        # cwd
        os.path.join(meipass, 'proj') if meipass else None,   # bundle embebido
    ]
    for c in candidatos:
        if _has(c, os.path.join('docs', PORTAL)):
            return c, 'docs/' + PORTAL
    # fallback: carpeta que ES docs/ (o docs embebida sin raiz)
    for c in candidatos + ([os.path.join(meipass, 'docs')] if meipass else []):
        if _has(c, PORTAL):
            return c, PORTAL
    return None, None


ENTRY = PORTAL      # entrada relativa a la raiz servida
PREFIX = ''         # 'docs' si se sirve la raiz del proyecto


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_GET(self):
        path = self.path.split('?')[0]
        if path in ('/', ''):
            self.send_response(302)
            self.send_header('Location', '/' + ENTRY)
            self.end_headers()
            return
        # Compatibilidad: /manuales-roles/... -> /docs/manuales-roles/...
        if PREFIX and path.startswith('/manuales-roles/'):
            self.send_response(302)
            self.send_header('Location', '/' + PREFIX + self.path)
            self.end_headers()
            return
        super().do_GET()


def main():
    global ENTRY, PREFIX
    root, entry = find_root()
    if not root:
        print('ERROR: no se encontro la documentacion (docs/manuales-roles/).')
        input('Enter para salir...')
        return
    ENTRY = entry
    PREFIX = 'docs' if entry.startswith('docs/') else ''

    url = f'http://localhost:{PORT}/{entry}'

    # Ya hay una instancia corriendo? -> solo abrir el navegador
    s = socket.socket()
    try:
        s.bind(('127.0.0.1', PORT))
        s.close()
    except OSError:
        webbrowser.open(url)
        print('La documentacion ya esta corriendo en otra ventana.')
        time.sleep(3)
        return

    server = http.server.ThreadingHTTPServer(
        ('0.0.0.0', PORT),
        functools.partial(Handler, directory=root))

    threading.Timer(0.8, lambda: webbrowser.open(url)).start()

    ip_lan = ''
    try:
        sk = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sk.connect(('8.8.8.8', 80))
        ip_lan = sk.getsockname()[0]
        sk.close()
    except OSError:
        pass

    print('=' * 58)
    print('  VISOR DE DOCUMENTACION - SISTEMA LOGISTICA')
    print('=' * 58)
    print(f'  Sirviendo : {root}')
    print(f'  Portal    : {url}')
    if ip_lan:
        print(f'  Red local : http://{ip_lan}:{PORT}/{entry}')
        print('            <- usa esta URL en el celular')
        print('               (misma red Wi-Fi)')
    print()
    print('  Deja esta ventana abierta mientras consultas la')
    print('  documentacion. Para cerrar el servicio, cierra')
    print('  esta ventana o presiona Ctrl+C.')
    print('=' * 58)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
