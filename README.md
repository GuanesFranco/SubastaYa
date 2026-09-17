# SubastaYa

Plataforma de subastas en tiempo real con billetera virtual, retención de saldo (escrow),
regla anti-sniping y liquidación automática por background worker.

Trabajo práctico de la cátedra **Proyecto de Software**.

**Stack:** .NET 8 · ASP.NET Core Web API · SQL Server Express · EF Core 8 Code First ·
SignalR · JWT + BCrypt · Swagger.

---

## Requisitos

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- **SQL Server Express** con la instancia por defecto `localhost\SQLEXPRESS` (el instalador la
  crea con ese nombre). La conexión usa autenticación de Windows: no hay usuario ni contraseña.
  El motor y SSMS son instalaciones separadas: para mirar las tablas hace falta instalar SSMS
  aparte y conectarse a `localhost\SQLEXPRESS` marcando **"Certificado de servidor de
  confianza"**, porque el certificado de SQL Express es autofirmado.
- [Node.js 20+](https://nodejs.org) para el frontend.
- **Conexión a internet** mientras se usa la app. Las fotos de las subastas del seed y de la
  galería de "Publicar" se sirven desde `cdn.dummyjson.com`; sin red, las cards muestran la
  inicial de la categoría en lugar de la foto. Todo lo demás corre local.
- En Windows, **Git Bash** para correr las pruebas automatizadas (`scripts/*.sh`).

## Cómo levantarlo

```bash
cd SubastaYa/Backend
```

**1. Configurar el secreto del JWT.** Obligatorio: sin esto la API no arranca. La clave de
firma no se versiona, así que cada uno la configura una vez en su máquina:

```bash
dotnet user-secrets init --project SubastaYa.Api
dotnet user-secrets set "Jwt:Secret" "SubastaYaSuperSecretKey2026!@#VeryLongKey" --project SubastaYa.Api
```

**2. Correr.**

```bash
dotnet run --project SubastaYa.Api --launch-profile http
```

El `--launch-profile http` **no es opcional si vas a usar el frontend**. Con el perfil `https`
(el que Visual Studio elige por defecto) cada request del front se come un redirect a
`https://localhost:7207` antes de que se apliquen las cabeceras de CORS, y el navegador lo
bloquea — con un error que parece del backend pero es del perfil.

Las migraciones se aplican solas al arrancar, así que la base `SubastaYaDB` se crea en el primer
`dotnet run`. Swagger queda en **http://localhost:5058/swagger**.

Para probar los endpoints protegidos: `POST /api/v1/sessions` para obtener el token, y después
el botón **Authorize** de Swagger.

## Datos de prueba

La base se siembra sola en el primer arranque (solo si está vacía). Los cuatro usuarios
comparten la contraseña **`Test1234!`**:

| Email | Saldo | Para qué sirve |
| --- | --- | --- |
| `vendedor@test.com` | $0 | Publicó las cinco subastas |
| `comprador1@test.com` | $150.000 · $45.000 retenidos | Lidera la subasta activa |
| `comprador2@test.com` | $200.000 | Fue superado en una subasta y lidera la vencida |
| `sinfondos@test.com` | $500 | Tiene plata pero no le alcanza: sirve para probar el rechazo por saldo (422) |

Los cuatro salen de los **datos semilla obligatorios** del enunciado (sección 3.3). El
disponible de `comprador2` arranca con la retención de la subasta vencida que lidera, y vuelve
a su valor final apenas el worker la liquida, a los pocos segundos de arrancar.

Y cinco subastas, una por escenario:

- **Activa** con dos pujas previas — el caso normal.
- **Activa que vence en 90 segundos** — para ver la regla anti-sniping en vivo.
- **Programada** para dentro de 24h — todavía no acepta pujas.
- **Vencida con ganador** y **vencida sin ofertas** — el worker las procesa a los pocos
  segundos de arrancar: una queda `Finalizada` con la plata transferida, la otra `Desierta`.

Las fechas se calculan en el momento del seed, así que los escenarios siguen siendo válidos sin
importar cuándo se clone el repositorio.

Para volver al estado inicial (por ejemplo, antes de una demo) alcanza con borrar la base y
arrancar la API de nuevo: `DROP DATABASE SubastaYaDB` desde SSMS, y el próximo `dotnet run`
la recrea y la vuelve a sembrar. El script `scripts/reset-db.sh` hace lo mismo sin abrir SSMS.

### Recorrido sugerido

1. **Catálogo** (`/`): filtrar por estado, categoría y precio, buscar por título. Sin sesión se
   puede mirar todo; para ofertar o publicar hace falta iniciar sesión.
2. **Sala en vivo** (`/subasta/:id`): abrir la misma subasta en dos ventanas con dos usuarios
   distintos. La oferta de uno aparece en la otra ventana sin recargar, y también en las cards
   del catálogo.
3. **Anti-sniping**: ofertar cuando faltan menos de 60 segundos. El cierre se corre 2 minutos y
   las dos ventanas lo muestran.
4. **Rechazo por saldo**: ofertar con `sinfondos@test.com` devuelve `422` y la consola de puja
   lo explica.
5. **Billetera** (`/billetera`): cargar saldo simulado y ver los movimientos, incluidas la
   retención al ofertar y la liberación cuando otro supera la oferta.
6. **Cierre**: cuando vence una subasta con ofertas, el worker la liquida y la sala muestra el
   resultado; el ganador ve el débito y el vendedor el crédito en su billetera.

## Pruebas automatizadas

En `scripts/` hay siete pruebas de integración escritas en bash, más un runner que las corre
todas y un script para resetear la base. Todas le pegan a la API real por HTTP, así que
necesitan el backend levantado. Aceptan la URL base como primer argumento, por si la API no
está en el puerto de siempre.

**No conviene correr la suite justo antes de una demo.** No es idempotente: siembra decenas de
subastas de prueba en el catálogo, con cierre a diez días, y deja fondos retenidos en las
billeteras de los usuarios semilla. Varias corridas seguidas sin resetear terminan agotando el
saldo disponible de los compradores.

El orden es siempre el mismo, y los tres comandos se corren desde la raíz del repositorio:

```bash
./scripts/reset-db.sh                                             # con la API apagada
dotnet run --project Backend/SubastaYa.Api --launch-profile http  # recrea y siembra la base
./scripts/correr-todas.sh                                         # en otra terminal
```

El runner ejecuta las siete pruebas en orden, imprime un resumen al final y devuelve error si
alguna falló.

### Qué demuestra cada una

- **`prueba-concurrencia.sh`** dispara quince pujas idénticas en paralelo sobre la misma
  subasta y exige que entre exactamente una (`201`) y que al menos una rebote por conflicto de
  versión (`409`). Reintenta hasta tres rondas, con una subasta nueva cada vez, porque el
  choque depende de qué tan rápido responda la máquina.
- **`prueba-volumen.sh`** es un smoke test: veinte peticiones al catálogo, cantidad
  parametrizable, y todas tienen que responder `200`. No mide memoria ni latencia.
- **`prueba-reglas-negocio.sh`** verifica los cuatro rechazos del dominio con su código exacto:
  sin token (`401`), monto por debajo del incremento mínimo (`422`), vendedor pujando en su
  propia subasta (`400`) y saldo insuficiente (`422`).
- **`prueba-worker.sh`** crea una subasta que vence en cinco segundos, no puja nadie y consulta
  el estado cada dos segundos hasta treinta, esperando que el worker la marque `Desierta`. El
  margen cubre el ciclo de diez segundos del `BackgroundService`.
- **`prueba-antisniping.sh`** puja dentro del último minuto y compara la fecha de cierre que
  devuelve la API antes y después: la diferencia tiene que ser de ciento veinte segundos
  exactos.
- **`prueba-ledger.sh`** hace tres pujas cruzadas entre dos compradores. Verifica que las tres
  entren y después que el líder tenga exactamente el monto retenido de menos y el superado haya
  recuperado todo, comparando los decimales con `awk`.
- **`prueba-paginacion.sh`** siembra treinta subastas y pide las páginas uno y dos con
  `pageSize=10`, más una búsqueda por título.

### Resetear la base

`reset-db.sh` borra `SubastaYaDB` con `sqlcmd`, que viene con las herramientas de SQL Server,
para que el próximo `dotnet run` la recree y la vuelva a sembrar desde cero. Se niega a correr
si la API está levantada, porque la dejaría apuntando a una base que ya no existe.

```bash
./scripts/reset-db.sh
```

---

## Notas para consumir la API

Los endpoints y sus códigos de respuesta están documentados en Swagger. Lo que no se ve ahí:

- **Los errores vienen en `ProblemDetails`** (RFC 7807), con `Content-Type:
  application/problem+json`.
- **Las fechas van siempre en UTC**, con la `Z` explícita (`"2026-09-09T23:00:00Z"`). La
  conversión a hora local es del cliente.
- **Los listados vienen paginados**, con la forma
  `{ items, totalItems, page, pageSize, totalPages }`. Se controlan con `?page=` y `?pageSize=`
  (por defecto 10, máximo 100). `GET /api/v1/auctions` filtra además por `estado`,
  `categoriaId`, `precioMin`, `precioMax`, `busqueda` (por título) y `cerradas=true`
  (finalizadas y desiertas juntas), y ordena con `orderBy`.
- **Los enums viajan como texto** (`"Activa"`, `"Finalizada"`, `"Deposito"`), tanto en la API
  como en los eventos del hub.
- **Hub de SignalR en `/hubs/auctions`.** El cliente llama a `JoinAuctionGroup(subastaId)` al
  entrar a la sala y recibe solo los eventos de esa subasta: `BidPlaced`, `AuctionExtended`
  (se aplicó el anti-sniping) y `AuctionClosed` (el worker la cerró, con ganador o desierta).
  El catálogo usa `JoinCatalogGroup()`, que recibe esos mismos eventos para todas las
  subastas y le permite actualizar las cards en vivo.
- **Una subasta cuyo inicio ya pasó nace `Activa`**; si el inicio es futuro nace `Programada` y
  el worker la activa en su ciclo (cada 10 segundos).

## Frontend

React + Vite. Vive fuera de la solución de .NET, se sirve por separado en
`http://localhost:5173` y consume la API por HTTP. El backend ya tiene CORS habilitado para
ese origen.

```bash
cd Frontend
npm install
npm run dev
```

Con el backend corriendo (ver "Cómo levantarlo" arriba), la app queda en
**http://localhost:5173**. El puerto es fijo: si está ocupado, Vite falla en vez de cambiarlo,
porque el CORS del backend está atado a ese origen.

`npm run lint` corre `oxlint` y tiene que quedar en cero. `npm run build` genera la versión de
producción en `dist/`.
