const contactShareService = require('../services/contactShareService');

/**
 * Controlador para gestionar compartir contacto
 */

/**
 * Solicitar compartir contacto
 * POST /api/contacts/:matchId/request
 */
exports.solicitarContacto = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;

    const resultado = await contactShareService.solicitarCompartirContacto(
      matchId,
      userId
    );

    res.status(200).json({
      success: true,
      message: 'Solicitud de contacto enviada correctamente',
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Aceptar solicitud de contacto
 * POST /api/contacts/:matchId/accept
 */
exports.aceptarContacto = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;

    const resultado = await contactShareService.aceptarCompartirContacto(
      matchId,
      userId
    );

    res.status(200).json({
      success: true,
      message: 'Contacto compartido exitosamente',
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rechazar solicitud de contacto
 * POST /api/contacts/:matchId/reject
 */
exports.rechazarContacto = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;

    const resultado = await contactShareService.rechazarCompartirContacto(
      matchId,
      userId
    );

    res.status(200).json({
      success: true,
      message: 'Solicitud de contacto rechazada',
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancelar solicitud de contacto (por el solicitante)
 * POST /api/contacts/:matchId/cancel
 */
exports.cancelarContacto = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;

    const resultado = await contactShareService.cancelarSolicitudContacto(
      matchId,
      userId
    );

    res.status(200).json({
      success: true,
      message: 'Solicitud de contacto cancelada',
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener estado de compartir contacto
 * GET /api/contacts/:matchId/status
 */
exports.obtenerEstado = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;

    const estado = await contactShareService.obtenerEstadoContacto(
      matchId,
      userId
    );

    res.status(200).json({
      success: true,
      data: estado,
    });
  } catch (error) {
    next(error);
  }
};
