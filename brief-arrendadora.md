# Brief de Proyecto: Plataforma Web de Propiedades Inmobiliarias

**Fecha:** Julio 2026
**Versión:** 1.0
**Estado:** Borrador para validación

---

## 1. Resumen ejecutivo

Desarrollo de una aplicación web responsiva para una inmobiliaria en Colombia que gestiona un portafolio pequeño (menos de 100 inmuebles) en modalidades de **arriendo** y **venta**. La plataforma cumple una doble función: un **portal público** donde los clientes buscan propiedades y contactan a la inmobiliaria vía WhatsApp, y un **panel administrativo** donde el equipo interno gestiona el inventario con roles y permisos diferenciados.

El proyecto tiene un plazo urgente de **1 a 2 meses** para su lanzamiento, por lo que el alcance está deliberadamente acotado a un MVP funcional y bien ejecutado.

---

## 2. Objetivos del proyecto

- Centralizar el inventario de propiedades de la inmobiliaria en una sola plataforma digital.
- Ofrecer a compradores y arrendatarios una experiencia de búsqueda simple, rápida y usable desde cualquier dispositivo.
- Facilitar el contacto inmediato entre cliente y agente mediante WhatsApp, canal preferido en el mercado colombiano.
- Dar al equipo interno una herramienta de administración con control de acceso por roles.
- Lanzar en un máximo de 2 meses con un alcance realista.

---

## 3. Usuarios y roles

### 3.1 Clientes (público general)
- Compradores y arrendatarios potenciales.
- Navegan **sin registro ni cuenta**; el acceso es libre.
- Única fricción permitida: una **validación anti-bot sencilla** (p. ej. reCAPTCHA v3 invisible o hCaptcha) en las acciones de contacto, para evitar spam sin entorpecer la experiencia.

### 3.2 Equipo interno (con autenticación y roles diferenciados)

| Rol | Permisos propuestos |
|---|---|
| **Administrador** | Gestión total: propiedades, usuarios, roles, configuración general |
| **Agente** | Crear y editar sus propiedades asignadas, cambiar estados, cargar fotos |
| **Editor / Asistente** (opcional) | Cargar y editar contenido sin poder publicar ni eliminar |

> **Pendiente por definir:** lista definitiva de roles y matriz de permisos exacta. La tabla anterior es una propuesta inicial.

---

## 4. Alcance funcional

### 4.1 Portal público

**Catálogo de propiedades con búsqueda y filtros básicos:**
- Tipo de operación: venta / arriendo
- Tipo de inmueble: apartamento, casa, local, oficina, lote, etc.
- Ubicación: ciudad y barrio/localidad

**Listado de resultados:**
- Tarjetas con foto principal, precio en COP, tipo de operación, ubicación y datos clave (habitaciones, baños, área).
- Indicador visual del estado cuando aplique (p. ej. "Reservada").

**Ficha de detalle de propiedad:**
- Galería de fotos.
- Ubicación en mapa interactivo (Google Maps o Mapbox).
- Descripción, características y precio en pesos colombianos (COP) con formato local ($ 1.500.000).
- **Botón directo a WhatsApp** que abre una conversación con el agente responsable, con mensaje prellenado que referencia la propiedad (código o título).
- Validación anti-bot antes de habilitar el contacto.

**Páginas complementarias:**
- Inicio con propiedades destacadas.
- Página "Quiénes somos" / contacto general.

### 4.2 Panel administrativo (equipo interno)

- Autenticación segura (correo + contraseña, con recuperación de contraseña).
- CRUD completo de propiedades: crear, editar, duplicar, archivar.
- Carga múltiple de fotos con orden personalizable y foto de portada.
- Fijación de ubicación en mapa (pin arrastrable o búsqueda de dirección).
- Gestión de estados por propiedad: **Disponible / Reservada / Arrendada-Vendida**.
- Asignación de agente responsable por propiedad (define el número de WhatsApp del botón de contacto).
- Gestión de usuarios y roles (solo Administrador).
- Listado interno con filtros y buscador para operar el inventario.

---

## 5. Requisitos no funcionales

- **Responsivo:** diseño web mobile-first; debe verse y funcionar bien en móviles, tabletas y escritorio. No se requieren apps nativas.
- **Rendimiento:** carga rápida del catálogo; optimización y compresión automática de imágenes.
- **SEO básico:** URLs amigables por propiedad, metadatos y Open Graph (para que al compartir un inmueble por WhatsApp se vea la foto y el título).
- **Seguridad:** HTTPS, protección anti-bot en formularios/contacto, control de acceso por roles en el panel.
- **Moneda y formato local:** precios en COP con separadores de miles colombianos; idioma español.
- **Escalabilidad moderada:** dimensionado para menos de 100 propiedades, con margen de crecimiento sin rediseño.

---

## 6. Fuera de alcance (explícitamente excluido en esta fase)

- Gestión de pagos o cobro de arriendos (se manejan fuera del sistema).
- Integración o publicación en portales inmobiliarios externos.
- CRM de leads y seguimiento comercial.
- Agendamiento de visitas y solicitudes de mantenimiento.
- Portal para propietarios.
- Registro/cuentas de clientes, favoritos o alertas.
- Video y tours virtuales 360° (solo fotos + mapa en esta fase).
- Contratos, firma electrónica y documentación legal.

> Estos puntos pueden considerarse como **fase 2** según resultados del lanzamiento.

---

## 7. Identidad de marca

La identidad visual (logo, paleta de colores, tipografía, tono) **aún no está definida**. Esto impacta el cronograma y debe resolverse cuanto antes.

**Opciones:**
1. Incluir en el proyecto un mini-branding (logo + paleta + tipografía) — suma tiempo y costo.
2. La inmobiliaria entrega su identidad antes de iniciar la fase de diseño UI.

> **Decisión requerida en la primera semana** para no comprometer el plazo de 1-2 meses.

---

## 8. Plazo y fases propuestas (8 semanas)

| Semana | Fase | Entregables |
|---|---|---|
| 1 | Descubrimiento y definición | Matriz de roles, campos de la ficha de propiedad, decisión de marca |
| 2-3 | Diseño UI | Wireframes y diseño visual de portal y panel (mobile + desktop) |
| 3-6 | Desarrollo | Portal público, panel administrativo, integración de mapa y WhatsApp |
| 7 | Carga de contenido y QA | Carga inicial de propiedades reales, pruebas en dispositivos, corrección |
| 8 | Lanzamiento | Puesta en producción, dominio, capacitación al equipo |

**Riesgo principal del cronograma:** la indefinición de marca (sección 7) y la disponibilidad del contenido (fotos y datos de las propiedades) para la semana 7.

---

## 9. Información pendiente por definir

1. **Marca:** logo, colores y estilo (ver sección 7).
2. **Roles definitivos** y matriz de permisos del equipo.
3. **Campos exactos de la ficha** de propiedad (estrato, administración, antigüedad, parqueadero, etc. — campos habituales en el mercado colombiano).
4. **Números de WhatsApp:** ¿uno por agente o una línea central de la inmobiliaria?
5. **Dominio y hosting:** ¿existen ya o se contratan dentro del proyecto?
6. **Contenido inicial:** quién carga las propiedades al lanzamiento y en qué estado están las fotos.
7. **Presupuesto** asignado al proyecto.
8. **Analítica:** ¿se desea medir visitas y clics en WhatsApp? (Google Analytics u similar; recomendado y de bajo costo).

---

## 10. Criterios de éxito

- Portal en producción dentro del plazo de 2 meses.
- 100% del inventario activo cargado y visible al lanzamiento.
- Un cliente puede encontrar una propiedad y contactar por WhatsApp en menos de 1 minuto desde su celular.
- El equipo interno puede crear y publicar una propiedad nueva sin asistencia técnica.
- Cero spam efectivo en los canales de contacto gracias a la validación anti-bot.