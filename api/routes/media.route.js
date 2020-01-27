const express = require("express");
const fs = require("fs");
const path = require("path");
const Response = require("../models/Response.model");
const { model: Media } = require("../models/Media.model");
const Err = require("../models/Error.model");
const { validateToken } = require("../middlewares/jwt-auth.middleware");
const msg = require("../utils/messages");
const multer = require("multer");

const app = express();

require("../config/app.config");

// Multer configuration
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function(req, file, cb) {
    const date = new Date().toISOString().replace(/:/g, "-");
    cb(null, `${date}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const acceptedMimetypes = ["image/jpeg", "image/png"];

  if (acceptedMimetypes.indexOf(file.mimetype) === -1) {
    cb(null, false);
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 1
  },
  fileFilter
});

app.post(
  "/media/single",
  [upload.single("image"), validateToken],
  async (req, res) => {
    try {
      const image = new Media({
        user: req.user._id,
        url: req.file.path
      });

      const saved = await image.save();

      return res.status(201).json(new Response(true, saved.populate(), null));
    } catch (err) {
      return res.status(400).json(new Response(false, null, new Err(err)));
    }
  }
);

app.delete("/media/:id", validateToken, async (req, res) => {
  const id = req.params.id;
  const userId = req.user._id;

  try {
    const image = await Media.findOne({ _id: id, user: userId }).catch(err => {
      throw err;
    });

    fs.exists(image.url, exists => {
      if (!exists) {
        return res
          .status(400)
          .json(new Response(false, null, "No se encontró el archivo"));
      }

      fs.unlink(image.url, async () => {
        await Media.findByIdAndDelete(image._id).catch(err => {
          throw err;
        });

        return res.json(new Response(true, image, null));
      });
    });
  } catch (err) {
    return res.status(400).json(new Response(false, null, new Err(err)));
  }
});

module.exports = app;
