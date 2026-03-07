<?php
class ogDevMiddleware {
  private $logMeta = ['module' => 'ogDevMiddleware', 'layer' => 'framework/middleware'];

  function handle() {
    if (!ogIsLocalhost()) {
      ogResponse::error(__('middleware.dev.access_denied'), 403);
      return false;
    }

    return true;
  }
}

/**
 * @doc-start
 * FILE: framework/middleware/ogDevMiddleware.php
 * ROLE: Restringe el acceso a rutas solo para entorno local (localhost).
 *       Retorna 403 si la request no viene de localhost.
 * @doc-end
 */