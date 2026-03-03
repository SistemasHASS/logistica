-- =============================================
-- Author:		Sistema Logística
-- Create date: 2026-03-03
-- Description:	Listar solicitudes de cotización
-- =============================================
CREATE PROCEDURE [dbo].[LOGISTICA_listarSolicitudesCotizacion]
	@json NVARCHAR(MAX)
AS
BEGIN
	SET NOCOUNT ON;
	
	DECLARE @sociedad VARCHAR(3);
	DECLARE @idproyecto VARCHAR(10);
	
	-- Parsear JSON de entrada
	SELECT 
		@sociedad = JSON_VALUE(socio.value, '$.sociedad'),
		@idproyecto = JSON_VALUE(socio.value, '$.idproyecto')
	FROM OPENJSON(@json) AS socio;
	
	-- Listar solicitudes de cotización con formato JSON
	SELECT 
		C.idSolicitudCotizacion AS id,
		C.noSolicitud,
		C.idConsolidacion,
		C.fechaGeneracion,
		C.usuarioGenera,
		C.totalItems,
		C.estado,
		C.observaciones,
		-- Detalles de la solicitud
		(
			SELECT 
				D.noLinea,
				D.codigoItem,
				D.descripcionItem,
				D.cantidad,
				D.unidadMedida,
				D.especificaciones
			FROM LOGISTICA_SolicitudCotizacionDet D
			WHERE D.idSolicitudCotizacion = C.idSolicitudCotizacion
			ORDER BY D.noLinea
			FOR JSON PATH
		) AS detalle
	FROM LOGISTICA_SolicitudCotizacion C
	WHERE 1=1
	ORDER BY C.fechaGeneracion DESC
	FOR JSON PATH;
	
END
