# SCENARIO.md — Documento de Arquitectura

- Proyecto: ORION Maintenance Lite — Gestión de mantenimiento de infraestructura ITS
- Propósito: Documentar las decisiones arquitectónicas adoptadas para la construcción de la solución.

---

## 1. Introducción

Este documento describe las principales decisiones arquitectónicas adoptadas para la construcción de ORION Maintenance Lite, solución de gestión de mantenimiento de infraestructura ITS desarrollada como prueba técnica para el cargo de Desarrollador Full Stack.

El documento está alineado con el backlog refinado (BACKLOG_REFINED.md) y con los criterios de evaluación definidos en el enunciado de la prueba: análisis funcional, refinamiento del backlog, diseño de la solución, calidad de código, uso de git y ramas, arquitectura, dockerización, testing, documentación y criterio técnico.

Los supuestos funcionales y técnicos adoptados se documentan de forma explícita en la sección 12.

---

## 2. Stack tecnológico

- Backend: Node.js + Express. Stack maduro, ligero, con amplia documentación y curva de arranque rápida. Ecosistema rico en librerías para validación, autenticación y testing.
- ORM: Sequelize. Permite definir modelos con enums, validaciones y relaciones a nivel de modelo y de base de datos. Soporta migraciones y seeders versionados.
- Base de datos: PostgreSQL. Motor relacional robusto con soporte nativo de enums, transacciones ACID e integridad referencial. Alineado con la naturaleza relacional del dominio.
- Frontend: React + Vite. Configuración mínima, arranque rápido y build optimizado. Vite reduce significativamente el tiempo de configuración frente a alternativas como Create React App.
- Cliente HTTP: Axios. Manejo centralizado de errores mediante interceptores. Adjunta el JWT automáticamente.
- Testing: Jest + Supertest. Estándar de facto para testing en Node.js. Integración sin fricción con Express y Sequelize.
- Contenedores: Docker + docker-compose.
- Autenticación: JWT + bcrypt. Estándar para APIs REST sin estado. bcrypt para hashing seguro de contraseñas.

Decisión clave: se eligió PostgreSQL sobre SQLite porque el dominio requiere enums nativos, restricciones de integridad referencial fuertes y consultas agregadas para el dashboard. SQLite habría simplificado el despliegue, pero PostgreSQL refleja mejor un entorno productivo real.

---

## 3. Arquitectura de la solución

La solución sigue una arquitectura en capas que separa responsabilidades y facilita el testing.

### 3.1 Backend — Patrón de capas

El backend se organiza en las siguientes capas, cada una con una responsabilidad única:

- Routes: definen las URLs y los métodos HTTP expuestos bajo /api/... No contienen lógica de negocio.
- Controllers: reciben la petición HTTP, validan la entrada a nivel de forma, delegan al servicio y devuelven la respuesta con el código HTTP adecuado.
- Services: contienen la lógica de negocio y las reglas definidas en el BACKLOG_REFINED.md (RN-*). Centralizan las validaciones de dominio y devuelven errores tipados. Es la capa con mayor cobertura de tests.
- Models (Sequelize): definen las entidades, sus atributos, enums, relaciones y restricciones a nivel de modelo y de base de datos.
- Middlewares: autenticación JWT, autorización por rol, manejo centralizado de errores y validación de entrada.

Regla arquitectónica: ninguna regla de negocio vive en el controller ni en el modelo. Todas viven en el servicio. Esto permite testearlas de forma aislada y reutilizarlas entre endpoints.

### 3.2 Modelo de datos y relaciones

Entidades principales:

- Activo: representa un equipo ITS de la concesión (PMV, CCTV, Estación Meteorológica, Sensor de Tráfico o Aforador).
- Corredor: entidad de catálogo que agrupa activos por tramo vial. Se puebla por seed.
- OrdenTrabajo: representa una actividad de mantenimiento preventivo o correctivo.
- Cuadrilla: representa un equipo operativo de mantenimiento.
- Usuario: actor del sistema con uno de los roles SUPERVISOR, COORDINADOR o TECNICO.
- Avería: entidad opcional que puede originar una orden correctiva (fuera del MVP, referenciada).

Relaciones principales:

- Un Activo pertenece a un Corredor. Un Corredor agrupa muchos Activos.
- Un Activo puede tener muchas Órdenes de Trabajo a lo largo de su ciclo de vida.
- Un Activo puede tener muchas Averías (fuera del MVP).
- Una OrdenTrabajo puede tener cero o muchas Cuadrillas asignadas a lo largo de su ciclo de vida.

### 3.3 Entidad de relación OrdenCuadrilla

La relación entre OrdenTrabajo y Cuadrilla no se modela como un campo clave foránea directo en la orden, sino como un modelo intermedio (OrdenCuadrilla) que materializa la asignación histórica.

Esta decisión responde a los siguientes requisitos del backlog:

- Una orden puede tener múltiples cuadrillas a lo largo de su ciclo de vida (asignación, desasignación, reasignación).
- Una cuadrilla puede estar asignada a múltiples órdenes a lo largo del tiempo.
- Se debe validar que no existan solapamientos de fechas para una misma cuadrilla (RN-11 de HU-002).

El modelo OrdenCuadrilla contiene los siguientes atributos:

- ordenId — FK a OrdenTrabajo.
- cuadrillaId — FK a Cuadrilla.
- fechaAsignacion — marca temporal de la asignación.
- fechaInicio — inicio del rango de ejecución planificado.
- fechaFin — fin del rango de ejecución planificado.

Se crea un índice compuesto sobre (cuadrillaId, fechaInicio, fechaFin) para hacer eficiente la validación de solapamiento, que es una consulta crítica en el flujo de asignación.

Decisión clave: modelar la relación como entidad propia en lugar de un campo en la orden permite mantener el histórico de asignaciones y soportar reasignaciones sin perder trazabilidad.

### 3.4 Frontend — React + Vite

El frontend sigue una organización por responsabilidades:

- Pages/Views: vistas principales (listado, detalle, formulario) de cada entidad.
- Components: componentes reutilizables (tablas, formularios, modales, selectores de estado, alertas de error).
- Services/Api: capa de consumo de la API mediante Axios, con interceptor para adjuntar el JWT y manejo centralizado de errores.
- Router: navegación entre vistas.
- State management: estado local de componentes y hooks de React. No se introduce una librería de estado global (Redux, Zustand) porque la complejidad del MVP no lo justifica.

### 3.5 Comunicación cliente-servidor

El frontend consume la API REST mediante JSON. Todas las respuestas de error siguen un contrato estandarizado documentado en la sección 6.

---

## 4. Autenticación y autorización

### 4.1 Autenticación

Se utiliza JWT firmado (HS256) emitido al iniciar sesión con email y contraseña. Las contraseñas se almacenan con hash bcrypt. El token se envía en el header Authorization: Bearer <token> en cada petición autenticada.

### 4.2 Roles del sistema

- SUPERVISOR — Supervisor de mantenimiento.
- COORDINADOR — Coordinador de operaciones.
- TECNICO — Técnico de mantenimiento.

### 4.3 Matriz de permisos (RBAC)

- TECNICO: solo lectura (GET). No puede crear, editar, cambiar estado, asignar ni cancelar.
- SUPERVISOR y COORDINADOR: operaciones CRUD sobre activos, órdenes y cuadrillas; cambios de estado operativos estándar; asignación y desasignación de cuadrillas.
- COORDINADOR (exclusivo): operaciones avanzadas que afectan la trazabilidad o reactivan entidades fuera de servicio:
  - Reactivación de un activo de FUERA_DE_SERVICIO a OPERATIVO.
  - Reapertura de una orden CERRADA a ABIERTA.
  - Desactivación de una cuadrilla con asignaciones ya cerradas.

Decisión clave: la segregación de funciones se implementa como middleware reutilizable, no como lógica dispersa en los servicios. Esto asegura consistencia en todas las historias.

### 4.4 Auditoría

Cada operación de escritura registra createdBy, updatedBy, createdAt y updatedAt, tomando el usuario autenticado del token JWT. Estos campos son obligatorios a nivel de base de datos.

---

## 5. Estados de las entidades

Los estados se definen explícitamente en el backlog y se implementan como enums nativos de PostgreSQL y como enums de Sequelize en el modelo. Las transiciones permitidas se validan en la capa de servicio y se rechazan con código 409 cuando son inválidas.

### 5.1 Activo

- OPERATIVO — activo en condiciones normales de funcionamiento.
- EN_MANTENIMIENTO — activo intervenido por al menos una orden activa.
- FUERA_DE_SERVICIO — activo dado de baja operativa. Se conserva por trazabilidad.

### 5.2 OrdenTrabajo

- ABIERTA — orden creada, sin cuadrilla asignada.
- ASIGNADA — orden con al menos una cuadrilla asignada, pendiente de inicio.
- EN_EJECUCION — orden iniciada por la cuadrilla asignada.
- CERRADA — orden finalizada con observación de cierre registrada.
- CANCELADA — orden cancelada con motivo registrado antes de iniciar ejecución.

### 5.3 Cuadrilla

- DISPONIBLE — cuadrilla operativa sin asignaciones activas.
- ASIGNADA — cuadrilla con al menos una asignación activa.
- INACTIVA — cuadrilla dada de baja operativa. No puede recibir nuevas asignaciones. Se conserva por trazabilidad.

Decisión clave: la máquina de estados se implementa como una tabla de transiciones permitidas en la capa de servicio, no como una serie de condicionales anidados. Esto facilita el testing y la evolución.

---

## 6. Decisiones arquitectónicas clave

1. Borrado lógico. Las entidades principales no se eliminan físicamente. La baja operativa se realiza cambiando el estado a su valor correspondiente: FUERA_DE_SERVICIO para activos, CANCELADA para órdenes, INACTIVA para cuadrillas. Esto preserva el histórico, la integridad referencial y las asignaciones registradas en OrdenCuadrilla.

2. Contrato de error estandarizado. Todas las respuestas de error usan el formato code, message y details, con códigos HTTP semánticos: 400, 401, 403, 404, 409, 422 y 500. Se implementa como middleware central, evitando que cada controlador defina su propio formato.

3. Paginación estándar. Todos los endpoints de listado aceptan page y size, y devuelven los datos junto con el total de registros y los metadatos de paginación. Se implementa como helper reutilizable.

4. Ordenamiento configurable. Parámetro sort. Orden por defecto distinto según el recurso: código ascendente para activos, fecha de creación descendente para órdenes, nombre ascendente para cuadrillas.

5. Máquinas de estado explícitas. Las transiciones permitidas se definen en las reglas RN-08 (activos), RN-09 (órdenes) y RN-11 (cuadrillas) del BACKLOG_REFINED.md. Las transiciones inválidas se rechazan con 409.

6. Enums a nivel de base de datos. PostgreSQL permite tipos ENUM nativos, reforzando la integridad de los catálogos cerrados (tipos de activo, estados, prioridades, especialidades). Se evita almacenar catálogos como texto libre.

7. Endpoints dedicados para cambios de estado. Los cambios de estado se realizan mediante endpoints semánticos dedicados: PATCH /api/activos/:id/estado, PATCH /api/ordenes/:id/estado, PATCH /api/cuadrillas/:id/estado. El uso de PUT queda reservado para actualizaciones completas de datos, no para transiciones de estado. Esto evita actualizaciones parciales inconsistentes.

8. Idempotencia. Los endpoints PUT son idempotentes. POST, PATCH y DELETE no lo son por naturaleza.

9. Un solo ORM. Sequelize en todo el backend, evitando mezclar tecnologías y mantener consistencia en migraciones, seeders y modelos.

10. Reutilización de componentes transversales. Middleware de error, helper de paginación, middleware de autenticación y autorización, y middleware de auditoría se reutilizan en las 4 historias. Esto reduce duplicación y garantiza comportamiento uniforme.

11. Un único comando de arranque. docker compose up levanta todo el sistema sin pasos manuales adicionales.

12. Separación estricta de responsabilidades. Ninguna regla de negocio vive fuera de la capa de servicio. Los controladores son delgados; los modelos solo definen estructura y relaciones.

---

## 7. Alcance del MVP

Se implementan las cuatro historias obligatorias del backlog:

- HU-001 Gestión de Activos.
- HU-002 Gestión de Órdenes de Trabajo.
- HU-003 Gestión de Cuadrillas.
- HU-004 Dashboard Operacional.

Las historias HU-005 (Gestión de Inventario) y HU-006 (Generación Automática de Averías) están marcadas como opcionales en el backlog original y quedan explícitamente fuera del alcance del MVP (ver sección 11).

---

## 8. Dockerización

La solución se ejecuta con un único comando:

docker compose up

El archivo docker-compose.yml define tres servicios:

- db — imagen postgres:15-alpine, expuesta en el puerto 5432, con volumen persistente para conservar los datos entre reinicios.
- backend — construido desde ./backend con su propio Dockerfile, expuesto en el puerto 3001. Ejecuta la API REST en Node.js + Express.
- frontend — construido desde ./frontend con su propio Dockerfile, expuesto en el puerto 3000. Sirve la aplicación en React + Vite.

Comportamiento del entorno al iniciar:

1. El servicio db arranca y ejecuta su healthcheck (pg_isready). Solo se marca como saludable cuando PostgreSQL acepta conexiones.
2. El servicio backend espera a que db esté saludable gracias a depends_on con condition service_healthy.
3. Al arrancar, el contenedor del backend ejecuta de forma automática y secuencial: las migraciones de Sequelize, los seeders con usuarios de prueba (SUPERVISOR, COORDINADOR, TECNICO), corredores, activos, órdenes y cuadrillas de ejemplo, y el servidor Express.
4. El servicio frontend espera a que el backend esté disponible y sirve la aplicación.

No existen pasos manuales adicionales. El evaluador solo necesita tener Docker instalado y ejecutar docker compose up para tener la solución completa funcionando.

---

## 9. Estrategia de testing

- Framework: Jest + Supertest.
- Tipos de pruebas:
  - Unitarias: cubren las reglas de negocio de la capa de servicio con casos de éxito y error. Cada regla RN-* tiene al menos un test asociado.
  - Integración: cubren los endpoints HTTP verificando códigos de respuesta, validaciones y contrato de error.
  - Máquina de estados: verifican transiciones válidas e inválidas de activos, órdenes y cuadrillas.
  - Validación de solapamiento: verifican que no se asignen dos cuadrillas con rangos de fechas solapados.
  - Componentes (opcional): vistas principales del frontend.
- Cobertura objetivo: 80% en la capa de servicio.
- Ejecución: npm test dentro de backend/.

---

## 10. Estrategia de ramas

El proyecto sigue una convención basada en GitHub Flow con ramas por propósito. Cada rama tiene un alcance claro y no se elimina.

Ramas del proyecto:

- main — rama principal consolidada. Punto de entrega final.
- develop — rama de integración intermedia.
- docs/refinamiento-backlog — contiene el BACKLOG_REFINED.md.
- docs/scenario — contiene este documento y el README.md actualizado.
- chore/docker — contiene la configuración de Docker (docker-compose.yml y Dockerfiles).
- feature/hu-001-gestion-activos — implementación de la HU-001 (backend + frontend).
- feature/hu-002-gestion-ordenes — implementación de la HU-002 (backend + frontend).
- feature/hu-003-gestion-cuadrillas — implementación de la HU-003 (backend + frontend).
- feature/hu-004-dashboard — implementación de la HU-004 (backend + frontend).

Convenciones:

- Cada rama feature/hu-XXX integra el backend y el frontend de la historia correspondiente.
- Los commits siguen la convención de Conventional Commits (feat, fix, docs, test, chore, refactor).
- Al finalizar cada historia, la rama se mergea a main (o a develop si se usa integración intermedia).

Decisión clave: se optó por una rama por historia de usuario en lugar de una rama por capa (backend y frontend separados) para mantener el trabajo autocontenido y facilitar la revisión del evaluador, que puede ver la funcionalidad completa de cada HU en una sola rama.

---

## 11. Decisiones diferidas (fuera del MVP)

Las siguientes funcionalidades quedan fuera del alcance del MVP y se documentan como mejoras futuras:

- HU-005 Gestión de Inventario — marcada como opcional en el backlog original.
- HU-006 Generación Automática de Averías — marcada como opcional en el backlog original.
- Coordenadas GPS e integración cartográfica de activos — requiere un modelo de datos más complejo y una librería de mapas que excede el alcance del MVP.
- Carga de archivos adjuntos (fotos, fichas técnicas) en activos y en cierre de órdenes — requiere almacenamiento de archivos.
- Exportación del dashboard a CSV o PDF — requiere librerías adicionales y no aporta al núcleo del problema.
- Notificaciones automáticas al asignar cuadrillas — requiere infraestructura de mensajería.
- Gestión de integrantes individuales de cuadrilla (personas) — la cuadrilla se modela como unidad operativa con un número de integrantes, no como colección de personas.
- Gestión de disponibilidad horaria detallada (turnos, descansos, vacaciones) — requiere un modelo de calendario más complejo.
- Historial de cambios visible en la interfaz — requiere una tabla de auditoría detallada que excede el MVP.
- Búsqueda de texto completo sobre nombre y ubicación — requiere índices de texto completo o un motor de búsqueda.
- Logging estructurado con correlation ID por request — requiere infraestructura de observabilidad.
- Rate limiting en la API — requiere middleware dedicado y almacenamiento distribuido.
- Cacheo distribuido con Redis para despliegues multi-instancia — el MVP usa cacheo en memoria.
- Precalculado de indicadores en background para volúmenes grandes — el MVP calcula en tiempo real.

Decisión clave: todas estas funcionalidades están documentadas como mejoras futuras en el BACKLOG_REFINED.md y en este documento, cumpliendo con el criterio de documentar los supuestos funcionales o técnicos de manera explícita.

---

## 12. Supuestos funcionales y técnicos

Se documentan explícitamente los supuestos adoptados durante el diseño e implementación, tal como lo exige el enunciado de la prueba.

Supuestos funcionales:

- Una orden de trabajo se asocia a un único activo.
- Una cuadrilla puede estar asignada a múltiples órdenes a lo largo del tiempo, pero no en rangos de fechas solapados.
- El mantenimiento preventivo es programado y periódico; el correctivo surge de una falla detectada.
- La prioridad de una orden se asigna manualmente por el supervisor.
- El cierre de una orden requiere una observación obligatoria.
- La cancelación de una orden requiere un motivo obligatorio y solo se permite antes de iniciar ejecución.
- La reapertura de órdenes cerradas está restringida al rol COORDINADOR.
- La reactivación de activos fuera de servicio está restringida al rol COORDINADOR.
- Los corredores viales se modelan como catálogo cerrado y se pueblan por seed.

Supuestos técnicos:

- El sistema usa autenticación JWT con roles SUPERVISOR, COORDINADOR y TECNICO.
- Todas las respuestas de error siguen el contrato code, message y details.
- Todos los endpoints de listado usan paginación estándar con page y size.
- El formato de fechas es ISO 8601.
- Los campos de auditoría createdBy, updatedBy, createdAt y updatedAt se registran en toda operación de escritura.
- Los tests cubren la capa de servicio con un umbral del 80%.
- El proyecto se ejecuta con docker compose up sin pasos manuales.
- Las migraciones y seeders se ejecutan automáticamente al iniciar el contenedor del backend.

---

## 13. Conclusión

La arquitectura adoptada prioriza:

- Claridad: separación de responsabilidades por capas.
- Consistencia: contrato de error, paginación y auditoría unificados.
- Trazabilidad: borrado lógico, campos de auditoría, máquinas de estado explícitas y entidad OrdenCuadrilla con histórico de asignaciones.
- Reproducibilidad: docker compose up levanta la solución completa sin pasos manuales.
- Calidad: testing automatizado con cobertura objetivo del 80% en la capa de servicio.
- Mantenibilidad: reutilización de middlewares y helpers transversales.
- Extensibilidad: decisiones diferidas documentadas de forma explícita para facilitar la evolución futura.
