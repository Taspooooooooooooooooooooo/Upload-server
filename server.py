from datetime import datetime
from http import cookies
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse
import cgi
import html
import mimetypes
import secrets

BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"
UPLOADS_DIR.mkdir(exist_ok=True)

PROFILES = {
    "T4B-Q7L": {"name": "Profil 1", "number": "071", "folder": "profil1"}
}
SESSIONS: dict[str, str] = {}


def render_template(name: str, replacements: dict[str, str]) -> bytes:
    content = (TEMPLATES_DIR / name).read_text(encoding="utf-8")
    for key, value in replacements.items():
        content = content.replace("{{" + key + "}}", value)
    return content.encode("utf-8")


class UploadAppHandler(BaseHTTPRequestHandler):
    def get_session_key(self):
        parsed = cookies.SimpleCookie()
        parsed.load(self.headers.get("Cookie", ""))
        sid = parsed.get("sid")
        return SESSIONS.get(sid.value) if sid else None

    def send_html(self, content: bytes, status=200, headers: dict | None = None):
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        if headers:
            for key, value in headers.items():
                self.send_header(key, value)
        self.end_headers()
        self.wfile.write(content)

    def redirect(self, location: str, headers: dict | None = None):
        self.send_response(302)
        self.send_header("Location", location)
        if headers:
            for key, value in headers.items():
                self.send_header(key, value)
        self.end_headers()

    def login_page(self, message: str = ""):
        message_html = f"<div class='messages'>{html.escape(message)}</div>" if message else ""
        self.send_html(render_template("index.html", {"message": message_html}))

    def profile_page(self, key: str, message: str = ""):
        profile = PROFILES[key]
        profile_dir = UPLOADS_DIR / profile["folder"]
        profile_dir.mkdir(exist_ok=True)

        files = sorted(
            [item.name for item in profile_dir.iterdir() if item.is_file() and not item.name.endswith(".txt")],
            reverse=True,
        )
        file_items = "".join(
            f"<li><a href='/download/{html.escape(file_name)}'>{html.escape(file_name)}</a></li>"
            for file_name in files
        )
        if not file_items:
            file_items = "<li>Zatiaľ žiadne nahrané súbory.</li>"

        message_html = f"<div class='messages'>{html.escape(message)}</div>" if message else ""
        self.send_html(
            render_template(
                "profile.html",
                {
                    "profile_name": html.escape(profile["name"]),
                    "profile_number": html.escape(profile["number"]),
                    "files": file_items,
                    "message": message_html,
                },
            )
        )

    def serve_static(self, path: str):
        relative = Path(path.replace("/static/", "", 1)).name
        file_path = STATIC_DIR / relative
        if not file_path.exists():
            return self.send_error(404, "Súbor neexistuje")

        data = file_path.read_bytes()
        content_type, _ = mimetypes.guess_type(file_path.name)
        self.send_response(200)
        self.send_header("Content-Type", content_type or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path = urlparse(self.path).path
        key = self.get_session_key()

        if path.startswith("/static/"):
            return self.serve_static(path)

        if path in ("/", "/index.html"):
            return self.redirect("/profile") if key in PROFILES else self.login_page()

        if path == "/profile":
            return self.profile_page(key) if key in PROFILES else self.redirect("/")

        if path.startswith("/download/"):
            if key not in PROFILES:
                return self.redirect("/")
            filename = Path(path.replace("/download/", "", 1)).name
            file_path = UPLOADS_DIR / PROFILES[key]["folder"] / filename
            if not file_path.exists():
                return self.send_error(404, "Súbor neexistuje")

            payload = file_path.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "application/octet-stream")
            self.send_header("Content-Disposition", f"attachment; filename={filename}")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        if path == "/logout":
            parsed = cookies.SimpleCookie()
            parsed.load(self.headers.get("Cookie", ""))
            sid = parsed.get("sid")
            if sid and sid.value in SESSIONS:
                del SESSIONS[sid.value]
            return self.redirect("/", {"Set-Cookie": "sid=; Max-Age=0; Path=/; HttpOnly"})

        self.send_error(404)

    def do_POST(self):
        path = urlparse(self.path).path

        if path in ("/", "/index.html"):
            length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(length).decode("utf-8")
            access_key = parse_qs(body).get("access_key", [""])[0].strip()
            if access_key in PROFILES:
                sid = secrets.token_hex(16)
                SESSIONS[sid] = access_key
                return self.redirect("/profile", {"Set-Cookie": f"sid={sid}; Path=/; HttpOnly"})
            return self.login_page("Neplatný prístupový kľúč.")

        if path == "/profile":
            key = self.get_session_key()
            if key not in PROFILES:
                return self.redirect("/")

            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={
                    "REQUEST_METHOD": "POST",
                    "CONTENT_TYPE": self.headers.get("Content-Type", ""),
                    "CONTENT_LENGTH": self.headers.get("Content-Length", "0"),
                },
            )

            description = form.getfirst("description", "").strip()
            file_item = form["file"] if "file" in form else None

            if file_item is None or not getattr(file_item, "filename", ""):
                return self.profile_page(key, "Najprv vyberte súbor.")
            if not description:
                return self.profile_page(key, "Doplňte popis.")

            clean_name = Path(file_item.filename).name.replace("/", "_")
            stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            final_name = f"{stamp}_{clean_name}"

            profile_dir = UPLOADS_DIR / PROFILES[key]["folder"]
            profile_dir.mkdir(exist_ok=True)
            (profile_dir / final_name).write_bytes(file_item.file.read())
            (profile_dir / f"{final_name}.txt").write_text(description, encoding="utf-8")

            return self.profile_page(key, f"Súbor uložený: {final_name}")

        self.send_error(404)


if __name__ == "__main__":
    print("Server beží na http://localhost:5000")
    HTTPServer(("0.0.0.0", 5000), UploadAppHandler).serve_forever()
