Este repositorio unifica el ecosistema de la aplicación, destacando una arquitectura de **API REST** robusta y segura.

---

## 🏗️ Arquitectura del Proyecto (Backend)

La API REST está construida sobre el ecosistema de **JavaScript** en el entorno de ejecución Node.js, utilizando un patrón de diseño por capas (Rutas, Controladores, Modelos y Configuración) para asegurar la escalabilidad y el mantenimiento del software.

### 🛠️ Tecnologías Principales
* **Node.js & Express:** Motor de servidor y gestión de enrutamiento HTTP.
* **PostgreSQL:** Sistema de gestión de base de datos relacional de nivel empresarial.
* **Sequelize ORM:** Mapeo objeto-relacional para la interacción segura con la base de datos, de forma de gestionar asociaciones y transacciones.

---

## 📁 Estructura del Código Fuente

A continuación se detalla la organización de la carpeta del backend, basada en la separación de responsabilidades:

```text
back
├── config/
│   └── database.js          # Conexión y configuración de Sequelize con PostgreSQL
├── controllers/
│   ├── raciones.controller.js # Lógica de auditoría humana, borrado lógico y restauración
│   ├── kardex.controller.js   # Cerebro logístico: algoritmo FIFO transaccional y reportes
│   └── ...
├── models/
│   ├── index.js             # Centralización y definición de asociaciones (HasMany, BelongsTo)
│   ├── Racion.js            # Modelo de raciones con soporte paranoid (borrado lógico)
│   ├── LoteStock.js         # Lotes de insumos con control de vencimiento y stock actual
│   ├── Producto.js          # Catálogo maestro de insumos (nombre, unidad de medida)
│   └── Kardex.js            # Registro histórico e inalterable de movimientos de stock
├── routes/
│   ├── raciones.routes.js   # Endpoints para el módulo de raciones
│   ├── kardex.routes.js     # Endpoints para el flujo FIFO y reportes analíticos
│   └── ...
├── .env                     # Plantilla de variables de entorno (DB_USER, DB_PASS, etc.)
└── server.js                # Punto de entrada del servidor Express

⚙️ Funcionamiento Clave y Reglas de Negocio
La API REST se diferencia por implementar lógica avanzada de control de gestión y consistencia de datos:

1. Motor Transaccional FIFO (First In, First Out)
Implementado en el controlador de Kardex bajo transacciones atómicas (ACID). Cuando la cocina solicita una cantidad de un insumo:

El sistema evalúa el stock consolidado total entre todos los lotes de ese producto.

Si hay stock suficiente, ordena los lotes cronológicamente por aproximación de vencimiento (fechaVencimiento ASC).

Un bucle consume los lotes de forma secuencial (vaciando los más viejos y descontando el saldo del siguiente).

Sanea los cálculos con precisión de dos decimales (.toFixed(2)) para evitar errores de coma flotante en JavaScript.

Registra de forma descarga e individual cada salida en la tabla kardex, congelando el precio unitario histórico del lote al momento del despacho.

Si ocurre cualquier error o corte de red durante el proceso, se ejecuta un rollback automático de la transacción, dejando el depósito intacto.

2. Trazabilidad y Auditoría Humana (Borrado Lógico)
En el módulo de raciones, los datos están protegidos contra eliminaciones accidentales o desprolijas:

Mecanismo paranoid: Al eliminar un registro, Sequelize no ejecuta un DELETE físico; en su lugar, estampa la fecha exacta en la columna deletedAt, ocultándolo de las consultas ordinarias pero preservando el historial completo para auditorías.

Justificación Obligatoria: El sistema exige al operador un motivo de anulación válido (mayor o igual a 10 caracteres) que se almacena en el campo observaciones como registro de auditoría.

Restauración Segura: Permite recuperar registros de la papelera (deletedAt: null), validando previamente que la combinación de fecha y turno no choque con una planilla activa cargada en el sistema mientras el registro estuvo oculto.

🚀 Endpoints Principales de la API
📊 Módulo Kardex e Inventario
GET /api/kardex - Recupera el historial cronológico completo de movimientos del hospital (Entradas, Salidas, Ajustes), incluyendo los datos del lote y del producto mediante eager loading anidado.

GET /api/kardex/producto/:idProducto - Endpoint especializado para React que filtra el historial de movimientos de un único insumo para alimentar tablas y reportes analíticos individuales.

POST /api/kardex/salida - Ejecuta el algoritmo FIFO automático para despachar mercadería de un producto específico.

Body requerido: { "idProducto": 1, "cantidadAsacar": 12.50, "detalle": "Consumo raciones" }

🍽️ Módulo Raciones y Planillas
GET /api/raciones - Listado de raciones activas del sistema.

GET /api/raciones/borradas - Acceso exclusivo a la "Papelera de Reciclaje" para auditoría de planillas descartadas.

PUT /api/raciones/:id - Modificación de planillas con escudo anti-duplicados integrado.

DELETE /api/raciones/:id - Borrado lógico del registro. Requiere enviar el motivo de la baja en el body.

Body requerido: { "motivo": "Se cargó por duplicado por error del operador." }

PATCH /api/raciones/restaurar/:id - Reactiva una ración oculta devolviendo el campo deletedAt a null.

🛠️ Instalación y Configuración Local
PASO 1: 
Clonar el repositorio:

deben entrar a su terminal de git(bash) y en alguna carpeta dentro de la terminal deben ejecutar: 
git clone https://github.com/Enriquecayu/pryecto_stock.git

luego de clonar y que todo salio bien deberan ver una carpeta nueva llamada "proyecto_stock" deben entrar:

cd "proyecto_stock"

PASO 2: 
Instalar dependencias:
deben entrar a la carpeta back y ejecutan en la raiz de back:

npm install 

al ejecutar ese comando se instalaran las dependencias que utiliza la API como sequelize, express, dotenv, etc.


PASO 3:
Configurar Variables de Entorno:
En la raiz de back deben crear un archivo llamado ".env" este archivo sirve para configurar nuestras variables de entorno y lo deben completar de la siguiente manera:

antes de completar los datos deberan haber creado una base de datos en pgadmin ya que en esa base de datos se crearan las tablas definidas. Deben recordar el nombre de la base de dato, su usuario que normalmente siempre es: "postgres" y su contraseña(la que les pide cuando entran a pgadmin). cuando tengan todos los datos deben completar las variables de entorno con esos datos, las variables que estan completas se las deja como estan.

PORT=3001
DB_USER=
DB_PASS=
DB_HOST=localhost
DB_NAME=
DB_PORT=5432

una vez configurado las variables la api esta lista para iniciar.

IMPORTANTE: 
antes de iniciar el servidor deben de cambiar algo en el codigo por unica vez:
"await sequelize.sync({ alter: true });"

deben buscar ese fragemnto de codigo que se encuentra dentro de back/server.js y remplazarlo por: 
"await sequelize.sync({ force: true });"

luego de cambiarlo de "alter" a "force" deben guardar el cambio.

PASO 4:
Iniciar el servidor de desarrollo:
para iniciar el servidor deben dirijirse a su terminal de git(bash) y en la raiz de la carpeta "back" ejecutar:

npm run dev

El servidor backend se levantará por defecto en: http://localhost:3001

luego de que vean un mensaje como este: 

CONEXION EXITOSA A POSTGRES
TABLAS SINCRONIZADAS CON PG
SERVIDOR CORRIENDO EN http://localhost:3001

ya sabran que a finalizado correctamente todo :)

para probar pueden abrir el navegador y buscar http://localhost:3001/

si ven un mensaj que dice: "Cannot GET /" es porque todo esta bien y la API esta andando perfectamente.