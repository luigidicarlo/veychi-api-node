const express = require("express");
const axios = require("axios");
const fs = require("fs");
const Response = require("../models/Response.model");
const Err = require("../models/Error.model");
const {validateToken} = require('../middlewares/jwt-auth.middleware');

const app = express();

require("../config/app.config");

app.post("/media", validateToken, async (req, res) => {
  const files = req.files.images;
  const authUri = process.env.WP_AUTH;
  const mediaUri = process.env.WP_MEDIA;
  let uploaded = null;

  try {
    const authenticated = await axios.post(authUri, {
      username: process.env.WP_USER,
      password: process.env.WP_PASS
    });

    if (files.length) {
      const promises = files.map(file => {
        return axios(mediaUri, {
          method: "post",
          headers: {
            "content-type": `${file.mimetype}`,
            "content-disposition": `attachment;filename="${file.name}"`,
            Authorization: `Bearer ${authenticated.data.token}`
          },
          data: fs.createReadStream(file.tempFilePath)
        });
      });

      const uploaded = await Promise.all(promises).catch(err => {
        throw err;
      });

      const resp = [];

      uploaded.forEach(uploadResponse => {
        resp.push(uploadResponse.data);
      });

      return res.status(201).json(new Response(true, resp, null));
    } else {
      uploaded = await axios(mediaUri, {
        method: "post",
        headers: {
          "content-type": `${files.mimetype}`,
          "content-disposition": `attachment;filename="${files.name}"`,
          Authorization: `Bearer ${authenticated.data.token}`
        },
        data: fs.createReadStream(files.tempFilePath)
      }).catch(err => {
        throw err;
      });
    }

    return res.status(201).json(new Response(true, uploaded.data, null));
  } catch (err) {
    return res.status(400).json(new Response(false, null, new Err(err)));
  }
});

module.exports = app;
