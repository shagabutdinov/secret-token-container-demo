const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
app.use(cookieParser());

const SECRET_TOKEN = "ohnai0jacohfie0ewaeWai0eethaephe";

app.get("/api", (req, res) => {
  if (req.headers["x-secret-token"] === SECRET_TOKEN) {
    res.json({ response: "🔓 Secret API response 🔓" });
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

app.get("/client", (req, res) => {
  const token = req.cookies?.secretToken || "";

  res.cookie("secretToken", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
  });

  if (!token) {
    res.send('"unauthorized";');
    return;
  }

  res.send(`
    const token = "${token}";
    const originalFetch = window.fetch;

    window.fetchSecretAPI = (url, options) => {
      const urlObject = new URL(window.location.origin + "/api");
      urlObject.search = (new URLSearchParams({ url })).toString();

      return originalFetch(urlObject.toString(), {
        ...options,
        headers: {
          ...(options ?? {}).headers,
          'X-Secret-Token': token,
        },
      });
    }
  `);
});

app.get("/login", (req, res) => {
  res.cookie("secretToken", SECRET_TOKEN, { httpOnly: true, path: "/" });
  res.redirect("/?xss=" + req.query.xss);
});

/*
 * This is the endpoint that is vulnerable to XSS attacks.
 * Use the request http://localhost:3000/?xss=JAVASCRIPT_CODE
 * to inject any html and trigger the XSS attack.
 */
app.get("/", (req, res) => {
  res.send(`
  <html>
    <head>
      <!-- Insert this before loading any other resource -->
      <script src="/client" type="text/javascript"></script>
      <script type="text/javascript">
        window.onload = function() {
          if (window.fetchSecretAPI) {
            document.getElementById("authorized-area").style.display = "block";
          } else {
            document.getElementById("unauthorized-area").style.display = "block";
          }
        };
      </script>
    </head>
    <body>
      <div id="authorized-area" style="display: none">
        ${
          req.query.xss
            ? `<div>${
                // the xss is left there on purpose to experiment with the attack
                req.query.xss
              }</div>
              <div>
              The following code was just embedded as a plain HTML simulating
              the XSS attack: <br /> 😱😱😱 <pre> ${req.query.xss
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;")}</pre> 😱😱😱</div>`
            : ""
        }

        <h1>Response:</h1>
        <div id="response"></div>

        <button onclick="
          fetchSecretAPI('https://api.example.com/secret')
            .then((response) => response.json())
            .then((value) => {
              document.getElementById('response').innerText = JSON.stringify(value);
            })
        ">Fetch Secret API</button>

        <button onclick="
          fetch(window.location.origin + '/api')
            .then((response) => response.json())
            .then((value) => {
              document.getElementById('response').innerText = JSON.stringify(value);
            })
        ">Fetch Secret API (without token)</button>
      </div>

      <div id="unauthorized-area" style="display: none">
        <h1>Login</h1>

        <form method="GET" action="/login">

          <label for="xss">
            Enter your javascript that would steal secret token here:<br />
            <textarea name="xss" placeholder="Xss" rows="10" style="width: 100%">
<script type="text/javascript">
fetch('/client').then(r => r.text()).then(t => console.log("this string should contain token", t));
</script>
            </textarea>
          </label>

          <button type="submit">Login</button>
        </form>
      </div>
    </body>
  </html>
  `);
});

const port = 3000;
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
