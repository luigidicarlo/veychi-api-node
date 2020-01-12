# Veychi RESTful API

## Instalación

Ejecuta ```npm install``` para instalar todas las dependencias. Luego debes modificar las opciones que se encuentran en ```/api/config/app.config.js``` para que se correspondan a tu ambiente de desarrollo.

Nótese que en la versión actual se emplea WordPress para manejar y gestionar la carga de archivos, así que debes poseer una instalación de dicho CMS para poder utilizar el endpoint /media de la API.

## Roles

* Administrador: posee acceso global a todas las rutas y es el encargado de habilitar o deshabilitar distintas entidades de la tienda.

* Vendedor: tiene la capacidad de gestionar una tienda, sus productos, cupones y demás entidades.

* Cliente: posee acceso básico. Sólo puede comprar en la tienda.

## Namespaces Generales

### Users (/users)

#### GET /users

Regresa los datos de un usuario, filtrados para no mostrar información sensible. Sólo se puede acceder si se posee un JWT válido generado después de iniciar sesión.

#### POST /users

Registra un nuevo usuario en la base de datos. Todos los usuarios creados a través de esta ruta tienen el rol de cliente, el cual carece de privilegios administrativos.

#### PUT /users

Modifica a un usuario previamente registrado. Se necesita enviar el JWT y se modificará sólo el usuario que se corresponda al token de identificación. No se puede modificar la contraseña a través de este endpoint.

#### PUT /users/password

Modifica la contraseña del usuario que corresponda al JWT provisto.

#### DELETE /users

Deshabilita la cuenta del usuario que corresponda al JWT provisto. Devuelve un mensaje de error si el usuario no existe o ya ha sido deshabilitado previamente.

### Stores (/stores)

#### GET /stores

Devuelve la tienda que se corresponda con el usuario al que se relaciona el JWT provisto.

#### POST /stores

Registra una nueva tienda en el sistema asociada al usuario que se corresponde al JWT provisto. Nótese que la tienda recién creada debe ser primero aprobada por un administrador para que su dueño pueda gestionar productos, cupones y demás entidades relacionadas. Devuelve un error si el usuario ya posee una tienda registrada.

#### PUT /stores

Modifica los datos de una tienda previamente registrada. Sólo se puede modificar la tienda que le pertenezca al usuario asociado al JWT provisto. Si el usuario no posee una tienda, se devuelve un error.

#### DELETE /stores

Deshabilita la tienda asociada al usuario que corresponda con el JWT provisto. Devuelve un error si el usuario no posee una tienda o esta ya ha sido desactivada.

### Auth

#### POST /login

Crea un JWT asociado al usuario que se corresponda con los datos enviados en el cuerpo de la petición (nombre de usuario y contraseña) y lo envía como respuesta. La API responde con un error si los datos enviados no son válidos, el usuario se encuentra deshabilitado o el usuario no existe.

#### POST /password/login

Genera un token para recuperar la contraseña en caso de olvido. Devuelve un error si el usuario no existe o su cuenta está deshabilitada.

#### POST /password/recovery-change

Permite al usuario que solicitó un cambio de contraseña por olvido realizar dicha operación. Se debe proveer un token válido. La API responde con un error si el usuario no existe, su cuenta está deshabilitada o el token provisto no es válido. Nótese que no es necesario iniciar sesión para realizar esta operación.

### Categories (/categories)

#### GET /categories

Devuelve todas las categorías registradas en el sistema o un mensaje de error en caso de que no haya ninguna.

#### GET /categories/`id`

Devuelve la información de la categoría identificada con `id` o un mensaje de error en caso de que no haya ninguna.

#### GET /categories/`id`/products

Devuelve los productos asociados a la categoría identificada con `id` o un mensaje de error si no hay ninguno.

#### POST /categories

Registra una nueva categoría en el sistema. Sólo los administradores pueden acceder a esta ruta. Devuelve un mensaje de error si no se ha iniciado sesión o el usuario no es un administrador.

#### PUT /categories/`id`

Modifica la categoría identificada con `id`. Sólo los administradores pueden acceder a esta ruta. Devuelve un mensaje de error si no se ha iniciado sesión, el usuario no es un administrador, la categoría no existe o está deshabilitada.

#### DELETE /categories/`id`

Deshabilita la categoría identificada con `id`. Sólo los administradores pueden acceder a esta ruta. Devuelve un mensaje de error si no se ha iniciado sesión, el usuario no es un administrador, la categoría no existe o ya está deshabilitada.

### Products (/products):

#### GET /products

Obtiene todos los productos registrados y habilitados y los envía como respuesta. Devuelve un mensaje de error si no hay ningún producto registrado.

#### GET /products/`id`

Devuelve la información del producto identificado con `id`. La API responde con un error si el producto no existe o está deshabilitado.

#### POST /products

Registra un nuevo producto en el sistema. Se debe proveer un JWT para poder asociarlo al usuario que inició sesión. Adicionalmente, dicho usuario debe poseer una tienda habilitada por el administrador, de lo contrario la solicitud será rechazada y se enviará un mensaje de error.

#### PUT /products/`id`

Modifica el producto previamente registrado en el sistema e identificado con `id`. Sólo el usuario que es dueño de la tienda a la cual pertenece el producto puede acceder a esta ruta.

#### DELETE /products/`id`

Deshabilita el producto identificado con `id`. Sólo el usuario que es dueño de la tienda a la cual pertenece el producto puede acceder a esta ruta.

### Tags (/tags)

#### GET /tags

Devuelve un arreglo con todas las etiquetas registradas en el sistema. Devuelve un mensaje de error si no hay productos registrados en el sistema.

### Coupons (/coupons)

#### GET /coupons

Obtiene todos los cupones registrados en la tienda del usuario que se corresponde con el JWT provisto. Nótese que esta ruta sólo puede ser accedida por un usuario que posea una tienda. Devuelve un error si alguna de las condiciones anteriores no se cumple, el usuario está deshabilitado o no existe.

#### GET /coupons/`name`

Devuelve la información del cupón identificado con `name`. La API responde con un error si dicho cupón no existe.

#### POST /coupons

Crea un nuevo cupón asociado a la tienda del usuario que se corresponde con el JWT provisto. Si la condición anterior no se cumple, entonces se envía un mensaje de error (el usuario no posee tienda o su tienda está deshabilitada).

#### PUT /coupons/`id`

Modifica el cupón identificado con `id`. Sólo el usuario que originalmente creó el cupón puede acceder a esta ruta. Devuelve un error si el cupón no existe, el usuario no posee una tienda válida o el usuario no existe.

#### DELETE /coupons/`id`

Elimina el cupón identificado con `id`. Sólo el usuario que originalmente creó el cupón puede acceder a esta ruta. Devuelve un error si el cupón no existe, el usuario no posee una tienda válida o el usuario no existe.

### Media (/media)

#### POST /media

Carga un archivo al sistema. Devuelve la URL a través de la cual se puede acceder a dicho archivo. Nótese que el medio cargado se asocia al usuario que se corresponde con el JWT provisto. Permite cargar múltiples archivos en una única petición.

#### DELETE /media/`id`

Elimina el archivo identificado con `id` del sistema. Sólo permite eliminar un archivo a la vez.

### Orders (/orders)

#### GET /orders

Devuelve todas las órdenes asociadas al usuario que se corresponde con el JWT provisto.

#### POST /orders

Crea una nueva orden, la cual acepta un arreglo con los seriales de identificación de los productos. A partir de ellos genera el subtotal y total y registra la orden en estado de `En Proceso`. Es necesario iniciar sesión para poder crear órdenes.

#### PUT /orders/`id`

Modifica el estado de una orden identificada con `id`. Sólo el administrador tiene acceso a esta ruta.

#### DELETE /orders/`id`

Elimina una orden que esté previamente registrada en el sistema, que sea identificada con `id` y le pertenezca al usuario que se corresponde con el JWT provisto.

## Namespaces de Administración (/admin)

### Stores (/admin/stores)

#### GET /admin/stores

Devuelve un arreglo con todas las tiendas que estén registradas en el sistema.

#### PUT /admin/stores/`id`

Habilita a la tienda identificada con `id`.

#### DELETE /admin/stores/`id`

Deshabilita a la tienda identificada con `id`.

### Users (/admin/users)

#### GET /admin/users

Devuelve un arreglo con todos los usuarios registrados en el sistema, tanto habilitados como deshabilitados.

#### PUT /admin/users/`id`

Habilita al usuario identificado con `id`.

#### DELETE /admin/users/`id`

Deshabilita al usuario identificado con `id`.
