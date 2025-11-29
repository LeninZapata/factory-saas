# Grouper Component

Componente para agrupar contenido en modo acordeón (linear) o pestañas (tabs).

## Métodos Principales

### `grouper.render(config, container)`
Renderiza grupos en el contenedor especificado.

### `grouper.switchTab(grouperId, tabIndex)`
Cambia a un tab específico (solo modo tabs).

### `grouper.toggleSection(grouperId, sectionIndex, forceOpen)`
Abre/cierra sección específica (solo modo linear).

### `grouper.openAll(grouperId)`
Abre todas las secciones (solo modo linear).

### `grouper.closeAll(grouperId)`
Cierra todas las secciones (solo modo linear).

## Configuración

### Modos Disponibles
- **linear**: Acordeón con secciones colapsables
- **tabs**: Pestañas horizontales

### Estructura de Configuración
```javascript
{
  mode: 'linear', // o 'tabs'
  groups: [
    {
      title: 'Grupo 1',
      content: '<div>Contenido HTML</div>'
    }
  ]
}