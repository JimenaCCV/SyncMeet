# Estructura del Proyecto — SyncMeet2

## Vista general

```
SyncMeet2/
├── ESTRUCTURA.md
├── swagger.yaml                          ← Documentación OpenAPI de la API
├── SyncMeet.postman_collection.json      ← Colección Postman para pruebas
├── vercel.json                           ← Config de deploy del frontend en Vercel
├── .vscode/settings.json
│
├── Backend/                              ← API REST (Node.js + Express + MongoDB)
└── Frontend/                             ← SPA vanilla JS (sin framework)
```

---

## Backend

**Stack:** Node.js · Express · MongoDB (Mongoose) · JWT (cookie) · Nodemailer · Railway

```
Backend/
├── server.js                             ← Entry point: inicia Express y conecta DB
├── package.json
├── railway.json                          ← Config de deployment en Railway
├── .env.template                         ← Variables de entorno requeridas
│
└── src/
    ├── app.js                            ← Configura Express: CORS, Helmet, rate-limit, rutas, /health
    │
    ├── config/
    │   ├── env.js                        ← Lee y valida variables de entorno
    │   ├── db.js                         ← conectarDB() — conexión a MongoDB
    │   └── nodemailer.js                 ← transporter SMTP Gmail
    │
    ├── models/                           ← Schemas Mongoose
    │   ├── Usuario.js                    ← nombre, email (único), password + pre-hook bcrypt
    │   ├── Reunion.js                    ← titulo, organizadorId, estado, historialEstados + pre-hook log
    │   ├── ParticipanteReunion.js        ← reunionId, usuarioId, rol, estado — índice único (reunion+usuario)
    │   ├── OpcionHorario.js              ← reunionId, fechaHora
    │   ├── Disponibilidad.js             ← reunionId, participanteId, opcionHorarioId, disponible
    │   └── Notificacion.js               ← usuarioId, reunionId, tipo, mensaje, leida
    │
    ├── repositories/                     ← Capa de acceso a datos (Data Access Layer)
    │   ├── usuario.repository.js
    │   │   ├── findByEmail(email)
    │   │   ├── findById(id, projection)
    │   │   └── create(data)
    │   ├── reunion.repository.js
    │   │   ├── create(data)
    │   │   ├── findById(id)
    │   │   ├── findByIdAndDelete(id)
    │   │   ├── save(doc)
    │   │   └── findByUsuario(usuarioId, filters)   ← paginación + filtro por estado/título
    │   ├── participante.repository.js
    │   │   ├── create(data)
    │   │   ├── findOne(filter)
    │   │   ├── find(filter)
    │   │   ├── findWithPopulate(filter, populate)
    │   │   ├── deleteById(id)
    │   │   ├── deleteMany(filter)
    │   │   └── findPaginated(filter, pagination, populate)
    │   ├── opcion.repository.js
    │   │   ├── create(data)
    │   │   ├── findOne(filter)
    │   │   ├── find(filter, sort)
    │   │   ├── deleteDoc(doc)
    │   │   └── deleteMany(filter)
    │   ├── disponibilidad.repository.js
    │   │   ├── create(data)
    │   │   ├── findOne(filter)
    │   │   ├── find(filter)
    │   │   ├── findWithPopulate(filter, populate)
    │   │   ├── save(doc)
    │   │   └── deleteMany(filter)
    │   └── notificacion.repository.js
    │       ├── create(data)
    │       ├── insertMany(docs)
    │       ├── findOne(filter)
    │       ├── save(doc)
    │       ├── updateMany(filter, update)
    │       └── findPaginated(filter, pagination)    ← ordenado por más reciente
    │
    ├── controllers/                      ← Handlers de requests HTTP
    │   ├── auth.controller.js
    │   │   ├── registro(req, res, next)
    │   │   ├── login(req, res, next)
    │   │   ├── logout(req, res, next)
    │   │   └── perfil(req, res, next)
    │   ├── reuniones.controller.js
    │   │   ├── crearReunion(req, res, next)
    │   │   ├── obtenerReuniones(req, res, next)     ← paginación + filtros
    │   │   ├── obtenerReunion(req, res, next)
    │   │   ├── editarReunion(req, res, next)
    │   │   ├── confirmarReunion(req, res, next)     ← fija opción, envía notif + email
    │   │   ├── cancelarReunion(req, res, next)      ← cancela, envía notif + email
    │   │   ├── recordarParticipantes(req, res, next) ← recuerda a quienes no respondieron
    │   │   └── eliminarReunion(req, res, next)       ← borra reunión y todo lo relacionado
    │   ├── participantes.controller.js
    │   │   ├── agregarParticipante(req, res, next)
    │   │   ├── listarParticipantes(req, res, next)
    │   │   ├── eliminarParticipante(req, res, next)
    │   │   └── reenviarInvitacion(req, res, next)
    │   ├── opciones.controller.js
    │   │   ├── agregarOpcion(req, res, next)        ← valida: mín 1h en futuro, máx 1 año
    │   │   ├── listarOpciones(req, res, next)
    │   │   └── eliminarOpcion(req, res, next)
    │   ├── disponibilidades.controller.js
    │   │   ├── registrarDisponibilidad(req, res, next)
    │   │   ├── actualizarDisponibilidad(req, res, next)
    │   │   ├── registrarDisponibilidadBulk(req, res, next)  ← upsert batch
    │   │   ├── obtenerDisponibilidades(req, res, next)
    │   │   └── obtenerCoincidencias(req, res, next)
    │   └── notificaciones.controller.js
    │       ├── obtenerNotificaciones(req, res, next)
    │       ├── marcarLeida(req, res, next)
    │       └── marcarTodasLeidas(req, res, next)
    │
    ├── services/
    │   ├── correo.service.js
    │   │   ├── enviarInvitacion({ destinatario, nombre, reunion })
    │   │   ├── enviarConfirmacion({ destinatario, nombre, reunion, fechaHora })
    │   │   ├── enviarCancelacion({ destinatario, nombre, reunion })
    │   │   └── enviarRecordatorio({ destinatario, nombre, reunion })
    │   ├── notificacion.service.js
    │   │   ├── crearNotificacion({ usuarioId, tipo, mensaje, reunionId })
    │   │   └── notificarParticipantes(participantesIds, tipo, mensaje, reunionId)
    │   └── coincidencias.service.js
    │       └── calcularCoincidencias(reunionId)     ← lógica core: cuenta disponibles por opción, pendientes
    │
    ├── routes/
    │   ├── auth.routes.js
    │   ├── reuniones.routes.js
    │   ├── participantes.routes.js
    │   ├── opciones.routes.js
    │   ├── disponibilidades.routes.js
    │   └── notificaciones.routes.js
    │
    ├── middlewares/
    │   ├── requireAuth.js               ← Verifica JWT desde cookie → req.usuarioId (401 si falla)
    │   ├── requireOrganizador.js        ← Verifica rol=organizador en la reunión (403 si no)
    │   ├── requireParticipante.js       ← Verifica que el user sea participante (403 si no)
    │   ├── validar.js                   ← Maneja errores de express-validator (400)
    │   └── errorHandler.js             ← Handler global de errores
    │
    ├── validators/                      ← Reglas de validación con express-validator
    │   ├── auth.validators.js           ← registroRules, loginRules
    │   ├── reuniones.validators.js      ← crearRules, listarRules, editarRules, confirmarRules, idParam
    │   ├── participantes.validators.js  ← agregarRules, usuarioIdParam
    │   ├── opciones.validators.js       ← agregarRules, opcionIdParam
    │   ├── disponibilidades.validators.js ← registrarRules, actualizarRules, bulkRules
    │   └── notificaciones.validators.js ← listarRules, notifIdParam
    │
    ├── templates/                       ← HTML para emails
    │   ├── invitacion.html
    │   ├── confirmacion.html
    │   ├── cancelacion.html
    │   └── recordatorio.html
    │
    └── utils/
        ├── respuesta.js                 ← ok(data) / err(error, code)
        └── validaciones.js             ← esEmailValido(email), esFechaFutura(fecha)
```

### Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check del servidor |
| POST | `/api/auth/registro` | Registro de usuario |
| POST | `/api/auth/login` | Login (setea cookie JWT) |
| POST | `/api/auth/logout` | Logout (limpia cookie) |
| GET | `/api/auth/perfil` | Perfil del usuario autenticado |
| POST | `/api/reuniones` | Crear reunión |
| GET | `/api/reuniones` | Listar reuniones del usuario (paginado, filtrable) |
| GET | `/api/reuniones/:id` | Detalle de una reunión |
| PUT | `/api/reuniones/:id` | Editar título/descripción |
| PUT | `/api/reuniones/:id/confirmar` | Confirmar opción de horario |
| PUT | `/api/reuniones/:id/cancelar` | Cancelar reunión |
| POST | `/api/reuniones/:id/recordar` | Enviar recordatorio a pendientes |
| DELETE | `/api/reuniones/:id` | Eliminar reunión y datos relacionados |
| POST | `/api/reuniones/:reunionId/participantes` | Agregar participante por email |
| GET | `/api/reuniones/:reunionId/participantes` | Listar participantes (paginado) |
| DELETE | `/api/reuniones/:reunionId/participantes/:usuarioId` | Eliminar participante |
| POST | `/api/reuniones/:reunionId/participantes/:usuarioId/reenviar-invitacion` | Reenviar invitación |
| POST | `/api/reuniones/:reunionId/opciones` | Agregar opción de horario |
| GET | `/api/reuniones/:reunionId/opciones` | Listar opciones de horario |
| DELETE | `/api/reuniones/:reunionId/opciones/:opcionId` | Eliminar opción de horario |
| POST | `/api/reuniones/:reunionId/disponibilidades` | Registrar disponibilidad |
| PUT | `/api/reuniones/:reunionId/disponibilidades/:disponibilidadId` | Actualizar disponibilidad |
| PUT | `/api/reuniones/:reunionId/disponibilidades/bulk` | Registrar disponibilidades en bulk (upsert) |
| GET | `/api/reuniones/:reunionId/disponibilidades` | Obtener disponibilidades |
| GET | `/api/reuniones/:reunionId/disponibilidades/coincidencias` | Calcular coincidencias de horario |
| GET | `/api/notificaciones` | Listar notificaciones (paginado, filtrable) |
| PUT | `/api/notificaciones/:id/leida` | Marcar notificación como leída |
| PUT | `/api/notificaciones/leer-todas` | Marcar todas como leídas |

---

## Frontend

**Stack:** HTML · CSS · Vanilla JS (sin framework) · Bootstrap 5 · Vercel

```
Frontend/
├── index.html                            ← SPA: contiene todas las vistas en un solo archivo
├── syncmeet.css                          ← Estilos globales
│
└── js/
    ├── config.js                         ← Estado global de la app
    │   └── Variables: API_URL, currentUser, currentMeetingId, currentMeetingTitle,
    │                  selectedOpcionId, pendingSlots, allMeetings,
    │                  currentFilter, dashPage, ITEMS_PER_PAGE
    │
    ├── api.js                            ← HTTP wrapper
    │   └── apiFetch(path, opts)          ← fetch con manejo de 401, JSON, y errores
    │
    ├── router.js                         ← Navegación entre vistas
    │   ├── showView(name)                ← Muestra vista, oculta el resto
    │   ├── goTo(name)                    ← showView + dispara carga de datos
    │   ├── updateNav()                   ← Muestra/oculta nav según auth
    │   └── updateGreetings()             ← Actualiza saludo con nombre del user
    │
    ├── init.js                           ← Inicialización (IIFE)
    │   └── Restaura sesión desde localStorage, llama /auth/perfil, redirige
    │
    ├── auth.js                           ← Autenticación
    │   ├── register()                    ← Valida form y llama /auth/registro
    │   ├── login()                       ← Valida form y llama /auth/login
    │   └── logout()                      ← Llama /auth/logout, limpia estado
    │
    ├── dashboard.js                      ← Vista principal de reuniones
    │   ├── loadDashboard()               ← Carga reuniones desde API
    │   ├── filterMeetings(filter)        ← Filtra por rol (all/org/part)
    │   ├── renderMeetings(reuniones)     ← Renderiza cards con badges y botones
    │   ├── renderPagination(total, pages) ← Genera controles de paginación
    │   └── goPage(n)                     ← Cambia página y re-renderiza
    │
    ├── reuniones.js                      ← Detalle y creación de reuniones
    │   ├── openMeetingOrg(reunionId)     ← Carga y renderiza vista de organizador
    │   ├── renderDetailOrg(reunion, opciones, coincidencias)
    │   ├── openMeetingPart(reunionId)    ← Carga y renderiza vista de participante
    │   ├── resetCreateMeeting()          ← Limpia formulario de creación
    │   ├── addSlot()                     ← Agrega opción de horario al form
    │   ├── removeSlot(iso)               ← Elimina opción de horario del form
    │   ├── renderPendingSlots()          ← Renderiza lista de slots pendientes
    │   ├── addParticipant()              ← Agrega email de participante al form
    │   └── createMeeting()              ← Crea reunión, agrega slots e invita participantes
    │
    ├── disponibilidad.js                 ← Respuesta de disponibilidad
    │   ├── toggleAvail(rowId)            ← Toggle checkbox de disponibilidad
    │   └── submitAvail()                 ← Envía respuestas al endpoint bulk
    │
    ├── modals.js                         ← Diálogos de confirmación
    │   ├── openModal(id) / closeModal(id)
    │   ├── selectSlot(opcionId, fechaLabel)
    │   ├── tryConfirm()                  ← Valida selección y abre modal confirmar
    │   ├── openCancelModal() / confirmCancel()
    │   ├── confirmMeeting()              ← Llama /reuniones/:id/confirmar
    │   ├── recordarPendientes()          ← Llama /reuniones/:id/recordar
    │   ├── deleteReunion(id, titulo) / openDeleteModal() / confirmDelete()
    │   └── confirmDelete()              ← Llama DELETE /reuniones/:id
    │
    ├── notificaciones.js                 ← Vista de notificaciones
    │   ├── loadNotifications()           ← Carga y renderiza notificaciones, actualiza badge
    │   ├── markRead(el)                  ← Marca una notificación como leída
    │   └── markAllRead()                 ← Marca todas como leídas
    │
    └── utils.js                          ← Utilidades compartidas
        ├── formatDate(iso)               ← ISO → fecha localizada en español
        ├── escHtml(str)                  ← Escapa HTML
        ├── badgeFor(estado)              ← Estado → clase Bootstrap badge
        ├── validateEmail(email)          ← Validación regex de email
        ├── markInvalid(el, msg) / markValid(el) / clearField(el)
        ├── setLoading(btn, isLoading)    ← Spinner en botón durante async
        └── showToast(msg, type)          ← Toast auto-dismissible
```

### Vistas del SPA (index.html)

| ID de vista | Descripción |
|-------------|-------------|
| `view-landing` | Landing page pública |
| `view-register` | Formulario de registro |
| `view-login` | Formulario de login |
| `view-dashboard` | Lista de reuniones con filtros y paginación |
| `view-create-meeting` | Formulario de creación de reunión |
| `view-detail-org` | Detalle para organizador (estado pendiente) |
| `view-detail-confirmed` | Detalle para organizador (estado confirmada) |
| `view-detail-part` | Detalle para participante (estado pendiente) |
| `view-detail-part-confirmed` | Detalle para participante (estado confirmada) |
| `view-notifications` | Lista de notificaciones |

---

## Arquitectura general

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                 │
│  SPA Vanilla JS · Bootstrap 5 · Estado en globals   │
│  config.js → api.js → módulos funcionales           │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP / JSON
                       │ Cookie JWT (HttpOnly)
┌──────────────────────▼──────────────────────────────┐
│                   BACKEND (Railway)                  │
│  Express → Routes → Validators → Middlewares        │
│           → Controllers → Services                  │
│           → Repositories → Mongoose Models          │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
   ┌──────▼──────┐         ┌────────▼────────┐
   │   MongoDB   │         │   Gmail SMTP    │
   │  (Atlas)    │         │  (Nodemailer)   │
   └─────────────┘         └─────────────────┘
```

### Flujo de autenticación
- Login → Express setea cookie `token` (JWT, HttpOnly, SameSite=None, Secure)
- Cada request protegido → `requireAuth` middleware extrae y verifica el JWT
- 401 → Frontend limpia estado y redirige a login

### Patrones del backend
- **Repository Pattern**: controllers nunca tocan Mongoose directamente
- **Service Layer**: lógica de negocio (emails, notificaciones, coincidencias) aislada de controllers
- **Validation Layer**: reglas de express-validator separadas de controllers
- **Middleware pipeline**: `requireAuth` → `requireOrganizador/Participante` → `validar` → controller
