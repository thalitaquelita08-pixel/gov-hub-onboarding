"""
Hook que serve a capacitação no `mkdocs serve`.

A capacitação mora em capacitacao/, fora de docs/, e o deploy.yml a copia para
site/capacitacao/ depois do build. No `mkdocs serve` essa cópia não acontece e
/capacitacao/ dá 404; este hook faz a mesma cópia, só no serve, e recarrega a
página quando um arquivo da capacitação muda. No `mkdocs build` não faz nada.

Fica depois de caminho_base.py, como a cópia do deploy: as páginas da capacitação
usam caminhos relativos e não precisam de prefixo.
"""
import shutil
from pathlib import Path

from mkdocs.config.defaults import MkDocsConfig

PASTA = "capacitacao"
# O mesmo que o deploy.yml deixa de fora
IGNORAR = shutil.ignore_patterns("tests", "tools", "package.json")

_servindo = False


def on_startup(command, **kwargs):
    global _servindo
    _servindo = command == "serve"


def _origem(config: MkDocsConfig) -> Path:
    return Path(config.config_file_path).parent / PASTA


def on_serve(server, config: MkDocsConfig, **kwargs):
    server.watch(str(_origem(config)))
    return server


def on_post_build(config: MkDocsConfig, **kwargs):
    if not _servindo:
        return
    origem = _origem(config)
    if not origem.is_dir():
        return
    shutil.copytree(origem, Path(config.site_dir) / PASTA, ignore=IGNORAR, dirs_exist_ok=True)
    print(f"✅ Capacitação copiada para {PASTA}/ (só no serve; os PDFs saem no deploy)")
