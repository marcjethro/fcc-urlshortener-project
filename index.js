require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const dns = require("dns");
const bodyParser = require("body-parser");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI);
const urlSchema = new mongoose.Schema({
  url: String,
  short_url: Number,
});
const Urlmodel = mongoose.model("Urlmodel", urlSchema);

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.post("/api/shorturl", bodyParser.urlencoded({ extended: true }));

const urlPattern =
  /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
app.post("/api/shorturl", (req, res) => {
  let url = req.body.url;
  Urlmodel.findOne({ url: url })
    .then((url_pair) => {
      if (url_pair) {
        let short_url = url_pair["short_url"];
        res.json({ original_url: url, short_url });
      } else {
        dns.lookup(url, (err, data) => {
          if (err || !urlPattern.test(url)) {
            res.json({ error: "invalid url" });
          } else {
            Urlmodel.countDocuments()
              .then((count) => {
                console.log(count);
                let new_url = new Urlmodel({ url, short_url: count });
                new_url.save();
                res.json({ original_url: url, short_url: count });
              })
              .catch((err) => {
                console.error(err);
                res.json({ error: "failed count" });
              });
          }
        });
      }
    })
    .catch((err) => {
      console.error(err);
      res.json({ error: "failed find" });
    });
});

app.get("/api/shorturl/:short_url", (req, res) => {
  Urlmodel.findOne({ short_url: req.params.short_url })
    .then((url_pair) => {
      if (url_pair) {
        res.redirect(url_pair["url"]);
      } else {
        res.json({ error: "No short URL found for the given input" });
      }
    })
    .catch((err) => {
      console.error(err);
      res.json({ error: "failed find" });
    });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
