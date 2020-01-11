const express = require("express");
const axios = require("axios");
const fs = require("fs");
const Response = require("../models/Response.model");
const { model: Media } = require("../models/Media.model");
const Err = require("../models/Error.model");
const { validateToken } = require("../middlewares/jwt-auth.middleware");
const msg = require("../utils/messages");

const fileUpload = require("express-fileupload");

const app = express();

// Allow file uploading
app.use(fileUpload({ useTempFiles: true }));

require("../config/app.config");

app.post("/media", validateToken, async (req, res) => {
  const authUri = process.env.WP_AUTH;
  const mediaUri = process.env.WP_MEDIA;
  let uploaded = null;

  if (!req.files)
    return res.status(400).json(new Response(false, null, msg.noMediaUploaded));

  const files = req.files.images;

  try {
    const authenticated = await axios({
      method: "post",
      url: authUri,
      headers: {
        "Content-Type": "application/json"
      },
      data: {
        username: process.env.WP_USER,
        password: process.env.WP_PASS
      }
    })
    .catch(err => { throw err; });

    if (files.length) {
      const promises = files.map(file => {
        return axios({
          method: "post",
          url: mediaUri,
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

      const savedPromises = uploaded.map(uploadResponse => {
        const aux = new Media({
          user: req.user._id,
          url: uploadResponse.data.media_details.sizes.full.source_url,
          wpId: uploadResponse.data.id
        });
        return aux.save();
      });

      const resp = await Promise.all(savedPromises).catch(err => {
        throw err;
      });

      return res.status(201).json(new Response(true, resp, null));
    } else {
      uploaded = await axios({
        method: "post",
        url: mediaUri,
        headers: {
          "content-type": `${files.mimetype}`,
          "content-disposition": `attachment;filename="${files.name}"`,
          Authorization: `Bearer ${authenticated.data.token}`
        },
        data: fs.createReadStream(files.tempFilePath)
      }).catch(err => {
        throw err;
      });

      const media = new Media({
        user: req.user._id,
        url: uploaded.data.media_details.sizes.full.source_url,
        wpId: uploaded.data.id
      });

      return res.status(201).json(new Response(true, media, null));
    }
  } catch (err) {
    return res.status(400).json(new Response(false, null, new Err(err)));
  }
});

app.delete('/media/:id', validateToken, async (req, res) => {
  const wpId = Number(req.params.id);
  const authUri = process.env.WP_AUTH;
  const mediaUri = process.env.WP_MEDIA;

  try {
    const media = await Media.findOne({ wpId });

    if (String(media.user) !== String(req.user._id)) return res.status(401).json(new Response(false, null, msg.unauthorizedMedia));
  
    const authenticated = await axios({
      method: "post",
      url: authUri,
      headers: {
        "Content-Type": "application/json"
      },
      data: {
        username: process.env.WP_USER,
        password: process.env.WP_PASS
      }
    })
    .catch(err => { throw err; });
  
    const wpDelete = await axios({
      url: `${mediaUri}/${wpId}?force=true`,
      method: 'delete',
      headers: {
        Authorization: `Bearer ${authenticated.data.token}`
      }
    })
    .catch(err => { throw err; });

    await Media.deleteOne({ wpId })
      .catch(err => { throw err; });

    if (wpDelete.data.deleted) return res.json(new Response(true, media, null));
  } catch (err) {
    return res.status(400).json(new Response(false, null, new Err(err)));
  }
});

module.exports = app;
