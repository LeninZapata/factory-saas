<?php
// Configuración de entorno - Control centralizado de modo desarrollo/producción
define('OG_IS_DEV', ogIsLocalhost());
/**
 * @doc-start
 * FILE: framework/config/environment.php
 * ROLE: Define OG_IS_DEV basado en ogIsLocalhost().
 *       Punto único de control del modo desarrollo/producción.
 *       Todo el framework usa OG_IS_DEV para condicionar comportamiento.
 * @doc-end
 */