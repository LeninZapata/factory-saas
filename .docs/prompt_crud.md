# PROMPT PARA CREAR CRUD RÁPIDO

Copia y pega este prompt reemplazando los valores entre `{...}`:

---

**Crea un CRUD completo usando la plantilla CRUD_RAPIDO_PLANTILLA.md con los siguientes datos:**

**Nombre del módulo:** `{miExtension}`  
Ejemplo: `producto`, `cliente`, `tarea`

**Descripción:** `{Descripción corta del módulo}`  
Ejemplo: "Gestión de productos del inventario"

**Emoji del menú:** `{emoji}`  
Ejemplo: 📦, 👥, 📋

**Tabla SQL:**
```
Campos personalizados (además de id, dc, da, ta, tu):
- {nombre_campo1} {tipo} {null/not null} COMMENT '{comentario}'
- {nombre_campo2} {tipo} {null/not null} COMMENT '{comentario}'
```

Ejemplo:
```
- `name` varchar(100) NOT NULL COMMENT 'Nombre del producto'
- `price` decimal(10,2) NOT NULL COMMENT 'Precio unitario'
- `stock` int NOT NULL DEFAULT 0 COMMENT 'Stock disponible'
- `description` text NULL COMMENT 'Descripción del producto'
```

**Campos del formulario:**
```
1. {nombre_campo}: tipo={tipo}, label="{etiqueta}", validation="{reglas}", required={si/no}
2. {nombre_campo}: tipo={tipo}, label="{etiqueta}", validation="{reglas}", required={si/no}
```

Ejemplo:
```
1. name: tipo=text, label="Nombre del Producto", validation="required|min:3|max:100", required=si
2. price: tipo=number, label="Precio", validation="required|numeric", required=si
3. stock: tipo=number, label="Stock", validation="required|numeric", required=si
4. description: tipo=textarea, label="Descripción", validation="max:500", required=no
```

**Columnas de la tabla (listado):**
```
- {campo}: ancho="{width}", alineación="{left/center/right}", sortable={si/no}
```

Ejemplo:
```
- name: ancho="250px", alineación=left, sortable=si
- price: ancho="120px", alineación=right, sortable=si
- stock: ancho="100px", alineación=center, sortable=si
```

**Campo principal requerido:** `{campo_requerido}`  
Ejemplo: `name`

**¿Tiene campo config (JSON)?** {si/no}

---

## EJEMPLOS DE USO

### Ejemplo 1: CRUD de Productos
```
Crea un CRUD completo usando la plantilla CRUD_RAPIDO_PLANTILLA.md con los siguientes datos:

Nombre del módulo: producto
Descripción: Gestión de productos del inventario
Emoji del menú: 📦

Tabla SQL:
- `name` varchar(100) NOT NULL COMMENT 'Nombre del producto'
- `sku` varchar(50) NOT NULL COMMENT 'Código SKU'
- `price` decimal(10,2) NOT NULL COMMENT 'Precio unitario'
- `stock` int NOT NULL DEFAULT 0 COMMENT 'Stock disponible'
- `description` text NULL COMMENT 'Descripción'
- `config` json NULL COMMENT 'Configuración adicional'

Campos del formulario:
1. name: tipo=text, label="Nombre del Producto", validation="required|min:3|max:100", required=si
2. sku: tipo=text, label="SKU", validation="required|min:3|max:50", required=si
3. price: tipo=number, label="Precio", validation="required|numeric", required=si
4. stock: tipo=number, label="Stock", validation="required|numeric", required=si
5. description: tipo=textarea, label="Descripción", validation="max:500", required=no

Columnas de la tabla:
- name: ancho="250px", alineación=left, sortable=si
- sku: ancho="120px", alineación=center, sortable=si
- price: ancho="120px", alineación=right, sortable=si
- stock: ancho="100px", alineación=center, sortable=si

Campo principal requerido: name
¿Tiene campo config (JSON)? si
```

### Ejemplo 2: CRUD de Clientes
```
Crea un CRUD completo usando la plantilla CRUD_RAPIDO_PLANTILLA.md con los siguientes datos:

Nombre del módulo: cliente
Descripción: Gestión de clientes
Emoji del menú: 👥

Tabla SQL:
- `name` varchar(100) NOT NULL COMMENT 'Nombre completo'
- `email` varchar(100) NOT NULL COMMENT 'Correo electrónico'
- `phone` varchar(20) NULL COMMENT 'Teléfono'
- `address` text NULL COMMENT 'Dirección'

Campos del formulario:
1. name: tipo=text, label="Nombre Completo", validation="required|min:3|max:100", required=si
2. email: tipo=email, label="Email", validation="required|email|max:100", required=si
3. phone: tipo=text, label="Teléfono", validation="max:20", required=no
4. address: tipo=textarea, label="Dirección", validation="max:250", required=no

Columnas de la tabla:
- name: ancho="200px", alineación=left, sortable=si
- email: ancho="200px", alineación=left, sortable=si
- phone: ancho="150px", alineación=center, sortable=no

Campo principal requerido: name
¿Tiene campo config (JSON)? no
```

### Ejemplo 3: CRUD de Tareas
```
Crea un CRUD completo usando la plantilla CRUD_RAPIDO_PLANTILLA.md con los siguientes datos:

Nombre del módulo: tarea
Descripción: Gestión de tareas
Emoji del menú: ✅

Tabla SQL:
- `title` varchar(150) NOT NULL COMMENT 'Título de la tarea'
- `description` text NULL COMMENT 'Descripción detallada'
- `status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT 'Estado'
- `priority` int NOT NULL DEFAULT 3 COMMENT 'Prioridad (1-5)'

Campos del formulario:
1. title: tipo=text, label="Título", validation="required|min:3|max:150", required=si
2. description: tipo=textarea, label="Descripción", validation="max:1000", required=no
3. status: tipo=select, label="Estado", validation="required", required=si, options=[pending,in_progress,completed]
4. priority: tipo=number, label="Prioridad", validation="required|numeric|min:1|max:5", required=si

Columnas de la tabla:
- title: ancho="300px", alineación=left, sortable=si
- status: ancho="120px", alineación=center, sortable=si
- priority: ancho="100px", alineación=center, sortable=si

Campo principal requerido: title
¿Tiene campo config (JSON)? no
```

---

## NOTAS IMPORTANTES

1. **Nombres**: Usa `{miExtension}` en singular (producto, cliente, tarea)
2. **Tabla SQL**: Siempre en plural (`productos`, `clientes`, `tareas`)
3. **Timestamps**: No declares `dc`, `da`, `ta`, `tu` - se agregan automáticamente
4. **Config JSON**: Solo si necesitas guardar configuración adicional flexible
5. **Campo requerido**: El campo principal que validará el controller
6. **Validaciones**: Separadas por `|` (ejemplo: `required|min:3|max:50`)