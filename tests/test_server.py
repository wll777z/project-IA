import http.client
import json
import threading
import unittest
from http.server import ThreadingHTTPServer
from studiopilot.server import State, make_handler

class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(State("test-secret-token-123456")))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def req(self, method, path, body=None, headers=None):
        conn = http.client.HTTPConnection("127.0.0.1", self.server.server_port)
        h = {"Host": "127.0.0.1:8765", "X-StudioPilot-Token": "test-secret-token-123456"}
        h.update(headers or {})
        conn.request(method, path, body, h)
        r = conn.getresponse()
        result = r.status, r.read()
        conn.close()
        return result

    def test_auth(self):
        self.assertEqual(self.req("GET", "/api/poll", headers={"X-StudioPilot-Token": "wrong"})[0], 401)

    def test_origin(self):
        self.assertEqual(self.req("GET", "/api/status", headers={"Origin": "https://example.com"})[0], 403)

    def test_host(self):
        self.assertEqual(self.req("GET", "/api/status", headers={"Host": "example.com"})[0], 403)

    def test_send_poll(self):
        body = json.dumps({"message": "Olá Studio"}).encode()
        self.assertEqual(self.req("POST", "/api/messages", body, {"Content-Type": "application/json"})[0], 201)
        status, data = self.req("GET", "/api/poll")
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(data)["messages"][-1]["message"], "Olá Studio")

    def test_message_validation(self):
        body = json.dumps({"message": "x" * 1001}).encode()
        self.assertEqual(self.req("POST", "/api/messages", body, {"Content-Type": "application/json"})[0], 400)

if __name__ == "__main__":
    unittest.main()
