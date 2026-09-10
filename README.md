# SubastaYa

Plataforma de subastas en tiempo real con billetera virtual, retención de saldo (escrow),
regla anti-sniping y liquidación automática por background worker.

Trabajo práctico de la cátedra **Proyecto de Software**.

**Stack:** .NET 8 · ASP.NET Core Web API · SQL Server Express · EF Core 8 Code First ·
SignalR · JWT + BCrypt · Swagger · xUnit.

---

## Requisitos

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- **SQL Server Express** con la instancia por defecto `localhost\SQLEXPRESS` (el instalador la
  crea con ese nombre). La conexión usa autenticación de Windows: no hay usuario ni contraseña.

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
dotnet run --project SubastaYa.Api
```

Las migraciones se aplican solas al arrancar, así que la base `SubastaYaDB` se crea en el primer
`dotnet run`. Swagger queda en **https://localhost:7207/swagger**.

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

## Tests

```bash
dotnet test
```

---

## Notas para consumir la API

Los endpoints y sus códigos de respuesta están documentados en Swagger. Tres cosas que no se
ven ahí:

- **Los errores vienen en `ProblemDetails`** (RFC 7807), con `Content-Type:
  application/problem+json`.
- **Las fechas van siempre en UTC**, con la `Z` explícita (`"2026-09-09T23:00:00Z"`). La
  conversión a hora local es del cliente.
- **Hub de SignalR en `/hubs/auctions`.** El cliente llama a `JoinAuctionGroup(subastaId)` al
  entrar a la sala y recibe solo los eventos de esa subasta: `BidPlaced`, `AuctionExtended`
  (se aplicó el anti-sniping) y `AuctionClosed` (el worker la cerró, con ganador o desierta).

## Frontend

React + Vite. Vive fuera de la solución de .NET, se sirve por separado en
`http://localhost:5173` y consume la API por HTTP. El backend ya tiene CORS habilitado para
ese origen.
