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
├── .env.example             # Plantilla de variables de entorno (DB_USER, DB_PASS, etc.)
└── app.js                   # Punto de entrada del servidor Express

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
Clonar el repositorio:

Bash
git clone [https://github.com/tu-usuario/centinela.git](https://github.com/tu-usuario/centinela.git)
cd centinela
Configurar Variables de Entorno:
Duplicar el archivo .env.example, renombrarlo a .env y configurar las credenciales de la base de datos local de PostgreSQL:

Fragmento de código

PORT=3001
DB_USER=tu_usuario
DB_PASS=tu_contraseña
DB_NAME=hospital_db
DB_HOST=127.0.0.1
Instalar dependencias:

Bash
npm install
Iniciar el servidor de desarrollo:

Bash
npm run dev
El servidor backend se levantará por defecto en: http://localhost:3001