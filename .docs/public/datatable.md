# DataTable Component

Clase estática para renderizar tablas de datos con soporte para múltiples fuentes de datos y formatos.

## Métodos Principales

### `datatable.render(config, container)`
Renderiza una tabla en el contenedor especificado.

**Parámetros:**
- `config` - Configuración de la tabla
- `container` - Elemento DOM donde renderizar

### `datatable.refresh(tableId)`
Recarga los datos de una tabla específica.

### `datatable.refreshFirst()`
Recarga la primera tabla visible en la página.

## Configuración

### Fuentes de Datos
- **API**: `source: '/api/users'`
- **JSON**: `source: 'data/users.json'`  
- **DataLoader**: `dataSource: 'users/list'`

### Columnas
Soporta arrays simples u objetos con configuración:
```javascript
columns: ['id', 'name', 'email']
// o
columns: {
  id: { name: 'ID', sortable: true },
  name: { name: 'Nombre', format: 'capitalize' }
}