from flask import Flask
from flask_jwt_extended import JWTManager, create_refresh_token, set_refresh_cookies
app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = "super-secret"
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
jwt = JWTManager(app)

with app.test_request_context():
    token = create_refresh_token("user1")
    resp = app.make_response("ok")
    set_refresh_cookies(resp, token)
    cookie_header = resp.headers.get("Set-Cookie")
    print(cookie_header)
