# PRD - Sistema de Gestion para Polleria

## Problem Statement
Sistema visual de gestion para polleria peruana con control de compras, inventario, produccion, mermas y dashboard analitico. 7 modulos funcionales con logica real de transformacion basada en recetas.

## Architecture
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Frontend**: React + Tailwind CSS + Shadcn UI + Recharts
- **Database**: MongoDB (collections: raw_materials, cooked_products, recipes, purchases, productions, wastes)
- **No Authentication**: Acceso directo

## User Personas
- Dueno de polleria: usuario principal, necesita registro rapido diario y vision clara de costos/mermas
- Futuro: empleados con roles limitados

## Core Requirements (Static)
1. Registro de compras con tracking de precios
2. Registro de produccion basado en recetas
3. Registro de mermas con descuento automatico
4. Inventario de materia prima con conversion de unidades
5. Inventario de productos cocidos
6. Dashboard con KPIs y recomendaciones
7. Interfaz en espanol, moneda en Soles (S/.)

## What's Been Implemented (Feb 2026)
- [x] Backend completo con 6 colecciones MongoDB y CRUD endpoints
- [x] Logica de transformacion: compras -> materia prima -> produccion (recetas) -> cocidos -> mermas
- [x] Conversion automatica de unidades (kg/g, litro/ml, custom)
- [x] Costo promedio ponderado en materia prima
- [x] Comparacion automatica de precios en compras
- [x] Dashboard con KPIs, graficos de compras, recomendaciones automaticas
- [x] 7 paginas frontend funcionales con tema calido polleria
- [x] Sidebar de navegacion responsive
- [x] Formularios con Shadcn UI (Dialog, Select, Table, Tabs)

## Prioritized Backlog
### P0 (Critical)
- Ninguno pendiente

### P1 (High)
- Edicion de compras/producciones/mermas existentes
- Filtros de fecha en tablas (rango de fechas)
- Busqueda de productos en tablas

### P2 (Medium)
- Integracion futura con Loyverse (punto de venta)
- Margen estimado de ganancia
- Exportar datos a Excel/CSV
- Gestion de proveedores

### P3 (Low)
- Autenticacion de usuarios (multi-usuario)
- Notificaciones de stock bajo
- Historial de cambios (audit log)
- App movil

## Next Tasks
1. Agregar filtros de fecha en paginas de compras/produccion/mermas
2. Agregar edicion de registros existentes
3. Preparar integracion con sistema de ventas (Loyverse)
