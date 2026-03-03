-- =============================================
-- Author:		Sistema Logística
-- Create date: 2026-03-03
-- Description:	Listar solicitudes de cotización (Versión corregida)
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[LOGISTICA_listarSolicitudesCotizacion]
	@json NVARCHAR(MAX)
AS
BEGIN
	SET NOCOUNT ON;
	
	DECLARE @sociedad VARCHAR(3);
	DECLARE @idproyecto VARCHAR(10);
	
	-- Parsear JSON de entrada con manejo de errores
	BEGIN TRY
		SELECT 
			@sociedad = JSON_VALUE(socio.value, '$.sociedad'),
			@idproyecto = JSON_VALUE(socio.value, '$.idproyecto')
		FROM OPENJSON(@json) AS socio;
	END TRY
	BEGIN CATCH
		-- Si hay error en el JSON, usar valores por defecto
		SET @sociedad = NULL;
		SET @idproyecto = NULL;
	END CATCH
	
	-- Listar solicitudes de cotización con formato JSON
	-- Usar una subquery para asegurar que siempre devuelva JSON
	SELECT 
		(
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
				CASE 
					WHEN EXISTS (
						SELECT 1 FROM LOGISTICA_SolicitudCotizacionDet D 
						WHERE D.idSolicitudCotizacion = C.idSolicitudCotizacion
					)
					THEN (
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
					)
					ELSE '[]'
				END AS detalle
			FROM LOGISTICA_SolicitudCotizacion C
			WHERE 1=1
			ORDER BY C.fechaGeneracion DESC
			FOR JSON PATH
		) AS resultado;
	
END
