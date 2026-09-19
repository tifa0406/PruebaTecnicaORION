#Candidato-FullStack

# ORION Maintenance Lite

## Introducción
Bienvenido a la prueba técnica para el cargo de Desarrollador Full Stack.
El objetivo de esta evaluación es validar tus capacidades de análisis, diseño, desarrollo y documentación mediante la construcción de una solución orientada a la gestión de mantenimiento de infraestructura ITS (Intelligent Transportation Systems).

Además de la implementación técnica, esta prueba busca evaluar tu capacidad para interpretar requerimientos, refinar historias de usuario y transformar necesidades de negocio en una solución funcional y mantenible.
---

# Contexto de Negocio

La concesión vial **Autopistas Inteligentes S.A.** opera una red de infraestructura ITS distribuida en diferentes corredores viales.
Dentro de esta infraestructura se encuentran activos como:
- Paneles de Mensajería Variable (PMV)
- Cámaras CCTV
- Estaciones Meteorológicas
- Sensores de Tráfico
- Aforadores
Actualmente el mantenimiento de dichos activos se realiza mediante herramientas dispersas y hojas de cálculo, dificultando el control operativo, la planificación y el seguimiento de actividades.
La organización requiere una solución que permita gestionar sus procesos de mantenimiento de forma centralizada.
---

# Objetivo
Desarrollar una solución que permita gestionar el ciclo de vida de actividades de mantenimiento asociadas a los activos ITS.
La solución deberá permitir como mínimo:
- Gestión de activos.
- Gestión de órdenes de trabajo.
- Gestión de cuadrillas.
- Visualización de indicadores operativos.
---
# Alcance
El backlog inicial del producto se encuentra documentado en:
```text
BACKLOG.md
```
Antes de iniciar el desarrollo deberá realizarse un ejercicio de refinamiento descrito en:
```text
REFINEMENT.md
```
---
# Tecnologías
Puede utilizar cualquier stack tecnológico.
Se valorará especialmente:
- Buenas prácticas de arquitectura.
- Calidad del código.
- Documentación.
- Pruebas automatizadas unit test.
- Dockerización.
---
# Restricciones
La solución deberá:
- Persistir información.
- Ser ejecutable mediante contenedores Docker.
- Incluir documentación técnica.
- Incluir pruebas automatizadas.
---
# Entregables
La entrega deberá incluir como mínimo:
```text
Código fuente completo
Dockerfile(s)
docker-compose.yml
README.md actualizado
BACKLOG_REFINED.md
SCENARIO.md
Pruebas automatizadas
```

---
# Docker
La aplicación deberá ejecutarse mediante:
```bash
docker compose up
```
No deberán existir pasos manuales adicionales para iniciar la solución.
---

# Documento de Arquitectura
Crear el archivo:
```text
SCENARIO.md
```
Donde deberá documentar las principales decisiones arquitectónicas adoptadas.
---

# Evaluación
La evaluación tendrá en cuenta:
- Análisis funcional.
- Refinamiento del backlog.
- Diseño de la solución.
- Calidad de código.
- Uso de git y ramas de impelementación
- Arquitectura.
- Dockerización.
- Testing.
- Documentación.
- Criterio técnico.
---

# Consideraciones Finales
En caso de realizar supuestos funcionales o técnicos, estos deberán ser documentados de manera explícita.
No existe una única solución válida. Se valorará especialmente la capacidad de justificar las decisiones tomadas.

---

## Cómo ejecutar el proyecto
- docker compose up

La aplicación estará disponible en:

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Credenciales de prueba

- SUPERVISOR: supervisor@orion.com / 123456
- COORDINADOR: coordinador@orion.com / 123456
- TECNICO: tecnico@orion.com / 123456

## Endpoints principales

- GET /api/activos
- POST /api/activos
- GET /api/ordenes
- POST /api/ordenes
- GET /api/cuadrillas
- POST /api/cuadrillas
- GET /api/dashboard

## Estructura del repositorio

- backend/ — API REST (Node.js + Express + Sequelize)
- frontend/ — Interfaz de usuario (React + Vite)
- BACKLOG_REFINED.md — Refinamiento de las 4 HU obligatorias
- SCENARIO.md — Decisiones arquitectónicas
- docker-compose.yml — Orquestación de servicios

## Entregables

- BACKLOG_REFINED.md — refinamiento de las 4 HU obligatorias
- SCENARIO.md — documento de arquitectura
- docker-compose.yml — orquestación de servicios
- backend/ — código fuente del backend
- frontend/ — código fuente del frontend
- Pruebas automatizadas en backend/tests/

