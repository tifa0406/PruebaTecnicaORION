# BACKLOG REFINADO — ORION Maintenance Lite

## Introducción

Este documento es el resultado del ejercicio de refinamiento del backlog inicial
de ORION Maintenance Lite, la solución de gestión de mantenimiento de infraestructura
ITS para la concesión vial Autopistas Inteligentes S.A.

El backlog original contiene seis historias de usuario, cuatro obligatorias y dos
opcionales. Para cada una de las historias obligatorias se documenta el análisis
funcional, el refinamiento del dominio, la descomposición técnica, la estimación,
la priorización y la justificación de las decisiones tomadas. Las historias opcionales
se dejan fuera del alcance del MVP y se documentan como mejoras futuras.

El objetivo del refinamiento no es solo descomponer el trabajo, sino transformar
necesidades de negocio expresadas de forma ambigua en reglas ejecutables, criterios
de aceptación verificables y actividades técnicas planificables.

---

## Objetivo

Refinar el backlog inicial de ORION Maintenance Lite para:

- Detectar y resolver ambigüedades funcionales.
- Modelar las entidades de negocio y sus relaciones.
- Definir reglas de negocio y máquinas de estados.
- Establecer criterios de aceptación verificables.
- Descomponer el trabajo en actividades técnicas ejecutables.
- Estimar el esfuerzo por área.
- Priorizar el alcance del MVP frente a funcionalidades opcionales y mejoras futuras.
- Justificar las decisiones funcionales y técnicas adoptadas.

---


El alcance mínimo del MVP son cuatro historias de usuario:

- HU-001 Gestión de Activos.
- HU-002 Gestión de Órdenes de Trabajo.
- HU-003 Gestión de Cuadrillas.
- HU-004 Dashboard Operacional.

Las historias HU-005 (Gestión de Inventario) y HU-006 (Generación Automática de Averías) están marcadas como opcionales en el backlog original y quedan fuera del
alcance del MVP.

---

## HU-001 — Gestión de Activos

### Historia de Usuario

Como supervisor de mantenimiento
Quiero administrar los activos ITS de la concesión
Para mantener actualizado el inventario de infraestructura operativa.

---

## 1. Análisis

### 1.1 Ambigüedades

- El verbo administrar no define el alcance real. Puede implicar crear, consultar, actualizar, cambiar estado o eliminar. El backlog no aclara cuál de estas operaciones es obligatoria.
- No se especifica qué atributos componen un activo ITS, ni cuál es su identificador único.
- No se define el catálogo de tipos de activo, aunque el contexto de negocio menciona cinco: PMV, CCTV, Estaciones Meteorológicas, Sensores de Tráfico y Aforadores.
- No se define si un activo puede eliminarse físicamente o si debe conservarse por trazabilidad.
- No se define la máquina de estados de un activo ni las transiciones permitidas entre estados.
- No se aclara si un activo puede estar asociado a múltiples órdenes de trabajo a lo largo de su ciclo de vida.
- No se especifica si la ubicación del activo es texto libre, una referencia a un corredor vial o coordenadas geográficas.
- No se menciona autenticación ni control de acceso por roles, aunque el enunciado asume un supervisor como actor.
- No se define el formato de errores ni el comportamiento de la API ante conflictos, validaciones o accesos no autorizados.
- No se define si el listado debe ser paginado ni con qué orden por defecto.
- No se aclara qué sucede con un activo dado de baja cuando se intenta reasignar a otro corredor.

### 1.2 Dependencias

- Esta es la historia base del sistema. No depende de ninguna otra historia funcional.
- De ella dependen directamente:
  - HU-002 Gestión de Órdenes de Trabajo, porque toda orden se asocia a un activo.
  - HU-004 Dashboard Operacional, porque los indicadores se calculan sobre activos y sus estados.
  - HU-006 Generación Automática de Averías, porque las averías se generan sobre activos.
- HU-005 Gestión de Inventario depende de forma indirecta: los consumos se registran sobre órdenes, y las órdenes dependen de activos.
- Dependencia transversal: se asume un módulo de autenticación y autorización por roles provisto por una historia técnica habilitante (HU-000 Auth), necesaria para cumplir con los criterios de acceso por rol.
- Dependencia transversal: contrato de error estandarizado y contrato de paginación, definidos como supuestos globales del proyecto y reutilizados por todas las historias.

### 1.3 Riesgos

- R-01: Eliminar físicamente un activo rompería la integridad referencial del histórico de mantenimiento, dejando órdenes huérfanas y perdiendo trazabilidad.
- R-02: Si el tipo de activo se almacena como texto libre, podrían registrarse valores fuera del catálogo del negocio, contaminando la base de datos y rompiendo filtros y reportes.
- R-03: Si la ubicación se modela sin estructura mínima, se limitan funcionalidades futuras como filtros por corredor o integración cartográfica.
- R-04: Si un activo retirado puede asociarse a nuevas órdenes de trabajo, se planificaría mantenimiento sobre infraestructura fuera de servicio.
- R-05: Sin validación de transiciones de estado, un activo podría pasar a estados inconsistentes, reflejando una realidad operativa falsa.
- R-06: Si cualquier usuario puede crear o editar activos, se rompe la segregación de funciones y se expone el inventario a modificaciones indebidas.
- R-07: Sin unicidad de código, podrían registrarse dos activos que representen la misma infraestructura física, inflando el inventario.
- R-08: Si el corredor vial se almacena como texto libre, podrían convivir valores duplicados, rompiendo agrupaciones, filtros y reportes.
- R-09: Sin campos de auditoría, no se podría determinar quién creó o modificó un activo, dificultando la investigación de incidentes.
- R-10: Sin validación de longitudes máximas ni de fecha de instalación, podrían registrarse valores fuera de rango que rompan la interfaz o la lógica de negocio.

### 1.4 Supuestos

- Cada activo posee un código único, nombre, tipo, ubicación, corredor vial, estado operativo y fecha de instalación.
- El catálogo de tipos de activo es cerrado y contempla cinco valores: PMV, CCTV, ESTACION_METEOROLOGICA, SENSOR_TRAFICO y AFORADOR.
- La ubicación se almacena inicialmente como texto libre, sin coordenadas GPS ni integración cartográfica. La incorporación de coordenadas queda fuera del MVP.
- El corredor vial se modela como entidad propia con nombre único, para evitar duplicidad y permitir agrupaciones consistentes. La gestión completa de corredores queda fuera del MVP: se poblarán por seed.
- Cada activo está asociado a un corredor vial, dado que el contexto de negocio menciona que la concesión opera una red distribuida en corredores.
- Los activos no se eliminan físicamente. La baja se realiza mediante el cambio de estado a FUERA_DE_SERVICIO, preservando el histórico de mantenimiento y la trazabilidad.
- Cada activo registra una fecha de instalación como dato descriptivo obligatorio.
- El sistema incluye autenticación mediante JWT emitido por HU-000 Auth. Sin autenticación, ningún endpoint de activos responde.
- Los campos de auditoría createdBy, updatedBy, createdAt y updatedAt se registran en toda operación de escritura.
- Supuesto transversal: todos los errores de la API siguen el formato code, message, details y usan códigos HTTP semánticos (400, 401, 403, 404, 409, 422, 500).
- Supuesto transversal: todos los endpoints de listado usan paginación estándar con los parámetros page y size, y devuelven el total de registros junto con los datos.
- Supuesto transversal: el orden por defecto del listado de activos es por código ascendente. El usuario puede cambiar el orden mediante el parámetro sort.
- Los corredores no se eliminan en el MVP. Si se implementara su borrado en el futuro, se aplicaría borrado lógico y se bloquearía si tienen activos asociados.
- El rate limiting queda fuera del MVP por ser una prueba técnica. Se documenta como mejora futura.
- El logging estructurado con correlation ID queda fuera del MVP. Se documenta como mejora futura.

---

## 2. Refinamiento

### 2.1 Entidades involucradas

- Activo: entidad principal. Representa un equipo ITS de la concesión.
- Corredor: entidad de catálogo que agrupa activos por tramo vial.
- Usuario: actor que crea y audita los cambios sobre activos. Se asume provisto por HU-000 Auth.
- OrdenTrabajo: entidad que referencia al activo. Se detalla en HU-002.
- Avería: entidad que referencia al activo. Se detalla en HU-006.

### 2.2 Reglas de negocio

- RN-01: El código de un activo debe ser único en el sistema, tanto en la creación como en la actualización.
- RN-02: El tipo de activo debe pertenecer a uno de los siguientes valores: PMV, CCTV, ESTACION_METEOROLOGICA, SENSOR_TRAFICO o AFORADOR.
- RN-03: El código, el nombre, el tipo, la ubicación, el corredor vial y la fecha de instalación del activo son obligatorios.
- RN-04: Los activos no pueden eliminarse físicamente. La operación de baja se realiza mediante el cambio de estado a FUERA_DE_SERVICIO.
- RN-05: Solo usuarios con rol SUPERVISOR o COORDINADOR pueden crear, editar o cambiar el estado de un activo. Los roles TECNICO y cualquier otro rol no autorizado solo pueden consultar.
- RN-06: Un activo en estado FUERA_DE_SERVICIO no puede asociarse a nuevas órdenes de trabajo.
- RN-07: El historial de mantenimiento de un activo debe conservarse aunque el activo cambie a estado FUERA_DE_SERVICIO.
- RN-08: Las transiciones de estado permitidas son: OPERATIVO a EN_MANTENIMIENTO (cuando existe al menos una orden activa), EN_MANTENIMIENTO a OPERATIVO (cuando todas las órdenes asociadas están cerradas), OPERATIVO a FUERA_DE_SERVICIO, EN_MANTENIMIENTO a FUERA_DE_SERVICIO, y FUERA_DE_SERVICIO a OPERATIVO solo con autorización de COORDINADOR. Cualquier otra transición se rechaza.
- RN-09: Toda operación de escritura sobre un activo debe registrar el usuario que la ejecutó y la marca temporal correspondiente (createdBy, updatedBy, createdAt, updatedAt).
- RN-10: El corredor vial debe existir previamente en el catálogo de corredores. No se permite crear activos asociados a corredores inexistentes.
- RN-11: Un activo puede reasignarse a otro corredor. El cambio queda auditado en updatedAt y updatedBy, y no se permite reasignar a un corredor inexistente.
- RN-12: Un activo en estado FUERA_DE_SERVICIO no puede reasignarse a otro corredor. Primero debe reactivarse mediante la transición autorizada por COORDINADOR.
- RN-13: El listado de activos se devuelve paginado, con orden por defecto por código ascendente, y admite ordenamiento por nombre, tipo, estado o fecha de instalación.
- RN-14: Los endpoints de creación (POST) y cambio de estado (PATCH) son no idempotentes por naturaleza. El endpoint de actualización (PUT) es idempotente: repetir la misma solicitud produce el mismo resultado.
- RN-15: El código tiene máximo 50 caracteres, el nombre máximo 120, la ubicación máximo 255 y la fecha de instalación no puede ser futura.
- RN-16: El endpoint PATCH de cambio de estado devuelve 200 con el activo actualizado, incluyendo su estado nuevo y los campos de auditoría actualizados.

### 2.3 Estados

- OPERATIVO: activo en condiciones normales de funcionamiento.
- EN_MANTENIMIENTO: activo intervenido por al menos una orden de trabajo activa.
- FUERA_DE_SERVICIO: activo dado de baja operativa. Se conserva por trazabilidad.

### 2.4 Relaciones

- Un Activo pertenece a un Corredor.
- Un Corredor agrupa muchos Activos.
- Un Activo puede tener muchas Órdenes de Trabajo.
- Un Activo puede tener muchas Averías.
- Un Usuario con rol SUPERVISOR o COORDINADOR gestiona los activos y queda registrado como auditor en cada cambio.

### 2.5 Flujo funcional

1. El usuario se autentica y obtiene un token JWT. Sin token, el sistema responde 401 en cualquier endpoint de activos.
2. El supervisor accede al módulo de activos y visualiza el listado paginado con filtros por tipo, estado y corredor vial, con orden por defecto por código ascendente.
3. El supervisor crea un nuevo activo completando el formulario con código, nombre, tipo, ubicación, corredor vial y fecha de instalación. El sistema valida unicidad de código, tipo permitido, existencia del corredor y campos obligatorios.
4. Si la validación pasa, el sistema registra el activo con estado OPERATIVO, guarda los campos de auditoría y lo muestra en el listado. Si falla, devuelve un error con el formato estándar.
5. El supervisor puede consultar el detalle de un activo, editarlo, reasignarlo a otro corredor o cambiar su estado respetando las transiciones de RN-08.
6. Si el supervisor desea dar de baja un activo, el sistema no permite su eliminación física y realiza la baja mediante el cambio de estado a FUERA_DE_SERVICIO, conservando información e historial.
7. Al consultar el listado, el sistema devuelve los datos paginados junto con el total de registros y los metadatos de paginación.

---

## 3. Criterios de aceptación

- CA-01: Dado un supervisor autenticado, cuando crea un activo con código, nombre, tipo, ubicación, corredor vial y fecha de instalación válidos, entonces el sistema registra el activo con estado OPERATIVO, guarda los campos de auditoría y responde con código 201.
- CA-02: Dado un supervisor autenticado, cuando intenta crear un activo con un código ya existente, entonces el sistema rechaza la operación con código 409 y un mensaje descriptivo.
- CA-03: Dado un supervisor autenticado, cuando intenta crear un activo sin nombre, sin ubicación, sin corredor vial, sin tipo o sin fecha de instalación, entonces el sistema rechaza la operación con código 400.
- CA-04: Dado un activo en cualquier estado operativo, cuando un supervisor solicita darlo de baja, entonces el sistema cambia su estado a FUERA_DE_SERVICIO, conserva su información e historial de mantenimiento y no elimina físicamente el registro.
- CA-05: Dado un listado de activos, cuando el usuario aplica filtros por tipo, estado o corredor vial, entonces el sistema devuelve únicamente los activos que cumplen los criterios seleccionados.
- CA-06: Dado un activo en estado FUERA_DE_SERVICIO, cuando un usuario intenta asociarlo a una nueva orden de trabajo, entonces el sistema rechaza la operación e informa que el activo no está disponible.
- CA-07: Dado un usuario con rol TECNICO, cuando intenta crear, editar o cambiar el estado de un activo, entonces el sistema rechaza la operación con código 403.
- CA-08: Dado un supervisor autenticado, cuando intenta crear o actualizar un activo con un tipo no permitido, entonces el sistema rechaza la operación con código 400 y un mensaje descriptivo.
- CA-09: Dado un supervisor autenticado, cuando actualiza un activo existente con datos válidos, entonces el sistema persiste los cambios, actualiza updatedBy y updatedAt, y responde con código 200.
- CA-10: Dado un supervisor autenticado, cuando intenta actualizar un activo cambiando su código por uno ya existente en otro activo, entonces el sistema rechaza la operación con código 409.
- CA-11: Dado un activo en estado OPERATIVO con al menos una orden activa, cuando el sistema procesa el cambio, entonces permite la transición a EN_MANTENIMIENTO y responde con código 200 y el activo actualizado. Dado un activo en estado EN_MANTENIMIENTO con todas sus órdenes cerradas, cuando el sistema procesa el cambio, entonces permite la transición a OPERATIVO y responde con código 200 y el activo actualizado.
- CA-12: Dado un activo en estado FUERA_DE_SERVICIO, cuando un COORDINADOR intenta pasarlo a OPERATIVO, entonces el sistema lo permite y responde con código 200 y el activo actualizado. Dado el mismo activo, cuando un SUPERVISOR intenta la misma transición, entonces el sistema rechaza con código 403.
- CA-13: Dado un activo en estado OPERATIVO, cuando un supervisor intenta una transición no permitida por RN-08, entonces el sistema rechaza con código 409 y un mensaje descriptivo.
- CA-14: Dado un supervisor autenticado, cuando intenta crear un activo asociado a un corredor vial inexistente, entonces el sistema rechaza la operación con código 400 y un mensaje descriptivo.
- CA-15: Dado un usuario no autenticado, cuando intenta acceder a cualquier endpoint de activos, entonces el sistema rechaza la operación con código 401.
- CA-16: Dado un activo creado o modificado, cuando se consulta su detalle, entonces el sistema devuelve los campos de auditoría createdBy, updatedBy, createdAt y updatedAt.
- CA-17: Dado un listado con más activos que el tamaño de página, cuando el usuario consulta GET /api/activos?page=2&size=10, entonces el sistema devuelve los 10 activos correspondientes a la segunda página junto con el total de registros y los metadatos de paginación.
- CA-18: Dado un listado de activos sin parámetro sort, cuando el usuario consulta el listado, entonces el sistema devuelve los activos ordenados por código ascendente. Dado el mismo listado con sort=nombre, entonces el sistema los devuelve ordenados por nombre.
- CA-19: Dado un supervisor autenticado, cuando reasigna un activo existente a otro corredor válido, entonces el sistema persiste el cambio, actualiza updatedBy y updatedAt, y responde con código 200.
- CA-20: Dado un supervisor autenticado, cuando intenta reasignar un activo a un corredor inexistente, entonces el sistema rechaza la operación con código 400.
- CA-21: Dado un error de validación, conflicto o autorización, cuando el sistema responde, entonces el cuerpo del error sigue el formato code, message, details.
- CA-22: Dado un supervisor autenticado, cuando repite una solicitud PUT con los mismos datos sobre el mismo activo, entonces el sistema responde con el mismo resultado y el recurso permanece en el mismo estado (idempotencia).
- CA-23: Dado un supervisor autenticado, cuando consulta GET /api/activos/:id con un ID inexistente, entonces el sistema responde con código 404 y el formato de error estándar.
- CA-24: Dado un usuario autenticado, cuando consulta el listado con page negativo o size mayor al máximo permitido, entonces el sistema responde con código 400 y el formato de error estándar.
- CA-25: Dado un activo en estado FUERA_DE_SERVICIO, cuando un usuario autenticado consulta su detalle, entonces el sistema responde con código 200 y muestra el activo con su historial.
- CA-26: Dado un listado de activos, cuando el usuario aplica simultáneamente filtros por tipo, estado y corredor vial, entonces el sistema devuelve únicamente los activos que cumplen los tres criterios.
- CA-27: Dado un supervisor autenticado, cuando intenta crear un activo con código mayor a 50 caracteres, nombre mayor a 120, ubicación mayor a 255 o fecha de instalación futura, entonces el sistema rechaza la operación con código 400.
- CA-28: Dado un activo en estado FUERA_DE_SERVICIO, cuando un supervisor intenta reasignarlo a otro corredor, entonces el sistema rechaza la operación con código 409 y un mensaje que indica que primero debe reactivarse el activo.

---

## 4. Descomposición técnica

### 4.1 Backend

- Definir el modelo Activo con los atributos: id, codigo, nombre, tipo, ubicacion, corredorId, estado, fechaInstalacion, createdBy, updatedBy, createdAt, updatedAt (S).
- Definir el enum de tipos de activo con los cinco valores permitidos: PMV, CCTV, ESTACION_METEOROLOGICA, SENSOR_TRAFICO y AFORADOR, aplicado a nivel de modelo y de base de datos, para cumplir RN-02 (XS).
- Definir el enum de estados del activo con los tres valores: OPERATIVO, EN_MANTENIMIENTO y FUERA_DE_SERVICIO (XS).
- Definir el modelo Corredor con id y nombre único, y su relación Activo pertenece a Corredor (S).
- Crear la migración de la tabla activos con restricción UNIQUE sobre codigo, clave foránea a corredores e índices sobre tipo, estado y corredorId. Incluir migración de rollback (down) (S).
- Implementar el endpoint GET /api/activos con filtros combinables por tipo, estado y corredor vial, paginación estándar con validación de parámetros, orden por defecto por código ascendente y parámetro sort (M).
- Implementar el endpoint GET /api/activos/:id con detalle del activo y campos de auditoría, incluyendo 404 cuando el ID no existe (S).
- Implementar el endpoint POST /api/activos con validación de campos obligatorios, tipo permitido, unicidad de código, existencia de corredor y longitudes máximas (M).
- Implementar el endpoint PUT /api/activos/:id con las mismas validaciones que la creación, más la exclusión del propio activo en la validación de unicidad de código, más el bloqueo de reasignación de corredor si el activo está en FUERA_DE_SERVICIO, y comportamiento idempotente (M).
- Implementar el endpoint PATCH /api/activos/:id/estado con validación de la máquina de estados de RN-08, incluyendo la restricción de FUERA_DE_SERVICIO a OPERATIVO solo para COORDINADOR, y devolviendo 200 con el activo actualizado (M).
- Implementar la capa de servicio con las reglas RN-01 a RN-16, centralizando validaciones y devolviendo errores de dominio tipados (M).
- Implementar el middleware de manejo de errores que normaliza todas las respuestas de error al formato code, message, details (S).
- Implementar el helper de paginación reutilizable por todos los endpoints de listado, con validación de page y size y tamaño máximo de página (S).
- Implementar la lógica de bloqueo de asociación de activos en FUERA_DE_SERVICIO a nuevas órdenes de trabajo, exponiendo un método reutilizable por HU-002 (S).
- Implementar el registro automático de campos de auditoría en cada operación de escritura, tomando el usuario del token JWT (S).


### 4.2 Frontend

- Crear la vista de listado de activos que muestre código, nombre, tipo, corredor vial, fecha de instalación y estado, con filtros combinables por tipo, estado y corredor vial, paginación y ordenamiento por columnas (M).
- Implementar el consumo de los endpoints del backend mediante Axios, incluyendo interceptor para adjuntar el JWT y manejo centralizado de errores 400, 401, 403, 404, 409 y 500 según el formato estándar (M).
- Crear el formulario de creación y edición con validación de campos obligatorios, tipo permitido, corredor existente, fecha válida y longitudes máximas, coherente con RN-03, RN-02, RN-10 y RN-15, con etiquetas accesibles (label, aria-describedby) y diseño responsivo (M).
- Crear la vista de detalle del activo que muestre sus datos, su estado actual y los campos de auditoría, con opción de cambiar estado y de reasignar corredor (S).
- Implementar el componente de cambio de estado que solo habilite las transiciones permitidas por RN-08 según el estado actual y el rol del usuario (S).
- Implementar el manejo de estados de carga (skeleton), vacío y error en las vistas de listado, detalle y formulario (S).
- Implementar la vista responsiva con breakpoints para móvil, tablet y escritorio (S).

### 4.3 Persistencia

- Crear índices sobre tipo, estado y corredorId para que los filtros del listado sean eficientes (XS).
- Crear seed inicial de corredores viales (por ejemplo: Corredor Norte, Corredor Sur, Corredor Oriente, Corredor Occidente) (XS).
- Crear seed inicial de activos de ejemplo que cubran los cinco tipos y los tres estados, para facilitar pruebas y demo (S).
- Crear seed de usuarios de prueba con roles SUPERVISOR, COORDINADOR y TECNICO para verificar la autorización por rol (S).

### 4.4 Seguridad

- Implementar middleware de autenticación JWT que rechace con 401 cualquier request sin token válido, según RN-05 y CA-15 (M).
- Implementar middleware de autorización por rol que restrinja la creación, edición y cambio de estado de activos a usuarios con rol SUPERVISOR o COORDINADOR, según RN-05 (S).
- Implementar la regla específica de RN-08 que restringe FUERA_DE_SERVICIO a OPERATIVO exclusivamente a COORDINADOR (S).
- Implementar la propagación del usuario autenticado a la capa de servicio para poblar los campos de auditoría, según RN-09 (S).

### 4.5 Testing

- Configurar el framework de testing unitario y de integración del stack elegido (Jest + Supertest para Node, o equivalente) (XS).
- Escribir pruebas unitarias del servicio que cubran cada regla de negocio RN-01 a RN-16, con casos de éxito y error (M).
- Escribir pruebas unitarias de la máquina de estados que cubran todas las transiciones permitidas y rechazadas de RN-08 (S).
- Escribir pruebas de integración de los endpoints /api/activos que verifiquen los códigos HTTP 201, 200, 400, 401, 403, 404, 409 y 500, y los CA-01 a CA-28 (M).
- Escribir pruebas de integración que verifiquen la restricción de unicidad, la paginación, el ordenamiento y las longitudes máximas directamente contra la base de datos (S).
- Escribir pruebas de componente del frontend para el listado, el formulario y el cambio de estado, incluyendo accesibilidad básica (M).
- Escribir un smoke test end-to-end que cubra el flujo crear activo, listar, editar, reasignar corredor, cambiar estado y dar de baja (S).
- Configurar la herramienta de cobertura y fijar un umbral mínimo del 80% en la capa de servicio (XS).

### 4.6 Docker

- Configurar healthcheck del backend y depends_on con condition service_healthy en el docker-compose, para garantizar orden de arranque (S).
- Verificar que la migración, los seeds y el arranque del backend y frontend corran automáticamente al iniciar el contenedor, cumpliendo el requisito de docker compose up sin pasos manuales (S).
- Documentar en el README los usuarios de prueba sembrados y las variables de entorno necesarias (XS).

---

## 5. Estimación

- Backend: M (modelo S, enums XS, corredor S, migración S, GET listado M, GET detalle S, POST M, PUT M, PATCH estado M, servicio M, manejo de errores S, helper paginación S, bloqueo HU-002 S, auditoría S).
- Frontend: M (listado M, Axios M, formulario M, detalle S, cambio de estado S, estados de carga S, responsivo S).
- Persistencia: S (índices XS, seed corredores XS, seed activos S, seed usuarios S).
- Seguridad: M (auth JWT M, autorización por rol S, regla RN-08 S, propagación de usuario S).
- Testing: L (configuración framework XS, unitarias servicio M, unitarias estados S, integración endpoints M, integración unicidad/paginación S, componente frontend M, smoke e2e S, cobertura XS).
- Docker: S (arranque automático S, healthcheck S, documentación XS).


---

## 6. Priorización

### MVP

- Modelo de Activo, enums, relaciones y migración con rollback.
- Seed inicial de corredores y usuarios de prueba.
- Endpoints de consulta: GET listado y GET detalle.
- Endpoint de creación: POST.
- Validaciones de campos obligatorios, tipo, código único y longitudes máximas.
- Autenticación y autorización por rol.
- Endpoint de actualización: PUT.
- Reasignación de corredor.
- Cambio de estado mediante PATCH.
- Máquina de estados definida en RN-08.
- Manejo estandarizado de errores.
- Paginación, filtros combinables y ordenamiento del listado.
- Frontend funcional: listado, formulario, detalle y cambio de estado.
- Pruebas unitarias y de integración de las reglas de negocio principales.
- Docker y ejecución del proyecto mediante docker compose up sin pasos manuales.

### Funcionalidades opcionales

- Diseño responsive completo para móvil, tablet y escritorio.
- Estados de carga mediante skeleton.
- Pruebas de componentes del frontend.
- Smoke test end-to-end.
- Umbral de cobertura mínimo del 80%.
- Healthcheck del backend y configuración avanzada de depends_on.
- Ordenamiento configurable por diferentes campos desde la interfaz.
- Seeds adicionales de activos para cubrir diferentes escenarios de prueba.

### Mejoras futuras

- Coordenadas GPS e integración cartográfica de activos.
- Gestión completa (CRUD) de corredores desde la interfaz.
- Carga de archivos adjuntos (fotos, fichas técnicas) en activos.
- Historial de cambios del activo visible en la interfaz.
- Búsqueda de texto completo sobre nombre y ubicación.
- Logging estructurado con correlation ID por request.
- Rate limiting en la API.
- Borrado lógico de corredores con validación de activos asociados.

---

## 7. Justificación

### 7.1 Actividades agregadas

- Se agregó HU-000 Auth como dependencia explícita, porque los criterios de aceptación exigen usuarios autenticados con rol y sin autenticación no se sostienen CA-07, CA-12 ni CA-15.
- Se agregó la entidad Corredor con nombre único y la regla RN-10, para evitar la duplicidad de valores que se produciría si el corredor se modelara como texto libre.
- Se agregaron las reglas RN-09 a RN-16 y los criterios CA-09 a CA-28 para cerrar la trazabilidad: toda regla de negocio tiene al menos un criterio de aceptación asociado.
- Se agregó el contrato de error estandarizado como supuesto transversal y middleware dedicado, para que el frontend maneje errores de forma uniforme en todas las HU.
- Se agregó el helper de paginación reutilizable, con validación de parámetros y tamaño máximo de página, para evitar duplicación de lógica y consultas abusivas.
- Se agregó la migración de rollback (down), porque una migración sin reversa es incompleta en un entorno productivo.
- Se agregó el healthcheck del backend y depends_on con condition service_healthy en el docker-compose, para garantizar un arranque ordenado y confiable.
- Se agregaron pruebas de integración de paginación, ordenamiento, formato de error y longitudes máximas, y se fijó un umbral de cobertura del 80% en la capa de servicio.
- Se agregó accesibilidad básica (labels, ARIA) y diseño responsivo en el frontend, porque una prueba fullstack lo valora.

### 7.2 Actividades eliminadas

- Se eliminó la implementación de gestión completa de usuarios porque no es el alcance de esta historia; los usuarios se cargan mediante seed y la autenticación se delega a HU-000 Auth.
- Se eliminó la integración cartográfica con mapas porque queda fuera del MVP.
- Se eliminó la carga de archivos adjuntos en activos porque no aporta al núcleo del problema.
- Se eliminó la gestión CRUD completa de corredores desde la interfaz, dejándola como mejora futura y poblando el catálogo por seed.
- Se eliminó la búsqueda de texto completo sobre nombre y ubicación, dejándola como mejora futura.


### 7.3 Decisiones tomadas

- Se decidió usar borrado lógico mediante el estado FUERA_DE_SERVICIO en lugar de eliminación física para preservar el histórico.
- Se decidió validar la unicidad del código tanto en la base de datos mediante restricción UNIQUE como en la capa de servicio para dar mensajes de error claros al usuario, cubriendo el caso de actualización con CA-10.
- Se decidió que solo SUPERVISOR y COORDINADOR puedan modificar activos, y que la transición FUERA_DE_SERVICIO a OPERATIVO quede restringida exclusivamente a COORDINADOR, según RN-05 y RN-08.
- Se decidió modelar el corredor vial como entidad propia con nombre único para evitar duplicidad, permitir agrupaciones consistentes y habilitar futuras funcionalidades como filtros y reportes por corredor.
- Se decidió permitir la reasignación de corredor con auditoría (RN-11), porque en operación real un activo puede moverse entre tramos y se requiere trazabilidad.
- Se decidió bloquear la reasignación de corredor cuando el activo está en FUERA_DE_SERVICIO (RN-12), para evitar mover activos que ya no están operativos sin reactivarlos primero.
- Se decidió que la fecha de instalación sea obligatoria y no futura, y se incorporó a RN-03, RN-15 y CA-03.
- Se decidió que el tipo de activo sea obligatorio y se incorporó a CA-03.
- Se decidió que la ubicación permanezca como texto libre en el MVP, dejando coordenadas GPS para una mejora futura.
- Se decidió estandarizar el formato de error y la paginación como supuestos transversales, para que todas las HU los reutilicen.
- Se decidió fijar orden por defecto por código ascendente y permitir ordenamiento configurable, para dar previsibilidad al listado.
- Se decidió documentar la idempotencia de PUT y la no idempotencia de POST y PATCH, para evitar ambigüedades en el contrato de la API.
- Se decidió que el endpoint PATCH de cambio de estado devuelva 200 con el activo actualizado, para dar claridad al frontend (RN-16).
- Se decidió incluir accesibilidad y responsividad en el frontend como criterio de calidad, no como extra.
- Se decidió dejar logging estructurado y rate limiting fuera del MVP, documentados como mejoras futuras, dado el plazo de entrega.

### 7.4 Riesgos identificados

- R-01 (integridad del histórico de mantenimiento): eliminar físicamente un activo rompería la trazabilidad del mantenimiento, dejando órdenes huérfanas y perdiendo el historial de intervenciones.
  - Mitigación: los activos no se eliminan físicamente. La baja se realiza mediante el cambio de estado a FUERA_DE_SERVICIO, conservando la información e historial del activo (RN-04, RN-07).

- R-02 (inconsistencia del catálogo de tipos): si el tipo de activo se almacena como texto libre, podrían registrarse valores fuera del catálogo del negocio, contaminando la base de datos y rompiendo filtros y reportes.
  - Mitigación: enum cerrado con los cinco tipos del negocio aplicado en modelo y base de datos (RN-02).

- R-03 (modelado inadecuado de la ubicación): si la ubicación se modela sin corredor vial ni estructura mínima, se limitan funcionalidades futuras como filtros por corredor, agrupaciones operativas o integración cartográfica.
  - Mitigación: corredor vial obligatorio (RN-03) y ubicación como texto libre, dejando coordenadas GPS fuera del MVP.

- R-04 (activos fuera de servicio reutilizados): si un activo retirado (FUERA_DE_SERVICIO) puede asociarse a nuevas órdenes de trabajo, se planificaría mantenimiento sobre infraestructura que ya no está operativa.
  - Mitigación: RN-06 bloquea la asociación y CA-06 lo verifica.

- R-05 (transiciones de estado no controladas): sin validación de transiciones, un activo podría pasar a estados inconsistentes, reflejando una realidad operativa falsa en el sistema.
  - Mitigación: RN-08 define las transiciones permitidas y el endpoint de cambio de estado las valida; CA-11, CA-12 y CA-13 lo verifican.

- R-06 (acceso no autorizado a la gestión de activos): si cualquier usuario puede crear o editar activos, se rompe la segregación de funciones y se expone el inventario a modificaciones indebidas.
  - Mitigación: middleware de autenticación y autorización que restringe creación y edición a SUPERVISOR o COORDINADOR (RN-05), verificado por CA-07 y CA-15.

- R-07 (duplicidad de activos en el inventario): sin unicidad de código, podrían registrarse dos activos que representen la misma infraestructura física, inflando el inventario y confundiendo el mantenimiento.
  - Mitigación: restricción UNIQUE en base de datos más validación en la capa de servicio (RN-01), verificado por CA-02 y CA-10.

- R-08 (duplicidad de corredores): si el corredor se almacena como texto libre, podrían convivir valores duplicados, rompiendo agrupaciones, filtros y reportes.
  - Mitigación: entidad Corredor con nombre único y RN-10 que exige que el corredor exista antes de asociarlo a un activo; CA-14 lo verifica.

- R-09 (pérdida de trazabilidad de quién modifica): sin campos de auditoría, no se podría determinar quién creó o modificó un activo, dificultando la investigación de incidentes operativos.
  - Mitigación: RN-09 obliga a registrar createdBy, updatedBy, createdAt y updatedAt; CA-16 lo verifica.

- R-10 (datos fuera de rango): sin validación de longitudes ni de fecha de instalación, podrían registrarse valores que rompan la interfaz o la lógica de negocio.
  - Mitigación: RN-15 fija longitudes máximas y prohíbe fechas futuras; CA-27 lo verifica.

---


## HU-002 — Gestión de Órdenes de Trabajo

### Historia de Usuario

Como supervisor de mantenimiento
Quiero crear y gestionar órdenes de trabajo
Para planificar y controlar actividades de mantenimiento preventivo y correctivo.

---

## 1. Análisis

### 1.1 Ambigüedades

- El verbo gestionar no define el alcance real. Puede implicar crear, consultar, actualizar, cambiar estado, asignar cuadrillas, cerrar o cancelar. El backlog no aclara cuál de estas operaciones es obligatoria.
- No se especifica qué atributos componen una orden de trabajo ni cuál es su identificador único.
- No se define el catálogo de tipos de mantenimiento, aunque el enunciado menciona preventivo y correctivo.
- No se define la máquina de estados de una orden de trabajo ni las transiciones permitidas.
- No se aclara si una orden puede tener múltiples activos asociados o solo uno.
- No se aclara si una orden puede tener múltiples cuadrillas asignadas o solo una.
- No se define si una orden puede reabrirse después de cerrada.
- No se especifica quién puede crear, editar, asignar o cerrar órdenes, más allá del supervisor mencionado.
- No se define el formato de fechas ni si se requiere fecha programada, fecha de inicio y fecha de cierre.
- No se aclara la relación entre órdenes correctivas y averías (HU-006).
- No se define si una orden puede cancelarse y bajo qué condiciones.
- No se especifica si el cierre de una orden requiere observaciones o evidencia.
- No se define el comportamiento del activo al abrir o cerrar una orden (transición a EN_MANTENIMIENTO y retorno a OPERATIVO).
- No se define el formato de errores ni el comportamiento de la API ante conflictos, validaciones o accesos no autorizados.
- No se define si el listado debe ser paginado ni con qué orden por defecto.

### 1.2 Dependencias

- Depende directamente de HU-001 Gestión de Activos, porque toda orden se asocia a un activo existente y en estado válido.
- Depende directamente de HU-003 Gestión de Cuadrillas, porque una orden puede requerir la asignación de una o más cuadrillas para su ejecución.
- Depende de forma indirecta de HU-005 Gestión de Inventario, porque el consumo de materiales se registra sobre órdenes cerradas o en ejecución.
- Depende de forma indirecta de HU-006 Generación Automática de Averías, porque una avería puede originar una orden de trabajo correctiva.
- Es consumida por HU-004 Dashboard Operacional, que calcula indicadores sobre órdenes y sus estados.
- Dependencia transversal: HU-000 Auth, que provee autenticación y roles.
- Dependencia transversal: contrato de error estandarizado y contrato de paginación, reutilizados por todas las historias.

### 1.3 Riesgos

- R-01: Si una orden puede asociarse a un activo en estado FUERA_DE_SERVICIO, se planificaría mantenimiento sobre infraestructura que ya no está operativa.
- R-02: Si no se valida la máquina de estados, una orden podría pasar a estados inconsistentes (por ejemplo, de CERRADA a EN_EJECUCION sin pasar por reapertura autorizada).
- R-03: Si no se valida el solapamiento de cuadrillas, una misma cuadrilla podría quedar asignada a dos órdenes simultáneas en el mismo rango de fechas.
- R-04: Si no se registra auditoría, no se podría determinar quién creó, asignó o cerró una orden.
- R-05: Si el tipo de mantenimiento se almacena como texto libre, podrían registrarse valores fuera del catálogo del negocio.
- R-06: Si el cierre de una orden no actualiza el estado del activo, el activo quedaría marcado como EN_MANTENIMIENTO de forma indefinida.
- R-07: Si no se valida la existencia del activo y de la cuadrilla, podrían registrarse órdenes huérfanas o con cuadrillas inexistentes.
- R-08: Si no se define el comportamiento de cancelación, una orden podría quedar en un estado ambiguo sin trazabilidad de la razón.
- R-09: Si no se valida la coherencia de fechas (programada, inicio, cierre), podrían registrarse órdenes con fechas ilógicas.
- R-10: Si no se controla el acceso por rol, cualquier usuario podría crear o cerrar órdenes sin autorización.

### 1.4 Supuestos

- Cada orden tiene un código único, tipo de mantenimiento, prioridad, descripción, activo asociado, fechas y estado.
- El catálogo de tipos de mantenimiento es cerrado y contempla dos valores: PREVENTIVO y CORRECTIVO.
- El catálogo de prioridades es cerrado y contempla tres valores: BAJA, MEDIA y ALTA.
- Una orden se asocia a un único activo, porque el mantenimiento se planifica sobre un equipo específico. Si se requiere intervenir varios activos, se crean órdenes separadas.
- Una orden puede tener cero o muchas cuadrillas asignadas a lo largo de su ciclo de vida, pero solo una cuadrilla activa por rango de fechas.
- Las órdenes correctivas pueden originarse a partir de una avería registrada en HU-006, pero también pueden crearse de forma manual.
- El cierre de una orden requiere una observación de cierre obligatoria.
- La cancelación de una orden requiere un motivo obligatorio y solo puede realizarse antes de que la orden entre en ejecución.
- El sistema incluye autenticación mediante JWT provisto por HU-000 Auth. Sin autenticación, ningún endpoint de órdenes responde.
- Los campos de auditoría createdBy, updatedBy, createdAt y updatedAt se registran en toda operación de escritura.
- Supuesto transversal: todos los errores de la API siguen el formato code, message, details y usan códigos HTTP semánticos (400, 401, 403, 404, 409, 422, 500).
- Supuesto transversal: todos los endpoints de listado usan paginación estándar con los parámetros page y size, y devuelven el total de registros junto con los datos.
- Supuesto transversal: el orden por defecto del listado de órdenes es por fecha de creación descendente. El usuario puede cambiar el orden mediante el parámetro sort.
- El envío de notificaciones al asignar una cuadrilla queda fuera del MVP. Se documenta como mejora futura.
- La carga de archivos adjuntos (evidencias fotográficas) queda fuera del MVP. Se documenta como mejora futura.

---

## 2. Refinamiento

### 2.1 Entidades involucradas

- OrdenTrabajo: entidad principal. Representa una actividad de mantenimiento planificada o correctiva.
- Activo: entidad referenciada. Se detalla en HU-001.
- Cuadrilla: entidad referenciada cuando se asigna. Se detalla en HU-003.
- Usuario: actor que crea, edita, asigna y cierra órdenes. Se asume provisto por HU-000 Auth.
- Avería: entidad opcional que puede originar una orden correctiva. Se detalla en HU-006.

### 2.2 Reglas de negocio

- RN-01: El código de una orden de trabajo debe ser único en el sistema, tanto en la creación como en la actualización.
- RN-02: El tipo de mantenimiento debe pertenecer a uno de los siguientes valores: PREVENTIVO o CORRECTIVO.
- RN-03: La prioridad debe pertenecer a uno de los siguientes valores: BAJA, MEDIA o ALTA.
- RN-04: El código, el tipo, la prioridad, la descripción, el activo asociado y la fecha programada son obligatorios.
- RN-05: Solo usuarios con rol SUPERVISOR o COORDINADOR pueden crear, editar, asignar cuadrillas, cambiar estado, cerrar o cancelar órdenes. Los roles TECNICO y cualquier otro rol no autorizado solo pueden consultar.
- RN-06: Una orden solo puede asociarse a un activo en estado OPERATIVO o EN_MANTENIMIENTO. No se permite asociarla a un activo en estado FUERA_DE_SERVICIO.
- RN-07: Al crear una orden sobre un activo en estado OPERATIVO, el sistema cambia el activo a EN_MANTENIMIENTO.
- RN-08: Al cerrar o cancelar la última orden activa de un activo, el sistema cambia el activo a OPERATIVO.
- RN-09: Las transiciones de estado permitidas de una orden son: ABIERTA a ASIGNADA (cuando existe al menos una cuadrilla asignada), ASIGNADA a EN_EJECUCION (cuando la cuadrilla inicia la orden), EN_EJECUCION a CERRADA (con observación de cierre obligatoria), ABIERTA a CANCELADA (con motivo obligatorio), ASIGNADA a CANCELADA (con motivo obligatorio y antes de iniciar ejecución). La transición CERRADA a ABIERTA solo se permite mediante reapertura autorizada por COORDINADOR. Cualquier otra transición se rechaza.
- RN-10: Una orden cancelada o cerrada no puede asignarse a nuevas cuadrillas.
- RN-11: Una cuadrilla no puede estar asignada a dos órdenes activas cuyos rangos de fechas se solapen.
- RN-12: La fecha programada no puede ser anterior a la fecha de creación de la orden.
- RN-13: La fecha de inicio de ejecución no puede ser anterior a la fecha programada ni posterior a la fecha de cierre.
- RN-14: La fecha de cierre no puede ser anterior a la fecha de inicio de ejecución.
- RN-15: Toda operación de escritura sobre una orden debe registrar el usuario que la ejecutó y la marca temporal correspondiente.
- RN-16: El listado de órdenes se devuelve paginado, con orden por defecto por fecha de creación descendente, y admite ordenamiento por código, tipo, prioridad, estado o fecha programada.
- RN-17: Los endpoints de creación (POST), asignación y cambio de estado son no idempotentes por naturaleza. El endpoint de actualización (PUT) es idempotente.
- RN-18: El código tiene máximo 50 caracteres, la descripción máximo 500 caracteres y la observación de cierre máximo 500 caracteres.
- RN-19: El endpoint PATCH de cambio de estado devuelve 200 con la orden actualizada, incluyendo su estado nuevo y los campos de auditoría actualizados.
- RN-20: Una orden en estado EN_EJECUCION no puede cancelarse. Solo puede cerrarse con observación.

### 2.3 Estados

- ABIERTA: orden creada, sin cuadrilla asignada.
- ASIGNADA: orden con al menos una cuadrilla asignada, pendiente de inicio.
- EN_EJECUCION: orden iniciada por la cuadrilla asignada.
- CERRADA: orden finalizada con observación de cierre registrada.
- CANCELADA: orden cancelada con motivo registrado antes de iniciar ejecución.

### 2.4 Relaciones

- Una OrdenTrabajo pertenece a un Activo.
- Un Activo puede tener muchas Órdenes de Trabajo.
- Una OrdenTrabajo puede tener cero o muchas Cuadrillas asignadas a lo largo de su ciclo de vida.
- Una Cuadrilla puede estar asignada a muchas Órdenes de Trabajo a lo largo del tiempo, pero no en rangos de fechas solapados.
- Una OrdenTrabajo puede originarse a partir de una Avería (opcional).
- Un Usuario con rol SUPERVISOR o COORDINADOR gestiona las órdenes y queda registrado como auditor en cada cambio.

### 2.5 Flujo funcional

1. El usuario se autentica y obtiene un token JWT. Sin token, el sistema responde 401 en cualquier endpoint de órdenes.
2. El supervisor accede al módulo de órdenes y visualiza el listado paginado con filtros por tipo, prioridad, estado, activo y rango de fechas.
3. El supervisor crea una nueva orden completando el formulario con código, tipo, prioridad, descripción, activo asociado y fecha programada. El sistema valida unicidad de código, tipo permitido, prioridad permitida, existencia del activo y estado válido del activo.
4. Si la validación pasa, el sistema registra la orden con estado ABIERTA, cambia el activo a EN_MANTENIMIENTO si estaba OPERATIVO, guarda los campos de auditoría y muestra la orden en el listado. Si falla, devuelve un error con el formato estándar.
5. El coordinador de operaciones asigna una cuadrilla a la orden. El sistema valida que no exista solapamiento de fechas para esa cuadrilla y cambia la orden a ASIGNADA.
6. La cuadrilla inicia la orden. El sistema cambia la orden a EN_EJECUCION y registra la fecha de inicio.
7. La cuadrilla cierra la orden con una observación obligatoria. El sistema cambia la orden a CERRADA, registra la fecha de cierre y, si no quedan otras órdenes activas sobre el activo, cambia el activo a OPERATIVO.
8. Si la orden debe cancelarse antes de iniciar ejecución, el supervisor o coordinador registra un motivo obligatorio. El sistema cambia la orden a CANCELADA y aplica la misma lógica de cierre sobre el activo.
9. Si una orden cerrada debe reabrirse, solo un COORDINADOR puede hacerlo. El sistema cambia la orden a ABIERTA y, si el activo estaba OPERATIVO, lo cambia a EN_MANTENIMIENTO.

---

## 3. Criterios de aceptación

- CA-01: Dado un supervisor autenticado, cuando crea una orden con código, tipo, prioridad, descripción, activo válido y fecha programada válida, entonces el sistema registra la orden con estado ABIERTA, guarda los campos de auditoría y responde con código 201.
- CA-02: Dado un supervisor autenticado, cuando intenta crear una orden con un código ya existente, entonces el sistema rechaza la operación con código 409 y un mensaje descriptivo.
- CA-03: Dado un supervisor autenticado, cuando intenta crear una orden sin descripción, sin activo, sin tipo, sin prioridad o sin fecha programada, entonces el sistema rechaza la operación con código 400.
- CA-04: Dado un supervisor autenticado, cuando intenta crear una orden con un tipo o prioridad no permitidos, entonces el sistema rechaza la operación con código 400 y un mensaje descriptivo.
- CA-05: Dado un supervisor autenticado, cuando intenta crear una orden asociada a un activo inexistente, entonces el sistema rechaza la operación con código 400.
- CA-06: Dado un supervisor autenticado, cuando intenta crear una orden asociada a un activo en estado FUERA_DE_SERVICIO, entonces el sistema rechaza la operación con código 409 y un mensaje descriptivo.
- CA-07: Dado un supervisor autenticado, cuando crea una orden sobre un activo en estado OPERATIVO, entonces el sistema cambia el activo a EN_MANTENIMIENTO y responde con la orden creada.
- CA-08: Dado un usuario con rol TECNICO, cuando intenta crear, editar, asignar cuadrillas, cambiar estado, cerrar o cancelar una orden, entonces el sistema rechaza la operación con código 403.
- CA-09: Dado un usuario no autenticado, cuando intenta acceder a cualquier endpoint de órdenes, entonces el sistema rechaza la operación con código 401.
- CA-10: Dado un coordinador autenticado, cuando asigna una cuadrilla a una orden en estado ABIERTA y sin solapamiento de fechas, entonces el sistema persiste la asignación, cambia la orden a ASIGNADA y responde con código 200.
- CA-11: Dado un coordinador autenticado, cuando intenta asignar una cuadrilla a una orden cuyos rangos de fechas se solapan con otra orden activa de la misma cuadrilla, entonces el sistema rechaza la operación con código 409 y un mensaje descriptivo.
- CA-12: Dado un coordinador autenticado, cuando intenta asignar una cuadrilla inexistente a una orden, entonces el sistema rechaza la operación con código 400.
- CA-13: Dado un coordinador autenticado, cuando intenta asignar una cuadrilla a una orden en estado CERRADA o CANCELADA, entonces el sistema rechaza la operación con código 409.
- CA-14: Dado un usuario autorizado, cuando inicia una orden en estado ASIGNADA, entonces el sistema cambia la orden a EN_EJECUCION, registra la fecha de inicio y responde con código 200.
- CA-15: Dado un usuario autorizado, cuando intenta iniciar una orden que no está en estado ASIGNADA, entonces el sistema rechaza la operación con código 409.
- CA-16: Dado un usuario autorizado, cuando cierra una orden en estado EN_EJECUCION con observación de cierre, entonces el sistema cambia la orden a CERRADA, registra la fecha de cierre y responde con código 200.
- CA-17: Dado un usuario autorizado, cuando intenta cerrar una orden sin observación de cierre, entonces el sistema rechaza la operación con código 400.
- CA-18: Dado un usuario autorizado, cuando cierra la última orden activa de un activo, entonces el sistema cambia el activo a OPERATIVO.
- CA-19: Dado un usuario autorizado, cuando cancela una orden en estado ABIERTA o ASIGNADA con motivo, entonces el sistema cambia la orden a CANCELADA y responde con código 200.
- CA-20: Dado un usuario autorizado, cuando intenta cancelar una orden en estado EN_EJECUCION, entonces el sistema rechaza la operación con código 409 y un mensaje descriptivo.
- CA-21: Dado un usuario autorizado, cuando intenta cancelar una orden sin motivo, entonces el sistema rechaza la operación con código 400.
- CA-22: Dado un COORDINADOR autenticado, cuando reabre una orden cerrada, entonces el sistema cambia la orden a ABIERTA y responde con código 200. Dado un SUPERVISOR autenticado, cuando intenta la misma transición, entonces el sistema rechaza con código 403.
- CA-23: Dado un listado de órdenes, cuando el usuario aplica filtros por tipo, prioridad, estado, activo o rango de fechas, entonces el sistema devuelve únicamente las órdenes que cumplen los criterios.
- CA-24: Dado un listado con más órdenes que el tamaño de página, cuando el usuario consulta GET /api/ordenes?page=2&size=10, entonces el sistema devuelve las 10 órdenes correspondientes a la segunda página junto con el total de registros y los metadatos de paginación.
- CA-25: Dado un listado de órdenes sin parámetro sort, cuando el usuario consulta el listado, entonces el sistema devuelve las órdenes ordenadas por fecha de creación descendente.
- CA-26: Dado un supervisor autenticado, cuando consulta GET /api/ordenes/:id con un ID inexistente, entonces el sistema responde con código 404 y el formato de error estándar.
- CA-27: Dado un usuario autenticado, cuando consulta el listado con page negativo o size mayor al máximo permitido, entonces el sistema responde con código 400 y el formato de error estándar.
- CA-28: Dado un error de validación, conflicto o autorización, cuando el sistema responde, entonces el cuerpo del error sigue el formato code, message, details.
- CA-29: Dado un supervisor autenticado, cuando repite una solicitud PUT con los mismos datos sobre la misma orden en estado ABIERTA, entonces el sistema responde con el mismo resultado y el recurso permanece en el mismo estado (idempotencia).
- CA-30: Dado un supervisor autenticado, cuando intenta crear una orden con descripción mayor a 500 caracteres, código mayor a 50 caracteres o fecha programada anterior a la fecha de creación, entonces el sistema rechaza la operación con código 400.
- CA-31: Dado un supervisor autenticado, cuando intenta actualizar una orden con un código ya existente en otra orden, entonces el sistema rechaza la operación con código 409.
- CA-32: Dado un usuario autorizado, cuando cambia el estado de una orden mediante PATCH, entonces el sistema responde con código 200 y la orden actualizada, incluyendo su estado nuevo y los campos de auditoría actualizados.

---

## 4. Descomposición técnica

### 4.1 Backend

- Definir el modelo OrdenTrabajo con los atributos: id, codigo, tipo, prioridad, descripcion, activoId, estado, fechaProgramada, fechaInicio, fechaCierre, observacionCierre, motivoCancelacion, averiaId opcional, createdBy, updatedBy, createdAt, updatedAt (M).
- Definir el enum de tipos de mantenimiento con dos valores: PREVENTIVO y CORRECTIVO, aplicado a nivel de modelo y base de datos, para cumplir RN-02 (XS).
- Definir el enum de prioridades con tres valores: BAJA, MEDIA y ALTA, para cumplir RN-03 (XS).
- Definir el enum de estados de la orden con cinco valores: ABIERTA, ASIGNADA, EN_EJECUCION, CERRADA y CANCELADA (XS).
- Definir el modelo OrdenCuadrilla como tabla intermedia con ordenId, cuadrillaId, fechaAsignacion, fechaInicio, fechaFin, para soportar múltiples cuadrillas a lo largo del ciclo de vida (S).
- Crear la migración de la tabla ordenes con restricción UNIQUE sobre codigo, clave foránea a activos y averías, e índices sobre estado, prioridad, tipo, activoId y fechaProgramada. Incluir migración de rollback (down) (S).
- Crear la migración de la tabla orden_cuadrillas con claves foráneas a ordenes y cuadrillas, e índice compuesto sobre cuadrillaId y fechas para validar solapamiento (S).
- Implementar el endpoint GET /api/ordenes con filtros combinables por tipo, prioridad, estado, activo y rango de fechas, paginación estándar con validación de parámetros, orden por defecto por fecha de creación descendente y parámetro sort (M).
- Implementar el endpoint GET /api/ordenes/:id con detalle de la orden, cuadrillas asignadas y campos de auditoría, incluyendo 404 cuando el ID no existe (S).
- Implementar el endpoint POST /api/ordenes con validación de campos obligatorios, tipo permitido, prioridad permitida, existencia del activo, estado válido del activo, longitudes máximas y coherencia de fechas. Al crear, cambia el activo a EN_MANTENIMIENTO si estaba OPERATIVO (M).
- Implementar el endpoint PUT /api/ordenes/:id con las mismas validaciones que la creación, más la exclusión de la propia orden en la validación de unicidad de código, y comportamiento idempotente. Solo permitido en estado ABIERTA (M).
- Implementar el endpoint POST /api/ordenes/:id/cuadrillas para asignar una cuadrilla, validando solapamiento de fechas, existencia de la cuadrilla y estado de la orden. Cambia la orden a ASIGNADA (M).
- Implementar el endpoint DELETE /api/ordenes/:id/cuadrillas/:cuadrillaId para desasignar una cuadrilla, solo permitido en estado ASIGNADA (S).
- Implementar el endpoint PATCH /api/ordenes/:id/estado con validación de la máquina de estados de RN-09, incluyendo la restricción de reapertura solo para COORDINADOR, la obligatoriedad de observación de cierre y la obligatoriedad de motivo de cancelación. Devuelve 200 con la orden actualizada (M).
- Implementar la lógica de sincronización del estado del activo al crear, cerrar o cancelar órdenes, según RN-07 y RN-08, exponiendo un método reutilizable (S).
- Implementar la capa de servicio con las reglas RN-01 a RN-20, centralizando validaciones y devolviendo errores de dominio tipados (M).
- Implementar el middleware de manejo de errores que normaliza todas las respuestas de error al formato code, message, details (S).
- Implementar el helper de paginación reutilizable por todos los endpoints de listado, con validación de page y size y tamaño máximo de página (S).
- Implementar el registro automático de campos de auditoría en cada operación de escritura, tomando el usuario del token JWT (S).

### 4.2 Frontend

- Crear la vista de listado de órdenes que muestre código, tipo, prioridad, activo asociado, estado y fecha programada, con filtros combinables por tipo, prioridad, estado, activo y rango de fechas, paginación y ordenamiento por columnas (M).
- Implementar el consumo de los endpoints del backend mediante Axios, incluyendo interceptor para adjuntar el JWT y manejo centralizado de errores 400, 401, 403, 404, 409 y 500 según el formato estándar (M).
- Crear el formulario de creación y edición con validación de campos obligatorios, tipo permitido, prioridad permitida, activo existente y en estado válido, fecha programada válida y longitudes máximas, coherente con RN-02, RN-03, RN-04, RN-06 y RN-18, con etiquetas accesibles (label, aria-describedby) y diseño responsivo (M).
- Crear la vista de detalle de la orden que muestre sus datos, su estado actual, las cuadrillas asignadas y los campos de auditoría, con opción de cambiar estado, asignar cuadrilla y desasignar cuadrilla (M).
- Implementar el componente de cambio de estado que solo habilite las transiciones permitidas por RN-09 según el estado actual y el rol del usuario, exigiendo observación de cierre o motivo de cancelación según corresponda (M).
- Implementar el componente de asignación de cuadrilla con validación de solapamiento de fechas en el cliente, coherente con RN-11 (S).
- Implementar el manejo de estados de carga (skeleton), vacío y error en las vistas de listado, detalle y formulario (S).
- Implementar la vista responsiva con breakpoints para móvil, tablet y escritorio (S).

### 4.3 Persistencia

- Crear índices sobre estado, prioridad, tipo, activoId y fechaProgramada para que los filtros del listado sean eficientes (XS).
- Crear índice compuesto sobre cuadrillaId y fechas en orden_cuadrillas para validar solapamiento (XS).
- Crear seed inicial de órdenes de ejemplo que cubran los cinco estados y los dos tipos, asociadas a los activos del seed de HU-001 (S).
- Reutilizar el seed de usuarios de prueba con roles SUPERVISOR, COORDINADOR y TECNICO creado en HU-001 (XS).
- Reutilizar el seed de cuadrillas creado en HU-003 (XS).

### 4.4 Seguridad

- Reutilizar el middleware de autenticación JWT implementado en HU-001, que rechaza con 401 cualquier request sin token válido (XS).
- Reutilizar el middleware de autorización por rol de HU-001 y extenderlo para restringir creación, edición, asignación, cambio de estado, cierre y cancelación de órdenes a SUPERVISOR o COORDINADOR (S).
- Implementar la regla específica de RN-09 que restringe la reapertura de órdenes cerradas exclusivamente a COORDINADOR (S).
- Reutilizar la propagación del usuario autenticado a la capa de servicio para poblar los campos de auditoría (XS).

### 4.5 Testing

- Escribir pruebas unitarias del servicio que cubran cada regla de negocio RN-01 a RN-20, con casos de éxito y error (M).
- Escribir pruebas unitarias de la máquina de estados que cubran todas las transiciones permitidas y rechazadas de RN-09 (M).
- Escribir pruebas unitarias de la lógica de sincronización del estado del activo al crear, cerrar y cancelar órdenes (S).
- Escribir pruebas unitarias de la validación de solapamiento de cuadrillas (S).
- Escribir pruebas de integración de los endpoints /api/ordenes que verifiquen los códigos HTTP 201, 200, 400, 401, 403, 404, 409 y 500, y los CA-01 a CA-32 (M).
- Escribir pruebas de integración que verifiquen la restricción de unicidad, la paginación, el ordenamiento y las longitudes máximas directamente contra la base de datos (S).
- Escribir pruebas de componente del frontend para el listado, el formulario, el detalle y el cambio de estado (M).
- Escribir un smoke test end-to-end que cubra el flujo crear orden, asignar cuadrilla, iniciar, cerrar y verificar el cambio de estado del activo (S).
- Mantener el umbral de cobertura mínimo del 80% en la capa de servicio (XS).

### 4.6 Docker

- Reutilizar la configuración de healthcheck, depends_on y arranque automático implementada en HU-001 (XS).
- Verificar que la nueva migración y los nuevos seeds corran automáticamente al iniciar el contenedor, sin pasos manuales (S).
- Documentar en el README los endpoints nuevos y cualquier variable de entorno adicional (XS).

---

## 5. Estimación

- Backend: L (modelo M, enums XS, orden_cuadrilla S, migraciones S, GET listado M, GET detalle S, POST M, PUT M, POST asignación M, DELETE asignación S, PATCH estado M, sincronización activo S, servicio M, manejo de errores S, helper paginación S, auditoría S,).
- Frontend: L (listado M, Axios M, formulario M, detalle M, cambio de estado M, asignación cuadrilla S, estados de carga S, responsivo S).
- Persistencia: S (índices XS, índice compuesto XS, seed órdenes S, reutilización de seeds XS).
- Seguridad: S (reutilización auth XS, autorización extendida S, regla reapertura S, propagación usuario XS).
- Testing: L (unitarias servicio M, unitarias estados M, unitarias sincronización S, unitarias solapamiento S, integración endpoints M, integración unicidad/paginación S, componente frontend M, smoke e2e S, cobertura XS).
- Docker: XS (reutilización de configuración, verificación de migración y seeds, documentación).

---

## 6. Priorización

### MVP

- Modelo OrdenTrabajo, enums, tabla orden_cuadrilla y migraciones con rollback.
- Seed inicial de órdenes de ejemplo.
- Endpoints de consulta: GET listado y GET detalle.
- Endpoint de creación: POST con sincronización del activo a EN_MANTENIMIENTO.
- Validaciones de campos obligatorios, tipo, prioridad, unicidad, longitudes y coherencia de fechas.
- Autenticación y autorización por rol.
- Endpoint de actualización: PUT en estado ABIERTA.
- Asignación de cuadrilla con validación de solapamiento.
- Cambio de estado mediante PATCH con observación de cierre y motivo de cancelación.
- Sincronización del activo a OPERATIVO al cerrar o cancelar la última orden activa.
- Máquina de estados definida en RN-09.
- Manejo estandarizado de errores.
- Paginación, filtros combinables y ordenamiento del listado.
- Frontend funcional: listado, formulario, detalle, cambio de estado y asignación de cuadrilla.
- Pruebas unitarias y de integración de las reglas de negocio principales.

- Docker y ejecución del proyecto mediante docker compose up sin pasos manuales.

### Funcionalidades opcionales

- Pruebas de componente del frontend.
- Smoke test end-to-end.
- Desasignación de cuadrillas.
- Estados de carga mediante skeleton.
- Diseño responsive completo para móvil, tablet y escritorio.
- Ordenamiento configurable por diferentes campos desde la interfaz.
- Seeds adicionales de órdenes para cubrir diferentes escenarios de prueba.

### Mejoras futuras

- Notificaciones al asignar una cuadrilla.
- Carga de archivos adjuntos (evidencias fotográficas) al cerrar la orden.
- Historial de cambios de la orden visible en la interfaz.
- Búsqueda de texto completo sobre descripción.
- Generación automática de órdenes correctivas a partir de averías de HU-006.
- Logging estructurado con correlation ID por request.
- Rate limiting en la API.

---

## 7. Justificación

### 7.1 Actividades agregadas

- Se agregó la entidad OrdenCuadrilla como tabla intermedia, porque una orden puede tener múltiples cuadrillas a lo largo de su ciclo de vida y se requiere validar solapamiento por rango de fechas.
- Se agregó la sincronización del estado del activo al crear, cerrar y cancelar órdenes, porque HU-001 deja el activo en EN_MANTENIMIENTO y esta historia es responsable de devolverlo a OPERATIVO cuando corresponde.
- Se agregaron las reglas RN-09 a RN-20 para cubrir máquina de estados, solapamiento de cuadrillas, coherencia de fechas, auditoría, paginación, idempotencia, longitudes máximas, contrato de PATCH y restricción de cancelación en ejecución.
- Se agregaron los criterios CA-01 a CA-32 para cerrar la trazabilidad: cada regla tiene al menos un criterio asociado.
- Se agregó la validación de solapamiento de cuadrillas tanto en backend como en frontend, porque es una regla crítica de operación.
- Se agregó la obligatoriedad de observación de cierre y motivo de cancelación, porque son trazabilidad operativa indispensable.
- Se agregó la restricción de reapertura de órdenes cerradas exclusivamente a COORDINADOR, coherente con el nivel de autorización requerido.
- Se agregó la reutilización de seeds y middlewares de HU-001, para no duplicar lógica ya implementada y mantener consistencia.


### 7.2 Actividades eliminadas

- Se eliminó la gestión completa de cuadrillas desde esta historia, porque es alcance de HU-003. Aquí solo se consume la entidad Cuadrilla y se valida su existencia y disponibilidad.
- Se eliminó la gestión de averías desde esta historia, porque es alcance de HU-006. Aquí solo se referencia opcionalmente la avería de origen.
- Se eliminó la carga de archivos adjuntos al cierre, porque no aporta al núcleo del problema y queda como mejora futura.
- Se eliminó el envío de notificaciones al asignar cuadrillas, porque queda fuera del MVP.
- Se eliminó la búsqueda de texto completo sobre descripción, dejándola como mejora futura.


### 7.3 Decisiones tomadas

- Se decidió que una orden se asocia a un único activo, porque el mantenimiento se planifica sobre un equipo específico. Si se requiere intervenir varios activos, se crean órdenes separadas.
- Se decidió permitir múltiples cuadrillas a lo largo del ciclo de vida de una orden, pero solo una activa por rango de fechas, para reflejar la realidad operativa y controlar el solapamiento.
- Se decidió que la transición de estado del activo se gestione desde esta historia, porque es la que abre y cierra órdenes.
- Se decidió que la cancelación solo se permita antes de iniciar ejecución, porque cancelar una orden en ejecución rompería la trazabilidad operativa.
- Se decidió exigir observación de cierre y motivo de cancelación como obligatorios, porque son la evidencia de por qué la orden terminó en ese estado.
- Se decidió que la reapertura de órdenes cerradas sea exclusiva de COORDINADOR, por el nivel de impacto operativo.
- Se decidió reutilizar los middlewares de autenticación y autorización de HU-001, para mantener consistencia y no duplicar lógica.
- Se decidió reutilizar el contrato de error y el helper de paginación definidos en HU-001, para mantener uniformidad en la API.
- Se decidió usar idempotencia en PUT y no idempotencia en POST, asignación y cambio de estado, coherente con HU-001.
- Se decidió que el endpoint PATCH de cambio de estado devuelva 200 con la orden actualizada, coherente con HU-001.
- Se decidió dejar notificaciones, adjuntos, historial visible y búsqueda de texto completo como mejoras futuras, dado el plazo de entrega.

### 7.4 Riesgos identificados

- R-01 (orden sobre activo fuera de servicio): si una orden puede asociarse a un activo en FUERA_DE_SERVICIO, se planificaría mantenimiento sobre infraestructura que ya no está operativa.
  - Mitigación: RN-06 bloquea la asociación y CA-06 lo verifica.
- R-02 (transiciones de estado no controladas): sin validación de transiciones, una orden podría pasar a estados inconsistentes, reflejando una realidad operativa falsa.
  - Mitigación: RN-09 define las transiciones permitidas y el endpoint de cambio de estado las valida; CA-14, CA-15, CA-16, CA-19, CA-20 y CA-22 lo verifican.
- R-03 (solapamiento de cuadrillas): sin validación, una misma cuadrilla podría quedar asignada a dos órdenes simultáneas, generando conflicto operativo.
  - Mitigación: RN-11 valida solapamiento y CA-11 lo verifica. Se crea índice compuesto para hacer eficiente la validación.
- R-04 (pérdida de trazabilidad de quién modifica): sin campos de auditoría, no se podría determinar quién creó, asignó o cerró una orden.
  - Mitigación: RN-15 obliga a registrar campos de auditoría en cada operación.
- R-05 (inconsistencia del catálogo de tipos y prioridades): si se almacenan como texto libre, podrían registrarse valores fuera del catálogo del negocio.
  - Mitigación: enums cerrados aplicados en modelo y base de datos (RN-02 y RN-03).
- R-06 (activo bloqueado en EN_MANTENIMIENTO): si el cierre de una orden no actualiza el estado del activo, el activo quedaría marcado como EN_MANTENIMIENTO indefinidamente.
  - Mitigación: RN-08 sincroniza el estado del activo al cerrar o cancelar la última orden activa; CA-18 lo verifica.
- R-07 (órdenes huérfanas): sin validación de existencia del activo y de la cuadrilla, podrían registrarse órdenes con referencias inexistentes.
  - Mitigación: RN-06 y CA-05 validan existencia y estado del activo; CA-12 valida existencia de la cuadrilla.
- R-08 (cancelación ambigua): sin reglas claras, una orden podría quedar en un estado ambiguo sin trazabilidad de la razón.
  - Mitigación: RN-09 y RN-20 restringen cancelación a estados ABIERTA y ASIGNADA, y exigen motivo obligatorio; CA-19, CA-20 y CA-21 lo verifican.
- R-09 (fechas incoherentes): sin validación, podrían registrarse órdenes con fechas ilógicas.
  - Mitigación: RN-12, RN-13 y RN-14 validan coherencia de fechas; CA-30 lo verifica.
- R-10 (acceso no autorizado): si cualquier usuario puede crear o cerrar órdenes, se rompe la segregación de funciones.
  - Mitigación: RN-05 restringe creación, edición, asignación, cambio de estado, cierre y cancelación a SUPERVISOR o COORDINADOR; CA-08 lo verifica.

---




## HU-003 — Gestión de Cuadrillas

### Historia de Usuario

Como coordinador de operaciones
Quiero asignar cuadrillas a órdenes de trabajo
Para asegurar la ejecución de las actividades programadas.

---

## 1. Análisis

### 1.1 Ambigüedades

- El verbo asignar no define el alcance real. Puede implicar crear cuadrillas, consultar su disponibilidad, asignarlas, desasignarlas o reasignarlas. El backlog no aclara cuál de estas operaciones es obligatoria.
- No se especifica qué atributos componen una cuadrilla ni cuál es su identificador único.
- No se define si una cuadrilla tiene un número fijo de integrantes, si los integrantes son entidades propias o si basta con un nombre y un tamaño.
- No se define la composición mínima de una cuadrilla (por ejemplo, si requiere un líder).
- No se define el estado operativo de una cuadrilla (disponible, asignada, inactiva, en descanso, etc.).
- No se aclara si una cuadrilla puede estar asignada a múltiples órdenes simultáneas o solo a una.
- No se define si una cuadrilla tiene especialidad técnica (por ejemplo, electricidad, comunicaciones, obra civil).
- No se aclara si la cuadrilla tiene una zona o corredor vial asignado habitualmente.
- No se define el formato de fechas ni cómo se registra la disponibilidad.
- No se especifica quién puede crear, editar, activar o desactivar cuadrillas, más allá del coordinador mencionado.
- No se define la relación exacta entre cuadrilla y orden: ¿es una asignación directa o a través de una tabla intermedia?
- No se define qué sucede con las órdenes asignadas cuando una cuadrilla se desactiva.
- No se define si el corredor habitual y la especialidad técnica son mutables una vez creada la cuadrilla.
- No se aclara si el nombre de la cuadrilla debe ser único o solo el código.
- No se define qué sucede con la asignación previa cuando se reabre una orden cerrada.
- No se define el formato de errores ni el comportamiento de la API ante conflictos, validaciones o accesos no autorizados.
- No se define si el listado debe ser paginado ni con qué orden por defecto.

### 1.2 Dependencias

- Depende directamente de HU-002 Gestión de Órdenes de Trabajo, porque la asignación de cuadrillas se realiza sobre órdenes existentes y en estado válido.
- Es consumida por HU-002 en su flujo de asignación y por HU-004 Dashboard Operacional, que calcula indicadores de carga por cuadrilla.
- Depende de forma indirecta de HU-001 Gestión de Activos, porque las órdenes que se asignan están vinculadas a activos.
- Es prerequisito del seed de cuadrillas que HU-002 reutiliza.
- Dependencia transversal: HU-000 Auth, que provee autenticación y roles.
- Dependencia transversal: contrato de error estandarizado y contrato de paginación, reutilizados por todas las historias.
- Dependencia transversal: la tabla intermedia OrdenCuadrilla definida en HU-002, que esta historia utiliza como mecanismo de asignación.

### 1.3 Riesgos

- R-01: Si una cuadrilla puede asignarse a dos órdenes con rangos de fechas solapados, se generaría un conflicto operativo real.
- R-02: Si no se controla el estado de la cuadrilla, una cuadrilla inactiva o en descanso podría recibir asignaciones.
- R-03: Si no se registra auditoría, no se podría determinar quién creó, editó o desactivó una cuadrilla.
- R-04: Si la especialidad técnica se almacena como texto libre, podrían registrarse valores fuera del catálogo del negocio.
- R-05: Si se desactiva una cuadrilla con órdenes activas asignadas, esas órdenes quedarían sin responsable operativo.
- R-06: Si no se valida la existencia de la cuadrilla al asignarla, podrían registrarse asignaciones huérfanas.
- R-07: Si no se valida la existencia de la orden al asignarla, podrían registrarse asignaciones a órdenes inexistentes.
- R-08: Si no se define el comportamiento de desasignación, las órdenes podrían quedar con cuadrillas asignadas sin trazabilidad de la razón.
- R-09: Si no se controla el acceso por rol, cualquier usuario podría crear o desactivar cuadrillas sin autorización.
- R-10: Si no se valida la composición mínima o máxima de la cuadrilla, podrían registrarse cuadrillas vacías o sobredimensionadas.
- R-11: Si se reabre una orden cerrada sin definir qué sucede con la asignación previa, podrían quedar cuadrillas asignadas de forma implícita o duplicada.
- R-12: Si el corredor habitual o la especialidad técnica cambian sin auditoría, se pierde trazabilidad de la reasignación operativa.

### 1.4 Supuestos

- Cada cuadrilla tiene un código único, nombre, especialidad técnica, número de integrantes, estado operativo y corredor vial habitual.
- El nombre de la cuadrilla no requiere unicidad; solo el código es único.
- El catálogo de especialidades técnicas es cerrado y contempla cuatro valores: ELECTRICIDAD, COMUNICACIONES, OBRA_CIVIL y MULTIDISCIPLINARIA.
- El catálogo de estados de cuadrilla es cerrado y contempla tres valores: DISPONIBLE, ASIGNADA e INACTIVA.
- Una cuadrilla tiene un número mínimo de 2 integrantes y un máximo de 10.
- Una cuadrilla puede estar asignada a múltiples órdenes a lo largo del tiempo, pero no en rangos de fechas solapados. Esta regla se define en HU-002 (RN-11) y se reutiliza aquí.
- La asignación de cuadrillas a órdenes se realiza a través de la tabla intermedia OrdenCuadrilla definida en HU-002, que ya incluye fechas de asignación, inicio y fin.
- Al asignar una cuadrilla a una orden activa, la cuadrilla pasa a estado ASIGNADA si no tiene otras asignaciones simultáneas. Al liberarse, vuelve a DISPONIBLE.
- Una cuadrilla INACTIVA no puede recibir nuevas asignaciones.
- Al reactivar una cuadrilla INACTIVA, vuelve a estado DISPONIBLE.
- El corredor habitual y la especialidad técnica son mutables y requieren auditoría al cambiar.
- Al reabrir una orden cerrada, la asignación previa de cuadrilla no se restaura automáticamente. El coordinador debe reasignar manualmente.
- El sistema incluye autenticación mediante JWT provisto por HU-000 Auth. Sin autenticación, ningún endpoint de cuadrillas responde.
- Los campos de auditoría createdBy, updatedBy, createdAt y updatedAt se registran en toda operación de escritura.
- Supuesto transversal: todos los errores de la API siguen el formato code, message, details y usan códigos HTTP semánticos (400, 401, 403, 404, 409, 422, 500).
- Supuesto transversal: todos los endpoints de listado usan paginación estándar con los parámetros page y size, y devuelven el total de registros junto con los datos.
- Supuesto transversal: el orden por defecto del listado de cuadrillas es por nombre ascendente. El usuario puede cambiar el orden mediante el parámetro sort.
- El formato de fechas es ISO 8601 (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ssZ según corresponda).
- La gestión de integrantes individuales de la cuadrilla (personas) queda fuera del MVP. La cuadrilla se modela como una unidad operativa con un número de integrantes, no como una colección de personas.
- La gestión de disponibilidad horaria detallada (turnos, descansos, vacaciones) queda fuera del MVP. Se documenta como mejora futura.
- Las asignaciones históricas se conservan al desactivar una cuadrilla, para preservar la trazabilidad operativa.

---

## 2. Refinamiento

### 2.1 Entidades involucradas

- Cuadrilla: entidad principal. Representa un equipo operativo de mantenimiento.
- OrdenTrabajo: entidad referenciada cuando se asigna. Se detalla en HU-002.
- OrdenCuadrilla: tabla intermedia definida en HU-002, que materializa la asignación.
- Corredor: entidad de catálogo que indica el corredor vial habitual de la cuadrilla. Se detalla en HU-001.
- Usuario: actor que crea, edita, activa, desactiva y asigna cuadrillas. Se asume provisto por HU-000 Auth.

### 2.2 Reglas de negocio

- RN-01: El código de una cuadrilla debe ser único en el sistema, tanto en la creación como en la actualización.
- RN-02: La especialidad técnica debe pertenecer a uno de los siguientes valores: ELECTRICIDAD, COMUNICACIONES, OBRA_CIVIL o MULTIDISCIPLINARIA.
- RN-03: El estado de la cuadrilla debe pertenecer a uno de los siguientes valores: DISPONIBLE, ASIGNADA o INACTIVA.
- RN-04: El código, el nombre, la especialidad técnica, el número de integrantes y el corredor vial habitual son obligatorios.
- RN-05: El número de integrantes debe estar entre 2 y 10.
- RN-06: Solo usuarios con rol COORDINADOR o SUPERVISOR pueden crear, editar, activar, desactivar o asignar cuadrillas. Los roles TECNICO y cualquier otro rol no autorizado solo pueden consultar.
- RN-07: Una cuadrilla en estado INACTIVA no puede recibir nuevas asignaciones.
- RN-08: Una cuadrilla no puede estar asignada a dos órdenes activas cuyos rangos de fechas se solapen. Esta regla es la misma RN-11 de HU-002 y se implementa como validación única en la capa de servicio.
- RN-09: Al asignar una cuadrilla a una orden activa, el sistema cambia el estado de la cuadrilla a ASIGNADA si no tiene otras asignaciones simultáneas.
- RN-10: Al liberarse de todas las asignaciones activas, el sistema cambia el estado de la cuadrilla a DISPONIBLE.
- RN-11: No se permite desactivar una cuadrilla con asignaciones activas. Primero deben desasignarse o cerrarse las órdenes asociadas.
- RN-12: La desasignación de una cuadrilla de una orden solo se permite cuando la orden está en estado ASIGNADA, no en EN_EJECUCION, CERRADA ni CANCELADA.
- RN-13: Toda operación de escritura sobre una cuadrilla debe registrar el usuario que la ejecutó y la marca temporal correspondiente.
- RN-14: El listado de cuadrillas se devuelve paginado, con orden por defecto por nombre ascendente, y admite ordenamiento por código, especialidad, estado o corredor.
- RN-15: Los endpoints de creación (POST), activación, desactivación y asignación son no idempotentes. El endpoint de actualización (PUT) es idempotente.
- RN-16: El código tiene máximo 50 caracteres, el nombre máximo 120 caracteres.
- RN-17: El endpoint PATCH de cambio de estado devuelve 200 con la cuadrilla actualizada, incluyendo su estado nuevo y los campos de auditoría actualizados.
- RN-18: Una cuadrilla no puede eliminarse físicamente. La operación de baja se realiza mediante el cambio de estado a INACTIVA, preservando el histórico de asignaciones.
- RN-19: Al reactivar una cuadrilla en estado INACTIVA, el sistema cambia su estado a DISPONIBLE y registra los campos de auditoría correspondientes.
- RN-20: Al reabrir una orden cerrada, la asignación previa de cuadrilla no se restaura automáticamente. El coordinador debe reasignar manualmente.
- RN-21: El corredor habitual y la especialidad técnica son mutables. Cada cambio queda auditado en updatedBy y updatedAt.
- RN-22: El nombre de la cuadrilla no requiere unicidad. Solo el código es único.

### 2.3 Estados

- DISPONIBLE: cuadrilla operativa sin asignaciones activas.
- ASIGNADA: cuadrilla con al menos una asignación activa.
- INACTIVA: cuadrilla dada de baja operativa. No puede recibir nuevas asignaciones. Se conserva por trazabilidad.

### 2.4 Relaciones

- Una Cuadrilla pertenece a un Corredor (corredor habitual).
- Un Corredor agrupa muchas Cuadrillas.
- Una Cuadrilla puede tener muchas asignaciones a Órdenes de Trabajo a lo largo del tiempo, pero no en rangos de fechas solapados.
- Una OrdenTrabajo puede tener cero o muchas Cuadrillas asignadas a lo largo de su ciclo de vida, según lo definido en HU-002.
- La relación Cuadrilla-OrdenTrabajo se materializa en la tabla intermedia OrdenCuadrilla definida en HU-002.
- Un Usuario con rol COORDINADOR o SUPERVISOR gestiona las cuadrillas y queda registrado como auditor en cada cambio.

### 2.5 Flujo funcional

1. El usuario se autentica y obtiene un token JWT. Sin token, el sistema responde 401 en cualquier endpoint de cuadrillas.
2. El coordinador accede al módulo de cuadrillas y visualiza el listado paginado con filtros por especialidad, estado y corredor vial.
3. El coordinador crea una nueva cuadrilla completando el formulario con código, nombre, especialidad, número de integrantes y corredor vial habitual. El sistema valida unicidad de código, especialidad permitida, rango de integrantes y existencia del corredor.
4. Si la validación pasa, el sistema registra la cuadrilla con estado DISPONIBLE, guarda los campos de auditoría y la muestra en el listado. Si falla, devuelve un error con el formato estándar.
5. El coordinador puede editar los datos de la cuadrilla, incluido el corredor habitual y la especialidad, siempre que no esté asignada a una orden en ejecución.
6. El coordinador asigna la cuadrilla a una orden desde el módulo de órdenes. El sistema valida solapamiento de fechas, estado DISPONIBLE de la cuadrilla y estado válido de la orden. Al asignar, la cuadrilla pasa a ASIGNADA si no tiene otras asignaciones simultáneas.
7. Cuando la orden se cierra o cancela, la asignación se libera y, si la cuadrilla no tiene otras asignaciones activas, vuelve a DISPONIBLE.
8. Si el coordinador desea dar de baja una cuadrilla, el sistema no permite su eliminación física. La baja se realiza mediante el cambio de estado a INACTIVA, siempre que no tenga asignaciones activas.
9. Si el coordinador reactiva una cuadrilla INACTIVA, el sistema la devuelve a estado DISPONIBLE y registra la auditoría correspondiente.
10. Si se reabre una orden cerrada, la asignación previa no se restaura. El coordinador debe reasignar manualmente la cuadrilla.
11. Al consultar el listado, el sistema devuelve los datos paginados junto con el total de registros y los metadatos de paginación.

---

## 3. Criterios de aceptación

- CA-01: Dado un coordinador autenticado, cuando crea una cuadrilla con código, nombre, especialidad, número de integrantes y corredor vial válidos, entonces el sistema registra la cuadrilla con estado DISPONIBLE, guarda los campos de auditoría y responde con código 201.
- CA-02: Dado un coordinador autenticado, cuando intenta crear una cuadrilla con un código ya existente, entonces el sistema rechaza la operación con código 409 y un mensaje descriptivo.
- CA-03: Dado un coordinador autenticado, cuando intenta crear una cuadrilla sin nombre, sin especialidad, sin número de integrantes o sin corredor vial, entonces el sistema rechaza la operación con código 400.
- CA-04: Dado un coordinador autenticado, cuando intenta crear una cuadrilla con una especialidad no permitida, entonces el sistema rechaza la operación con código 400 y un mensaje descriptivo.
- CA-05: Dado un coordinador autenticado, cuando intenta crear una cuadrilla con menos de 2 o más de 10 integrantes, entonces el sistema rechaza la operación con código 400.
- CA-06: Dado un coordinador autenticado, cuando intenta crear una cuadrilla asociada a un corredor vial inexistente, entonces el sistema rechaza la operación con código 400.
- CA-07: Dado un usuario con rol TECNICO, cuando intenta crear, editar, activar, desactivar o asignar una cuadrilla, entonces el sistema rechaza la operación con código 403.
- CA-08: Dado un usuario no autenticado, cuando intenta acceder a cualquier endpoint de cuadrillas, entonces el sistema rechaza la operación con código 401.
- CA-09: Dado un coordinador autenticado, cuando actualiza una cuadrilla existente con datos válidos y sin asignaciones en ejecución, entonces el sistema persiste los cambios, actualiza updatedBy y updatedAt, y responde con código 200.
- CA-10: Dado un coordinador autenticado, cuando intenta actualizar una cuadrilla cambiando su código por uno ya existente en otra cuadrilla, entonces el sistema rechaza la operación con código 409.
- CA-11: Dado un coordinador autenticado, cuando intenta actualizar una cuadrilla que tiene una asignación en estado EN_EJECUCION, entonces el sistema rechaza la operación con código 409 y un mensaje descriptivo.
- CA-12: Dado un coordinador autenticado, cuando asigna una cuadrilla DISPONIBLE a una orden válida sin solapamiento de fechas, entonces el sistema persiste la asignación, cambia la cuadrilla a ASIGNADA y responde con código 200.
- CA-13: Dado un coordinador autenticado, cuando intenta asignar una cuadrilla cuyos rangos de fechas se solapan con otra orden activa de la misma cuadrilla, entonces el sistema rechaza la operación con código 409 y un mensaje descriptivo.
- CA-14: Dado un coordinador autenticado, cuando intenta asignar una cuadrilla en estado INACTIVA a una orden, entonces el sistema rechaza la operación con código 409 y un mensaje descriptivo.
- CA-15: Dado un coordinador autenticado, cuando intenta asignar una cuadrilla a una orden en estado CERRADA o CANCELADA, entonces el sistema rechaza la operación con código 409.
- CA-16: Dado un coordinador autenticado, cuando libera una cuadrilla de su última asignación activa al cerrar la orden, entonces el sistema cambia la cuadrilla a DISPONIBLE.
- CA-17: Dado un coordinador autenticado, cuando intenta desactivar una cuadrilla con asignaciones activas, entonces el sistema rechaza la operación con código 409 y un mensaje descriptivo.
- CA-18: Dado un coordinador autenticado, cuando desactiva una cuadrilla sin asignaciones activas, entonces el sistema cambia su estado a INACTIVA y responde con código 200.
- CA-19: Dado un coordinador autenticado, cuando desasigna una cuadrilla de una orden en estado ASIGNADA, entonces el sistema elimina la asignación, y si no quedan otras asignaciones activas, cambia la cuadrilla a DISPONIBLE y responde con código 200.
- CA-20: Dado un coordinador autenticado, cuando intenta desasignar una cuadrilla de una orden en estado EN_EJECUCION, entonces el sistema rechaza la operación con código 409.
- CA-21: Dado un listado de cuadrillas, cuando el usuario aplica filtros por especialidad, estado o corredor vial, entonces el sistema devuelve únicamente las cuadrillas que cumplen los criterios.
- CA-22: Dado un listado con más cuadrillas que el tamaño de página, cuando el usuario consulta GET /api/cuadrillas?page=2&size=10, entonces el sistema devuelve las 10 cuadrillas correspondientes a la segunda página junto con el total de registros y los metadatos de paginación.
- CA-23: Dado un listado de cuadrillas sin parámetro sort, cuando el usuario consulta el listado, entonces el sistema devuelve las cuadrillas ordenadas por nombre ascendente.
- CA-24: Dado un coordinador autenticado, cuando consulta GET /api/cuadrillas/:id con un ID inexistente, entonces el sistema responde con código 404 y el formato de error estándar.
- CA-25: Dado un usuario autenticado, cuando consulta el listado con page negativo o size mayor al máximo permitido, entonces el sistema responde con código 400 y el formato de error estándar.
- CA-26: Dado un error de validación, conflicto o autorización, cuando el sistema responde, entonces el cuerpo del error sigue el formato code, message, details.
- CA-27: Dado un coordinador autenticado, cuando repite una solicitud PUT con los mismos datos sobre la misma cuadrilla, entonces el sistema responde con el mismo resultado y el recurso permanece en el mismo estado (idempotencia).
- CA-28: Dado un coordinador autenticado, cuando intenta crear una cuadrilla con nombre mayor a 120 caracteres o código mayor a 50 caracteres, entonces el sistema rechaza la operación con código 400.
- CA-29: Dado un coordinador autenticado, cuando cambia el estado de una cuadrilla mediante PATCH, entonces el sistema responde con código 200 y la cuadrilla actualizada, incluyendo su estado nuevo y los campos de auditoría actualizados.
- CA-30: Dado un listado de cuadrillas, cuando el usuario aplica simultáneamente filtros por especialidad y estado, entonces el sistema devuelve únicamente las cuadrillas que cumplen ambos criterios.
- CA-31: Dado un coordinador autenticado, cuando reactiva una cuadrilla en estado INACTIVA, entonces el sistema cambia su estado a DISPONIBLE, registra la auditoría correspondiente y responde con código 200.
- CA-32: Dado un coordinador autenticado, cuando desasigna una cuadrilla de una orden en estado ASIGNADA y la cuadrilla aún tiene otras asignaciones activas, entonces el sistema elimina la asignación pero mantiene el estado ASIGNADA.
- CA-33: Dado un coordinador autenticado, cuando reabre una orden previamente cerrada, entonces el sistema no restaura automáticamente la asignación previa de cuadrilla y la orden vuelve a estado ABIERTA sin cuadrillas asignadas.
- CA-34: Dado un coordinador autenticado, cuando actualiza el corredor habitual o la especialidad técnica de una cuadrilla, entonces el sistema persiste el cambio, actualiza updatedBy y updatedAt, y responde con código 200.
- CA-35: Dado un coordinador autenticado, cuando consulta el detalle de una cuadrilla INACTIVA, entonces el sistema devuelve sus datos, su estado y el histórico de asignaciones asociadas.

---

## 4. Descomposición técnica

### 4.1 Backend

- Definir el modelo Cuadrilla con los atributos: id, codigo, nombre, especialidad, numeroIntegrantes, corredorId, estado, createdBy, updatedBy, createdAt, updatedAt (S).
- Definir el enum de especialidades técnicas con cuatro valores: ELECTRICIDAD, COMUNICACIONES, OBRA_CIVIL y MULTIDISCIPLINARIA, aplicado a nivel de modelo y base de datos, para cumplir RN-02 (XS).
- Definir el enum de estados de cuadrilla con tres valores: DISPONIBLE, ASIGNADA e INACTIVA, para cumplir RN-03 (XS).
- Crear la migración de la tabla cuadrillas con restricción UNIQUE sobre codigo, clave foránea a corredores, restricción de rango entre 2 y 10 integrantes, e índices sobre especialidad, estado y corredorId. Incluir migración de rollback (down) (S).
- Implementar el endpoint GET /api/cuadrillas con filtros combinables por especialidad, estado y corredor vial, paginación estándar con validación de parámetros, orden por defecto por nombre ascendente y parámetro sort (M).
- Implementar el endpoint GET /api/cuadrillas/:id con detalle de la cuadrilla, sus asignaciones activas, el histórico de asignaciones cuando esté inactiva y campos de auditoría, incluyendo 404 cuando el ID no existe (M).
- Implementar el endpoint POST /api/cuadrillas con validación de campos obligatorios, especialidad permitida, rango de integrantes, existencia del corredor y longitudes máximas (M).
- Implementar el endpoint PUT /api/cuadrillas/:id con las mismas validaciones que la creación, más la exclusión de la propia cuadrilla en la validación de unicidad de código, más el bloqueo de edición si tiene asignaciones en ejecución, permitiendo cambios de corredor habitual y especialidad con auditoría, y comportamiento idempotente (M).
- Implementar el endpoint PATCH /api/cuadrillas/:id/estado con validación de RN-11 (no desactivar con asignaciones activas), RN-19 (reactivación a DISPONIBLE) y devolviendo 200 con la cuadrilla actualizada (M).
- Implementar el endpoint POST /api/cuadrillas/:id/asignaciones para asignar la cuadrilla a una orden, reutilizando el endpoint POST /api/ordenes/:id/cuadrillas definido en HU-002. Alternativamente, centralizar la lógica en un servicio compartido entre ambas historias (S).
- Implementar el endpoint DELETE /api/cuadrillas/:id/asignaciones/:ordenId para desasignar la cuadrilla de una orden en estado ASIGNADA, según RN-12, manteniendo el estado ASIGNADA si quedan otras asignaciones activas (S).
- Implementar la lógica de sincronización del estado de la cuadrilla al asignar, liberar, activar y desactivar, según RN-09, RN-10, RN-11 y RN-19, exponiendo un método reutilizable por HU-002 (S).
- Implementar la regla RN-20 que impide restaurar asignaciones previas al reabrir una orden cerrada (S).
- Implementar la capa de servicio con las reglas RN-01 a RN-22, centralizando validaciones y devolviendo errores de dominio tipados (M).
- Reutilizar el middleware de manejo de errores de HU-001 que normaliza todas las respuestas de error al formato code, message, details (XS).
- Reutilizar el helper de paginación de HU-001 con validación de page y size y tamaño máximo de página (XS).
- Reutilizar el registro automático de campos de auditoría de HU-001, tomando el usuario del token JWT (XS).

### 4.2 Frontend

- Crear la vista de listado de cuadrillas que muestre código, nombre, especialidad, número de integrantes, corredor vial habitual y estado, con filtros combinables por especialidad, estado y corredor, paginación y ordenamiento por columnas (M).
- Implementar el consumo de los endpoints del backend mediante Axios, incluyendo interceptor para adjuntar el JWT y manejo centralizado de errores 400, 401, 403, 404, 409 y 500 según el formato estándar (M).
- Crear el formulario de creación y edición con validación de campos obligatorios, especialidad permitida, rango de integrantes, corredor existente y longitudes máximas, coherente con RN-02, RN-04, RN-05 y RN-16, con etiquetas accesibles (label, aria-describedby) y diseño responsivo (M).
- Crear la vista de detalle de la cuadrilla que muestre sus datos, su estado actual, sus asignaciones activas, el histórico de asignaciones cuando esté inactiva y los campos de auditoría, con opción de cambiar estado, activar, desactivar y desasignar (M).
- Implementar el componente de cambio de estado que solo habilite las transiciones permitidas por RN-11, RN-18, RN-19 y RN-12 según el estado actual y el rol del usuario (S).
- Implementar el componente de asignación de cuadrilla a orden con validación de solapamiento de fechas en el cliente, reutilizando el componente definido en HU-002 (S).
- Implementar el manejo de estados de carga (skeleton), vacío y error en las vistas de listado, detalle y formulario (S).
- Implementar la vista responsiva con breakpoints para móvil, tablet y escritorio (S).

### 4.3 Persistencia

- Crear índices sobre especialidad, estado y corredorId para que los filtros del listado sean eficientes (XS).
- Crear índice compuesto sobre especialidad y estado para optimizar el filtro combinado (XS).
- Crear restricción CHECK en la base de datos para el rango de integrantes entre 2 y 10 (XS).
- Crear seed inicial de cuadrillas de ejemplo que cubran las cuatro especialidades y los tres estados, asociadas a los corredores del seed de HU-001 (S).
- Reutilizar el seed de usuarios de prueba con roles SUPERVISOR, COORDINADOR y TECNICO creado en HU-001 (XS).

### 4.4 Seguridad

- Reutilizar el middleware de autenticación JWT implementado en HU-001, que rechaza con 401 cualquier request sin token válido (XS).
- Reutilizar el middleware de autorización por rol de HU-001 y extenderlo para restringir creación, edición, activación, desactivación, asignación y desasignación de cuadrillas a COORDINADOR o SUPERVISOR (S).
- Implementar la regla específica de RN-07 que restringe asignaciones a cuadrillas INACTIVAS (S).
- Implementar la regla específica de RN-11 que restringe la desactivación de cuadrillas con asignaciones activas (S).
- Reutilizar la propagación del usuario autenticado a la capa de servicio para poblar los campos de auditoría (XS).

### 4.5 Testing

- Escribir pruebas unitarias del servicio que cubran cada regla de negocio RN-01 a RN-22, con casos de éxito y error (M).
- Escribir pruebas unitarias de la lógica de sincronización del estado de la cuadrilla al asignar, liberar, activar y desactivar (S).
- Escribir pruebas unitarias de la validación de solapamiento de cuadrillas, compartida con HU-002 (S).
- Escribir pruebas unitarias de la reactivación de cuadrillas y de la no restauración automática de asignaciones al reabrir órdenes cerradas (S).
- Escribir pruebas de integración de los endpoints /api/cuadrillas que verifiquen los códigos HTTP 201, 200, 400, 401, 403, 404, 409 y 500, y los CA-01 a CA-35 (M).
- Escribir pruebas de integración que verifiquen la restricción de unicidad, el rango de integrantes, la paginación, el ordenamiento y las longitudes máximas directamente contra la base de datos (S).
- Escribir pruebas de componente del frontend para el listado, el formulario, el detalle y el cambio de estado (M).
- Escribir un smoke test end-to-end que cubra el flujo crear cuadrilla, asignar a orden, liberar, desactivar y reactivar (S).
- Mantener el umbral de cobertura mínimo del 80% en la capa de servicio (XS).

### 4.6 Docker

- Reutilizar la configuración de healthcheck, depends_on y arranque automático implementada en HU-001 (XS).
- Verificar que la nueva migración y los nuevos seeds corran automáticamente al iniciar el contenedor, sin pasos manuales (S).
- Documentar en el README los endpoints nuevos y cualquier variable de entorno adicional (XS).

---

## 5. Estimación

- Backend: M (modelo S, enums XS, migración S, GET listado M, GET detalle M, POST M, PUT M, PATCH estado M, endpoints de asignación y desasignación S, sincronización estado S, regla RN-20 S, servicio M, reutilización de middleware y helpers XS,).
- Frontend: M (listado M, Axios M, formulario M, detalle M, cambio de estado S, asignación reutilizada S, estados de carga S, responsivo S).
- Persistencia: S (índices XS, índice compuesto XS, restricción CHECK XS, seed cuadrillas S, reutilización de seeds XS).
- Seguridad: S (reutilización auth XS, autorización extendida S, reglas específicas S, propagación usuario XS).
- Testing: M (unitarias servicio M, unitarias sincronización S, unitarias solapamiento S, unitarias reactivación S, integración endpoints M, integración unicidad/paginación S, componente frontend M, smoke e2e S, cobertura XS).
- Docker: XS (reutilización de configuración, verificación de migración y seeds, documentación).


## 6. Priorización

### MVP

- Modelo Cuadrilla, enums, migración con rollback y restricción de rango de integrantes.
- Seed inicial de cuadrillas de ejemplo.
- Endpoints de consulta: GET listado y GET detalle.
- Endpoint de creación: POST con validación de especialidad, rango de integrantes y existencia de corredor.
- Validaciones de campos obligatorios, unicidad, longitudes y rango de integrantes.
- Autenticación y autorización por rol.
- Endpoint de actualización: PUT con bloqueo si hay asignaciones en ejecución y auditoría de cambios de corredor y especialidad.
- Cambio de estado mediante PATCH con validación de asignaciones activas y reactivación a DISPONIBLE.
- Asignación de cuadrilla a orden reutilizando el endpoint de HU-002.
- Sincronización del estado de la cuadrilla al asignar, liberar, activar y desactivar.
- Manejo estandarizado de errores.
- Paginación, filtros combinables y ordenamiento del listado.
- Frontend funcional: listado, formulario, detalle, cambio de estado y asignación.
- Pruebas unitarias y de integración de las reglas de negocio principales.
- Docker y ejecución del proyecto mediante docker compose up sin pasos manuales.

### Funcionalidades opcionales

- Desasignación explícita de cuadrillas desde la interfaz.
- Pruebas de componente del frontend.
- Smoke test end-to-end.
- Estados de carga mediante skeleton.
- Diseño responsive completo para móvil, tablet y escritorio.
- Ordenamiento configurable por diferentes campos desde la interfaz.
- Seeds adicionales de cuadrillas para cubrir diferentes escenarios de prueba.
- Vista de histórico de asignaciones en el detalle de la cuadrilla.

### Mejoras futuras

- Gestión de integrantes individuales de la cuadrilla (personas).
- Gestión de disponibilidad horaria detallada (turnos, descansos, vacaciones).
- Especialidades múltiples por cuadrilla.
- Historial de asignaciones visible en la interfaz.
- Notificaciones al asignar una cuadrilla.
- Búsqueda de texto completo sobre nombre.
- Logging estructurado con correlation ID por request.
- Rate limiting en la API.
- Métricas de carga por cuadrilla expuestas a HU-004.

---

## 7. Justificación

### 7.1 Actividades agregadas

- Se agregó la sincronización del estado de la cuadrilla al asignar, liberar, activar y desactivar (RN-09, RN-10, RN-11, RN-19), porque la cuadrilla debe reflejar su disponibilidad operativa en tiempo real.
- Se agregó el bloqueo de edición de cuadrillas con asignaciones en ejecución, porque modificar una cuadrilla en uso puede afectar la orden en curso.
- Se agregó el bloqueo de desactivación de cuadrillas con asignaciones activas, para evitar dejar órdenes sin responsable operativo.
- Se agregó la regla RN-19 para reactivar cuadrillas INACTIVAS devolviéndolas a DISPONIBLE, con auditoría.
- Se agregó la regla RN-20 que impide restaurar automáticamente la asignación previa al reabrir una orden cerrada, para evitar duplicidad implícita.
- Se agregaron las reglas RN-21 y RN-22 para permitir la mutabilidad auditada del corredor y la especialidad, y aclarar que solo el código es único.
- Se agregó la restricción de rango de integrantes entre 2 y 10 tanto en servicio como en base de datos, porque una cuadrilla vacía o sobredimensionada no es operativa.
- Se agregaron las reglas RN-07 a RN-22 y los criterios CA-01 a CA-35 para cerrar la trazabilidad: cada regla tiene al menos un criterio asociado.
- Se agregó la reutilización explícita de la tabla OrdenCuadrilla de HU-002, para no duplicar el modelo de asignación.
- Se agregó la reutilización del middleware de autenticación, autorización, manejo de errores, helper de paginación y auditoría de HU-001, para mantener consistencia.
- Se agregó el modelo Cuadrilla con corredor vial habitual, porque refleja cómo se organiza la operación real en la concesión.
- Se agregó la especialidad técnica como catálogo cerrado, porque permite filtrar y asignar cuadrillas de forma coherente con el tipo de intervención.
- Se agregó el índice compuesto sobre especialidad y estado, para optimizar el filtro combinado más frecuente.
- Se agregó la vista de histórico de asignaciones en el detalle de cuadrillas INACTIVAS, para preservar trazabilidad.

### 7.2 Actividades eliminadas

- Se eliminó la gestión de integrantes individuales de la cuadrilla (personas), porque no aporta al núcleo del problema y queda como mejora futura.
- Se eliminó la gestión de disponibilidad horaria detallada (turnos, descansos, vacaciones), porque queda fuera del MVP.
- Se eliminó la eliminación física de cuadrillas, porque rompería el histórico de asignaciones. Se reemplaza por baja lógica mediante estado INACTIVA.
- Se eliminó la gestión de especialidades múltiples por cuadrilla, porque complica el modelo sin aportar valor en el MVP.
- Se eliminó la búsqueda de texto completo sobre nombre, dejándola como mejora futura.


### 7.3 Decisiones tomadas

- Se decidió modelar la cuadrilla como una unidad operativa con un número de integrantes, no como una colección de personas, para simplificar el MVP sin perder valor operativo.
- Se decidió que la especialidad técnica sea un catálogo cerrado de cuatro valores, para permitir filtros consistentes y asignaciones coherentes.
- Se decidió que el corredor vial habitual de la cuadrilla sea una referencia a la entidad Corredor de HU-001, para mantener consistencia.
- Se decidió reutilizar la tabla OrdenCuadrilla definida en HU-002 como mecanismo de asignación, para no duplicar el modelo.
- Se decidió que la cuadrilla pase a ASIGNADA al recibir una asignación activa y vuelva a DISPONIBLE al liberarse de todas, para reflejar su disponibilidad operativa.
- Se decidió bloquear la desactivación de cuadrillas con asignaciones activas, para evitar dejar órdenes sin responsable.
- Se decidió bloquear la edición de cuadrillas con asignaciones en ejecución, porque modificar una cuadrilla en uso puede afectar la orden en curso.
- Se decidió que la baja de una cuadrilla se realice mediante el cambio de estado a INACTIVA, preservando el histórico de asignaciones.
- Se decidió permitir la reactivación de cuadrillas INACTIVAS a DISPONIBLE, con auditoría.
- Se decidió que al reabrir una orden cerrada no se restaure la asignación previa, para evitar duplicidad implícita; el coordinador reasigna manualmente.
- Se decidió permitir la mutabilidad del corredor habitual y la especialidad, con auditoría.
- Se decidió que solo el código de la cuadrilla es único, no el nombre.
- Se decidió reutilizar los middlewares, contrato de error, helper de paginación, auditoría y seeds de HU-001, para mantener consistencia y no duplicar lógica.
- Se decidió usar idempotencia en PUT y no idempotencia en POST, activación, desactivación y asignación, coherente con HU-001 y HU-002.
- Se decidió que el endpoint PATCH de cambio de estado devuelva 200 con la cuadrilla actualizada, coherente con HU-001 y HU-002.
- Se decidió declarar el formato de fechas como ISO 8601, para evitar ambigüedades.
- Se decidió dejar gestión de integrantes, disponibilidad horaria detallada, especialidades múltiples, historial visible, notificaciones y búsqueda de texto completo como mejoras futuras, dado el plazo de entrega.
- Se decidió documentar explícitamente el alcance del MVP de 24 horas, para que el evaluador entienda qué se entrega y qué se difiere.

### 7.4 Riesgos identificados

- R-01 (solapamiento de cuadrillas): sin validación, una misma cuadrilla podría quedar asignada a dos órdenes simultáneas, generando conflicto operativo.
  - Mitigación: RN-08 valida solapamiento y CA-13 lo verifica. Se reutiliza el índice compuesto definido en HU-002 para hacer eficiente la validación.
- R-02 (asignación a cuadrilla inactiva): sin control de estado, una cuadrilla inactiva podría recibir asignaciones.
  - Mitigación: RN-07 bloquea la asignación y CA-14 lo verifica.
- R-03 (pérdida de trazabilidad de quién modifica): sin campos de auditoría, no se podría determinar quién creó, editó o desactivó una cuadrilla.
  - Mitigación: RN-13 obliga a registrar campos de auditoría en cada operación.
- R-04 (inconsistencia del catálogo de especialidades): si se almacena como texto libre, podrían registrarse valores fuera del catálogo del negocio.
  - Mitigación: enum cerrado aplicado en modelo y base de datos (RN-02).
- R-05 (desactivación con órdenes activas): si se desactiva una cuadrilla con órdenes activas, esas órdenes quedarían sin responsable operativo.
  - Mitigación: RN-11 bloquea la desactivación y CA-17 lo verifica.
- R-06 (asignación huérfana de cuadrilla): sin validación, podrían registrarse asignaciones a cuadrillas inexistentes.
  - Mitigación: se reutiliza la validación de existencia definida en HU-002 (CA-12).
- R-07 (asignación a orden inexistente): sin validación, podrían registrarse asignaciones a órdenes inexistentes.
  - Mitigación: se reutiliza la validación de existencia definida en HU-002.
- R-08 (desasignación ambigua): sin reglas claras, una orden podría quedar con cuadrillas asignadas sin trazabilidad.
  - Mitigación: RN-12 restringe la desasignación a órdenes en estado ASIGNADA; CA-19 y CA-20 lo verifican. CA-32 aclara el caso de múltiples asignaciones activas.
- R-09 (acceso no autorizado): si cualquier usuario puede crear o desactivar cuadrillas, se rompe la segregación de funciones.
  - Mitigación: RN-06 restringe creación, edición, activación, desactivación y asignación a COORDINADOR o SUPERVISOR; CA-07 y CA-08 lo verifican.
- R-10 (cuadrilla mal dimensionada): sin validación, podrían registrarse cuadrillas vacías o sobredimensionadas.
  - Mitigación: RN-05 fija el rango entre 2 y 10 integrantes; CA-05 lo verifica.
- R-11 (reasignación implícita al reabrir orden): si se reabre una orden cerrada sin definir qué sucede con la asignación previa, podrían quedar cuadrillas asignadas de forma implícita o duplicada.
  - Mitigación: RN-20 impide la restauración automática y CA-33 lo verifica.
- R-12 (cambio de corredor o especialidad sin trazabilidad): si el corredor habitual o la especialidad cambian sin auditoría, se pierde trazabilidad de la reasignación operativa.
  - Mitigación: RN-21 obliga a auditar el cambio y CA-34 lo verifica.


---



## HU-004 — Dashboard Operacional

### Historia de Usuario

Como supervisor Quiero visualizar indicadores operacionales
Para conocer el estado general de las actividades de mantenimiento.

---

## 1. Análisis

### 1.1 Ambigüedades

- El término indicadores operacionales es ambiguo. No se especifica cuáles son los indicadores mínimos, ni su unidad de medida, ni su periodicidad.
- No se define el nivel de agregación: ¿indicadores globales, por corredor, por activo, por cuadrilla, por tipo de mantenimiento o combinaciones?
- No se aclara si el dashboard es en tiempo real o si puede tener un retraso aceptable.
- No se define el rango temporal de los indicadores: ¿últimos 7 días, mes actual, trimestre, rango configurable?
- No se especifica si el dashboard debe permitir filtrar por corredor, tipo de activo o rango de fechas.
- No se aclara si los indicadores deben poder exportarse (CSV, PDF) o si solo se visualizan en pantalla.
- No se define si el dashboard debe refrescarse automáticamente o solo bajo demanda.
- No se define si el dashboard es exclusivo del rol SUPERVISOR o si otros roles pueden consultarlo.
- No se define el formato de errores ni el comportamiento de la API ante fallos parciales de datos.
- No se define si los indicadores se calculan en el backend en tiempo real o si se precalculan y almacenan.
- No se define si el dashboard debe mostrar tendencias (comparación con periodos anteriores) o solo valores absolutos.
- No se define si el dashboard debe incluir indicadores de inventario (HU-005) o de averías (HU-006).
- No se aclara si los indicadores deben incluir valores porcentuales además de absolutos.
- No se define el comportamiento del dashboard cuando el rango temporal no tiene datos.
- No se define si el rango temporal se aplica a activos por fecha de instalación o si se cuentan siempre todos los activos.

### 1.2 Dependencias

- Depende directamente de HU-001 Gestión de Activos, porque los indicadores de activos por estado y por tipo se calculan sobre esa entidad.
- Depende directamente de HU-002 Gestión de Órdenes de Trabajo, porque los indicadores de órdenes por estado, por tipo y por prioridad se calculan sobre esa entidad.
- Depende directamente de HU-003 Gestión de Cuadrillas, porque los indicadores de carga y disponibilidad de cuadrillas se calculan sobre esa entidad.
- Depende de forma indirecta de HU-005 Gestión de Inventario y HU-006 Generación Automática de Averías, si el dashboard las incluye.
- Es consumida por el rol SUPERVISOR y por el rol COORDINADOR, según lo que se defina en el control de acceso.
- Dependencia transversal: HU-000 Auth, que provee autenticación y roles.
- Dependencia transversal: contrato de error estandarizado, reutilizado por todas las historias.
- Dependencia transversal: contrato de paginación, si algún listado del dashboard lo requiere.

### 1.3 Riesgos

- R-01: Si los indicadores se calculan en tiempo real con consultas pesadas, el dashboard podría degradar el rendimiento del sistema.
- R-02: Si no se define el rango temporal por defecto, cada consulta podría devolver resultados distintos y confundir al usuario.
- R-03: Si no se controla el acceso por rol, cualquier usuario podría ver información operativa sensible.
- R-04: Si los indicadores dependen de datos inconsistentes (por ejemplo, órdenes huérfanas), el dashboard mostraría cifras erróneas.
- R-05: Si no se valida el rango de fechas, podrían solicitarse periodos absurdos (por ejemplo, 100 años) que degraden el sistema.
- R-06: Si no se maneja el fallo parcial de datos, un error en un indicador podría romper todo el dashboard.
- R-07: Si no se define el formato de los indicadores (unidades, decimales), cada implementación podría mostrar valores distintos.
- R-08: Si no se documenta qué indicadores son obligatorios, el alcance podría crecer indefinidamente.
- R-09: Si no se define si el dashboard es en tiempo real o precalculado, la implementación podría diferir de lo esperado por el negocio.
- R-10: Si no se define el orden por defecto de los listados que alimentan el dashboard, la presentación podría variar entre consultas.
- R-11: Si el rango temporal no tiene datos, el usuario podría interpretar la ausencia de información como un error del sistema.
- R-12: Si los activos en estado FUERA_DE_SERVICIO se cuentan como activos operativos en los indicadores, el dashboard mostraría cifras infladas.
- R-13: Si la carga de cuadrillas activas se calcula sin filtrar por rango temporal, el indicador sería inconsistente con el resto.

### 1.4 Supuestos

- El dashboard es de solo lectura. No crea, edita ni elimina entidades.
- Los indicadores mínimos del MVP son: activos por estado, activos por tipo, órdenes por estado, órdenes por tipo de mantenimiento, órdenes por prioridad, órdenes abiertas por corredor, cuadrillas por estado y carga de cuadrillas activas.
- El rango temporal por defecto es el mes en curso.
- El rango temporal es configurable mediante los parámetros fechaDesde y fechaHasta en formato ISO 8601.
- Los indicadores se calculan en el backend en tiempo real, con consultas agregadas optimizadas y sobre columnas indexadas.
- El dashboard está disponible para los roles SUPERVISOR y COORDINADOR. Los roles TECNICO y otros no autorizados no pueden acceder.
- Los indicadores no incluyen datos de inventario ni de averías en el MVP. Esos indicadores se incorporan como mejora futura cuando HU-005 y HU-006 estén implementadas.
- El dashboard no incluye exportación a CSV ni PDF en el MVP.
- El dashboard no incluye refresco automático en el MVP. Se actualiza bajo demanda del usuario.
- El dashboard no incluye comparación con periodos anteriores en el MVP.
- El sistema incluye autenticación mediante JWT provisto por HU-000 Auth. Sin autenticación, ningún endpoint del dashboard responde.
- Supuesto transversal: todos los errores de la API siguen el formato code, message, details y usan códigos HTTP semánticos (400, 401, 403, 404, 405, 422, 500).
- Supuesto transversal: el formato de fechas es ISO 8601 (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ssZ según corresponda).
- Los indicadores se devuelven en una única respuesta agregada para evitar múltiples llamadas desde el frontend.
- Si un indicador falla, el resto se devuelve igualmente y el indicador fallido se reporta como null con un campo de error parcial.
- Cuando el rango temporal no tiene datos, el dashboard devuelve indicadores con valor 0 y sin error. La ausencia de datos no se interpreta como error.
- Los indicadores de activos cuentan activos en estado OPERATIVO y EN_MANTENIMIENTO. Los activos en estado FUERA_DE_SERVICIO se reportan en un indicador separado dentro de activos por estado, pero no se cuentan como activos operativos.
- Los indicadores se devuelven en un orden fijo definido por el backend, para dar previsibilidad al frontend.
- Los indicadores se devuelven como valores absolutos. Los valores porcentuales se calculan en el frontend a partir de los absolutos.
- Se aplica un cacheo en memoria de 30 segundos por rango temporal, para reducir la carga en consultas repetidas del mismo periodo.

---

## 2. Refinamiento

### 2.1 Entidades involucradas

- Activo: fuente de los indicadores de activos por estado y por tipo. Se detalla en HU-001.
- OrdenTrabajo: fuente de los indicadores de órdenes por estado, tipo, prioridad y corredor. Se detalla en HU-002.
- Cuadrilla: fuente de los indicadores de cuadrillas por estado y carga. Se detalla en HU-003.
- Corredor: entidad de catálogo que permite agrupar indicadores por tramo vial. Se detalla en HU-001.
- Usuario: actor que consulta el dashboard. Se asume provisto por HU-000 Auth.

### 2.2 Reglas de negocio

- RN-01: El dashboard es de solo lectura. No permite crear, editar ni eliminar entidades.
- RN-02: Solo usuarios con rol SUPERVISOR o COORDINADOR pueden acceder al dashboard. Los roles TECNICO y cualquier otro rol no autorizado son rechazados con 403.
- RN-03: El rango temporal por defecto es el mes en curso, desde el primer día del mes hasta la fecha actual.
- RN-04: El rango temporal es configurable mediante los parámetros fechaDesde y fechaHasta en formato ISO 8601.
- RN-05: La fechaDesde no puede ser posterior a la fechaHasta. Si se incumple, el sistema rechaza con 400.
- RN-06: El rango temporal no puede exceder 365 días. Si se excede, el sistema rechaza con 400.
- RN-07: Los indicadores mínimos del MVP son: activos por estado, activos por tipo, órdenes por estado, órdenes por tipo de mantenimiento, órdenes por prioridad, órdenes abiertas por corredor, cuadrillas por estado y carga de cuadrillas activas.
- RN-08: Los indicadores se devuelven en una única respuesta agregada.
- RN-09: Si un indicador falla, el resto se devuelve igualmente y el indicador fallido se reporta como null con un campo de error parcial.
- RN-10: Los indicadores se calculan en tiempo real en el backend, sobre columnas indexadas, para evitar degradación del rendimiento.
- RN-11: Los indicadores de órdenes por estado, tipo y prioridad se calculan filtrando por el rango temporal sobre la fecha de creación de la orden.
- RN-12: Los indicadores de carga de cuadrillas activas se calculan contando las asignaciones activas por cuadrilla en el rango temporal. Las asignaciones fuera del rango no se cuentan.
- RN-13: El dashboard no incluye paginación porque devuelve una respuesta agregada única.
- RN-14: El dashboard no incluye datos de inventario ni de averías en el MVP.
- RN-15: El dashboard no incluye exportación a CSV ni PDF en el MVP.
- RN-16: El dashboard no incluye refresco automático en el MVP.
- RN-17: El dashboard no incluye comparación con periodos anteriores en el MVP.
- RN-18: El endpoint del dashboard devuelve 200 con la respuesta agregada, o 400 si el rango de fechas es inválido, 401 si no está autenticado, 403 si el rol no está autorizado, 405 si el método HTTP no es GET, 500 si falla el cálculo completo.
- RN-19: Cuando el rango temporal no tiene datos, los indicadores se devuelven con valor 0 y sin error. La ausencia de datos no se interpreta como fallo.
- RN-20: Los indicadores de activos cuentan activos en estado OPERATIVO y EN_MANTENIMIENTO. Los activos en estado FUERA_DE_SERVICIO se reportan en un indicador separado dentro de activos por estado, pero no se cuentan como activos operativos.
- RN-21: Los indicadores se devuelven en un orden fijo definido por el backend: activos por estado, activos por tipo, órdenes por estado, órdenes por tipo, órdenes por prioridad, órdenes abiertas por corredor, cuadrillas por estado, carga de cuadrillas activas.
- RN-22: Los indicadores se devuelven como valores absolutos. El frontend calcula los valores porcentuales a partir de los absolutos cuando lo necesita.
- RN-23: Se aplica un cacheo en memoria de 30 segundos por combinación de rango temporal y rol, para reducir la carga en consultas repetidas del mismo periodo.

### 2.3 Estados

El dashboard no gestiona estados propios. Consume los estados definidos en HU-001 (activos), HU-002 (órdenes) y HU-003 (cuadrillas).

### 2.4 Relaciones

- Un Activo contribuye a los indicadores de activos por estado y por tipo.
- Una OrdenTrabajo contribuye a los indicadores de órdenes por estado, tipo, prioridad y corredor.
- Una Cuadrilla contribuye a los indicadores de cuadrillas por estado y carga.
- Un Corredor agrupa indicadores por tramo vial.
- Un Usuario con rol SUPERVISOR o COORDINADOR consulta el dashboard.

### 2.5 Flujo funcional

1. El usuario se autentica y obtiene un token JWT. Sin token, el sistema responde 401 en el endpoint del dashboard.
2. El supervisor accede al módulo de dashboard y visualiza los indicadores con el rango temporal por defecto (mes en curso).
3. El supervisor puede ajustar el rango temporal mediante los parámetros fechaDesde y fechaHasta.
4. El frontend envía una única solicitud al endpoint del dashboard con el rango temporal seleccionado.
5. El backend verifica si existe una respuesta cacheada para esa combinación de rango temporal y rol. Si existe y tiene menos de 30 segundos, la devuelve.
6. Si no hay cache válido, el backend calcula todos los indicadores en una sola pasada sobre las tablas de activos, órdenes y cuadrillas, usando consultas agregadas e índices, y arma la respuesta agregada con los indicadores en orden fijo.
7. El backend devuelve una respuesta agregada con todos los indicadores y, si algún indicador falla, lo reporta como null con un campo de error parcial.
8. El frontend renderiza los indicadores en tarjetas o gráficos simples y calcula los porcentajes a partir de los absolutos cuando corresponde.
9. Si el rango temporal no tiene datos, el backend devuelve los indicadores con valor 0 y sin error.
10. Si el rango temporal es inválido, el backend responde 400. Si el rol no está autorizado, responde 403. Si el método HTTP no es GET, responde 405. Si el cálculo completo falla, responde 500.

---

## 3. Criterios de aceptación

- CA-01: Dado un supervisor autenticado, cuando consulta el dashboard sin parámetros, entonces el sistema devuelve los indicadores del mes en curso con código 200.
- CA-02: Dado un supervisor autenticado, cuando consulta el dashboard con fechaDesde y fechaHasta válidos, entonces el sistema devuelve los indicadores del rango solicitado con código 200.
- CA-03: Dado un supervisor autenticado, cuando consulta el dashboard con fechaDesde posterior a fechaHasta, entonces el sistema rechaza la operación con código 400.
- CA-04: Dado un supervisor autenticado, cuando consulta el dashboard con un rango temporal mayor a 365 días, entonces el sistema rechaza la operación con código 400.
- CA-05: Dado un usuario con rol TECNICO, cuando intenta acceder al dashboard, entonces el sistema rechaza la operación con código 403.
- CA-06: Dado un usuario no autenticado, cuando intenta acceder al dashboard, entonces el sistema rechaza la operación con código 401.
- CA-07: Dado un supervisor autenticado, cuando consulta el dashboard, entonces la respuesta incluye el indicador de activos por estado.
- CA-08: Dado un supervisor autenticado, cuando consulta el dashboard, entonces la respuesta incluye el indicador de activos por tipo.
- CA-09: Dado un supervisor autenticado, cuando consulta el dashboard, entonces la respuesta incluye el indicador de órdenes por estado.
- CA-10: Dado un supervisor autenticado, cuando consulta el dashboard, entonces la respuesta incluye el indicador de órdenes por tipo de mantenimiento.
- CA-11: Dado un supervisor autenticado, cuando consulta el dashboard, entonces la respuesta incluye el indicador de órdenes por prioridad.
- CA-12: Dado un supervisor autenticado, cuando consulta el dashboard, entonces la respuesta incluye el indicador de órdenes abiertas por corredor.
- CA-13: Dado un supervisor autenticado, cuando consulta el dashboard, entonces la respuesta incluye el indicador de cuadrillas por estado.
- CA-14: Dado un supervisor autenticado, cuando consulta el dashboard, entonces la respuesta incluye el indicador de carga de cuadrillas activas.
- CA-15: Dado un supervisor autenticado, cuando consulta el dashboard y un indicador falla, entonces el resto de indicadores se devuelve igualmente y el indicador fallido se reporta como null con un campo de error parcial.
- CA-16: Dado un supervisor autenticado, cuando consulta el dashboard, entonces el sistema responde con código 200 y una única respuesta agregada.
- CA-17: Dado un supervisor autenticado, cuando consulta el dashboard, entonces el tiempo de respuesta no supera los 2 segundos sobre el volumen de datos del seed.
- CA-18: Dado un error de validación, autorización o fallo completo del cálculo, cuando el sistema responde, entonces el cuerpo del error sigue el formato code, message, details.
- CA-19: Dado un supervisor autenticado, cuando intenta crear, editar o eliminar cualquier entidad desde el dashboard, entonces el sistema rechaza la operación con código 405.
- CA-20: Dado un supervisor autenticado, cuando consulta el dashboard con fechaDesde válida pero sin fechaHasta, entonces el sistema usa la fecha actual como fechaHasta por defecto.
- CA-21: Dado un supervisor autenticado, cuando consulta el dashboard con fechaHasta válida pero sin fechaDesde, entonces el sistema usa el primer día del mes en curso como fechaDesde por defecto.
- CA-22: Dado un supervisor autenticado, cuando consulta el dashboard, entonces los indicadores de órdenes reflejan únicamente los datos existentes en el rango temporal solicitado.
- CA-23: Dado un supervisor autenticado, cuando consulta el dashboard con un rango temporal en el que no hay datos, entonces el sistema devuelve los indicadores con valor 0 y sin error, con código 200.
- CA-24: Dado un supervisor autenticado, cuando consulta el dashboard, entonces el indicador de activos por estado cuenta los activos en OPERATIVO y EN_MANTENIMIENTO como activos operativos, y reporta los activos en FUERA_DE_SERVICIO en una categoría separada.
- CA-25: Dado un supervisor autenticado, cuando consulta el dashboard, entonces el indicador de carga de cuadrillas activas solo cuenta asignaciones dentro del rango temporal solicitado.
- CA-26: Dado un supervisor autenticado, cuando consulta el dashboard, entonces la respuesta devuelve los indicadores en el orden fijo definido por el backend.
- CA-27: Dado un supervisor autenticado, cuando repite la consulta del dashboard con el mismo rango temporal dentro de los 30 segundos, entonces el sistema devuelve la respuesta cacheada sin recalcular los indicadores.
- CA-28: Dado un supervisor autenticado, cuando realiza una solicitud POST, PUT o DELETE al endpoint del dashboard, entonces el sistema rechaza la operación con código 405 y el formato de error estándar.

---

## 4. Descomposición técnica

### 4.1 Backend

- Definir el DTO de respuesta agregada del dashboard con los ocho indicadores mínimos, el campo de error parcial y el orden fijo (S).
- Implementar el endpoint GET /api/dashboard con validación de rango temporal, control de acceso por rol, rechazo de métodos no GET y respuesta agregada (M).
- Implementar la consulta agregada de activos por estado sobre la tabla activos, separando activos operativos (OPERATIVO y EN_MANTENIMIENTO) de los activos en FUERA_DE_SERVICIO, usando índices (S).
- Implementar la consulta agregada de activos por tipo sobre la tabla activos, usando índices (S).
- Implementar la consulta agregada de órdenes por estado sobre la tabla ordenes, filtrando por fechaCreacion en el rango temporal e indexando por estado (S).
- Implementar la consulta agregada de órdenes por tipo de mantenimiento sobre la tabla ordenes (S).
- Implementar la consulta agregada de órdenes por prioridad sobre la tabla ordenes (S).
- Implementar la consulta agregada de órdenes abiertas por corredor sobre la tabla ordenes, agrupando por corredorId (S).
- Implementar la consulta agregada de cuadrillas por estado sobre la tabla cuadrillas (S).
- Implementar la consulta agregada de carga de cuadrillas activas sobre la tabla orden_cuadrillas, contando asignaciones activas por cuadrilla dentro del rango temporal (S).
- Implementar el manejo de fallo parcial por indicador, capturando errores individuales y reportándolos como null con un campo de error (S).
- Implementar el manejo de rango sin datos devolviendo indicadores con valor 0 y sin error (S).
- Implementar un cacheo en memoria con TTL de 30 segundos por combinación de rango temporal y rol, para reducir la carga en consultas repetidas (S).
- Implementar la capa de servicio del dashboard que orquesta las consultas agregadas en paralelo, arma la respuesta con el orden fijo y aplica el cacheo (M).
- Reutilizar el middleware de manejo de errores de HU-001 que normaliza todas las respuestas de error al formato code, message, details (XS).
- Reutilizar el middleware de autenticación JWT de HU-001 (XS).
- Reutilizar el middleware de autorización por rol de HU-001 y extenderlo para restringir el dashboard a SUPERVISOR o COORDINADOR (S).

### 4.2 Frontend

- Crear la vista del dashboard con tarjetas o gráficos simples para cada indicador mínimo, respetando el orden fijo devuelto por el backend (M).
- Implementar el consumo del endpoint GET /api/dashboard mediante Axios, incluyendo interceptor para adjuntar el JWT y manejo centralizado de errores 400, 401, 403, 405 y 500 según el formato estándar (M).
- Implementar el selector de rango temporal con valores por defecto (mes en curso) y validación de fechaDesde menor o igual a fechaHasta (S).
- Implementar el cálculo de valores porcentuales a partir de los absolutos devueltos por el backend, cuando el indicador lo requiera (S).
- Implementar el manejo de fallo parcial en la interfaz: si un indicador llega null, se muestra un mensaje de no disponible sin romper el resto del dashboard (S).
- Implementar el manejo de rango sin datos: si los indicadores llegan a 0, se muestran los valores con un mensaje de sin datos en el periodo seleccionado (S).
- Implementar el manejo de estados de carga (skeleton), vacío y error en la vista del dashboard (S).
- Implementar la vista responsiva con breakpoints para móvil, tablet y escritorio (S).

### 4.3 Persistencia

- Verificar que existan índices sobre los campos usados por las consultas agregadas: estado, tipo, prioridad, corredorId, fechaCreacion y fechaInstalacion (XS).
- Crear índice compuesto sobre ordenes(estado, fechaCreacion) para optimizar la consulta de órdenes por estado en el rango temporal (XS).
- Crear índice compuesto sobre orden_cuadrillas(cuadrillaId, fechaInicio, fechaFin) para optimizar la consulta de carga de cuadrillas activas (XS).
- Reutilizar los seeds de HU-001, HU-002 y HU-003 para que el dashboard tenga datos representativos (XS).

### 4.4 Seguridad

- Reutilizar el middleware de autenticación JWT implementado en HU-001, que rechaza con 401 cualquier request sin token válido (XS).
- Reutilizar el middleware de autorización por rol de HU-001 y extenderlo para restringir el dashboard a SUPERVISOR o COORDINADOR (S).
- Garantizar que el endpoint del dashboard rechaza cualquier método distinto de GET con 405, según CA-19 y CA-28 (S).

### 4.5 Testing

- Escribir pruebas unitarias del servicio del dashboard que cubran el cálculo de cada indicador con datos controlados (M).
- Escribir pruebas unitarias de la validación de rango temporal (fechaDesde mayor a fechaHasta, rango mayor a 365 días, valores por defecto) (S).
- Escribir pruebas unitarias del manejo de fallo parcial por indicador (S).
- Escribir pruebas unitarias del manejo de rango sin datos (S).
- Escribir pruebas unitarias del indicador de activos por estado, verificando que los activos en FUERA_DE_SERVICIO no se cuenten como operativos (S).
- Escribir pruebas unitarias del indicador de carga de cuadrillas activas, verificando que solo se cuentan asignaciones dentro del rango temporal (S).
- Escribir pruebas unitarias del cacheo con TTL de 30 segundos (S).
- Escribir pruebas de integración del endpoint /api/dashboard que verifiquen los códigos HTTP 200, 400, 401, 403, 405 y 500, y los CA-01 a CA-28 (M).
- Escribir pruebas de componente del frontend para la vista del dashboard, el selector de rango temporal y el manejo de fallo parcial (M).
- Escribir un smoke test end-to-end que cubra el flujo autenticarse, consultar el dashboard con rango por defecto, consultar con rango personalizado y verificar el cacheo (S).
- Mantener el umbral de cobertura mínimo del 80% en la capa de servicio (XS).

### 4.6 Docker

- Reutilizar la configuración de healthcheck, depends_on y arranque automático implementada en HU-001 (XS).
- Verificar que los nuevos índices se creen automáticamente al iniciar el contenedor, sin pasos manuales (S).
- Documentar en el README los endpoints nuevos y cualquier variable de entorno adicional (XS).

---

## 5. Estimación

- Backend: M (DTO S, endpoint M, ocho consultas agregadas S cada una, manejo de fallo parcial S, manejo de rango sin datos S, cacheo S, servicio M, reutilización de middleware XS, autorización extendida S).
- Frontend: M (vista dashboard M, Axios M, selector rango temporal S, cálculo de porcentajes S, manejo de fallo parcial S, manejo de rango sin datos S, estados de carga S, responsivo S).
- Persistencia: XS (verificación de índices XS, índice compuesto XS, índice compuesto XS, reutilización de seeds XS).
- Seguridad: S (reutilización auth XS, autorización extendida S, rechazo de métodos no GET S).
- Testing: M (unitarias servicio M, unitarias rango S, unitarias fallo parcial S, unitarias rango sin datos S, unitarias activos por estado S, unitarias carga cuadrillas S, unitarias cacheo S, integración endpoint M, componente frontend M, smoke e2e S, cobertura XS).
- Docker: XS (reutilización de configuración XS, verificación de índices S, documentación XS).

---

## 6. Priorización

### MVP

- DTO de respuesta agregada del dashboard con los ocho indicadores mínimos, el campo de error parcial y el orden fijo.
- Endpoint GET /api/dashboard con validación de rango temporal, control de acceso por rol y rechazo de métodos no GET.
- Ocho consultas agregadas: activos por estado, activos por tipo, órdenes por estado, órdenes por tipo, órdenes por prioridad, órdenes abiertas por corredor, cuadrillas por estado, carga de cuadrillas activas.
- Manejo de fallo parcial por indicador.
- Manejo de rango sin datos con valores 0.
- Indicador de activos por estado con separación de activos operativos y fuera de servicio.
- Indicador de carga de cuadrillas activas filtrado por rango temporal.
- Cacheo en memoria con TTL de 30 segundos por rango temporal y rol.
- Índices compuestos para optimizar las consultas más costosas.
- Frontend funcional: vista del dashboard, selector de rango temporal, manejo de fallo parcial, manejo de rango sin datos y estados de carga.
- Pruebas unitarias del servicio y de la validación de rango temporal.
- Pruebas de integración del endpoint del dashboard.
- Docker y ejecución del proyecto mediante docker compose up sin pasos manuales.

### Funcionalidades opcionales

- Pruebas de componente del frontend.
- Smoke test end-to-end.
- Estados de carga mediante skeleton.
- Diseño responsive completo para móvil, tablet y escritorio.
- Refresco automático del dashboard cada N segundos.
- Exportación a CSV.

### Mejoras futuras

- Indicadores de inventario (HU-005) y de averías (HU-006).
- Comparación con periodos anteriores y tendencias.
- Exportación a PDF.
- Filtros adicionales por tipo de activo y por cuadrilla.
- Panel configurable por el usuario.
- Indicadores de SLA y tiempo medio de resolución de órdenes.
- Logging estructurado con correlation ID por request.
- Rate limiting en la API.
- Precalculado de indicadores en background para volúmenes grandes.
- Cacheo distribuido en Redis para despliegues multi-instancia.

---

## 7. Justificación

### 7.1 Actividades agregadas

- Se agregó el DTO de respuesta agregada del dashboard para estandarizar el contrato entre backend y frontend y evitar múltiples llamadas desde el frontend.
- Se agregaron las ocho consultas agregadas mínimas, alineadas con las preguntas de reflexión del REFINEMENT.md (indicadores importantes para un supervisor).
- Se agregó la validación de rango temporal (fechaDesde no posterior a fechaHasta, rango máximo de 365 días, valores por defecto) para evitar consultas abusivas y resultados inconsistentes.
- Se agregó el manejo de fallo parcial por indicador para que un error en un cálculo no rompa todo el dashboard.
- Se agregó el manejo de rango sin datos con valores 0 y sin error, para que el usuario no confunda ausencia de datos con fallo del sistema.
- Se agregó la separación entre activos operativos y activos en FUERA_DE_SERVICIO en el indicador de activos por estado, para no inflar la cifra de activos operativos.
- Se agregó el filtro por rango temporal en el indicador de carga de cuadrillas activas, para que sea consistente con el resto de indicadores.
- Se agregó el cacheo en memoria con TTL de 30 segundos por rango temporal y rol, para reducir la carga en consultas repetidas.
- Se agregó el orden fijo de los indicadores en la respuesta del backend, para dar previsibilidad al frontend.
- Se agregaron los índices compuestos sobre ordenes(estado, fechaCreacion) y orden_cuadrillas(cuadrillaId, fechaInicio, fechaFin) para optimizar las consultas más costosas.
- Se agregaron las reglas RN-01 a RN-23 y los criterios CA-01 a CA-28 para cerrar la trazabilidad: cada regla tiene al menos un criterio asociado.
- Se agregó el rechazo explícito de métodos distintos de GET con 405, porque el dashboard es de solo lectura y conviene blindarlo.
- Se agregó la reutilización del middleware de autenticación, autorización y manejo de errores de HU-001, para mantener consistencia.
- Se agregó la autorización extendida para restringir el dashboard a SUPERVISOR o COORDINADOR, coherente con el rol que lo consume.

### 7.2 Actividades eliminadas

- Se eliminó la exportación a CSV y PDF del MVP, porque no aporta al núcleo del problema y requiere tiempo adicional.
- Se eliminó el refresco automático del dashboard en el MVP, porque el usuario puede actualizar manualmente.
- Se eliminó la comparación con periodos anteriores en el MVP, porque agrega complejidad de cálculo sin aportar valor inmediato.
- Se eliminó la inclusión de indicadores de inventario y averías en el MVP, porque dependen de HU-005 y HU-006, que aún no están implementadas.
- Se eliminó el panel configurable por el usuario, porque complica el modelo sin aportar valor en el MVP.
- Se eliminó la paginación del dashboard, porque devuelve una respuesta agregada única.
- Se eliminó el cálculo de porcentajes en el backend, dejándolo al frontend, porque el backend solo devuelve valores absolutos y el frontend tiene el contexto de presentación.

### 7.3 Decisiones tomadas

- Se decidió que el dashboard sea de solo lectura y rechace cualquier método distinto de GET con 405, para blindarlo.
- Se decidió que el rango temporal por defecto sea el mes en curso, para dar previsibilidad al usuario.
- Se decidió que el rango máximo sea de 365 días, para evitar consultas abusivas y proteger el rendimiento.
- Se decidió que los indicadores se devuelvan en una única respuesta agregada, para reducir el número de llamadas desde el frontend.
- Se decidió que el fallo parcial por indicador se reporte como null con un campo de error, para que el dashboard siga siendo usable aunque una consulta falle.
- Se decidió que el rango sin datos devuelva valores 0 y sin error, para no confundir ausencia de datos con fallo del sistema.
- Se decidió separar activos operativos de activos en FUERA_DE_SERVICIO en el indicador de activos por estado, para no inflar la cifra operativa.
- Se decidió filtrar el indicador de carga de cuadrillas activas por rango temporal, para que sea consistente con el resto.
- Se decidió aplicar cacheo en memoria con TTL de 30 segundos por rango temporal y rol, para reducir la carga en consultas repetidas.
- Se decidió que los indicadores se devuelvan en un orden fijo definido por el backend, para dar previsibilidad al frontend.
- Se decidió que los indicadores se calculen en tiempo real sobre columnas indexadas, porque el volumen del MVP lo permite y evita la complejidad de un precalculado.
- Se decidió incluir ocho indicadores mínimos alineados con las preguntas de reflexión del REFINEMENT.md: activos por estado, activos por tipo, órdenes por estado, órdenes por tipo, órdenes por prioridad, órdenes abiertas por corredor, cuadrillas por estado y carga de cuadrillas activas.
- Se decidió que el dashboard esté disponible para SUPERVISOR y COORDINADOR, porque ambos roles necesitan visibilidad operativa.
- Se decidió excluir inventario y averías del MVP, porque dependen de historias opcionales aún no implementadas.
- Se decidió excluir exportación, refresco automático y comparación con periodos anteriores del MVP, dejándolos como mejoras futuras.
- Se decidió que el backend devuelva valores absolutos y que el frontend calcule los porcentajes, para no acoplar la presentación al backend.
- Se decidió reutilizar los middlewares y contratos de HU-001 para mantener consistencia y no duplicar lógica.
- Se decidió declarar el formato de fechas como ISO 8601, coherente con HU-003.

### 7.4 Riesgos identificados

- R-01 (degradación de rendimiento): si los indicadores se calculan con consultas pesadas sin índices, el dashboard podría degradar el rendimiento del sistema.
  - Mitigación: se definen índices compuestos sobre ordenes(estado, fechaCreacion) y orden_cuadrillas(cuadrillaId, fechaInicio, fechaFin), se limita el rango temporal a 365 días y se aplica cacheo en memoria con TTL de 30 segundos; CA-17 verifica el tiempo de respuesta.
- R-02 (rango temporal inconsistente): si no se define el rango por defecto, cada consulta podría devolver resultados distintos y confundir al usuario.
  - Mitigación: RN-03 fija el rango por defecto al mes en curso; CA-01 lo verifica.
- R-03 (acceso no autorizado): si cualquier usuario puede ver información operativa sensible, se rompe la segregación de funciones.
  - Mitigación: RN-02 restringe el dashboard a SUPERVISOR o COORDINADOR; CA-05 y CA-06 lo verifican.
- R-04 (datos inconsistentes): si los indicadores dependen de datos inconsistentes (por ejemplo, órdenes huérfanas), el dashboard mostraría cifras erróneas.
  - Mitigación: los indicadores se calculan sobre las mismas tablas y con las mismas claves foráneas definidas en HU-001, HU-002 y HU-003, evitando duplicar lógica de validación.
- R-05 (rango temporal abusivo): si no se valida el rango de fechas, podrían solicitarse periodos absurdos que degraden el sistema.
  - Mitigación: RN-06 limita el rango a 365 días; CA-04 lo verifica.
- R-06 (fallo total por un indicador): si no se maneja el fallo parcial, un error en un indicador podría romper todo el dashboard.
  - Mitigación: RN-09 reporta el indicador fallido como null con un campo de error, sin romper el resto; CA-15 lo verifica.
- R-07 (formato inconsistente de indicadores): si no se define el formato de los indicadores, cada implementación podría mostrar valores distintos.
  - Mitigación: el DTO de respuesta agregada define la estructura de cada indicador, con etiqueta, valor y campo de error parcial.
- R-08 (alcance creciente): si no se documenta qué indicadores son obligatorios, el alcance podría crecer indefinidamente.
  - Mitigación: RN-07 fija los ocho indicadores mínimos del MVP y los criterios CA-07 a CA-14 los verifican.
- R-09 (ambigüedad tiempo real vs precalculado): si no se define, la implementación podría diferir de lo esperado por el negocio.
  - Mitigación: RN-10 define que los indicadores se calculan en tiempo real sobre columnas indexadas, con cacheo de 30 segundos.
- R-10 (orden inconsistente en listados): si algún indicador se presenta como listado sin orden por defecto, la presentación podría variar entre consultas.
  - Mitigación: RN-21 define el orden fijo de los indicadores en la respuesta del backend; CA-26 lo verifica.
- R-11 (rango sin datos interpretado como error): si el rango temporal no tiene datos, el usuario podría interpretar la ausencia de información como un error del sistema.
  - Mitigación: RN-19 define que los indicadores se devuelven con valor 0 y sin error; CA-23 lo verifica.
- R-12 (activos fuera de servicio contados como operativos): si los activos en FUERA_DE_SERVICIO se cuentan como activos operativos, el dashboard mostraría cifras infladas.
  - Mitigación: RN-20 separa activos operativos de activos en FUERA_DE_SERVICIO; CA-24 lo verifica.
- R-13 (carga de cuadrillas sin filtro temporal): si la carga de cuadrillas activas se calcula sin filtrar por rango temporal, el indicador sería inconsistente con el resto.
  - Mitigación: RN-12 filtra las asignaciones por rango temporal; CA-25 lo verifica.