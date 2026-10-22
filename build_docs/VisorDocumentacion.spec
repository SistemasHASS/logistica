# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['../docs/servidor_docs.py'],
    pathex=[],
    binaries=[],
    datas=[('C:/Users/jonathan.marquina/Documents/Proyectos/logistica/docs', 'proj/docs'), ('C:/Users/jonathan.marquina/Documents/Proyectos/logistica/INFORME_SISTEMA_LOGISTICA_SOPORTE_TI.docx', 'proj'), ('C:/Users/jonathan.marquina/Documents/Proyectos/logistica/INFORME_SISTEMA_LOGISTICA_SOPORTE_TI.md', 'proj'), ('C:/Users/jonathan.marquina/Documents/Proyectos/logistica/IMPLEMENTACION_DESPACHOS.md', 'proj'), ('C:/Users/jonathan.marquina/Documents/Proyectos/logistica/IMPLEMENTACION_FRONTEND_ADMIN.md', 'proj'), ('C:/Users/jonathan.marquina/Documents/Proyectos/logistica/README.md', 'proj')],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='VisorDocumentacion',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
