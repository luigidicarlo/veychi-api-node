const conn = require('../config/database.config');

conn.schema
    .dropTableIfExists('users')
    .dropTableIfExists('tags')
    .dropTableIfExists('stores')
    .dropTableIfExists('shopping_carts')
    .dropTableIfExists('products')
    .dropTableIfExists('password_recovery')
    .dropTableIfExists('images')
    .dropTableIfExists('coupons')
    .dropTableIfExists('coupon_product')
    .dropTableIfExists('categories')
    .dropTableIfExists('orders')
    .dropTableIfExists('addresses')
    .createTable('users', table => {
        table.increments();
        table.string('username').notNullable().unique();
        table.string('names').notNullable();
        table.string('last_names').notNullable();
        table.string('email').notNullable().unique();
        table.string('password').notNullable();
        table.string('role').defaultTo('CLIENT_ROLE').notNullable();
        table.integer('image_id').unsigned().nullable();
        table.timestamps();
    })
    .createTable('tags', table => {
        table.increments();
        table.string('name').unique();
        table.timestamps();
    })
    .createTable('stores', table => {
        table.increments();
        table.string('name').unique().notNullable();
        table.string('description').nullable();
        table.integer('user_id').unsigned().notNullable();
        table.integer('image_id').unsigned().nullable();
        table.string('rut').notNullable().unique();
        table.string('activity').notNullable();
        table.string('owner').notNullable();
        table.timestamps();
    })
    .createTable('shopping_carts', table => {
        table.increments();
        table.integer('product_id').unsigned().notNullable();
        table.integer('user_id').unsigned().notNullable();
        table.integer('quantity').unsigned().defaultTo(1).notNullable();
        table.timestamps();
    })
    .createTable('products', table => {
        table.increments();
        table.string('name').notNullable().unique();
        table.text('description').nullable();
        table.text('short_description').nullable();
        table.decimal('price').unsigned().notNullable();
        table.decimal('discount').unsigned().nullable();
        table.integer('store_id').unsigned().notNullable();
        table.integer('category_id').unsigned().notNullable().defaultTo(1);
        table.timestamps();
    })
    .createTable('password_recovery', (table) => {
        table.string('email').unique();
        table.string('token');
        table.timestamps();
    })
    .createTable('images', table => {
        table.increments();
        table.string('alt').nullable();
        table.string('src').notNullable();
        table.timestamps();
    })
    .createTable('coupons', table => {
        table.increments();
        table.string('name').unique().notNullable();
        table.timestamp('expiration').notNullable();
        table.decimal('value').unsigned().notNullable();
        table.boolean('percentage').defaultTo(true).notNullable();
        table.integer('store_id').unsigned().notNullable();
        table.timestamps();
    })
    .createTable('coupon_product', table => {
        table.increments();
        table.integer('product_id').unsigned();
        table.integer('coupon_id').unsigned();
        table.timestamps();
    })
    .createTable('categories', table => {
        table.increments();
        table.string('name').unique();
        table.integer('parent_id').unsigned().defaultTo(null);
        table.integer('image_id').unsigned();
        table.timestamps();
    })
    .createTable('orders', table => {
        table.increments();
        table.integer('user_id').unsigned();
        table.integer('product_id').unsigned();
        table.integer('quantity').unsigned();
        table.timestamps();
    })
    .createTable('addresses', table => {
        table.increments();
        table.string('country');
        table.string('province');
        table.string('line1');
        table.string('line2');
        table.integer('user_id').unsigned();
        table.timestamps();
    })
    .then(() => {
        console.log(`Migration completed at ${new Date(Date.now()).toTimeString()}.`);
        process.exit(0);
    });