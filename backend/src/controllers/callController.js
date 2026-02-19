const callService = require('../services/callService');

/**
 * Controlador de llamadas (endpoints REST complementarios)
 */
const callController = {
  /**
   * POST /api/calls/:matchId/request
   * Solicitar consentimiento para llamada
   */
  async solicitarLlamada(req, res) {
    try {
      const { matchId } = req.params;
      const { tipo = 'video' } = req.body;

      const permiso = await callService.solicitarLlamada(
        matchId,
        req.userId,
        tipo
      );

      res.status(201).json({
        exito: true,
        mensaje: 'Solicitud de llamada enviada',
        datos: {
          permisoId: permiso._id,
          expiraEn: permiso.expiraEn,
        },
      });
    } catch (error) {
      res.status(400).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * POST /api/calls/:matchId/accept
   * Aceptar solicitud de llamada
   */
  async aceptarLlamada(req, res) {
    try {
      const { permisoId } = req.body;

      if (!permisoId) {
        return res.status(400).json({
          exito: false,
          mensaje: 'permisoId es requerido',
        });
      }

      const permiso = await callService.aceptarLlamada(permisoId, req.userId);

      res.json({
        exito: true,
        mensaje: 'Llamada aceptada',
        datos: {
          permisoId: permiso._id,
          estado: permiso.estado,
        },
      });
    } catch (error) {
      res.status(400).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * POST /api/calls/:matchId/reject
   * Rechazar solicitud de llamada
   */
  async rechazarLlamada(req, res) {
    try {
      const { permisoId } = req.body;

      if (!permisoId) {
        return res.status(400).json({
          exito: false,
          mensaje: 'permisoId es requerido',
        });
      }

      await callService.rechazarLlamada(permisoId, req.userId);

      res.json({
        exito: true,
        mensaje: 'Llamada rechazada',
      });
    } catch (error) {
      res.status(400).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * GET /api/calls/:matchId/active
   * Obtener llamada activa de un match
   */
  async obtenerLlamadaActiva(req, res) {
    try {
      const { matchId } = req.params;

      const llamada = await callService.obtenerLlamadaActiva(matchId);

      res.json({
        exito: true,
        datos: {
          hayLlamadaActiva: !!llamada,
          llamada,
        },
      });
    } catch (error) {
      res.status(500).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * GET /api/calls/:matchId/history
   * Obtener historial de llamadas
   */
  async obtenerHistorial(req, res) {
    try {
      const { matchId } = req.params;
      const { limite } = req.query;

      const llamadas = await callService.obtenerHistorialLlamadas(
        matchId,
        parseInt(limite, 10) || 20
      );

      res.json({
        exito: true,
        datos: {
          llamadas,
          total: llamadas.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },
};

module.exports = callController;
