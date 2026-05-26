USE [BDERP_Agro_Hass]
GO
/****** Object:  StoredProcedure [dbo].[MAESTRO_importarItemsCommoditys]    Script Date: 15/05/2026 14:31:49 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*

--		[MAESTRO_importarItemsCommoditys] '{"ruc":"20481121966","codigos":["000059"]}'
--		[MAESTRO_importarItemsCommoditys] '[{"ruc":"20481121966"}]'

select * from gen_empresa

*/

ALTER proc [dbo].[MAESTRO_importarItemsCommoditys]
	@json varchar(max)
as begin
	declare @ruc varchar(20), @codigos varchar(max), @tieneCodigos bit;
	declare @consulta varchar(max);
	declare @esArray bit;
	create table #M_iic (id varchar(30),tipoclasificacion varchar(50),codigo varchar(50),descripcion varchar(max),almacen varchar(50),um varchar(50),moneda varchar(50),precio varchar(50));

	-- Detectar si es array o objeto
	set @esArray = case when LEFT(@json, 1) = '[' then 1 else 0 end;

	-- Extraer RUC y codigos del JSON (compatible con ambos formatos)
	if @esArray = 1
	begin
		-- Formato array: [{"ruc":"20481121966"}]
		set @ruc = isnull((SELECT JSON_VALUE(a.value, '$.ruc') FROM OPENJSON(@json) AS a),'');
		set @codigos = '';
		set @tieneCodigos = 0;
	end
	else
	begin
		-- Formato objeto: {"ruc":"20481121966","codigos":["000059"]}
		set @ruc = isnull((SELECT JSON_VALUE(@json, '$.ruc')),'');
		set @codigos = isnull((SELECT JSON_VALUE(@json, '$.codigos')),'');
		set @tieneCodigos = case when @codigos is not null and @codigos != '' then 1 else 0 end;
	end

	-- Si hay codigos, crear tabla temporal para filtrar
	if @tieneCodigos = 1
	begin
		declare @tablaCodigos table (codigo varchar(50));
		insert into @tablaCodigos (codigo)
		select value from OPENJSON(@codigos, '$');
	end

	insert into #M_iic (id,tipoclasificacion,codigo,descripcion,almacen,um,moneda,precio)
	select 'I'+rtrim(i.item) id,'I' tipoclasificacion,rtrim(i.item) codigo,rtrim(i.descripcioncompleta) descripcion,rtrim(a.AlmacenCodigo) as almacen,rtrim(i.UnidadCodigo) as um, rtrim(MonedaCodigo) as moneda,CASE WHEN MonedaCodigo='LO' THEN rtrim(PrecioUnitarioLocal) ELSE rtrim(PrecioUnitarioDolares) END as precio from [HASS-DB1].HP_SPRING_PRD.dbo.WH_ItemMast i 
	inner join [HASS-DB1].HP_SPRING_PRD.dbo.WH_ItemAlmacen a on a.Item=i.Item
	inner join [HASS-DB1].HP_SPRING_PRD.dbo.WH_AlmacenMast al on al.AlmacenCodigo=a.AlmacenCodigo
	inner join BDERP_Agro_Hass.dbo.HOMOL_AdaptaSpring_Compania c on i.ReferenciaFiscalIngreso02 like '%'+c.empresaItem+'%'
	where c.documentofiscal=@ruc and i.estado='A' and ISNULL(i.descripcioncompleta,'')!='' and al.CompaniaSocio='00000800'
	-- Filtrar por codigos si se proporcionan
	and (@tieneCodigos = 0 or exists (select 1 from @tablaCodigos tc where tc.codigo = i.item))
	union all
	select 'C'+rtrim(commodity01) id,'C' tipoclasificacion,rtrim(commodity01) codigo,rtrim(descripcionlocal) descripcion, 'H005' as almacen, 'UNI' as um, 'LO' as moneda,'0.00' as precio from [HASS-DB1].HP_SPRING_PRD.dbo.WH_Commodity 
	where estado='A' and ISNULL(descripcionlocal,'')!=''
	-- Filtrar por codigos si se proporcionan
	and (@tieneCodigos = 0 or exists (select 1 from @tablaCodigos tc where tc.codigo = commodity01));

	--select COUNT(*) from #M_iic

	set @consulta = (select * from #M_iic FOR JSON PATH);

	select isnull(@consulta,'[]') id;

	drop table #M_iic;
end
