const express = require('express');
const { isAdmin } = require('../../middlewares/auth.middleware');
const { validateToken } = require('../../middlewares/jwt-auth.middleware');
const { model: Order, statuses } = require('../../models/Order.model');
const Response = require('../../models/Response.model');
const Err = require('../../models/Error.model');
const msg = require('../../utils/messages');

const app = express();

app.get('/admin/orders', [validateToken, isAdmin], async (req, res) => {
  try {
    const orders = await Order.find().populate().catch(err => { throw err; });

    if (!orders) return res.json(new Response(false, null, msg.ordersNotFound));

    return res.json(new Response(true, orders, null));
  } catch (err) {
    return res.json(new Response(false, null, new Err(err)));
  }
});

app.get('/admin/orders/:status', async (req, res) => {
  const status = req.params.status;

  if (statuses.indexOf(status) === -1) { return res.json(new Response(false, null, msg.orderInvalidStatus)); }

  try {
    const orders = await Order.find({ status }).populate().catch(err => { throw err; });

    if (!orders) return res.json(new Response(false, null, msg.ordersNotFound));

    return res.json(new Response(true, orders, null));
  } catch (err) {
    return res.json(new Response(false, null, new Err(err)));
  }
});

module.exports = app;