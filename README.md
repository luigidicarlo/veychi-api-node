# Veychi RESTful API

## Endpoints

### /users

* GET: obtains a user's data. Can only be accessed after logging in and having a valid JWT token.

* POST: creates a user in the database. By default, this is a client type user who lacks administrative privileges.

* PUT: modifies an existing user's data. Passwords cannot be changed via this endpoint. Can only be accessed after logging in and having a valid JWT token.

* DELETE: allows a user to delete their own account. Can only be accessed after logging in and having a valid JWT token.

### /stores

* GET: obtains a store's data. Can only be accessed after logging in and having a valid JWT token. One user can only get his own store's data.

* POST: creates a store in the database.

* PUT: modifies an existing store's data.

* DELETE: destroys a store from the database. Once done, it cannot be rolled back.

### /carts

* GET: returns all products that are included in the user's cart. Can only be accessed after logging in and having a valid JWT token.

* POST: adds products to a user's cart. Can only be accessed after logging in and having a valid JWT token. Accepts an array of elements to be inserted.

* PUT: requires the param :id to be passed via the endpoint (```/carts/:id```). Modifies the quantity of the selected cart element.

* DELETE: requires the param :id to be passed via the endpoint (```/carts/:id```). Destroys the selected cart element. This translates to completely removing a product from the shopping cart.

### /products

* GET: obtains all products stored in the database.

* GET: requires the param :id to be passed via the endpoint (```/products/:id```). Returns the data of the selected product.

* POST: creates a new product and stores it in the database. Can only be accessed after logging in, having a valid JWT token and being the owner of a store.

* PUT: requires the param :id to be passed via the endpoint (```/products/:id```). Modifies the data of the selected product.

* DELETE: requires the param :id to be passed via the endpoint (```/products/:id```). Destroys the selected product, completely removing it from the database.

### /categories

* GET: returns an array containing all existing categories.

* GET: requires the param :id to be passed via the endpoint (```/categories/:id```). Returns an array of products associated with the given category ID.

* POST: creates a new category and stores it in the database.

* PUT: requires the param :id to be passed via the endpoint (```/categories/:id```). Modifies an existing category.

* DELETE: requires the param :id to be passed via the endpoint (```/categories/:id```). Destroys the category with the given ID.

### /login

* POST: generates a JWT token and returns it to the frontend if the given credentials pass validation.