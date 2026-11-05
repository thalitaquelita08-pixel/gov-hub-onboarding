"""
Hook que faz a raiz do site gerado abrir a trilha de onboarding
"""
from pathlib import Path
from mkdocs.config.defaults import MkDocsConfig

# Relativo, para funcionar também fora da raiz do domínio (preview do GitHub Pages).
DESTINO = "capacitacao/"


def on_post_build(config: MkDocsConfig, **kwargs):
    """Escreve na raiz do site um index.html que redireciona para o onboarding."""
    dest_file = Path(config.site_dir) / "index.html"
    dest_file.write_text(
        '<!doctype html>\n<html lang="pt-BR"><head><meta charset="utf-8">\n'
        '<title>Onboarding Gov Hub</title>\n'
        f'<meta http-equiv="refresh" content="0; url={DESTINO}">\n'
        f'<script>location.replace("{DESTINO}")</script>\n'
        f'</head><body><a href="{DESTINO}">Abrir a trilha de onboarding</a></body></html>\n',
        encoding='utf-8',
    )
    print(f"✅ Raiz do site redireciona para {DESTINO}")
