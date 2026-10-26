"""Local browser ↔ Roblox Studio bridge; standard library only."""
import json
import secrets
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

HTML = (Path(__file__).parent / "index.html").read_text(encoding="utf-8")
class State:
    def __init__(self, token=None):
        self.token = token or secrets.token_urlsafe(24)
        self.lock = threading.Lock()
        self.queue = []
        self.next_id = 1

def make_handler(state):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args): pass
        def reply(self, code, data):
            body = json.dumps(data, ensure_ascii=False).encode()
            self.send_response(code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
        def guard(self):
            if self.headers.get("Host") not in ("127.0.0.1:8765", "localhost:8765") or self.headers.get("Origin") not in (None, "http://127.0.0.1:8765", "http://localhost:8765"):
                self.reply(403, {"error": "Origem bloqueada"})
                return False
            return True
        def auth(self):
            if not secrets.compare_digest(self.headers.get("X-StudioPilot-Token", ""), state.token):
                self.reply(401, {"error": "Token inválido"})
                return False
            return True
        def do_GET(self):
            if not self.guard(): return
            path = urlsplit(self.path).path
            if path == "/":
                body = HTML.encode()
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Security-Policy", "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            if path not in ("/api/status", "/api/poll"):
                return self.reply(404, {"error": "Não encontrado"})
            if not self.auth(): return
            with state.lock:
                if path == "/api/status": return self.reply(200, {"pending": len(state.queue)})
                messages = state.queue[:]
                state.queue.clear()
            self.reply(200, {"messages": messages})
        def do_POST(self):
            if not self.guard() or not self.auth(): return
            if urlsplit(self.path).path != "/api/messages":
                return self.reply(404, {"error": "Não encontrado"})
            if self.headers.get("Content-Type", "").split(";")[0] != "application/json":
                return self.reply(415, {"error": "Use JSON"})
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if not 0 < size <= 4096: return self.reply(413, {"error": "Tamanho inválido"})
                payload = json.loads(self.rfile.read(size))
                message = payload.get("message") if isinstance(payload, dict) else None
                if not isinstance(message, str) or not 0 < len(message.strip()) <= 1000:
                    return self.reply(400, {"error": "Mensagem inválida"})
            except (ValueError, UnicodeError):
                return self.reply(400, {"error": "JSON inválido"})
            with state.lock:
                if len(state.queue) >= 30: return self.reply(429, {"error": "Fila cheia"})
                item = {"id": state.next_id, "message": message.strip()}
                state.next_id += 1
                state.queue.append(item)
            self.reply(201, {"queued": True, "id": item["id"]})
    return Handler

def main():
    state = State()
    print("StudioPilot v0.1 | http://127.0.0.1:8765")
    print("TOKEN (navegador e plugin):", state.token, flush=True)
    server = ThreadingHTTPServer(("127.0.0.1", 8765), make_handler(state))
    try: server.serve_forever()
    except KeyboardInterrupt: pass
    finally: server.server_close()

if __name__ == "__main__": main()
